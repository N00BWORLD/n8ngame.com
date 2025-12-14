"""
키움증권 Open API+ 연동 클래스
- 로그인, 계좌조회, 주문, 시세조회 기능
- 실시간 데이터, 미체결 조회, 주문 취소
"""

import sys
import time
from PyQt5.QAxContainer import QAxWidget
from PyQt5.QtCore import QEventLoop, QTimer, pyqtSignal, QObject
from PyQt5.QtWidgets import QApplication
from logger import logger
import config


class Kiwoom(QObject):
    # 시그널 정의
    realtime_data_received = pyqtSignal(str, dict)  # 실시간 데이터
    order_executed = pyqtSignal(dict)  # 체결 알림
    condition_searched = pyqtSignal(str, list)  # 조건검색 결과 (조건명, 종목리스트)
    realtime_condition = pyqtSignal(str, str, str)  # 실시간 조건 (코드, 종목명, 편입/이탈)
    
    def __init__(self):
        super().__init__()
        
        self.app = QApplication.instance()
        if not self.app:
            self.app = QApplication(sys.argv)
        
        # 키움 API COM 객체 생성
        self.ocx = QAxWidget("KHOPENAPI.KHOpenAPICtrl.1")
        
        # 이벤트 루프
        self.login_loop = QEventLoop()
        self.request_loop = QEventLoop()
        
        # 데이터 저장용
        self.account_list = []
        self.current_account = ""
        self.account_password = ""  # 계좌 비밀번호
        self.stock_data = {}
        self.order_data = {}
        self.realtime_stocks = {}  # 실시간 구독 종목
        
        # 미체결 주문
        self.pending_orders = []
        
        # 조건검색
        self.condition_list = {}  # {인덱스: 조건명}
        self.condition_loaded = False
        self.searched_stocks = []  # 검색된 종목
        
        # 요청 제한 관리
        self.last_request_time = 0
        
        # 이벤트 연결
        self._connect_events()
    
    def _connect_events(self):
        """이벤트 핸들러 연결"""
        self.ocx.OnEventConnect.connect(self._on_event_connect)
        self.ocx.OnReceiveTrData.connect(self._on_receive_tr_data)
        self.ocx.OnReceiveChejanData.connect(self._on_receive_chejan_data)
        self.ocx.OnReceiveMsg.connect(self._on_receive_msg)
        self.ocx.OnReceiveRealData.connect(self._on_receive_real_data)
        self.ocx.OnReceiveConditionVer.connect(self._on_receive_condition_ver)
        self.ocx.OnReceiveTrCondition.connect(self._on_receive_tr_condition)
        self.ocx.OnReceiveRealCondition.connect(self._on_receive_real_condition)
    
    def _request_throttle(self):
        """API 요청 제한 (초당 5회)"""
        elapsed = time.time() - self.last_request_time
        if elapsed < config.REQUEST_INTERVAL:
            time.sleep(config.REQUEST_INTERVAL - elapsed)
        self.last_request_time = time.time()
    
    # ========== 로그인 관련 ==========
    
    def login(self):
        """로그인 창 띄우기"""
        self.ocx.dynamicCall("CommConnect()")
        self.login_loop.exec_()
    
    def _on_event_connect(self, err_code):
        """로그인 이벤트 처리"""
        if err_code == 0:
            logger.info("✅ 로그인 성공!")
            self._load_account_info()
        else:
            logger.error(f"❌ 로그인 실패 (에러코드: {err_code})")
        self.login_loop.exit()
    
    def _load_account_info(self):
        """계좌 정보 로드"""
        accounts = self.ocx.dynamicCall("GetLoginInfo(QString)", "ACCNO")
        self.account_list = accounts.strip().split(';')
        self.account_list = [acc for acc in self.account_list if acc]
        
        if self.account_list:
            self.current_account = self.account_list[0]
            logger.info(f"📋 계좌 목록: {self.account_list}")
            logger.info(f"📌 현재 선택 계좌: {self.current_account}")
    
    def get_login_info(self, tag):
        """로그인 정보 조회"""
        return self.ocx.dynamicCall("GetLoginInfo(QString)", tag)
    
    def is_connected(self):
        """연결 상태 확인"""
        state = self.ocx.dynamicCall("GetConnectState()")
        return state == 1
    
    def get_server_type(self):
        """서버 구분 (모의투자/실거래)"""
        server = self.get_login_info("GetServerGubun")
        return "모의투자" if server == "1" else "실거래"
    
    def set_account_password(self, password):
        """계좌 비밀번호 설정"""
        self.account_password = password
        # 비밀번호 자동입력 설정
        self.ocx.dynamicCall("KOA_Functions(QString, QString)", "ShowAccountWindow", "")
        logger.info("🔐 계좌 비밀번호 설정 완료")
    
    # ========== 계좌 조회 ==========
    
    def get_account_balance(self, account_no=None):
        """계좌 잔고 조회 (opw00018)"""
        self._request_throttle()
        
        if not account_no:
            account_no = self.current_account
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "계좌번호", account_no)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "비밀번호", self.account_password)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "비밀번호입력매체구분", "00")
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "조회구분", "1")
        
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "계좌잔고조회", "opw00018", 0, "0101"
        )
        self.request_loop.exec_()
        
        return self.stock_data
    
    def get_deposit(self, account_no=None):
        """예수금 조회 (opw00001)"""
        self._request_throttle()
        
        if not account_no:
            account_no = self.current_account
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "계좌번호", account_no)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "비밀번호", self.account_password)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "비밀번호입력매체구분", "00")
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "조회구분", "2")
        
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "예수금조회", "opw00001", 0, "0102"
        )
        self.request_loop.exec_()
        
        return self.stock_data
    
    # ========== 종목 정보 조회 ==========
    
    def get_stock_price(self, code):
        """주식 현재가 조회 (opt10001)"""
        self._request_throttle()
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", code)
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "주식기본정보", "opt10001", 0, "0103"
        )
        self.request_loop.exec_()
        
        return self.stock_data
    
    def get_stock_name(self, code):
        """종목명 조회"""
        return self.ocx.dynamicCall("GetMasterCodeName(QString)", code)
    
    def get_daily_chart(self, code, count=60):
        """일봉 데이터 조회 (opt10081)"""
        self._request_throttle()
        
        from datetime import datetime
        today = datetime.now().strftime("%Y%m%d")
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", code)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "기준일자", today)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "수정주가구분", "1")
        
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "일봉조회", "opt10081", 0, "0104"
        )
        self.request_loop.exec_()
        
        return self.stock_data
    
    def get_minute_chart(self, code, tick_unit=1):
        """분봉 데이터 조회 (opt10080)"""
        self._request_throttle()
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", code)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "틱범위", str(tick_unit))
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "수정주가구분", "1")
        
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "분봉조회", "opt10080", 0, "0105"
        )
        self.request_loop.exec_()
        
        return self.stock_data
    
    # ========== 미체결 조회 ==========
    
    def get_pending_orders(self, account_no=None):
        """미체결 주문 조회 (opt10075)"""
        self._request_throttle()
        
        if not account_no:
            account_no = self.current_account
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "계좌번호", account_no)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "전체종목구분", "0")
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "매매구분", "0")
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "체결구분", "1")  # 미체결
        
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "미체결조회", "opt10075", 0, "0106"
        )
        self.request_loop.exec_()
        
        return self.pending_orders
    
    # ========== 주문 ==========
    
    def send_order(self, order_type, code, quantity, price=0, 
                   hoga_type="03", account_no=None):
        """주문 전송
        
        Args:
            order_type: 1=신규매수, 2=신규매도, 3=매수취소, 4=매도취소, 5=매수정정, 6=매도정정
            code: 종목코드
            quantity: 수량
            price: 가격 (시장가일 경우 0)
            hoga_type: 00=지정가, 03=시장가, 05=조건부지정가, 06=최유리지정가
            account_no: 계좌번호
        """
        if not account_no:
            account_no = self.current_account
        
        # 안전장치
        if quantity > config.MAX_ORDER_QUANTITY:
            logger.warning(f"⚠️ 주문 수량 초과: {quantity} > {config.MAX_ORDER_QUANTITY}")
            return -1
        
        if price * quantity > config.MAX_ORDER_AMOUNT:
            logger.warning(f"⚠️ 주문 금액 초과: {price * quantity:,} > {config.MAX_ORDER_AMOUNT:,}")
            return -1
        
        order_type_names = {1: "매수", 2: "매도", 3: "매수취소", 4: "매도취소", 5: "매수정정", 6: "매도정정"}
        order_type_name = order_type_names.get(order_type, "알수없음")
        stock_name = self.get_stock_name(code)
        hoga_name = "지정가" if hoga_type == "00" else "시장가"
        
        logger.log_order(order_type_name, code, stock_name, quantity, price, hoga_type)
        
        result = self.ocx.dynamicCall(
            "SendOrder(QString, QString, QString, int, QString, int, int, QString, QString)",
            [f"{order_type_name}주문", "0201", account_no, order_type, 
             code, quantity, price, hoga_type, ""]
        )
        
        if result == 0:
            logger.info(f"✅ {order_type_name} 주문 전송 성공")
        else:
            logger.error(f"❌ {order_type_name} 주문 전송 실패 (에러코드: {result})")
        
        return result
    
    def buy(self, code, quantity, price=0, hoga_type="03"):
        """매수 주문"""
        return self.send_order(1, code, quantity, price, hoga_type)
    
    def buy_limit(self, code, quantity, price):
        """지정가 매수"""
        return self.send_order(1, code, quantity, price, "00")
    
    def sell(self, code, quantity, price=0, hoga_type="03"):
        """매도 주문"""
        return self.send_order(2, code, quantity, price, hoga_type)
    
    def sell_limit(self, code, quantity, price):
        """지정가 매도"""
        return self.send_order(2, code, quantity, price, "00")
    
    def cancel_order(self, order_no, code, quantity, order_type=3):
        """주문 취소
        order_type: 3=매수취소, 4=매도취소
        """
        result = self.ocx.dynamicCall(
            "SendOrder(QString, QString, QString, int, QString, int, int, QString, QString)",
            ["주문취소", "0202", self.current_account, order_type, 
             code, quantity, 0, "", order_no]
        )
        
        stock_name = self.get_stock_name(code)
        if result == 0:
            logger.log_cancel(code, stock_name, quantity, order_no)
        else:
            logger.error(f"❌ 주문 취소 실패: {order_no}")
        
        return result
    
    # ========== 실시간 데이터 ==========
    
    def subscribe_realtime(self, codes, fid_list="10;11;12;13;14;15"):
        """실시간 시세 구독
        
        FID:
        10=현재가, 11=전일대비, 12=등락율, 13=누적거래량
        14=누적거래대금, 15=거래량
        """
        if isinstance(codes, list):
            codes = ";".join(codes)
        
        # 실시간 등록
        self.ocx.dynamicCall(
            "SetRealReg(QString, QString, QString, QString)",
            "1000", codes, fid_list, "0"  # 0=기존 유지하며 추가
        )
        
        for code in codes.split(";"):
            self.realtime_stocks[code] = True
        
        logger.info(f"📡 실시간 시세 구독: {codes}")
    
    def unsubscribe_realtime(self, codes=None):
        """실시간 시세 해제"""
        if codes is None:
            self.ocx.dynamicCall("SetRealRemove(QString, QString)", "ALL", "ALL")
            self.realtime_stocks.clear()
            logger.info("📡 전체 실시간 시세 해제")
        else:
            if isinstance(codes, list):
                codes = ";".join(codes)
            
            for code in codes.split(";"):
                self.ocx.dynamicCall("SetRealRemove(QString, QString)", "1000", code)
                if code in self.realtime_stocks:
                    del self.realtime_stocks[code]
            
            logger.info(f"📡 실시간 시세 해제: {codes}")
    
    # ========== 이벤트 핸들러 ==========
    
    def _on_receive_tr_data(self, screen_no, rq_name, tr_code, record_name, 
                            prev_next, data_len, err_code, msg1, msg2):
        """TR 데이터 수신 이벤트"""
        
        if rq_name == "주식기본정보":
            self.stock_data = {
                "종목명": self._get_comm_data(tr_code, rq_name, 0, "종목명"),
                "현재가": abs(int(self._get_comm_data(tr_code, rq_name, 0, "현재가") or 0)),
                "전일대비": self._get_comm_data(tr_code, rq_name, 0, "전일대비"),
                "등락율": self._get_comm_data(tr_code, rq_name, 0, "등락율"),
                "거래량": self._get_comm_data(tr_code, rq_name, 0, "거래량"),
                "시가": abs(int(self._get_comm_data(tr_code, rq_name, 0, "시가") or 0)),
                "고가": abs(int(self._get_comm_data(tr_code, rq_name, 0, "고가") or 0)),
                "저가": abs(int(self._get_comm_data(tr_code, rq_name, 0, "저가") or 0)),
            }
        
        elif rq_name == "예수금조회":
            self.stock_data = {
                "예수금": self._get_comm_data(tr_code, rq_name, 0, "예수금"),
                "출금가능금액": self._get_comm_data(tr_code, rq_name, 0, "출금가능금액"),
                "주문가능금액": self._get_comm_data(tr_code, rq_name, 0, "주문가능금액"),
            }
        
        elif rq_name == "계좌잔고조회":
            count = self.ocx.dynamicCall("GetRepeatCnt(QString, QString)", tr_code, rq_name)
            holdings = []
            
            total_buy = 0
            total_eval = 0
            
            for i in range(count):
                item = {
                    "종목번호": self._get_comm_data(tr_code, rq_name, i, "종목번호").replace("A", ""),
                    "종목명": self._get_comm_data(tr_code, rq_name, i, "종목명"),
                    "보유수량": int(self._get_comm_data(tr_code, rq_name, i, "보유수량") or 0),
                    "매입가": int(self._get_comm_data(tr_code, rq_name, i, "매입가") or 0),
                    "현재가": int(self._get_comm_data(tr_code, rq_name, i, "현재가") or 0),
                    "수익률": self._get_comm_data(tr_code, rq_name, i, "수익률(%)"),
                    "평가손익": int(self._get_comm_data(tr_code, rq_name, i, "평가손익") or 0),
                }
                holdings.append(item)
                
                total_buy += item["매입가"] * item["보유수량"]
                total_eval += item["현재가"] * item["보유수량"]
            
            self.stock_data = {
                "보유종목": holdings,
                "총매입금액": total_buy,
                "총평가금액": total_eval,
                "총손익": total_eval - total_buy,
            }
        
        elif rq_name == "일봉조회":
            count = self.ocx.dynamicCall("GetRepeatCnt(QString, QString)", tr_code, rq_name)
            candles = []
            
            for i in range(min(count, 60)):
                item = {
                    "일자": self._get_comm_data(tr_code, rq_name, i, "일자"),
                    "시가": abs(int(self._get_comm_data(tr_code, rq_name, i, "시가") or 0)),
                    "고가": abs(int(self._get_comm_data(tr_code, rq_name, i, "고가") or 0)),
                    "저가": abs(int(self._get_comm_data(tr_code, rq_name, i, "저가") or 0)),
                    "종가": abs(int(self._get_comm_data(tr_code, rq_name, i, "현재가") or 0)),
                    "거래량": int(self._get_comm_data(tr_code, rq_name, i, "거래량") or 0),
                }
                candles.append(item)
            
            self.stock_data = {"일봉": candles}
        
        elif rq_name == "분봉조회":
            count = self.ocx.dynamicCall("GetRepeatCnt(QString, QString)", tr_code, rq_name)
            candles = []
            
            for i in range(min(count, 100)):
                item = {
                    "체결시간": self._get_comm_data(tr_code, rq_name, i, "체결시간"),
                    "시가": abs(int(self._get_comm_data(tr_code, rq_name, i, "시가") or 0)),
                    "고가": abs(int(self._get_comm_data(tr_code, rq_name, i, "고가") or 0)),
                    "저가": abs(int(self._get_comm_data(tr_code, rq_name, i, "저가") or 0)),
                    "종가": abs(int(self._get_comm_data(tr_code, rq_name, i, "현재가") or 0)),
                    "거래량": int(self._get_comm_data(tr_code, rq_name, i, "거래량") or 0),
                }
                candles.append(item)
            
            self.stock_data = {"분봉": candles}
        
        elif rq_name == "미체결조회":
            count = self.ocx.dynamicCall("GetRepeatCnt(QString, QString)", tr_code, rq_name)
            self.pending_orders = []
            
            for i in range(count):
                item = {
                    "주문번호": self._get_comm_data(tr_code, rq_name, i, "주문번호"),
                    "종목코드": self._get_comm_data(tr_code, rq_name, i, "종목코드"),
                    "종목명": self._get_comm_data(tr_code, rq_name, i, "종목명"),
                    "주문수량": int(self._get_comm_data(tr_code, rq_name, i, "주문수량") or 0),
                    "주문가격": int(self._get_comm_data(tr_code, rq_name, i, "주문가격") or 0),
                    "미체결수량": int(self._get_comm_data(tr_code, rq_name, i, "미체결수량") or 0),
                    "주문구분": self._get_comm_data(tr_code, rq_name, i, "주문구분"),
                    "시간": self._get_comm_data(tr_code, rq_name, i, "시간"),
                }
                self.pending_orders.append(item)
        
        elif rq_name == "선물현재가":
            self.stock_data = {
                "종목명": self._get_comm_data(tr_code, rq_name, 0, "종목명"),
                "현재가": abs(float(self._get_comm_data(tr_code, rq_name, 0, "현재가") or 0)),
                "전일대비": self._get_comm_data(tr_code, rq_name, 0, "전일대비"),
                "등락율": self._get_comm_data(tr_code, rq_name, 0, "등락율"),
                "거래량": self._get_comm_data(tr_code, rq_name, 0, "거래량"),
                "미결제약정": self._get_comm_data(tr_code, rq_name, 0, "미결제약정"),
            }
        
        elif rq_name == "옵션현재가":
            self.stock_data = {
                "종목명": self._get_comm_data(tr_code, rq_name, 0, "종목명"),
                "현재가": abs(float(self._get_comm_data(tr_code, rq_name, 0, "현재가") or 0)),
                "전일대비": self._get_comm_data(tr_code, rq_name, 0, "전일대비"),
                "내재변동성": self._get_comm_data(tr_code, rq_name, 0, "내재변동성"),
                "델타": self._get_comm_data(tr_code, rq_name, 0, "델타"),
                "감마": self._get_comm_data(tr_code, rq_name, 0, "감마"),
                "세타": self._get_comm_data(tr_code, rq_name, 0, "세타"),
                "베가": self._get_comm_data(tr_code, rq_name, 0, "베가"),
            }
        
        elif rq_name == "선옵예수금조회":
            self.stock_data = {
                "예수금": self._get_comm_data(tr_code, rq_name, 0, "예수금"),
                "증거금": self._get_comm_data(tr_code, rq_name, 0, "증거금"),
                "주문가능금액": self._get_comm_data(tr_code, rq_name, 0, "주문가능금액"),
            }
        
        elif rq_name == "주식호가":
            self.stock_data = {
                "호가시간": self._get_comm_data(tr_code, rq_name, 0, "호가시간"),
                "매도호가1": abs(int(self._get_comm_data(tr_code, rq_name, 0, "매도최우선호가") or 0)),
                "매도호가2": abs(int(self._get_comm_data(tr_code, rq_name, 0, "매도2차선호가") or 0)),
                "매도호가3": abs(int(self._get_comm_data(tr_code, rq_name, 0, "매도3차선호가") or 0)),
                "매도호가4": abs(int(self._get_comm_data(tr_code, rq_name, 0, "매도4차선호가") or 0)),
                "매도호가5": abs(int(self._get_comm_data(tr_code, rq_name, 0, "매도5차선호가") or 0)),
                "매수호가1": abs(int(self._get_comm_data(tr_code, rq_name, 0, "매수최우선호가") or 0)),
                "매수호가2": abs(int(self._get_comm_data(tr_code, rq_name, 0, "매수2차선호가") or 0)),
                "매수호가3": abs(int(self._get_comm_data(tr_code, rq_name, 0, "매수3차선호가") or 0)),
                "매수호가4": abs(int(self._get_comm_data(tr_code, rq_name, 0, "매수4차선호가") or 0)),
                "매수호가5": abs(int(self._get_comm_data(tr_code, rq_name, 0, "매수5차선호가") or 0)),
                "매도수량1": int(self._get_comm_data(tr_code, rq_name, 0, "매도최우선잔량") or 0),
                "매도수량2": int(self._get_comm_data(tr_code, rq_name, 0, "매도2차선잔량") or 0),
                "매도수량3": int(self._get_comm_data(tr_code, rq_name, 0, "매도3차선잔량") or 0),
                "매도수량4": int(self._get_comm_data(tr_code, rq_name, 0, "매도4차선잔량") or 0),
                "매도수량5": int(self._get_comm_data(tr_code, rq_name, 0, "매도5차선잔량") or 0),
                "매수수량1": int(self._get_comm_data(tr_code, rq_name, 0, "매수최우선잔량") or 0),
                "매수수량2": int(self._get_comm_data(tr_code, rq_name, 0, "매수2차선잔량") or 0),
                "매수수량3": int(self._get_comm_data(tr_code, rq_name, 0, "매수3차선잔량") or 0),
                "매수수량4": int(self._get_comm_data(tr_code, rq_name, 0, "매수4차선잔량") or 0),
                "매수수량5": int(self._get_comm_data(tr_code, rq_name, 0, "매수5차선잔량") or 0),
            }
        
        elif rq_name in ["거래량상위", "상승률상위"]:
            count = self.ocx.dynamicCall("GetRepeatCnt(QString, QString)", tr_code, rq_name)
            stocks = []
            
            for i in range(min(count, 30)):
                item = {
                    "종목코드": self._get_comm_data(tr_code, rq_name, i, "종목코드"),
                    "종목명": self._get_comm_data(tr_code, rq_name, i, "종목명"),
                    "현재가": abs(int(self._get_comm_data(tr_code, rq_name, i, "현재가") or 0)),
                    "등락율": self._get_comm_data(tr_code, rq_name, i, "등락율"),
                    "거래량": int(self._get_comm_data(tr_code, rq_name, i, "거래량") or 0),
                }
                stocks.append(item)
            
            self.stock_data = {"종목리스트": stocks}
        
        self.request_loop.exit()
    
    def _on_receive_chejan_data(self, gubun, item_cnt, fid_list):
        """체결/잔고 데이터 수신 이벤트"""
        if gubun == "0":  # 체결
            order_no = self._get_chejan_data(9203)
            code = self._get_chejan_data(9001).replace("A", "")
            stock_name = self._get_chejan_data(302)
            order_status = self._get_chejan_data(913)
            order_qty = int(self._get_chejan_data(900) or 0)
            order_price = int(self._get_chejan_data(901) or 0)
            exec_qty = int(self._get_chejan_data(911) or 0)
            exec_price = int(self._get_chejan_data(910) or 0)
            
            logger.info(f"\n📊 체결 알림: {stock_name}({code}) {order_status}")
            logger.info(f"   주문번호: {order_no}, 주문수량: {order_qty}, 체결수량: {exec_qty}")
            
            if exec_qty > 0:
                logger.log_execution(code, stock_name, exec_qty, exec_price, order_no)
            
            # 체결 시그널 발생
            self.order_executed.emit({
                "주문번호": order_no,
                "종목코드": code,
                "종목명": stock_name,
                "상태": order_status,
                "체결수량": exec_qty,
                "체결가격": exec_price,
            })
        
        elif gubun == "1":  # 잔고
            code = self._get_chejan_data(9001).replace("A", "")
            stock_name = self._get_chejan_data(302)
            quantity = int(self._get_chejan_data(930) or 0)
            buy_price = int(self._get_chejan_data(931) or 0)
            
            logger.info(f"💼 잔고 변경: {stock_name}({code}) {quantity}주 (평균가: {buy_price:,}원)")
    
    def _on_receive_msg(self, screen_no, rq_name, tr_code, msg):
        """메시지 수신 이벤트"""
        logger.info(f"📨 메시지: {msg}")
    
    def _on_receive_real_data(self, code, real_type, real_data):
        """실시간 데이터 수신 이벤트"""
        if real_type == "주식체결":
            current_price = abs(int(self._get_comm_real_data(code, 10) or 0))
            change = self._get_comm_real_data(code, 11)
            change_rate = self._get_comm_real_data(code, 12)
            volume = self._get_comm_real_data(code, 15)
            
            data = {
                "현재가": current_price,
                "전일대비": change,
                "등락율": change_rate,
                "거래량": volume,
            }
            
            # 시그널 발생
            self.realtime_data_received.emit(code, data)
    
    # ========== 유틸리티 ==========
    
    def _get_comm_data(self, tr_code, rq_name, index, item):
        """TR 데이터 조회"""
        data = self.ocx.dynamicCall(
            "GetCommData(QString, QString, int, QString)",
            tr_code, rq_name, index, item
        )
        return data.strip()
    
    def _get_chejan_data(self, fid):
        """체잔 데이터 조회"""
        data = self.ocx.dynamicCall("GetChejanData(int)", fid)
        return data.strip()
    
    def _get_comm_real_data(self, code, fid):
        """실시간 데이터 조회"""
        data = self.ocx.dynamicCall(
            "GetCommRealData(QString, int)", code, fid
        )
        return data.strip()
    
    def get_kospi_codes(self):
        """코스피 종목 리스트"""
        codes = self.ocx.dynamicCall("GetCodeListByMarket(QString)", "0")
        return codes.split(";")[:-1]
    
    def get_kosdaq_codes(self):
        """코스닥 종목 리스트"""
        codes = self.ocx.dynamicCall("GetCodeListByMarket(QString)", "10")
        return codes.split(";")[:-1]
    
    # ========== 선물/옵션 ==========
    
    def get_future_codes(self):
        """선물 종목 리스트"""
        codes = self.ocx.dynamicCall("GetFutureList()")
        return codes.split(";") if codes else []
    
    def get_option_codes(self, option_type="C"):
        """옵션 종목 리스트 (C=콜, P=풋)"""
        # 옵션 월물 코드 조회
        codes = self.ocx.dynamicCall("GetActPriceList()")
        return codes.split(";") if codes else []
    
    def get_future_price(self, code):
        """선물 현재가 조회 (opt50001)"""
        self._request_throttle()
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", code)
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "선물현재가", "opt50001", 0, "0301"
        )
        self.request_loop.exec_()
        
        return self.stock_data
    
    def get_option_price(self, code):
        """옵션 현재가 조회 (opt50004)"""
        self._request_throttle()
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", code)
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "옵션현재가", "opt50004", 0, "0302"
        )
        self.request_loop.exec_()
        
        return self.stock_data
    
    def send_order_fo(self, code, order_type, slbytp, qty, price=0, 
                      hoga_type="1", account_no=None):
        """선물옵션 주문
        
        Args:
            code: 종목코드
            order_type: 1=신규매매, 2=정정, 3=취소
            slbytp: 1=매도, 2=매수
            qty: 수량
            price: 가격 (시장가면 0)
            hoga_type: 1=지정가, 3=시장가
            account_no: 계좌번호
        """
        if not account_no:
            account_no = self.current_account
        
        order_name = "매수" if slbytp == "2" else "매도"
        logger.info(f"📝 선물옵션 {order_name} 주문: {code} {qty}계약")
        
        result = self.ocx.dynamicCall(
            "SendOrderFO(QString, QString, QString, QString, int, QString, int, QString, QString)",
            [f"선물{order_name}", "0601", account_no, code, order_type,
             slbytp, qty, price, hoga_type, ""]
        )
        
        if result == 0:
            logger.info(f"✅ 선물옵션 주문 전송 성공")
        else:
            logger.error(f"❌ 선물옵션 주문 실패 (에러코드: {result})")
        
        return result
    
    def buy_future(self, code, qty, price=0, hoga_type="3"):
        """선물 매수"""
        return self.send_order_fo(code, 1, "2", qty, price, hoga_type)
    
    def sell_future(self, code, qty, price=0, hoga_type="3"):
        """선물 매도"""
        return self.send_order_fo(code, 1, "1", qty, price, hoga_type)
    
    def get_fo_deposit(self, account_no=None):
        """선물옵션 예수금 조회 (opw20010)"""
        self._request_throttle()
        
        if not account_no:
            account_no = self.current_account
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "계좌번호", account_no)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "비밀번호", self.account_password)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "비밀번호입력매체구분", "00")
        
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "선옵예수금조회", "opw20010", 0, "0303"
        )
        self.request_loop.exec_()
        
        return self.stock_data
    
    # ========== 호가 조회 ==========
    
    def get_stock_hoga(self, code):
        """주식 호가 조회 (opt10004)"""
        self._request_throttle()
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", code)
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "주식호가", "opt10004", 0, "0401"
        )
        self.request_loop.exec_()
        
        return self.stock_data
    
    # ========== 조건검색 ==========
    
    def load_condition(self):
        """조건식 목록 로드"""
        result = self.ocx.dynamicCall("GetConditionLoad()")
        if result == 1:
            logger.info("📋 조건식 로드 요청...")
        else:
            logger.error("❌ 조건식 로드 실패")
        return result
    
    def get_condition_list(self):
        """조건식 목록 조회"""
        if not self.condition_loaded:
            self.load_condition()
            # 로드 완료 대기
            import time
            for _ in range(50):  # 최대 5초 대기
                if self.condition_loaded:
                    break
                time.sleep(0.1)
                self.app.processEvents()
        
        return self.condition_list
    
    def search_by_condition(self, condition_name, index, is_realtime=False):
        """조건검색 실행
        
        Args:
            condition_name: 조건식 이름
            index: 조건식 인덱스
            is_realtime: 실시간 조건검색 여부
        """
        search_type = 1 if is_realtime else 0
        
        result = self.ocx.dynamicCall(
            "SendCondition(QString, QString, int, int)",
            "0156", condition_name, index, search_type
        )
        
        if result == 1:
            logger.info(f"🔍 조건검색 실행: {condition_name}")
        else:
            logger.error(f"❌ 조건검색 실패: {condition_name}")
        
        return result
    
    def stop_condition(self, condition_name, index):
        """조건검색 중지"""
        self.ocx.dynamicCall(
            "SendConditionStop(QString, QString, int)",
            "0156", condition_name, index
        )
        logger.info(f"⏹️ 조건검색 중지: {condition_name}")
    
    def _on_receive_condition_ver(self, ret, msg):
        """조건식 로드 완료 이벤트"""
        if ret == 1:
            condition_str = self.ocx.dynamicCall("GetConditionNameList()")
            conditions = condition_str.split(";")
            
            self.condition_list = {}
            for cond in conditions:
                if cond:
                    parts = cond.split("^")
                    if len(parts) == 2:
                        idx, name = parts
                        self.condition_list[int(idx)] = name
            
            self.condition_loaded = True
            logger.info(f"📋 조건식 {len(self.condition_list)}개 로드 완료")
            for idx, name in self.condition_list.items():
                logger.info(f"   [{idx}] {name}")
        else:
            logger.error(f"❌ 조건식 로드 실패: {msg}")
    
    def _on_receive_tr_condition(self, screen_no, code_list, condition_name, 
                                  index, next_flag):
        """조건검색 결과 수신"""
        if code_list:
            codes = code_list.split(";")
            codes = [c for c in codes if c]
            
            self.searched_stocks = []
            for code in codes:
                name = self.get_stock_name(code)
                self.searched_stocks.append({"code": code, "name": name})
            
            logger.info(f"🔍 조건검색 결과: {condition_name} - {len(codes)}개 종목")
            self.condition_searched.emit(condition_name, self.searched_stocks)
        else:
            logger.info(f"🔍 조건검색 결과: {condition_name} - 0개 종목")
            self.condition_searched.emit(condition_name, [])
    
    def _on_receive_real_condition(self, code, event_type, condition_name, condition_index):
        """실시간 조건검색 편입/이탈"""
        name = self.get_stock_name(code)
        status = "편입" if event_type == "I" else "이탈"
        
        logger.info(f"🔔 실시간 조건: {name}({code}) {status} - {condition_name}")
        self.realtime_condition.emit(code, name, status)
    
    # ========== 거래량/상승률 상위 종목 ==========
    
    def get_top_volume(self, market="0"):
        """거래량 상위 종목 (opt10023)
        market: 0=코스피, 10=코스닥
        """
        self._request_throttle()
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "시장구분", market)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "정렬구분", "1")  # 거래량
        
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "거래량상위", "opt10023", 0, "0501"
        )
        self.request_loop.exec_()
        
        return self.stock_data
    
    def get_top_rise(self, market="0"):
        """상승률 상위 종목 (opt10018)
        market: 0=코스피, 10=코스닥
        """
        self._request_throttle()
        
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "시장구분", market)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "정렬구분", "1")  # 상승률
        
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            "상승률상위", "opt10018", 0, "0502"
        )
        self.request_loop.exec_()
        
        return self.stock_data


# 테스트
if __name__ == "__main__":
    kiwoom = Kiwoom()
    kiwoom.login()
    
    if kiwoom.is_connected():
        print(f"\n🖥️ 서버: {kiwoom.get_server_type()}")
        
        # 삼성전자 현재가 조회
        price_info = kiwoom.get_stock_price("005930")
        print(f"\n📈 삼성전자 정보: {price_info}")
        
        # 일봉 조회
        daily = kiwoom.get_daily_chart("005930")
        print(f"\n📊 일봉 데이터 (최근 5일):")
        for candle in daily.get("일봉", [])[:5]:
            print(f"  {candle}")
