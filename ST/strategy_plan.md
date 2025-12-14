
# Domestic Stock Trading Strategy Plan (Aggressive)

## 1. Strategy: Real-time Condition Scalping (조건검색 단타)
Target: Stocks skyrocketing **Right Now**.
Goal: Capture 1~3% profit per trade, multiple times a day.

### 🟢 Logic
1.  **Source**: Kiwoom **Condition Search** (조건검색).
    -   User must define a condition in HTS (e.g., "Price Up 3% + Volume Up").
2.  **Buy Signal**:
    -   When Kiwoom sends `OnReceiveRealCondition` (Stock Inserted into list).
    -   **Instant Market Buy**.
3.  **Sell Signal**:
    -   **Trailing Stop**: If price drops 1.5% from highest point since buy.
    -   **Stop Loss**: -2% hard cut.
    -   **Take Profit**: +3% (Optional).

### 🟢 Risk Management
-   Max 3 Stocks at a time.
-   Don't trade same stock twice in 10 mins.

