---
name: portfolio-tracker
description: Crypto portfolio tracker using wallet + exchange balances and PnL math.
author: OceanOS
tags:
  - crypto
  - wallet
  - pnl
price_cents: 0
license_key_required: false
entrypoints:
  - command: python registery/portfolio.py
    port: 8013
    protocol: http
---

# Portfolio Tracker Skill

Portfolio tracking skill:
- Input: wallet balance or exchange API keys
- Computes PnL, allocation, base exposure
- Pushes summary to Telegram and UI processes
- Reuses crypto-trader data feed where available
