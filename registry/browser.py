from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import glob
from datetime import datetime

browser = FastAPI(title='OceanOS Browser Automation')

MEDIA_DIR = os.path.join(os.getcwd(), "media", "screenshots")
os.makedirs(MEDIA_DIR, exist_ok=True)

class ScreenshotRequest(BaseModel):
    url: str
    filename: Optional[str] = None
    width: int = 1280
    height: int = 720

_playwright_available = None  # cached check

def _check_playwright():
    global _playwright_available
    if _playwright_available is None:
        try:
            import playwright  # noqa: F401
            _playwright_available = True
        except ImportError:
            _playwright_available = False
    return _playwright_available

def _take_screenshot(url: str, path: str, width: int = 1280, height: int = 720):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": width, "height": height})
        page = context.new_page()
        page.goto(url, wait_until="networkidle", timeout=30000)
        page.screenshot(path=path, full_page=False)
        browser.close()

@browser.get('/health')
def health():
    status = "playwright" if _check_playwright() else "disabled"
    return {'status': 'ok', 'module': 'web-browser-automation', 'backend': status}

@browser.post('/screenshot')
def screenshot(req: ScreenshotRequest):
    if not _check_playwright():
        raise HTTPException(
            status_code=503,
            detail=(
                "Playwright is not installed. "
                "Install with: pip install playwright && playwright install chromium"
            ),
        )

    filename = req.filename or f"screenshot_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.png"
    if not filename.endswith(".png"):
        filename += ".png"

    path = os.path.join(MEDIA_DIR, filename)

    try:
        _take_screenshot(req.url, path, width=req.width, height=req.height)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Screenshot failed: {exc}")

    return {"ok": True, "url": req.url, "screenshot_path": path}

@browser.get('/screenshots')
def list_screenshots():
    files = glob.glob(os.path.join(MEDIA_DIR, "*.png"))
    files.sort(key=os.path.getmtime, reverse=True)
    return {
        "count": len(files),
        "screenshots": [os.path.relpath(f, os.getcwd()) for f in files],
    }
