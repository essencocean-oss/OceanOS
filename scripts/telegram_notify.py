import sys
import json
import urllib.request
import os


def find_token():
    search_paths = [
        os.path.join(os.path.expanduser("~"), ".oceanos", ".env"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "oceanos", ".env"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
    ]
    for p in search_paths:
        if not os.path.isfile(p):
            continue
        with open(p, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("TELEGRAM_BOT_TOKEN=") and not line.startswith("#"):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def main():
    if len(sys.argv) < 2:
        print("Usage: telegram_notify.py <message>")
        sys.exit(1)
    text = " ".join(sys.argv[1:]).strip()
    if not text:
        print("SKIP: empty message")
        sys.exit(0)
    token = find_token()
    if not token:
        print("FAIL: TELEGRAM_BOT_TOKEN not found")
        sys.exit(1)
    chat = "6677764672"
    payload = json.dumps({"chat_id": chat, "text": text}).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        out = json.loads(r.read())
    print(f"OK: telegram sent ({out.get('ok')})")


if __name__ == "__main__":
    main()
