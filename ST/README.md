# Kiwoom AI Auto Trading Bot

## 1. Introduction
This is an automated stock trading system designed for **Domestic Korean Stocks** (KOSPI/KOSDAQ) using the Kiwoom Open API+.

## 2. Strategy: Volatility Breakout (변동성 돌파)
We use the famous **Larry Williams' Volatility Breakout** strategy. It is designed to capture short-term momentum.

### 🟢 Concept
If the price moves significantly in one direction (uptime), it tends to continue that trend for the day. We only enter the market when this "breakout" is confirmed.

### 📝 Logic
1.  **Calculate Volatility (Range)**:
    -   `Range = Yesterday's High - Yesterday's Low`
    -   (Example: High 10000, Low 9000 -> Range 1000)

2.  **Set Buy Target**:
    -   `Target Price = Today's Open Price + (Range * k)`
    -   **k** factor (usually 0.5): Controls sensitivity.
    -   (Example: Open 9500 + (1000 * 0.5) = **10000**)

3.  **Buy Signal**:
    -   If `Current Price` >= `Target Price` -> **Instant BUY**.
    -   (This confirms the upward momentum is stronger than yesterday's noise)

4.  **Sell Signal**:
    -   **Sell at Market Price** on the **Next Day's Open**.
    -   Why? To avoid overnight gap risks and capture the day's trend profit.
    -   (Optional) **Stop Loss**: -2% immediately.

## 3. Usage
1.  **Run**: `venv32\Scripts\python main_kiwoom.py`
2.  **Login**: Enter Kiwoom Password.
3.  **Monitor**: The bot will calculate targets for watched stocks (e.g., Samsung Electronics) and buy automatically if the price triggers.

## 4. Requirements
-   Windows OS
-   Python 32-bit (`venv32`)
-   Kiwoom Open API+ Installed
