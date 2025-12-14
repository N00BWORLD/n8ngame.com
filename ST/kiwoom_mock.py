"""
키움증권 API Mock 클래스
- 키움 API 없이 테스트용으로 사용
- 가상 데이터로 UI 테스트 가능
"""

import random
from PyQt5.QtCore import pyqtSignal, QObject, QTimer
from logger import logger


class KiwoomMock(QObject):
    """키움 API Mock 클래스 (테스트용)"""
    
    # 시그널 정의
    realtime_data_received = pyqtSignal(str, dict)
    order_executed = pyqtSignal(dict)
    condition_searched = pyqtSignal(str, list)
    realtime_condition = pyqtSignal(str, str, str)
    
    def __init__(self):
        super().__init__()
        
        # 가상 데이터
        self.account_list = ["8888888811", "8888888822"]
        self.current_account = "8888888811"
        self.connected = False
        
        # 가상 보유 종목
        self.holdings = [
            {"종목번호": "005930", "종목명": "삼성전자", "보유수량": 10, 
             "매입가": 72000, "현재가": 75000, "수익률": "4.17", "평가손익": 30000},
            {"종목번호": "000660", "종목명": "SK하이닉스", "보유수량": 5,
             "매입가": 180000, "현재가": 175000, "수익률": "-2.78", "평가손익": -25000},
        ]
        
        # 가상 미체결
        self.pending_orders = []
        self.order_no = 1000
        
        # 가상 주가 데이터
        self.stock_prices = {
            "005930": {"종목명": "삼성전자", "현재가": 75000, "전일대비": "500", "등락율": "0.67", "거래량": "12345678"},
            "000660": {"종목명": "SK하이닉스", "현재가": 175000, "전일대비": "-2000", "등락율": "-1.13", "거래량": "3456789"},
            "035420": {"종목명": "NAVER", "현재가": 215000, "전일대비": "3000", "등락율": "1.41", "거래량": "987654"},
            "035720": {"종목명": "카카오", "현재가": 48500, "전일대비": "-500", "등락율": "-1.02", "거래량": "5678901"},
            "051910": {"종목명": "LG화학", "현재가": 380000, "전일대비": "5000", "등락율": "1.33", "거래량": "234567"},
            "006400": {"종목명": "삼성SDI", "현재가": 420000, "전일대비": "-3000", "등락율": "-0.71", "거래량": "345678"},
        }
        
        # 실시간 시뮬레이션 타이머
        self.realtime_timer = None
        self.subscribed_codes = []
        
        # 조건검색
        self.condition_list = {
            0: "급등주 포착",
            1: "골든크로스",
            2: "거래량 급증",
            3: "신고가 돌파",
        }
        self.condition_loaded = True
        self.searched_stocks = []
        
        logger.info("🔧 Mock 모드로 실행 (테스트용)")
    
    def login(self):
        """가상 로그인"""
        logger.info("🔧 [Mock] 로그인 시뮬레이션")
        self.connected = True
        logger.info("✅ [Mock] 로그인 성공!")
        logger.info(f"📋 [Mock] 계좌 목록: {self.account_list}")
    
    def is_connected(self):
        return self.connected
    
    def get_server_type(self):
        return "모의투자 (Mock)"
    
    def get_login_info(self, tag):
        if tag == "ACCNO":
            return ";".join(self.account_list)
        elif tag == "USER_ID":
            return "mock_user"
        elif tag == "USER_NAME":
            return "테스트유저"
        return ""
    
    def set_account_password(self, password):
        """계좌 비밀번호 설정 (Mock)"""
        logger.info("🔐 [Mock] 계좌 비밀번호 설정")
    
    def get_deposit(self, account_no=None):
        """가상 예수금"""
        return {
            "예수금": "50000000",
            "출금가능금액": "45000000",
            "주문가능금액": "45000000",
        }
    
    def get_account_balance(self, account_no=None):
        """가상 잔고"""
        total_buy = sum(h["매입가"] * h["보유수량"] for h in self.holdings)
        total_eval = sum(h["현재가"] * h["보유수량"] for h in self.holdings)
        
        return {
            "보유종목": self.holdings,
            "총매입금액": total_buy,
            "총평가금액": total_eval,
            "총손익": total_eval - total_buy,
        }
    
    def get_stock_price(self, code):
        """가상 시세"""
        if code in self.stock_prices:
            data = self.stock_prices[code].copy()
            # 약간의 변동 추가
            price = data["현재가"]
            change = random.randint(-100, 100)
            data["현재가"] = price + change
            data["시가"] = price - random.randint(0, 500)
            data["고가"] = price + random.randint(0, 1000)
            data["저가"] = price - random.randint(0, 1000)
            return data
        return {"종목명": "알수없음", "현재가": 0, "전일대비": "0", "등락율": "0", "거래량": "0"}
    
    def get_stock_name(self, code):
        """종목명"""
        if code in self.stock_prices:
            return self.stock_prices[code]["종목명"]
        return "알수없음"
    
    def get_daily_chart(self, code, count=60):
        """가상 일봉"""
        import datetime
        candles = []
        base_price = self.stock_prices.get(code, {}).get("현재가", 50000)
        
        for i in range(30):
            date = datetime.datetime.now() - datetime.timedelta(days=i)
            change = random.randint(-2000, 2000)
            open_p = base_price + change
            high_p = open_p + random.randint(0, 1000)
            low_p = open_p - random.randint(0, 1000)
            close_p = open_p + random.randint(-500, 500)
            
            candles.append({
                "일자": date.strftime("%Y%m%d"),
                "시가": open_p,
                "고가": high_p,
                "저가": low_p,
                "종가": close_p,
                "거래량": random.randint(100000, 1000000),
            })
            base_price = close_p
        
        return {"일봉": candles}
    
    def get_minute_chart(self, code, tick_unit=1):
        """가상 분봉"""
        import datetime
        candles = []
        base_price = self.stock_prices.get(code, {}).get("현재가", 50000)
        
        for i in range(60):
            time = datetime.datetime.now() - datetime.timedelta(minutes=i)
            change = random.randint(-100, 100)
            open_p = base_price + change
            high_p = open_p + random.randint(0, 200)
            low_p = open_p - random.randint(0, 200)
            close_p = open_p + random.randint(-100, 100)
            
            candles.append({
                "체결시간": time.strftime("%Y%m%d%H%M%S"),
                "시가": open_p,
                "고가": high_p,
                "저가": low_p,
                "종가": close_p,
                "거래량": random.randint(1000, 10000),
            })
            base_price = close_p
        
        return {"분봉": candles}
    
    def get_pending_orders(self, account_no=None):
        """미체결 조회"""
        return self.pending_orders
    
    def send_order(self, order_type, code, quantity, price=0, 
                   hoga_type="03", account_no=None):
        """가상 주문"""
        import datetime
        
        order_names = {1: "매수", 2: "매도", 3: "매수취소", 4: "매도취소"}
        order_name = order_names.get(order_type, "알수없음")
        stock_name = self.get_stock_name(code)
        
        if price == 0:
            price = self.stock_prices.get(code, {}).get("현재가", 50000)
        
        self.order_no += 1
        
        # 미체결에 추가
        if order_type in [1, 2]:
            self.pending_orders.append({
                "주문번호": str(self.order_no),
                "종목코드": code,
                "종목명": stock_name,
                "주문수량": quantity,
                "주문가격": price,
                "미체결수량": quantity,
                "주문구분": order_name,
                "시간": datetime.datetime.now().strftime("%H%M%S"),
            })
        
        logger.info(f"🔧 [Mock] {order_name} 주문: {stock_name}({code}) {quantity}주 @ {price:,}원")
        
        # 1초 후 체결 시뮬레이션
        QTimer.singleShot(1000, lambda: self._simulate_execution(code, stock_name, quantity, price))
        
        return 0
    
    def _simulate_execution(self, code, stock_name, quantity, price):
        """체결 시뮬레이션"""
        # 미체결에서 제거
        self.pending_orders = [o for o in self.pending_orders if o["종목코드"] != code]
        
        self.order_executed.emit({
            "주문번호": str(self.order_no),
            "종목코드": code,
            "종목명": stock_name,
            "상태": "체결",
            "체결수량": quantity,
            "체결가격": price,
        })
        
        logger.info(f"🔧 [Mock] 체결 완료: {stock_name} {quantity}주 @ {price:,}원")
    
    def buy(self, code, quantity, price=0, hoga_type="03"):
        return self.send_order(1, code, quantity, price, hoga_type)
    
    def buy_limit(self, code, quantity, price):
        return self.send_order(1, code, quantity, price, "00")
    
    def sell(self, code, quantity, price=0, hoga_type="03"):
        return self.send_order(2, code, quantity, price, hoga_type)
    
    def sell_limit(self, code, quantity, price):
        return self.send_order(2, code, quantity, price, "00")
    
    def cancel_order(self, order_no, code, quantity, order_type=3):
        """주문 취소"""
        self.pending_orders = [o for o in self.pending_orders if o["주문번호"] != order_no]
        logger.info(f"🔧 [Mock] 주문 취소: {order_no}")
        return 0
    
    def subscribe_realtime(self, codes, fid_list="10;11;12;13;14;15"):
        """실시간 구독"""
        if isinstance(codes, str):
            codes = codes.split(";")
        
        self.subscribed_codes = codes
        
        # 실시간 시뮬레이션 시작
        if self.realtime_timer is None:
            self.realtime_timer = QTimer()
            self.realtime_timer.timeout.connect(self._emit_realtime_data)
        
        self.realtime_timer.start(1000)  # 1초마다
        logger.info(f"🔧 [Mock] 실시간 구독 시작: {codes}")
    
    def _emit_realtime_data(self):
        """실시간 데이터 발생"""
        for code in self.subscribed_codes:
            if code in self.stock_prices:
                base = self.stock_prices[code]
                price = base["현재가"] + random.randint(-100, 100)
                
                data = {
                    "현재가": price,
                    "전일대비": str(random.randint(-500, 500)),
                    "등락율": f"{random.uniform(-2, 2):.2f}",
                    "거래량": str(random.randint(1000, 10000)),
                }
                
                self.realtime_data_received.emit(code, data)
    
    def unsubscribe_realtime(self, codes=None):
        """실시간 해제"""
        if self.realtime_timer:
            self.realtime_timer.stop()
        self.subscribed_codes = []
        logger.info("🔧 [Mock] 실시간 구독 해제")
    
    # ========== 선물옵션 Mock ==========
    
    def get_future_price(self, code):
        """선물 시세 (Mock)"""
        return {
            "종목명": "코스피200 F 2403",
            "현재가": 365.50 + random.uniform(-2, 2),
            "전일대비": "1.25",
            "등락율": "0.34",
            "거래량": "123456",
            "미결제약정": "234567",
        }
    
    def get_option_price(self, code):
        """옵션 시세 (Mock)"""
        return {
            "종목명": "코스피200 C 2403 370",
            "현재가": 3.50 + random.uniform(-0.5, 0.5),
            "전일대비": "0.25",
            "내재변동성": "15.5",
            "델타": "0.45",
            "감마": "0.02",
            "세타": "-0.15",
            "베가": "0.08",
        }
    
    def buy_future(self, code, qty, price=0, hoga_type="3"):
        """선물 매수 (Mock)"""
        logger.info(f"🔧 [Mock] 선물 매수: {code} {qty}계약")
        return 0
    
    def sell_future(self, code, qty, price=0, hoga_type="3"):
        """선물 매도 (Mock)"""
        logger.info(f"🔧 [Mock] 선물 매도: {code} {qty}계약")
        return 0
    
    def get_fo_deposit(self, account_no=None):
        """선옵 예수금 (Mock)"""
        return {
            "예수금": "10000000",
            "증거금": "5000000",
            "주문가능금액": "5000000",
        }
    
    def get_stock_hoga(self, code):
        """호가 조회 (Mock)"""
        base = self.stock_prices.get(code, {}).get("현재가", 50000)
        
        return {
            "호가시간": "100000",
            "매도호가1": base + 100,
            "매도호가2": base + 200,
            "매도호가3": base + 300,
            "매도호가4": base + 400,
            "매도호가5": base + 500,
            "매수호가1": base,
            "매수호가2": base - 100,
            "매수호가3": base - 200,
            "매수호가4": base - 300,
            "매수호가5": base - 400,
            "매도수량1": random.randint(100, 1000),
            "매도수량2": random.randint(100, 1000),
            "매도수량3": random.randint(100, 1000),
            "매도수량4": random.randint(100, 1000),
            "매도수량5": random.randint(100, 1000),
            "매수수량1": random.randint(100, 1000),
            "매수수량2": random.randint(100, 1000),
            "매수수량3": random.randint(100, 1000),
            "매수수량4": random.randint(100, 1000),
            "매수수량5": random.randint(100, 1000),
        }
    
    # ========== 조건검색 Mock ==========
    
    def load_condition(self):
        """조건식 로드 (Mock)"""
        logger.info("🔧 [Mock] 조건식 로드")
        return 1
    
    def get_condition_list(self):
        """조건식 목록 (Mock)"""
        return self.condition_list
    
    def search_by_condition(self, condition_name, index, is_realtime=False):
        """조건검색 (Mock)"""
        logger.info(f"🔧 [Mock] 조건검색: {condition_name}")
        
        # 가상 검색 결과
        self.searched_stocks = [
            {"code": "005930", "name": "삼성전자"},
            {"code": "000660", "name": "SK하이닉스"},
            {"code": "035420", "name": "NAVER"},
            {"code": "035720", "name": "카카오"},
            {"code": "051910", "name": "LG화학"},
        ][:random.randint(2, 5)]
        
        # 시그널 발생
        QTimer.singleShot(500, lambda: self.condition_searched.emit(condition_name, self.searched_stocks))
        
        return 1
    
    def stop_condition(self, condition_name, index):
        """조건검색 중지 (Mock)"""
        logger.info(f"🔧 [Mock] 조건검색 중지: {condition_name}")
    
    def get_top_volume(self, market="0"):
        """거래량 상위 (Mock)"""
        stocks = [
            {"종목코드": "005930", "종목명": "삼성전자", "현재가": 75000, "등락율": "2.5", "거래량": 15000000},
            {"종목코드": "000660", "종목명": "SK하이닉스", "현재가": 175000, "등락율": "-1.2", "거래량": 8000000},
            {"종목코드": "035420", "종목명": "NAVER", "현재가": 215000, "등락율": "1.8", "거래량": 3000000},
            {"종목코드": "035720", "종목명": "카카오", "현재가": 48500, "등락율": "3.2", "거래량": 5000000},
            {"종목코드": "051910", "종목명": "LG화학", "현재가": 380000, "등락율": "-0.5", "거래량": 1000000},
        ]
        return {"종목리스트": stocks}
    
    def get_top_rise(self, market="0"):
        """상승률 상위 (Mock)"""
        stocks = [
            {"종목코드": "123456", "종목명": "테스트A", "현재가": 15000, "등락율": "29.8", "거래량": 5000000},
            {"종목코드": "234567", "종목명": "테스트B", "현재가": 8500, "등락율": "25.3", "거래량": 3000000},
            {"종목코드": "345678", "종목명": "테스트C", "현재가": 32000, "등락율": "18.7", "거래량": 2000000},
            {"종목코드": "035720", "종목명": "카카오", "현재가": 48500, "등락율": "15.2", "거래량": 5000000},
            {"종목코드": "005930", "종목명": "삼성전자", "현재가": 75000, "등락율": "8.5", "거래량": 15000000},
        ]
        return {"종목리스트": stocks}




