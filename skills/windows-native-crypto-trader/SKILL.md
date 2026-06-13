---
name: windows-native-crypto-trader
description: "Windows-native crypto trading and wallet automation without WSL. Check balances, send/receive SOL/ETH/BTC, fetch prices, build trading bots via PowerShell/Python."
version: 0.1.0
author: essencocean-oss
tags: crypto, trading, wallet, windows, solana, bitcoin, ethereum
price_cents: 1000
license_key_required: false
---

# Windows Native Crypto Trader

Windows-first crypto skill for OceanOS. No WSL. No Linux dependencies.

## Supported chains

- Solana (devnet/mainnet)
- EVM via JSON-RPC (ETH/WETH defaults)
- Bitcoin reads only (extensible)

## Usage

```powershell
# Price check
python skills/windows-native-crypto-trader/scripts/price_fetch.py SOL

# Wallet balance
python skills/windows-native-crypto-trader/scripts/price_fetch.py wallet <address>
```

## Safety

- Never print private keys or seed phrases.
- Use devnet until explicit mainnet intent is confirmed.
- All RPC endpoints come from the user's `rpc_url` config.
