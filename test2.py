import sys
import pandas as pd
sys.path.insert(0, './ml')
from backend.main import _fetch_ohlcv

gold = _fetch_ohlcv('GC=F', period='60d', interval='1h')
tnx = _fetch_ohlcv('^TNX', period='60d', interval='1h')

df = gold.copy()
df['yields_close'] = tnx['close']
print('Sum of NaNs before ffill:', df['yields_close'].isna().sum())
df['yields_close'] = df['yields_close'].ffill()
print('Sum of NaNs after ffill:', df['yields_close'].isna().sum())
print(df['yields_close'].tail())
