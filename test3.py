import sys
sys.path.insert(0, './ml')
import pandas as pd
from preprocess import *
from backend.main import _fetch_ohlcv

gold = _fetch_ohlcv('GC=F', period='60d', interval='1h')
dxy = _fetch_ohlcv('DX-Y.NYB', period='60d', interval='1h')
tnx = _fetch_ohlcv('^TNX', period='60d', interval='1h')

df = gold.copy()
print('Initial Gold length:', len(df))

df = add_ema(df)
df = add_rsi(df)
df = add_macd(df)
df = add_atr(df)
df = add_bollinger(df)
df = add_volume_features(df)
df = add_candle_features(df)
df = add_swing_pivots(df)
df = add_market_structure(df)
df = add_adx(df)
df = add_session_features(df)

print('Length before correlations:', len(df))

if dxy is not None:
    dxy = dxy.resample('1h').last()
    df['dxy_close'] = dxy['close']
    df['dxy_close'] = df['dxy_close'].ffill().bfill()
    df['gold_dxy_corr'] = df['close'].rolling(20).corr(df['dxy_close'])
    df['dxy_momentum'] = df['dxy_close'].pct_change(5)
    
if tnx is not None:
    tnx = tnx.resample('1h').last()
    df['yields_close'] = tnx['close']
    df['yields_close'] = df['yields_close'].ffill().bfill()
    df['gold_yields_corr'] = df['close'].rolling(20).corr(df['yields_close'])
    df['yields_momentum'] = df['yields_close'].pct_change(5)

print('Length after correlations before ffill/bfill:', len(df))
df.ffill(inplace=True)
df.bfill(inplace=True)

print('Length before dropna:', len(df))

from preprocess import FEATURE_COLS
df.dropna(subset=FEATURE_COLS, inplace=True)
print('Final Length:', len(df))
print('Any NaNs remaining in FEATURE_COLS?', df[FEATURE_COLS].isna().sum().sum())
