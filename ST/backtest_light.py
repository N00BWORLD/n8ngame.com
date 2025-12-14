import urllib.request
import json
import time
from datetime import datetime

def fetch_data(symbol):
    # Yahoo Finance Chart API (Unofficial but reliable for simple Tests)
    # Symbol for Samsung: 005930.KS
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=2y"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.load(response)
            
        result = data['chart']['result'][0]
        timestamps = result['timestamp']
        quote = result['indicators']['quote'][0]
        
        opens = quote['open']
        highs = quote['high']
        lows = quote['low']
        closes = quote['close']
        
        # Zip into list of dicts
        candles = []
        for i in range(len(timestamps)):
            if opens[i] is None: continue
            candles.append({
                "ts": timestamps[i],
                "open": opens[i],
                "high": highs[i],
                "low": lows[i],
                "close": closes[i]
            })
        return candles
    except Exception as e:
        print(f"Error fetching data: {e}")
        return []

def simulate(candles, start_money=50000, target_money=100000, k=0.5):
    balance = start_money
    days = 0
    trades = 0
    wins = 0
    
    # Need prev day data
    for i in range(1, len(candles)):
        today = candles[i]
        prev = candles[i-1]
        
        date_str = datetime.fromtimestamp(today['ts']).strftime('%Y-%m-%d')
        
        # Volatility Breakout Logic
        rng = prev['high'] - prev['low']
        target_price = today['open'] + (rng * k)
        
        # Buy Condition: High > Target
        if today['high'] > target_price:
            trades += 1
            buy_price = target_price
            
            # Sell at Next Open (Larry Williams)
            # Check if next day exists
            if i + 1 < len(candles):
                sell_price = candles[i+1]['open']
                profit_pct = (sell_price - buy_price) / buy_price
                
                # Fee & Tax (0.25%)
                profit_pct -= 0.0025
                
                # Update Balance
                balance *= (1 + profit_pct)
                
                if profit_pct > 0: wins += 1
                
                # Check Goal
                days += 1
                if balance >= target_money:
                    return {
                        "success": True, 
                        "days": days, 
                        "final_balance": balance,
                        "trades": trades,
                        "cagr": (balance/start_money)**(365/days) - 1
                    }
        else:
            days += 1
            
    return {
        "success": False, 
        "days": days, 
        "final_balance": balance,
        "trades": trades
    }

if __name__ == "__main__":
    print("=== Backtest Simulation (50,000 KRW Start) ===")
    
    # 1. Samsung Electronics
    print("\n[Samsung Electronics (005930.KS)]")
    data = fetch_data("005930.KS")
    if data:
        res = simulate(data)
        if res['success']:
            print(f"✅ Success! Reached 100,000 KRW in {res['days']} trading days.")
        else:
            print(f"❌ Failed to double in 2 years.")
            print(f"   Final Balance: {int(res['final_balance']):,} KRW")
            print(f"   Return: {(res['final_balance']/50000 - 1)*100:.1f}%")
            
    # 2. SK Hynix
    print("\n[SK Hynix (000660.KS)]")
    data = fetch_data("000660.KS")
    if data:
        res = simulate(data)
        if res['success']:
            print(f"✅ Success! Reached 100,000 KRW in {res['days']} trading days.")
        else:
            print(f"❌ Failed to double in 2 years.")
            print(f"   Final Balance: {int(res['final_balance']):,} KRW")
            print(f"   Return: {(res['final_balance']/50000 - 1)*100:.1f}%")

    # 3. KOSDAQ Volatile (EcoPro)
    print("\n[EcoPro (086520.KQ)]")
    data = fetch_data("086520.KQ")
    if data:
        res = simulate(data)
        if res['success']:
            print(f"✅ Success! Reached 100,000 KRW in {res['days']} trading days.")
        else:
            print(f"❌ Failed to double in 2 years.")
            print(f"   Final Balance: {int(res['final_balance']):,} KRW")
            print(f"   Return: {(res['final_balance']/50000 - 1)*100:.1f}%")
