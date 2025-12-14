from datetime import datetime

class ConditionStrategy:
    def __init__(self, kiwoom, account_no):
        self.kiwoom = kiwoom
        self.account_no = account_no
        self.condition_name = "MyAutoBot" # Must match HTS save name
        self.condition_idx = None
        self.bought_today = {} # {code: {buy_price: 0, highest: 0}}
        
    def prepare_strategy(self):
        print(f"[Strategy] Loading Condition: {self.condition_name}...")
        # 1. Load Conditions from Server
        if self.kiwoom.load_condition() == 0:
            print("[Error] Failed to call load_condition")
    
    def on_condition_ver(self, ret, msg):
        """ Called when condition list is loaded """
        if ret == 1:
            print("[Kiwoom] Condition List Loaded.")
            cond_list = self.kiwoom.get_condition_list()
            # Find index query for "MyAutoBot"
            target_idx = None
            for idx, name in cond_list.items():
                if self.condition_name in name:
                    target_idx = idx
                    print(f"✅ Found Condition: {name} (Idx: {idx})")
                    break
            
            if target_idx is not None:
                self.condition_idx = int(target_idx)
                # 2. Request Realtime Condition Monitoring
                # ScreenNo "0156", ConditionName, Index, Search(1=Realtime)
                self.kiwoom.send_condition("0156", self.condition_name, self.condition_idx, 1)
                print(f"[Strategy] Started Realtime Monitoring for '{self.condition_name}'")
            else:
                print(f"❌ Condition '{self.condition_name}' NOT found. Please save it in HTS.")

    def on_real_condition(self, code, type_str, cond_name, cond_idx):
        """
        code: Stock Code
        type_str: 'I' (Inserted/Match), 'D' (Deleted/NoMatch)
        """
        if type_str == 'I':
            print(f"🚀 [CONDITION MATCH] {code} ({cond_name})")
            
            # Simple Logic: Buy if not bought today
            if code not in self.bought_today:
                self.buy(code)
        elif type_str == 'D':
            print(f"📉 [CONDITION EXIT] {code}")
            # Optional: Sell if condition breaks?
            # self.sell(code)

    def buy(self, code):
        print(f"💰 Buying {code} (Market Price)...")
        qty = 1 # 1 Share for test
        ret = self.kiwoom.send_order("Cond_Buy", "0101", self.account_no, 1, code, qty, 0, "03", "")
        if ret == 0:
            self.bought_today[code] = {"time": datetime.now()}

