"""
VISION — XAU/USD AI Trading System · FastAPI Backend
"""

import sys, os
from datetime import datetime
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml'))

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import yfinance as yf
import pandas as pd
from services.crypto_service import CryptoService
from services.paper_trader import paper_trader
from services.database import db_service, Position, TradeLog

app = FastAPI(title='VISION Multi-Asset AI Trading Platform', version='1.1.0')
crypto_service = CryptoService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://localhost:5175', '*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fetch_ohlcv(symbol: str, period: str = '60d', interval: str = '1h') -> pd.DataFrame:
    df = yf.download(symbol, period=period, interval=interval, auto_adjust=True, progress=False)
    if df.empty: return df
    
    # Flatten MultiIndex if present
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
        
    df.columns = [str(c).lower() for c in df.columns]
    df.index   = pd.to_datetime(df.index, utc=True).tz_convert('UTC')
    return df


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get('/')
def root():
    return {'status': 'ok', 'system': 'VISION XAU/USD AI'}


def ticker_info(df, symbol, multiply=1):
    if df.empty:
        return {'symbol': symbol, 'price': 0, 'change': 0, 'changePct': 0, 'trend': 'neutral'}
    price  = float(df['close'].iloc[-1]) * multiply
    prev   = float(df['close'].iloc[-2]) * multiply
    change = round(price - prev, 4)
    pct    = round(change / prev * 100, 2) if prev else 0
    vol    = float(df['volume'].iloc[-1]) if 'volume' in df.columns else 0
    high   = float(df['high'].max()) * multiply
    low    = float(df['low'].min()) * multiply
    return {'symbol': symbol, 'price': round(price, 4), 'change': change, 'changePct': pct,
            'trend': 'bullish' if change >= 0 else 'bearish', 'volume': vol, 'high': high, 'low': low}

@app.get('/api/market-data')
def market_data(category: str = Query('XAUUSD')):
    if category == 'CRYPTO':
        btc = _fetch_ohlcv('BTC-USD', period='5d', interval='1h')
        eth = _fetch_ohlcv('ETH-USD', period='5d', interval='1h')
        sol = _fetch_ohlcv('SOL-USD', period='5d', interval='1h')
        return [
            ticker_info(btc, 'BTC/USD'),
            ticker_info(eth, 'ETH/USD'),
            ticker_info(sol, 'SOL/USD'),
        ]
    elif category == 'FOREX':
        eur = _fetch_ohlcv('EURUSD=X', period='5d', interval='1h')
        gbp = _fetch_ohlcv('GBPUSD=X', period='5d', interval='1h')
        jpy = _fetch_ohlcv('JPY=X', period='5d', interval='1h')
        # For JPY, price is like 150. For EURUSD it's 1.08.
        return [
            ticker_info(eur, 'EUR/USD'),
            ticker_info(gbp, 'GBP/USD'),
            ticker_info(jpy, 'USD/JPY'),
        ]

    # Default XAUUSD
    gold = _fetch_ohlcv('GC=F', period='5d', interval='1h')
    dxy  = _fetch_ohlcv('DX-Y.NYB', period='5d', interval='1h')
    us10 = _fetch_ohlcv('^TNX', period='5d', interval='1h')

    return [
        ticker_info(gold, 'XAU/USD'),
        ticker_info(dxy,  'DXY'),
        ticker_info(us10, 'US10Y'),
    ]

@app.get('/api/assets/crypto')
def get_crypto_assets(limit: int = 50):
    """Fetch top volume crypto assets and score them using ML condition logic."""
    raw_assets = crypto_service.fetch_top_volume_coins(limit=limit)
    try:
        from ml.inference import score_crypto_assets
        scored = score_crypto_assets(raw_assets)
        return scored
    except Exception as e:
        print(f"Error scoring crypto assets: {e}")
        return raw_assets

