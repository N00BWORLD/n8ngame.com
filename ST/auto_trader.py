"""
자동매매 엔진
- AI 모드: 전략 기반 자동 매수/매도
- 실시간 모니터링 및 주문 실행
"""

from PyQt5.QtCore import QObject, QTimer, pyqtSignal
from datetime import datetime, time
from logger import logger
import config


class AutoTrader(QObject):
    """자동매매 엔진"""
    
    # 시그널
    status_changed = pyqtSignal(str)  # 상태 변경
    trade_signal = pyqtSignal(dict)   # 매매 신호
    log_message = pyqtSignal(str)     # 로그 메시지
    
    def __init__(self, kiwoom):
        super().__init__()
        self.kiwoom = kiwoom
        self.is_running = False
        self.mode = "manual"  # manual / auto
        
        # 전략 설정
        self.strategy = "volatility"  # ma / volatility / percentage
        self.watchlist = []
        
        # 보유 종목 추적
        self.positions = {}  # {code: {qty, buy_price}}
        self.today_bought = set()  # 오늘 매수한 종목
        
        # 설정값
        self.invest_ratio = 0.1  # 1회 투자 비율 (예수금의 10%)
        self.max_stocks = 5  # 최대 보유 종목 수
        self.take_profit = 5.0  # 익절 %
        self.stop_loss = -3.0  # 손절 %
        self.volatility_k = 0.5  # 변동성 돌파 K값
        
        # 조건검색 자동매매
        self.use_condition = False
        self.condition_name = ""
        self.condition_index = 0
        self.auto_buy_on_condition = False  # 조건 편입시 자동매수
        
        # 타이머 (1초마다 체크)
        self.timer = QTimer()
        self.timer.timeout.connect(self._check_signals)
        
        # 일봉 데이터 캐시
        self.daily_cache = {}
        self.target_prices = {}  # 변동성 돌파 목표가
    
    def set_watchlist(self, codes):
        """관심종목 설정"""
        self.watchlist = codes
        self.log_message.emit(f"📋 관심종목 설정: {len(codes)}개")
    
    def set_strategy(self, strategy):
        """전략 설정"""
        self.strategy = strategy
        names = {"ma": "이동평균", "volatility": "변동성돌파", "percentage": "수익률"}
        self.log_message.emit(f"📊 전략 변경: {names.get(strategy, strategy)}")
    
    def set_params(self, invest_ratio=None, max_stocks=None, 
                   take_profit=None, stop_loss=None, k_value=None):
        """파라미터 설정"""
        if invest_ratio is not None:
            self.invest_ratio = invest_ratio
        if max_stocks is not None:
            self.max_stocks = max_stocks
        if take_profit is not None:
            self.take_profit = take_profit
        if stop_loss is not None:
            self.stop_loss = stop_loss
        if k_value is not None:
            self.volatility_k = k_value
    
    def start(self):
        """자동매매 시작"""
        if not self.kiwoom or not self.kiwoom.is_connected():
            self.log_message.emit("❌ 로그인 필요")
            return False
        
        self.is_running = True
        self.mode = "auto"
        self.timer.start(3000)  # 3초마다 체크
        
        # 일봉 데이터 로드
        self._load_daily_data()
        
        # 현재 보유종목 로드
        self._load_positions()
        
        self.status_changed.emit("🤖 AI 모드 실행중")
        self.log_message.emit("🚀 자동매매 시작!")
        self.log_message.emit(f"   전략: {self.strategy}")
        self.log_message.emit(f"   관심종목: {len(self.watchlist)}개")
        self.log_message.emit(f"   익절: {self.take_profit}% / 손절: {self.stop_loss}%")
        
        return True
    
    def stop(self):
        """자동매매 중지"""
        self.is_running = False
        self.mode = "manual"
        self.timer.stop()
        
        self.status_changed.emit("✋ 직접 모드")
        self.log_message.emit("⏹️ 자동매매 중지")
    
    def is_market_open(self):
        """장 운영시간 확인"""
        now = datetime.now().time()
        market_start = time(9, 0)
        market_end = time(15, 20)
        return market_start <= now <= market_end
    
    def _load_daily_data(self):
        """일봉 데이터 로드"""
        self.log_message.emit("📊 일봉 데이터 로딩...")
        
        for code in self.watchlist:
            try:
                data = self.kiwoom.get_daily_chart(code)
                candles = data.get("일봉", [])
                if candles:
                    self.daily_cache[code] = candles
                    
                    # 변동성 돌파 목표가 계산
                    if len(candles) >= 2:
                        prev = candles[1]  # 전일
                        today_open = candles[0].get("시가", 0)
                        prev_high = prev.get("고가", 0)
                        prev_low = prev.get("저가", 0)
                        
                        target = today_open + (prev_high - prev_low) * self.volatility_k
                        self.target_prices[code] = int(target)
                        
                        name = self.kiwoom.get_stock_name(code)
                        self.log_message.emit(f"   {name}: 목표가 {int(target):,}원")
            except Exception as e:
                self.log_message.emit(f"❌ {code} 데이터 로드 실패: {e}")
    
    def _load_positions(self):
        """보유종목 로드"""
        try:
            data = self.kiwoom.get_account_balance()
            holdings = data.get("보유종목", [])
            
            self.positions = {}
            for h in holdings:
                code = h.get("종목번호", "").replace("A", "")
                if code:
                    self.positions[code] = {
                        "qty": int(h.get("보유수량", 0)),
                        "buy_price": int(h.get("매입가", 0)),
                        "name": h.get("종목명", "")
                    }
            
            self.log_message.emit(f"💼 보유종목: {len(self.positions)}개")
        except Exception as e:
            self.log_message.emit(f"❌ 보유종목 로드 실패: {e}")
    
    def _check_signals(self):
        """매매 신호 체크"""
        if not self.is_running:
            return
        
        if not self.is_market_open():
            return
        
        # 각 종목 체크
        for code in self.watchlist:
            try:
                self._check_stock(code)
            except Exception as e:
                logger.error(f"신호 체크 오류 {code}: {e}")
    
    def _check_stock(self, code):
        """개별 종목 신호 체크"""
        # 현재가 조회
        data = self.kiwoom.get_stock_price(code)
        current_price = data.get("현재가", 0)
        name = data.get("종목명", "")
        
        if current_price <= 0:
            return
        
        # 보유 중이면 매도 신호 체크
        if code in self.positions:
            self._check_sell_signal(code, name, current_price)
        else:
            # 미보유면 매수 신호 체크
            self._check_buy_signal(code, name, current_price)
    
    def _check_buy_signal(self, code, name, current_price):
        """매수 신호 체크"""
        # 오늘 이미 매수했으면 패스
        if code in self.today_bought:
            return
        
        # 최대 보유 종목 수 체크
        if len(self.positions) >= self.max_stocks:
            return
        
        should_buy = False
        reason = ""
        
        if self.strategy == "volatility":
            # 변동성 돌파 전략
            target = self.target_prices.get(code, 0)
            if target > 0 and current_price >= target:
                should_buy = True
                reason = f"목표가 돌파 ({current_price:,} >= {target:,})"
        
        elif self.strategy == "ma":
            # 이동평균 전략
            candles = self.daily_cache.get(code, [])
            if len(candles) >= 20:
                prices = [c.get("종가", 0) for c in candles[:20]]
                ma5 = sum(prices[:5]) / 5
                ma20 = sum(prices) / 20
                
                if ma5 > ma20 and current_price > ma5:
                    should_buy = True
                    reason = f"골든크로스 (MA5:{int(ma5):,} > MA20:{int(ma20):,})"
        
        if should_buy:
            self._execute_buy(code, name, current_price, reason)
    
    def _check_sell_signal(self, code, name, current_price):
        """매도 신호 체크"""
        pos = self.positions.get(code)
        if not pos:
            return
        
        buy_price = pos["buy_price"]
        qty = pos["qty"]
        
        if buy_price <= 0:
            return
        
        profit_rate = ((current_price - buy_price) / buy_price) * 100
        
        should_sell = False
        reason = ""
        
        # 익절
        if profit_rate >= self.take_profit:
            should_sell = True
            reason = f"익절 ({profit_rate:.1f}% >= {self.take_profit}%)"
        
        # 손절
        elif profit_rate <= self.stop_loss:
            should_sell = True
            reason = f"손절 ({profit_rate:.1f}% <= {self.stop_loss}%)"
        
        # 장 마감 청산 (변동성 돌파)
        elif self.strategy == "volatility":
            now = datetime.now().time()
            if now >= time(15, 15):
                should_sell = True
                reason = "장마감 청산"
        
        if should_sell:
            self._execute_sell(code, name, qty, current_price, reason)
    
    def _execute_buy(self, code, name, price, reason):
        """매수 실행"""
        try:
            # 투자금액 계산
            deposit_data = self.kiwoom.get_deposit()
            deposit = int(deposit_data.get("주문가능금액", 0) or 0)
            
            invest_amount = int(deposit * self.invest_ratio)
            qty = invest_amount // price
            
            if qty <= 0:
                self.log_message.emit(f"⚠️ {name}: 매수 수량 부족")
                return
            
            # 매수 주문
            result = self.kiwoom.buy(code, qty)
            
            if result == 0:
                self.today_bought.add(code)
                self.positions[code] = {"qty": qty, "buy_price": price, "name": name}
                
                msg = f"🔴 매수 | {name} | {qty}주 | {price:,}원 | {reason}"
                self.log_message.emit(msg)
                self.trade_signal.emit({
                    "type": "buy", "code": code, "name": name,
                    "qty": qty, "price": price, "reason": reason
                })
        except Exception as e:
            self.log_message.emit(f"❌ 매수 실패 {name}: {e}")
    
    def _execute_sell(self, code, name, qty, price, reason):
        """매도 실행"""
        try:
            result = self.kiwoom.sell(code, qty)
            
            if result == 0:
                if code in self.positions:
                    del self.positions[code]
                
                msg = f"🔵 매도 | {name} | {qty}주 | {price:,}원 | {reason}"
                self.log_message.emit(msg)
                self.trade_signal.emit({
                    "type": "sell", "code": code, "name": name,
                    "qty": qty, "price": price, "reason": reason
                })
        except Exception as e:
            self.log_message.emit(f"❌ 매도 실패 {name}: {e}")
    
    def reset_daily(self):
        """일일 초기화 (매일 장 시작 전 호출)"""
        self.today_bought.clear()
        self.target_prices.clear()
        self.daily_cache.clear()
        self.log_message.emit("🔄 일일 데이터 초기화")

