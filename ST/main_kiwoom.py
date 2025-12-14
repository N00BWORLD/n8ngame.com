import sys
from PyQt5.QtWidgets import QApplication, QMainWindow, QTextEdit, QVBoxLayout, QWidget, QLabel
from PyQt5.QtCore import pyqtSignal, QObject
from kiwoom_core import Kiwoom
from strategy_condition import ConditionStrategy
import datetime

class Logger(QObject):
    sig_log = pyqtSignal(str)
    def write(self, msg): self.sig_log.emit(msg.strip())
    def flush(self): pass

class BotWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Kiwoom Speed Scalper")
        self.setGeometry(100, 100, 600, 400)
        
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        
        self.status = QLabel("Status: Init")
        layout.addWidget(self.status)
        
        self.log_area = QTextEdit()
        self.log_area.setReadOnly(True)
        layout.addWidget(self.log_area)
        
        from PyQt5.QtWidgets import QPushButton
        self.btn = QPushButton("Test Condition Logic")
        self.btn.clicked.connect(self.test_click)
        layout.addWidget(self.btn)

        self.logger = Logger()
        self.logger.sig_log.connect(self.append_log)
        sys.stdout = self.logger

    def append_log(self, msg):
        if not msg: return
        t = datetime.datetime.now().strftime("%H:%M:%S")
        self.log_area.append(f"[{t}] {msg}")
        c = self.log_area.textCursor()
        c.movePosition(c.End)
        self.log_area.setTextCursor(c)
        
    def test_click(self):
        print("Manual Test.")

def main():
    app = QApplication(sys.argv)
    window = BotWindow()
    window.show()
    
    print("=== Kiwoom Scalper Started ===")
    kiwoom = Kiwoom()
    kiwoom.login()
    
    if not kiwoom.account_list:
        print("No Account.")
        return
    
    account = kiwoom.account_list[0]
    print(f"Account: {account}")
    
    # Init Condition Strategy
    strategy = ConditionStrategy(kiwoom, account)
    
    # Link Signals
    kiwoom.sig_condition_ver.connect(strategy.on_condition_ver)
    kiwoom.sig_real_condition.connect(strategy.on_real_condition)
    
    # Start
    strategy.prepare_strategy()
    
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
