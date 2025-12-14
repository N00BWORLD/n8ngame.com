import sys
from PyQt5.QtWidgets import QApplication
from PyQt5.QAxContainer import QAxWidget
from PyQt5.QtCore import QObject, pyqtSlot

class KiwoomLoginTest(QObject):
    def __init__(self):
        super().__init__()
        self.ocx = QAxWidget("KHOPENAPI.KHOpenAPICtrl.1")
        self.ocx.OnEventConnect.connect(self.on_event_connect)
    
    def login(self):
        print("Starting Login...")
        ret = self.ocx.dynamicCall("CommConnect()")
        if ret == 0:
            print("Login Popup Triggered. Please enter password in the popup.")
        else:
            print(f"Failed to trigger login. Error Code: {ret}")

    @pyqtSlot(int)
    def on_event_connect(self, err_code):
        if err_code == 0:
            print("[SUCCESS] Connected to Kiwoom Server!")
            print("You can now close this window.")
            # Verify Account Info (Optional)
            acc_list = self.ocx.dynamicCall("GetLoginInfo(QString)", "ACCNO")
            print(f"Accounts: {acc_list}")
        else:
            print(f"[FAIL] Login Failed. Error Code: {err_code}")
        
        # Exit app after result
        # sys.exit() 

if __name__ == "__main__":
    app = QApplication(sys.argv)
    kiwoom = KiwoomLoginTest()
    kiwoom.login()
    sys.exit(app.exec_())
