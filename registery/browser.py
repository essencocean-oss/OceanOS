from fastapi import FastAPI, HTTPException

browser = FastAPI(title='HermesOS Browser Automation')

@browser.get('/health')
def health():
    return {'status': 'ok', 'module': 'web-browser-automation'}

@browser.post('/screenshot')
def screenshot(payload: dict):
    url = payload.get('url')
    return {'ok': True, 'url': url, 'screenshot_path': None}
