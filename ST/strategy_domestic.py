from datetime import datetime
import time

class VolatilityBreakoutStrategy:
    def __init__(self, kiwoom, account_no, target_codes):
        self.kiwoom = kiwoom
        self.account_no = account_no
        self.target_codes = target_codes # list of codes
        
        self.targets = {} # {code: target_price}
        self.bought_today = {} # {code: bool}
        self.k = 0.5

    def prepare_strategy(self):
        """ Pre-market: Calculate Target Prices """
        print("\n[Strategy] Preparing Target Prices...")
        today_str = datetime.now().strftime("%Y%m%d")
        
        for code in self.target_codes:
            # 1. Get Daily Data (needs previous day)
            ohlcv = self.kiwoom.get_daily_ohlcv(code, today_str)
            if not ohlcv:
                print(f"Wait, no data for {code}")
                continue
                
            # ohlcv[0] is today (if market open) or yesterday?
            # Kiwoom returns recent ordered.
            # If market NOT started, ohlcv[0] is Yesterday.
            # If market STARTED, ohlcv[0] is Today, ohlcv[1] is Yesterday.
            
            # Simple check:
            # We need Previous Day's Range.
            # Let's assume ohlcv[0] is current today Candle (incomplete) or valid yesterday if before 9am?
            # Actually simplest verification: compare 'date'.
            
            # For simplicity in this demo, we assume ohlcv[0] is 'yesterday' if running at night,
            # or we specifically look for 'yesterday'.
            
            # Logic: Range = Prev_High - Prev_Low
            yesterday_data = ohlcv[0] # Assuming we run this before market or just take the latest closed candle
            # Note: During trading hours, [0] is today. [1] is yesterday.
            # We will use [1] for safety if [0].date == today.
            
            if yesterday_data['date'] == today_str:
                 # Today is present
                 yesterday_data = ohlcv[1]
            
            range_val = yesterday_data['high'] - yesterday_data['low']
            
            # We need Today's Open. If market not started, we can't know today Open.
            # Strategy: We set 'Range' and wait for First Price (Open) to set Target?
            # OR: Volatility Breakout usually uses Today Open.
            # So, Target = Today_Open + (Prev_Range * k)
            # We will calculate 'prev_range' now, and set target dynamically when we get Today's active price.
            
            self.targets[code] = {
                "range": range_val,
                "target_price": None # Will be set on first realtime data
            }
            print(f"  {code}: Prev Range {range_val} (H:{yesterday_data['high']} L:{yesterday_data['low']})")

    def make_decision(self, code, current_price):
        if not self.targets.get(code):
            return

        # 1. Set Target Price if not set (First tick is Open)
        if self.targets[code]["target_price"] is None:
            today_open = current_price # Approximation if running from start
            # Real VBO uses strict 'Open' from 9:00. 
            # We accept current_price as Open for now.
            rng = self.targets[code]["range"]
            self.targets[code]["target_price"] = today_open + (rng * self.k)
            print(f"  [{code}] Target Price Set: {self.targets[code]['target_price']} (Open:{today_open} + Range:{rng}*0.5)")
            return

        target = self.targets[code]["target_price"]
        
        # 2. Check Breakout
        if current_price >= target and not self.bought_today.get(code):
            print(f"🔥 BREAKOUT! {code}: {current_price} >= {target}")
            self.buy(code)

    def buy(self, code):
        # Market Buy 1 share for test
        qty = 1 
        ret = self.kiwoom.send_order("VBO_Buy", "0101", self.account_no, 1, code, qty, 0, "03", "")
        if ret == 0:
            print(f"✅ Order Sent: Buy {code}")
            self.bought_today[code] = True
