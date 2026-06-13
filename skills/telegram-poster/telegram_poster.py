import requests, os, sys
from pathlib import Path

CONFIG_PATH = Path.home() / "AppData" / "Local" / "hermes" / "config.yaml"

def load_token():
    import re
    text = CONFIG_PATH.read_text(encoding='utf-8')
    m = re.search(r'telegram_token["\s:=]+([^\s"\']+)', text)
    return m.group(1) if m else None

def send_telegram(text):
    token = load_token()
    chat_id = "6677764672"
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    r = requests.post(url, json={"chat_id": chat_id, "text": text})
    return {"ok": r.status_code == 200, "status": r.status_code}

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "Hello from OceanOS skill engine"
    print(send_telegram(msg))