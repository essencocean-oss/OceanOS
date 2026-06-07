import requests, json, sys
from datetime import datetime

def get_binance_klines(symbol="BTCUSDT", interval="1h"):
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit=24"
    r = requests.get(url)
    r.raise_for_status()
    return r.json()

def summarize(candles):
    closes = [float(c[4]) for c in candles]
    latest = closes[-1]
    high = max(closes)
    low = min(closes)
    return {
        "symbol": "BTC/USDT",
        "latest": latest,
        "24h_high": high,
        "24h_low": low,
        "ts": datetime.utcnow().isoformat() + "Z"
    }

if __name__ == "__main__":
    try:
        candles = get_binance_klines()
        print(json.dumps(summarize(candles), indent=2))
    except Exception as e:
        print({"error": str(e)})