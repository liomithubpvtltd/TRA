"""
XAU/USD ML Feature Engineering Pipeline
Generates features for XGBoost model training.
"""

import pandas as pd
import numpy as np

# ── Technical Indicators ─────────────────────────────────────────────────────

def add_ema(df: pd.DataFrame, periods=[9, 20, 50, 200]) -> pd.DataFrame:
    for p in periods:
        df[f'ema_{p}'] = df['close'].ewm(span=p, adjust=False).mean()
    return df

def add_rsi(df: pd.DataFrame, period=14) -> pd.DataFrame:
    delta = df['close'].diff()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / (loss + 1e-9)
    df['rsi'] = 100 - 100 / (1 + rs)
    return df

def add_macd(df: pd.DataFrame) -> pd.DataFrame:
    ema12 = df['close'].ewm(span=12, adjust=False).mean()
    ema26 = df['close'].ewm(span=26, adjust=False).mean()
    df['macd']        = ema12 - ema26
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist']   = df['macd'] - df['macd_signal']
    return df

def add_atr(df: pd.DataFrame, period=14) -> pd.DataFrame:
    high_low   = df['high'] - df['low']
    high_close = (df['high'] - df['close'].shift()).abs()
    low_close  = (df['low']  - df['close'].shift()).abs()
    tr  = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    df['atr']     = tr.rolling(period).mean()
    df['atr_pct'] = df['atr'] / df['close']
    return df

def add_bollinger(df: pd.DataFrame, period=20) -> pd.DataFrame:
    sma = df['close'].rolling(period).mean()
    std = df['close'].rolling(period).std()
    df['bb_upper'] = sma + 2 * std
    df['bb_lower'] = sma - 2 * std
    df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / (sma + 1e-9)
    df['bb_pos']   = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'] + 1e-9)
    return df

def add_adx(df: pd.DataFrame, period=14) -> pd.DataFrame:
    """Average Directional Index (Trend Strength)."""
    plus_dm  = df['high'].diff().clip(lower=0)
    minus_dm = (-df['low'].diff()).clip(lower=0)
    
    tr = pd.concat([
        df['high'] - df['low'],
        (df['high'] - df['close'].shift()).abs(),
        (df['low'] - df['close'].shift()).abs()
    ], axis=1).max(axis=1)
    
    atr = tr.rolling(period).mean()
    plus_di  = 100 * (plus_dm.rolling(period).mean() / (atr + 1e-9))
    minus_di = 100 * (minus_dm.rolling(period).mean() / (atr + 1e-9))
    dx  = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di + 1e-9)
    df['adx'] = dx.rolling(period).mean()
    return df

def add_volume_features(df: pd.DataFrame) -> pd.DataFrame:
    if 'volume' not in df.columns:
        return df
    df['volume_sma']  = df['volume'].rolling(20).mean()
    df['volume_ratio'] = df['volume'] / (df['volume_sma'] + 1e-9)
    return df

# ── SMC / Price-Action Features ───────────────────────────────────────────────

def add_candle_features(df: pd.DataFrame) -> pd.DataFrame:
    df['body']       = (df['close'] - df['open']).abs()
    df['range']      = df['high'] - df['low']
    df['body_ratio'] = df['body'] / (df['range'] + 1e-9)
    df['upper_wick'] = df['high'] - df[['open', 'close']].max(axis=1)
    df['lower_wick'] = df[['open', 'close']].min(axis=1) - df['low']
    df['wick_ratio'] = (df['upper_wick'] + df['lower_wick']) / (df['range'] + 1e-9)
    df['is_bullish'] = (df['close'] > df['open']).astype(int)
    
    # Liquidity Sweep Probability (High wick with rejection)
    df['liquidity_sweep_top'] = ((df['upper_wick'] > df['body'] * 2) & (df['close'] < df['open'])).astype(int)
    df['liquidity_sweep_bot'] = ((df['lower_wick'] > df['body'] * 2) & (df['close'] > df['open'])).astype(int)
    return df

def add_swing_pivots(df: pd.DataFrame, window=5) -> pd.DataFrame:
    df['pivot_high'] = df['high'].rolling(window * 2 + 1, center=True).max() == df['high']
    df['pivot_low']  = df['low'].rolling(window * 2 + 1, center=True).min() == df['low']
    return df

