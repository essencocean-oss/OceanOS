import sys, json, urllib.request

CMD = (sys.argv[1:2] or [None])[0]
ARG = (sys.argv[2:3] or [None])[0]

def http_get(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "OceanOS/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())

def get_sol_price():
    candidates = [
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
        "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT",
    ]
    last_err = None
    for url in candidates:
        try:
            data = http_get(url)
            if "solana" in data:
                price = data["solana"]["usd"]
            else:
                price = data.get("price") or data.get("lastPrice")
            print({"symbol": "SOL", "usd": price if isinstance(price, (int, float)) else str(price)})
            return price
        except Exception as exc:
            last_err = exc
    raise SystemExit(f"Price fetch failed: {last_err}")

def get_wallet_balance(address: str):
    rpc = "https://api.mainnet-beta.solana.com"
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getBalance",
        "params": [address],
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(rpc, data=data, headers={"Content-Type": "application/json", "User-Agent": "OceanOS/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        result = json.loads(resp.read())
    lamports = result.get("result", {}).get("value", 0)
    sol = lamports / 1_000_000_000
    print({"address": address, "lamports": lamports, "sol": sol})
    return sol

if CMD == "price":
    get_sol_price()
elif CMD == "wallet":
    if not ARG:
        raise SystemExit("usage: wallet <address>")
    get_wallet_balance(address=ARG)
else:
    raise SystemExit("Unknown command: try `price` or `wallet <address>`")
