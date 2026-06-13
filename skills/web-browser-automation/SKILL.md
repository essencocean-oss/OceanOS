---
name: web-browser-automation
description: Browser automation for login flows, scraping, screenshots, and QA.
author: OceanOS
tags:
  - browser
  - automation
  - scraper
price_cents: 0
license_key_required: false
entrypoints:
  - command: python registery/browser.py
    port: 8012
    protocol: http
---

# Web Browser Automation Skill

Browser automation layer:
- Playwright/Chromium headless
- Screenshot + diff
- Form fill / login flows
- DOM scraping
- Lighthouse perf checks
