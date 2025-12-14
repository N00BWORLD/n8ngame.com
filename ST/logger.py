"""
매매 로그 시스템
- 주문/체결 기록
- 파일 및 콘솔 로깅
"""

import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler


class TradingLogger:
    def __init__(self, name="trading", log_dir="logs"):
        self.log_dir = log_dir
        self._ensure_log_dir()
        
        # 메인 로거
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        
        # 포맷터
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # 콘솔 핸들러
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)
        
        # 파일 핸들러 (일반 로그)
        file_handler = RotatingFileHandler(
            os.path.join(log_dir, "trading.log"),
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        
        # 주문 전용 핸들러
        order_handler = RotatingFileHandler(
            os.path.join(log_dir, "orders.log"),
            maxBytes=10*1024*1024,
            backupCount=10,
            encoding='utf-8'
        )
        order_handler.setLevel(logging.INFO)
        order_handler.setFormatter(formatter)
        
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)
        
        # 주문 로거
        self.order_logger = logging.getLogger(f"{name}_orders")
        self.order_logger.setLevel(logging.INFO)
        self.order_logger.addHandler(order_handler)
    
    def _ensure_log_dir(self):
        """로그 디렉토리 생성"""
        if not os.path.exists(self.log_dir):
            os.makedirs(self.log_dir)
    
    def debug(self, msg):
        self.logger.debug(msg)
    
    def info(self, msg):
        self.logger.info(msg)
    
    def warning(self, msg):
        self.logger.warning(msg)
    
    def error(self, msg):
        self.logger.error(msg)
    
    def critical(self, msg):
        self.logger.critical(msg)
    
    # ========== 매매 전용 로그 ==========
    
    def log_order(self, order_type, code, name, quantity, price, hoga_type):
        """주문 로그"""
        hoga_name = "지정가" if hoga_type == "00" else "시장가"
        msg = f"[주문] {order_type} | {name}({code}) | {quantity}주 | {price:,}원 | {hoga_name}"
        self.order_logger.info(msg)
        self.logger.info(msg)
    
    def log_execution(self, code, name, quantity, price, order_no):
        """체결 로그"""
        msg = f"[체결] {name}({code}) | {quantity}주 | {price:,}원 | 주문번호: {order_no}"
        self.order_logger.info(msg)
        self.logger.info(msg)
    
    def log_cancel(self, code, name, quantity, order_no):
        """취소 로그"""
        msg = f"[취소] {name}({code}) | {quantity}주 | 주문번호: {order_no}"
        self.order_logger.info(msg)
        self.logger.info(msg)
    
    def log_balance(self, total_value, profit_rate, holdings):
        """잔고 로그"""
        msg = f"[잔고] 총평가: {total_value:,}원 | 수익률: {profit_rate}%"
        self.logger.info(msg)
        for h in holdings:
            self.logger.info(f"  - {h['종목명']}: {h['보유수량']}주 ({h['수익률']}%)")


# 전역 로거 인스턴스
logger = TradingLogger()




