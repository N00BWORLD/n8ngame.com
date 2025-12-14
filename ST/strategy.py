"""
자동매매 전략 모듈
- 기본 전략 클래스
- 이동평균 돌파 전략
- 변동성 돌파 전략
"""

from abc import ABC, abstractmethod
from datetime import datetime, time
from logger import logger


class BaseStrategy(ABC):
    """기본 전략 추상 클래스"""
    
    def __init__(self, kiwoom, name="BaseStrategy"):
        self.kiwoom = kiwoom
        self.name = name
        self.is_running = False
        self.positions = {}  # 보유 포지션
    
    @abstractmethod
    def should_buy(self, code, data):
        """매수 조건 확인"""
        pass
    
    @abstractmethod
    def should_sell(self, code, data):
        """매도 조건 확인"""
        pass
    
    def is_market_open(self):
        """장 운영 시간 확인"""
        now = datetime.now().time()
        market_open = time(9, 0)
        market_close = time(15, 20)
        return market_open <= now <= market_close
    
    def start(self):
        """전략 시작"""
        self.is_running = True
        logger.info(f"[{self.name}] 전략 시작")
    
    def stop(self):
        """전략 중지"""
        self.is_running = False
        logger.info(f"[{self.name}] 전략 중지")
    
    def execute_buy(self, code, quantity, price=0):
        """매수 실행"""
        if not self.is_running:
            return
        
        result = self.kiwoom.buy(code, quantity, price)
        if result == 0:
            self.positions[code] = self.positions.get(code, 0) + quantity
            logger.info(f"[{self.name}] 매수 주문: {code} {quantity}주")
        return result
    
    def execute_sell(self, code, quantity, price=0):
        """매도 실행"""
        if not self.is_running:
            return
        
        result = self.kiwoom.sell(code, quantity, price)
        if result == 0:
            self.positions[code] = self.positions.get(code, 0) - quantity
            if self.positions[code] <= 0:
                del self.positions[code]
            logger.info(f"[{self.name}] 매도 주문: {code} {quantity}주")
        return result


class MovingAverageStrategy(BaseStrategy):
    """이동평균선 돌파 전략
    
    - 5일선이 20일선 상향 돌파시 매수
    - 5일선이 20일선 하향 돌파시 매도
    """
    
    def __init__(self, kiwoom, short_period=5, long_period=20):
        super().__init__(kiwoom, "이동평균전략")
        self.short_period = short_period
        self.long_period = long_period
        self.prev_signals = {}  # 이전 신호 저장
    
    def calculate_ma(self, prices, period):
        """이동평균 계산"""
        if len(prices) < period:
            return None
        return sum(prices[-period:]) / period
    
    def should_buy(self, code, data):
        """매수 조건: 5일선이 20일선 상향 돌파"""
        prices = data.get("prices", [])
        if len(prices) < self.long_period:
            return False
        
        short_ma = self.calculate_ma(prices, self.short_period)
        long_ma = self.calculate_ma(prices, self.long_period)
        
        if short_ma is None or long_ma is None:
            return False
        
        prev_signal = self.prev_signals.get(code, "neutral")
        current_signal = "bullish" if short_ma > long_ma else "bearish"
        
        # 상향 돌파 (bearish → bullish)
        is_crossover = prev_signal == "bearish" and current_signal == "bullish"
        
        self.prev_signals[code] = current_signal
        
        if is_crossover:
            logger.info(f"[{self.name}] {code} 매수 신호: 골든크로스")
            return True
        return False
    
    def should_sell(self, code, data):
        """매도 조건: 5일선이 20일선 하향 돌파"""
        prices = data.get("prices", [])
        if len(prices) < self.long_period:
            return False
        
        short_ma = self.calculate_ma(prices, self.short_period)
        long_ma = self.calculate_ma(prices, self.long_period)
        
        if short_ma is None or long_ma is None:
            return False
        
        prev_signal = self.prev_signals.get(code, "neutral")
        current_signal = "bullish" if short_ma > long_ma else "bearish"
        
        # 하향 돌파 (bullish → bearish)
        is_crossunder = prev_signal == "bullish" and current_signal == "bearish"
        
        self.prev_signals[code] = current_signal
        
        if is_crossunder:
            logger.info(f"[{self.name}] {code} 매도 신호: 데드크로스")
            return True
        return False


