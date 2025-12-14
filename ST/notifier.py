"""
알림 시스템
- 텔레그램 알림
- 매수/매도 알림
"""

import requests
from logger import logger
import config


class TelegramNotifier:
    """텔레그램 알림"""
    
    def __init__(self, bot_token=None, chat_id=None):
        self.bot_token = bot_token or config.TELEGRAM_BOT_TOKEN
        self.chat_id = chat_id or config.TELEGRAM_CHAT_ID
        self.enabled = bool(self.bot_token and self.chat_id)
        
        if self.enabled:
            logger.info("📱 텔레그램 알림 활성화")
        else:
            logger.info("📱 텔레그램 알림 비활성화 (토큰/채팅ID 없음)")
    
    def send(self, message):
        """메시지 전송"""
        if not self.enabled:
            return False
        
        try:
            url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            data = {
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": "HTML"
            }
            response = requests.post(url, data=data, timeout=5)
            
            if response.status_code == 200:
                logger.debug(f"📱 텔레그램 전송 성공: {message[:30]}...")
                return True
            else:
                logger.error(f"📱 텔레그램 전송 실패: {response.text}")
                return False
        except Exception as e:
            logger.error(f"📱 텔레그램 오류: {e}")
            return False
    
    def notify_login(self, account, server_type):
        """로그인 알림"""
        msg = f"""
🔐 <b>로그인 완료</b>
계좌: {account}
서버: {server_type}
"""
        self.send(msg)
    
    def notify_buy(self, name, code, qty, price, reason=""):
        """매수 알림"""
        msg = f"""
🔴 <b>매수 체결</b>
종목: {name} ({code})
수량: {qty}주
가격: {price:,}원
금액: {qty * price:,}원
{f"사유: {reason}" if reason else ""}
"""
        self.send(msg)
    
    def notify_sell(self, name, code, qty, price, profit_rate=0, reason=""):
        """매도 알림"""
        emoji = "📈" if profit_rate > 0 else "📉"
        msg = f"""
🔵 <b>매도 체결</b>
종목: {name} ({code})
수량: {qty}주
가격: {price:,}원
수익률: {emoji} {profit_rate:.1f}%
{f"사유: {reason}" if reason else ""}
"""
        self.send(msg)
    
    def notify_signal(self, signal_type, name, code, price, reason):
        """매매 신호 알림"""
        emoji = "🚨" if signal_type == "buy" else "🔔"
        type_name = "매수" if signal_type == "buy" else "매도"
        msg = f"""
{emoji} <b>{type_name} 신호</b>
종목: {name} ({code})
현재가: {price:,}원
사유: {reason}
"""
        self.send(msg)
    
    def notify_error(self, error_msg):
        """에러 알림"""
        msg = f"""
❌ <b>오류 발생</b>
{error_msg}
"""
        self.send(msg)
    
    def notify_daily_report(self, total_value, profit, profit_rate, holdings):
        """일일 리포트"""
        holdings_str = "\n".join([
            f"  • {h['name']}: {h['qty']}주 ({h['profit_rate']}%)"
            for h in holdings[:5]
        ])
        
        emoji = "📈" if profit > 0 else "📉"
        msg = f"""
📊 <b>일일 리포트</b>
총 평가금액: {total_value:,}원
총 손익: {emoji} {profit:,}원 ({profit_rate:.1f}%)

<b>보유종목:</b>
{holdings_str}
"""
        self.send(msg)


# 전역 인스턴스
notifier = TelegramNotifier()

