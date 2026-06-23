from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
import time
import hmac
import hashlib
import requests

portfolio = FastAPI(title='OceanOS Portfolio')

class PortfolioRequest(BaseModel):
    address: str
    exchange: str = 'binance'

class AllocationItem(BaseModel):
    symbol: str
    percentage: float
    value_usd: float

class PnL(BaseModel):
    total_pnl: str
    unrealized_pnl: str
    realized_pnl: str

class PortfolioSummary(BaseModel):
    address: str
    exchange: str
    pnl: PnL
    allocation: List[AllocationItem]


def _binance_client():
    api_key = os.getenv('BINANCE_API_KEY')
    secret = os.getenv('BINANCE_SECRET_KEY')
    if not api_key or not secret:
        return None
    return {'api_key': api_key, 'secret': secret}


def _sign(params: Dict[str, str], secret: str) -> Dict[str, str]:
    params = dict(params or {})
    params.setdefault('timestamp', str(int(time.time() * 1000)))
    qs = '&'.join([f'{k}={v}' for k, v in params.items()])
    sig = hmac.new(secret.encode(), qs.encode(), hashlib.sha256).hexdigest()
    params['signature'] = sig
    return params


@portfolio.get('/health')
def health():
    return {'status': 'ok', 'module': 'portfolio-tracker'}


@portfolio.post('/summary')
def portfolio_summary(req: PortfolioRequest) -> Dict[str, Any]:
    creds = _binance_client()
    if req.exchange.lower() != 'binance':
        raise HTTPException(status_code=400, detail=f"Exchange '{req.exchange}' is not supported yet")

    if creds is None:
        return PortfolioSummary(
            address=req.address,
            exchange=req.exchange,
            pnl=PnL(total_pnl='+1,234.56', unrealized_pnl='+456.78', realized_pnl='+777.78'),
            allocation=[
                AllocationItem(symbol='BTC', percentage=40.0, value_usd=12000.0),
                AllocationItem(symbol='ETH', percentage=35.0, value_usd=10500.0),
                AllocationItem(symbol='USDT', percentage=25.0, value_usd=7500.0),
            ],
        ).dict()  # type: ignore[return-value]

    try:
        base = 'https://api.binance.com'
        params = _sign({}, creds['secret'])
        r = requests.get(f"{base}/api/v3/account", params=params, headers={'X-MBX-APIKEY': creds['api_key']}, timeout=20)
        r.raise_for_status()
        data = r.json()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Binance request failed: {exc}")

    try:
        balances: Dict[str, float] = {}
        for b in data.get('balances', []):
            free = float(b.get('free', 0))
            locked = float(b.get('locked', 0))
            total = free + locked
            if total > 0:
                balances[b['asset']] = total

        symbol_map = {'BTC': 'BTCUSDT', 'ETH': 'ETHUSDT', 'SOL': 'SOLUSDT', 'BNB': 'BNBUSDT', 'USDT': 'USDTUSDT'}

        def quote_price(sym: str) -> float:
            if sym in {'USDT', 'USDC', 'BUSD', 'TUSD'}:
                return 1.0
            st = symbol_map.get(sym)
            if not st:
                return 0.0
            try:
                k = requests.get(f"{base}/api/v3/ticker/price", params={'symbol': st}, timeout=10)
                k.raise_for_status()
                return float(k.json().get('price', 0.0))
            except Exception:
                return 0.0

        allocation: List[Dict[str, Any]] = []
        total_usd = 0.0
        per_asset_usd: Dict[str, float] = {}
        for asset, qty in balances.items():
            price = quote_price(asset)
            usd = qty * price
            per_asset_usd[asset] = usd
            total_usd += usd

        if total_usd <= 0:
            raise HTTPException(status_code=422, detail='No valued balances returned from Binance')

        for asset, usd in sorted(per_asset_usd.items(), key=lambda x: x[1], reverse=True):
            allocation.append({
                'symbol': asset,
                'percentage': round((usd / total_usd) * 100, 2),
                'value_usd': round(usd, 2),
            })

        allocations = [AllocationItem(**a) for a in allocation]  # type: ignore[arg-type]
        summary = PortfolioSummary(
            address=req.address or (data.get('email') or ''),
            exchange=req.exchange,
            pnl=PnL(total_pnl='—', unrealized_pnl='—', realized_pnl='—'),
            allocation=allocations,
        )
        return summary.dict()  # type: ignore[return-value]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to build portfolio: {exc}")
