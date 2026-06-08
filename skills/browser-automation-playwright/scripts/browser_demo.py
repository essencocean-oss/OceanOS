from playwright.sync_api import sync_playwright

URL = "https://example.com"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL)
    print("title:", page.title())
    print("url:", page.url)
    browser.close()
