import sys
import pandas as pd
sys.path.insert(0, './ml')
from preprocess import build_features
from backend.main import _fetch_ohlcv

gold = _fetch_ohlcv('GC=F', period='60d', interval='1h')
dxy = _fetch_ohlcv('DX-Y.NYB', period='60d', interval='1h')
tnx = _fetch_ohlcv('^TNX', period='60d', interval='1h')

df_feat = build_features(gold, dxy_df=dxy, yields_df=tnx, is_training=False)
print('Length of df_feat:', len(df_feat))
print(df_feat.isna().sum().tail(25))