class VolatilityBreakoutStrategy(BaseStrategy):
    """변동성 돌파 전략 (래리 윌리엄스)
    
    - 당일 시가 + (전일 고가 - 전일 저가) * K 돌파시 매수
    - 장 마감 전 청산
    """
    
    def __init__(self, kiwoom, k_value=0.5):
        super().__init__(kiwoom, "변동성돌파전략")
        self.k_value = k_value
        self.target_prices = {}  # 목표가
        self.bought_today = {}  # 오늘 매수 여부
    
    def calculate_target_price(self, code, data):
        """목표가 계산"""
        open_price = data.get("시가", 0)
        prev_high = data.get("전일고가", 0)
        prev_low = data.get("전일저가", 0)
        
        if not all([open_price, prev_high, prev_low]):
            return None
        
        range_val = prev_high - prev_low
        target = open_price + (range_val * self.k_value)
        
        return int(target)
    
    def should_buy(self, code, data):
        """매수 조건: 현재가가 목표가 돌파"""
        # 오늘 이미 매수했으면 패스
        today = datetime.now().date()
        if self.bought_today.get(code) == today:
            return False
        
        current_price = data.get("현재가", 0)
        
        # 목표가 계산
        if code not in self.target_prices:
            target = self.calculate_target_price(code, data)
            if target:
                self.target_prices[code] = target
                logger.info(f"[{self.name}] {code} 목표가 설정: {target:,}원")
        
        target_price = self.target_prices.get(code, 0)
        
        if target_price and current_price >= target_price:
            self.bought_today[code] = today
            logger.info(f"[{self.name}] {code} 매수 신호: 목표가 돌파 ({current_price:,}원 >= {target_price:,}원)")
            return True
        
        return False
    
    def should_sell(self, code, data):
        """매도 조건: 장 마감 15분 전"""
        now = datetime.now().time()
        close_time = time(15, 15)  # 15:15
        
        if now >= close_time and code in self.positions:
            logger.info(f"[{self.name}] {code} 매도 신호: 장 마감 청산")
            return True
        
        return False
    
    def reset_daily(self):
        """일일 초기화"""
        self.target_prices = {}
        self.bought_today = {}
        logger.info(f"[{self.name}] 일일 데이터 초기화")


class PercentageStrategy(BaseStrategy):
    """수익률 기반 전략
    
    - 목표 수익률 도달시 매도
    - 손절 수익률 도달시 매도
    """
    
    def __init__(self, kiwoom, take_profit=5.0, stop_loss=-3.0):
        super().__init__(kiwoom, "수익률전략")
        self.take_profit = take_profit  # 익절 %
        self.stop_loss = stop_loss      # 손절 %
        self.buy_prices = {}  # 매수가
    
    def set_buy_price(self, code, price):
        """매수가 설정"""
        self.buy_prices[code] = price
    
    def should_buy(self, code, data):
        """이 전략은 매도 전용"""
        return False
    
    def should_sell(self, code, data):
        """매도 조건: 익절/손절"""
        if code not in self.buy_prices:
            return False
        
        buy_price = self.buy_prices[code]
        current_price = data.get("현재가", 0)
        
        if not current_price or not buy_price:
            return False
        
        profit_rate = ((current_price - buy_price) / buy_price) * 100
        
        if profit_rate >= self.take_profit:
            logger.info(f"[{self.name}] {code} 익절 신호: {profit_rate:.2f}% >= {self.take_profit}%")
            return True
        
        if profit_rate <= self.stop_loss:
            logger.info(f"[{self.name}] {code} 손절 신호: {profit_rate:.2f}% <= {self.stop_loss}%")
            return True
        
        return False




