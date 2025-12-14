import yfinance as yf
import pandas as pd
import numpy as np

def run_backtest(code, start_money=50000, target_money=100000, k=0.5):
    # Fetch Data (1 Year)
    ticker = f"{code}.KS" # Samsung Electronics
    print(f"Fetching data for {ticker}...")
    df = yf.download(ticker, period="2y", progress=False)
    
    # Strategy Logic
    # Range = Prev High - Prev Low
    # Target = Today Open + Range * k
    
    df['prev_high'] = df['High'].shift(1)
    df['prev_low'] = df['Low'].shift(1)
    df['range'] = df['prev_high'] - df['prev_low']
    df['target'] = df['Open'] + (df['range'] * k)
    
    # Simulation
    balance = start_money
    days_passed = 0
    trade_count = 0
    win_count = 0
    
    print(f"Start Simulation with {balance:,} KRW")
    
    for date, row in df.iterrows():
        # Skip if data missing
        if pd.isna(row['target']): continue
        
        days_passed += 1
        
        # Buy Condition: Did price go above target?
        # We assume if High > Target, we bought.
        # But wait, Volatility Breakout usually buys at Target.
        # So Buy Price = Target Price.
        # Sell Price = Next Open.
        
        if row['High'] > row['target']:
            trade_count += 1
            buy_price = row['target']
            
            # Next Day Open is the Sell Price.
            # We need to look ahead.
            # actually iteration is easier if we just shift Close/Open.
            # Let's simplify: Sell at Current Close (simpler) or Next Open.
            # Original Larry Williams is Next Open.
            
            # Let's find Next Open
            if df.index.get_loc(date) + 1 < len(df):
                next_loc = df.index.get_loc(date) + 1
                sell_price = df.iloc[next_loc]['Open']
                
                # Calculate Return
                # Fee: 0.015% * 2 (approx) + Tax 0.20% = ~0.25%
                fee_rate = 0.0025
                profit_rate = (sell_price - buy_price) / buy_price
                profit_rate -= fee_rate # Deduct Fee
                
                # Update Balance
                # We invest 100% of balance? "Compound"
                balance = balance * (1 + profit_rate)
                
                if profit_rate > 0: win_count += 1
                
                # Check Target
                if balance >= target_money:
                    return {
                        "success": True, 
                        "days": days_passed, 
                        "final_balance": balance,
                        "trades": trade_count
                    }
            
    return {
        "success": False, 
        "days": days_passed, 
        "final_balance": balance,
        "trades": trade_count,
        "win_rate": win_count / trade_count if trade_count > 0 else 0
    }

if __name__ == "__main__":
    # Test on Samsung Electronics (005930) and SK Hynix (000660)
    for name, code in [("Samsung Electronics", "005930"), ("SK Hynix", "000660")]:
        print(f"\n--- Simulating {name} ---")
        res = run_backtest(code)
        if res['success']:
            print(f"🎉 DOUBLED! Took {res['days']} days (approx {res['days']/30:.1f} months)")
            print(f"Final Balance: {int(res['final_balance']):,} KRW")
            print(f"Trades: {res['trades']}")
        else:
            print(f"FAIL to double in 2 years.")
            print(f"Final Balance: {int(res['final_balance']):,} KRW")
            print(f"Return: {(res['final_balance']/50000 - 1)*100:.1f}%")
