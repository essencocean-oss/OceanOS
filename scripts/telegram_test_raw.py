import os
from pathlib import Path

# Read actual token from local Ocean env
paths = [
    Path(os.path.expanduser("~")) / ".oceanos" / ".env",
    Path(os.environ.get("LOCALAPPDATA", "")) / "oceanos" / ".env",
]
token = None
for p in paths:
    if not p.exists():
        continue
    for line in p.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if s.startswith("TELEGRAM_BOT_TOKEN"):
            token = s.split("=", 1)[1].strip()
            break
    if token:
        break

print("TOKEN_FOUND", bool(token))
print("TOKEN_PREFIX", (token[:18] + "...") if token else None)

import urllib.request, json
if not token:
    raise SystemExit(1)

try:
    r = urllib.request.urlopen(f"https://api.telegram.org/bot{token}/getMe")
    print("GETME", r.read().decode())
except Exception as e:
    print("GETME_ERR", repr(e))

try:
    payload = json.dumps({"chat_id": "6677764672", "text": "OceanOS live notify test"}).encode()
    r = urllib.request.urlopen(urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    ))
    print("SEND", r.read().decode())
except Exception as e:
    print("SEND_ERR", repr(e))
