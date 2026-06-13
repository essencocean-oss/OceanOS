#!/usr/bin/env python3
"""OceanOS server installer (Windows-native, no Docker required)."""

from pathlib import Path
import os
import sys
import urllib.request
import subprocess


ROOT = Path(__file__).resolve().parent
SKILLS_DIR = ROOT / "skills"
AGENTS_DIR = ROOT / "agents"
DIST_DIR = ROOT / "dist"


def run(cmd, cwd=None):
    print(f">>> {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd or ROOT, text=True)
    if res.returncode != 0:
        print(f"FAIL: {cmd}")
        sys.exit(res.returncode)


def health(url, timeout=5):
    try:
        urllib.request.urlopen(url, timeout=timeout)
        return True
    except Exception:
        return False


def main():
    DIST_DIR.mkdir(exist_ok=True)
    print("[1/4] installing registry + gateway")
    run("py -3 -m pip install -r registery/requirements.txt -q")
    run("py -3 -m pip install -r gateway/requirements.txt -q || true")

    print("[2/4] running migrations / seed folders")
    for d in [SKILLS_DIR, AGENTS_DIR, DIST_DIR]:
        d.mkdir(exist_ok=True)

    print("[3/4] building skills index")
    run("py -3 registery/build_index.py || true")

    print("[4/4] sanity checks")
    print("registry:", "OK" if health("http://127.0.0.1:8000/health") else "DOWN")
    print("gateway:", "OK" if health("http://127.0.0.1:8080/health") else "DOWN")
    print("done.")


if __name__ == "__main__":
    main()
