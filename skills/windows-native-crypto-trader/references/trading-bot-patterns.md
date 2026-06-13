# Trading bot patterns

Recommended starting patterns:
- Simple grid bot: place limit orders at fixed % intervals around current price.
- Momentum bot: RSI/EMA trend filter on 1H candles.
- Mean-reversion: ATR bands with fixed stop-loss.

All bots should be runnable as plain Python scripts under `skills/windows-native-crypto-trader/scripts/`.

Use OceanOS skills registry for sharing new bot templates once validated.