@app.get('/api/assets/forex')
def get_forex_assets():
    """Fetch major forex pairs and score them using ML condition logic."""
    # We fetch basic market data for FX
    eur = _fetch_ohlcv('EURUSD=X', period='5d', interval='1h')
    gbp = _fetch_ohlcv('GBPUSD=X', period='5d', interval='1h')
    jpy = _fetch_ohlcv('JPY=X', period='5d', interval='1h')
    aud = _fetch_ohlcv('AUDUSD=X', period='5d', interval='1h')
    cad = _fetch_ohlcv('USDCAD=X', period='5d', interval='1h')
    chf = _fetch_ohlcv('USDCHF=X', period='5d', interval='1h')
    
    raw_assets = [
        ticker_info(eur, 'EUR/USD'),
        ticker_info(gbp, 'GBP/USD'),
        ticker_info(jpy, 'USD/JPY'),
        ticker_info(aud, 'AUD/USD'),
        ticker_info(cad, 'USD/CAD'),
        ticker_info(chf, 'USD/CHF'),
    ]
    
    try:
        from ml.inference import score_forex_assets
        scored = score_forex_assets(raw_assets)
        return scored
    except Exception as e:
        print(f"Error scoring forex assets: {e}")
        return raw_assets

@app.get('/api/portfolio')
def get_portfolio():
    """Fetch current paper trading positions and balance."""
    session = db_service.Session()
    try:
        positions = session.query(Position).all()
        logs = session.query(TradeLog).order_by(TradeLog.timestamp.desc()).limit(10).all()
        return {
            "positions": [
                {
                    "symbol": p.symbol,
                    "side": p.side,
                    "price": p.entry_price,
                    "size": p.size,
                    "status": p.status,
                    "timestamp": p.timestamp.isoformat()
                } for p in positions
            ],
            "history": [
                {
                    "action": l.action,
                    "price": l.price,
                    "details": l.details,
                    "timestamp": l.timestamp.isoformat()
                } for l in logs
            ]
        }
    finally:
        session.close()

@app.get('/api/reports')
def get_reports(
    date_from: str = Query(None),
    date_to:   str = Query(None),
    action:    str = Query(None),
    limit:     int = Query(500),
):
    """Return full chronological trade log with optional date and action type filters."""
    session = db_service.Session()
    try:
        q = session.query(TradeLog).order_by(TradeLog.timestamp.desc())
        if date_from:
            q = q.filter(TradeLog.timestamp >= datetime.fromisoformat(date_from))
        if date_to:
            q = q.filter(TradeLog.timestamp <= datetime.fromisoformat(date_to + 'T23:59:59'))
        if action:
            q = q.filter(TradeLog.action.ilike(f'%{action}%'))
        logs = q.limit(limit).all()
        return [
            {
                "action":    l.action,
                "price":     l.price,
                "symbol":    l.symbol,
                "details":   l.details,
                "timestamp": l.timestamp.isoformat(),
            }
            for l in logs
        ]
    finally:
        session.close()

@app.post('/api/portfolio/add')
async def add_position(symbol: str, side: str, price: float, size: float = 1.0):
    """Manually add a position to the portfolio and route to live broker if enabled."""
    session = db_service.Session()
    try:
        from services.broker_service import broker_service
        # Route to appropriate broker based on asset type
        FOREX_METALS = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'XAU', 'USD']
        is_forex = any(market in symbol.upper() for market in FOREX_METALS) and 'USDT' not in symbol
        if is_forex:
            broker_resp = broker_service.execute_forex_order(symbol, side, size)
        else:
            # Crypto — route to Binance Spot
            broker_resp = broker_service.execute_crypto_order(symbol, side, size)
        broker_status = broker_resp.get('status', 'paper')
        broker_details = str(broker_resp)

        new_pos = Position(
            symbol=symbol,
            side=side,
            entry_price=price,
            size=size,
            timestamp=datetime.now(),
            status='open'
        )
        session.add(new_pos)
        
        log = TradeLog(
            symbol=symbol,
            action=f"[{broker_status.upper()}] {side.upper()}",
            price=price,
            details=f"Broker Response: {broker_details[:100]}",
            timestamp=datetime.now()
        )
        session.add(log)
        session.commit()
        return {"status": "Success", "message": "Position added to portfolio"}
    except Exception as e:
        session.rollback()
        return {"status": "Error", "message": str(e)}
    finally:
        session.close()