def add_market_structure(df: pd.DataFrame) -> pd.DataFrame:
    """Simple HH/HL/LH/LL detection for BOS/CHOCH signals."""
    df['hh'] = (df['high'] > df['high'].shift(1)) & (df['high'].shift(1) > df['high'].shift(2))
    df['ll'] = (df['low']  < df['low'].shift(1))  & (df['low'].shift(1)  < df['low'].shift(2))
    df['hl'] = (df['low']  > df['low'].shift(2))  & ~df['ll']
    df['lh'] = (df['high'] < df['high'].shift(2)) & ~df['hh']
    return df

# ── Session / Time Features ───────────────────────────────────────────────────

def add_session_features(df: pd.DataFrame) -> pd.DataFrame:
    if not isinstance(df.index, pd.DatetimeIndex):
        return df
    hour = df.index.hour
    df['is_london']   = ((hour >= 7)  & (hour < 13)).astype(int)
    df['is_newyork']  = ((hour >= 13) & (hour < 21)).astype(int)
    df['is_overlap']  = ((hour >= 13) & (hour < 16)).astype(int)   # London/NY overlap
    df['is_tokyo']    = ((hour >= 0)  & (hour < 7)).astype(int)
    df['hour_sin']    = np.sin(2 * np.pi * hour / 24)
    df['hour_cos']    = np.cos(2 * np.pi * hour / 24)
    df['day_of_week'] = df.index.dayofweek
    return df

# ── Label Generation ──────────────────────────────────────────────────────────

def add_labels(df: pd.DataFrame, lookahead: int = 4, rr_threshold: float = 0.0015) -> pd.DataFrame:
    """
    Binary label:
      1 = price is >= rr_threshold % higher after `lookahead` candles (BUY)
      0 = price is <= -rr_threshold % lower after `lookahead` candles (SELL)
    Rows in between are dropped (neutral zone).
    """
    future_returns = df['close'].shift(-lookahead) / df['close'] - 1
    df['label'] = np.where(
        future_returns >=  rr_threshold, 1,
        np.where(future_returns <= -rr_threshold, 0, np.nan)
    )
    return df

def add_correlation_features(df: pd.DataFrame, dxy_df: pd.DataFrame = None, yields_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Adds correlation features between Gold and DXY/Yields.
    """
    if dxy_df is not None:
        # Align DXY data
        dxy_df = dxy_df.resample('1h').last()
        df['dxy_close'] = dxy_df['close']
        df['dxy_close'] = df['dxy_close'].ffill().bfill()
        df['gold_dxy_corr'] = df['close'].rolling(20).corr(df['dxy_close'])
        df['dxy_momentum'] = df['dxy_close'].pct_change(5)
        
    if yields_df is not None:
        # Align Yield data
        yields_df = yields_df.resample('1h').last()
        df['yields_close'] = yields_df['close']
        df['yields_close'] = df['yields_close'].ffill().bfill()
        df['gold_yields_corr'] = df['close'].rolling(20).corr(df['yields_close'])
        df['yields_momentum'] = df['yields_close'].pct_change(5)
    
    return df

# ── Master Pipeline ───────────────────────────────────────────────────────────

def build_features(df: pd.DataFrame, dxy_df: pd.DataFrame = None, yields_df: pd.DataFrame = None, lookahead: int = 4, is_training: bool = True) -> pd.DataFrame:
    df = df.copy()
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
    df = add_correlation_features(df, dxy_df, yields_df)
    
    # Forward and backward fill features to avoid dropping rows
    df.ffill(inplace=True)
    df.bfill(inplace=True)
    
    if is_training:
        df = add_labels(df, lookahead=lookahead)
        df.dropna(inplace=True)
    else:
        # In inference, only drop rows missing the required ML features
        from preprocess import FEATURE_COLS
        df.dropna(subset=FEATURE_COLS, inplace=True)

    return df

FEATURE_COLS = [
    'ema_9', 'ema_20', 'ema_50', 'ema_200',
    'rsi', 'macd', 'macd_signal', 'macd_hist',
    'atr', 'atr_pct',
    'bb_width', 'bb_pos',
    'body_ratio', 'upper_wick', 'lower_wick', 'is_bullish',
    'hh', 'hl', 'll', 'lh',
    'is_london', 'is_newyork', 'is_overlap', 'is_tokyo',
    'hour_sin', 'hour_cos', 'day_of_week',
    'gold_dxy_corr', 'dxy_momentum', 'gold_yields_corr', 'yields_momentum',
    'volume_ratio', 'volume_sma',
    'adx', 'wick_ratio', 'liquidity_sweep_top', 'liquidity_sweep_bot'
]
