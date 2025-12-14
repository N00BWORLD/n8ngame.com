import sys
from PyQt5.QAxContainer import QAxWidget
from PyQt5.QtCore import QEventLoop, pyqtSignal, QObject

class Kiwoom(QObject):
    # Signals
    sig_connected = pyqtSignal(int)
    sig_realtime_data = pyqtSignal(str, float)
    sig_condition_ver = pyqtSignal(int, str)
    sig_real_condition = pyqtSignal(str, str, str, str) # code, type, name, idx
    
    def __init__(self):
        super().__init__()
        self.ocx = QAxWidget("KHOPENAPI.KHOpenAPICtrl.1")
        self.ocx.OnEventConnect.connect(self._on_connect)
        self.ocx.OnReceiveTrData.connect(self._on_tr_data)
        self.ocx.OnReceiveRealData.connect(self._on_real_data)
        self.ocx.OnReceiveConditionVer.connect(self._on_receive_condition_ver)
        self.ocx.OnReceiveRealCondition.connect(self._on_receive_real_condition)
        
        self.login_loop = None
        self.account_list = []
        self.condition_list = {}
        
    def login(self):
        self.login_loop = QEventLoop()
        self.ocx.dynamicCall("CommConnect()")
        self.login_loop.exec_()
        
    def _on_connect(self, err_code):
        if err_code == 0:
            print("[Kiwoom] Connected")
            self.account_list = self.get_login_info("ACCNO").split(';')
            self.account_list = [x for x in self.account_list if x]
        if self.login_loop: self.login_loop.exit()

    def get_login_info(self, tag):
        return self.ocx.dynamicCall("GetLoginInfo(QString)", tag)

    # --- Order ---
    def send_order(self, rq_name, screen, acc_no, order_type, code, qty, price, hoga, order_no=""):
        # print(f"[Kiwoom] Sending Order: {code} {qty}ea")
        return self.ocx.dynamicCall("SendOrder(QString, QString, QString, int, QString, int, int, QString, QString)",
                                   [rq_name, screen, acc_no, order_type, code, qty, price, hoga, order_no])

    # --- Condition Search ---
    def load_condition(self):
        return self.ocx.dynamicCall("GetConditionLoad()")

    def get_condition_list(self):
        data = self.ocx.dynamicCall("GetConditionNameList()")
        # Format: "index^name;index^name;..."
        conditions = {}
        if data:
            pairs = data.split(';')
            for p in pairs:
                if not p: continue
                idx, name = p.split('^')
                conditions[int(idx)] = name
        return conditions

    def send_condition(self, screen, name, idx, search_type):
        # search_type: 1=Realtime, 0=Global?
        return self.ocx.dynamicCall("SendCondition(QString, QString, int, int)", screen, name, idx, search_type)

    def _on_receive_condition_ver(self, ret, msg):
        self.sig_condition_ver.emit(ret, msg)

    def _on_receive_real_condition(self, code, type_str, cond_name, cond_idx):
        self.sig_real_condition.emit(code, type_str, cond_name, cond_idx)

    # --- Etc ---
    def _on_tr_data(self, *args): pass
    def _on_real_data(self, *args): pass