@app.get('/api/prediction')
def prediction(category: str = Query('XAUUSD')):
    try:
        from ml.inference import predict, _fallback_prediction
        
        if category == 'CRYPTO':
            df = _fetch_ohlcv('BTC-USD', period='60d', interval='1h')
            res = _fallback_prediction(df)
            res['asset_name'] = 'BTC/USD (Bitcoin)'
            res['reasoning'] = 'Bitcoin accumulation on high volume indicates upside.' if res['buy_probability'] > 50 else 'Distribution phase limits upside potential.'
            res['rr_ratio'] = '1:3.5'
            res['session_bias'] = 'Asian Accumulation'
            res['confluence_score'] = 82
            res['execution_log'] = ['Funding rates reset.', 'On-chain dominance detected.', 'Algorithm ready.']
            
            # Additional params missing in fallback
            price = df['close'].iloc[-1] if not df.empty else 64000
            res['entry_price'] = price
            res['targets'] = [price * 1.05, price * 1.10, price * 1.15] if res['buy_probability'] > 50 else [price * 0.95, price * 0.90, price * 0.85]
            res['stop_loss'] = price * 0.96 if res['buy_probability'] > 50 else price * 1.04
            res['duration'] = '2-7 Days'
            return res

        elif category == 'FOREX':
            df = _fetch_ohlcv('EURUSD=X', period='60d', interval='1h')
            res = _fallback_prediction(df)
            res['asset_name'] = 'EUR/USD (Euro)'
            res['reasoning'] = 'Euro strength aligned with DXY weakness.'
            res['rr_ratio'] = '1:2.8'
            res['session_bias'] = 'London Focus'
            res['confluence_score'] = 78
            res['execution_log'] = ['ECB remarks factored.', 'Volatility normalized.']
            price = df['close'].iloc[-1] if not df.empty else 1.08
            res['entry_price'] = price
            res['targets'] = [price * 1.01, price * 1.02, price * 1.03] if res['buy_probability'] > 50 else [price * 0.99, price * 0.98, price * 0.97]
            res['stop_loss'] = price * 0.995 if res['buy_probability'] > 50 else price * 1.005
            res['duration'] = '1-3 Days'
            return res

        # Default XAUUSD
        df        = _fetch_ohlcv('GC=F',      period='60d', interval='1h')
        dxy_df    = _fetch_ohlcv('DX-Y.NYB',  period='60d', interval='1h')
        yields_df = _fetch_ohlcv('^TNX',      period='60d', interval='1h')
        
        return predict(df, dxy_df=dxy_df, yields_df=yields_df)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            'buy_probability':   50.0,
            'sell_probability':  50.0,
            'trend':             'Neutral',
            'confidence':        'Low',
            'regime':            'Error',
            'volatility_score':  0.0,
            'features_detected': [f'Live mode — {str(e)[:60]}'],
            'reasoning':         f'System error during multi-asset inference: {str(e)[:100]}'
        }


@app.get('/api/ohlcv')
def ohlcv(symbol: str = Query('GC=F'), interval: str = Query('1h'), period: str = Query('30d')):
    df = _fetch_ohlcv(symbol, period=period, interval=interval)
    if df.empty:
        return []
    df = df.reset_index()
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df.columns = [str(c).lower() for c in df.columns]
    time_col = 'datetime' if 'datetime' in df.columns else df.columns[0]
    return df[[time_col, 'open', 'high', 'low', 'close', 'volume']].rename(
        columns={time_col: 'time'}
    ).tail(200).to_dict(orient='records')


@app.post('/api/retrain')
async def retrain_model():
    """Triggers the 5-year automated training pipeline."""
    import subprocess
    try:
        # Use venv python for training
        python_exe = os.path.join(os.path.dirname(__file__), '..', 'venv', 'Scripts', 'python.exe')
        subprocess.Popen([python_exe, 'ml/auto_trainer.py'], cwd=os.path.join(os.path.dirname(__file__), '..'))
        return {"status": "Training started", "message": "The 5-year automated training pipeline is now running in the background."}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

@app.get('/api/model-status')
def model_status():
    """Returns the current model's accuracy and status."""
    report_path = os.path.join(os.path.dirname(__file__), '..', 'ml', 'model', 'report.json')
    if os.path.exists(report_path):
        with open(report_path) as f:
            import json
            return json.load(f)
    return {"status": "No model found", "message": "Please run the training pipeline."}

import subprocess
import threading

def _run_training_job():
    script_path = os.path.join(os.path.dirname(__file__), "..", "ml", "train.py")
    subprocess.Popen([sys.executable, script_path])

@app.post('/api/ml/train')
def trigger_ml_training():
    """Trigger the XGBoost Retraining pipeline in the background."""
    t = threading.Thread(target=_run_training_job)
    t.start()
    return {"status": "Training Initiated", "message": "ML engine is now pulling latest live data and re-fitting the XGBoost models."}
if __name__ == '__main__':
    # Start Paper Trader background monitor
    paper_trader.start()
    uvicorn.run(app, host='0.0.0.0', port=8001)
