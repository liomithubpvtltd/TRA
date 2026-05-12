"""
XAU/USD XGBoost Model — Training Script
----------------------------------------
Usage:
  python train.py                  # train on yfinance data (GC=F, 1h, 5y)
  python train.py --csv data.csv   # train on your own CSV
"""

import argparse
import os
import json
import warnings
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report, roc_auc_score,
)
from sklearn.preprocessing import StandardScaler
import joblib

from preprocess import build_features, FEATURE_COLS

warnings.filterwarnings('ignore')

MODEL_DIR    = os.path.join(os.path.dirname(__file__), 'model')
MODEL_PATH   = os.path.join(MODEL_DIR, 'xgb_xauusd.json')
SCALER_PATH  = os.path.join(MODEL_DIR, 'scaler.pkl')
REPORT_PATH  = os.path.join(MODEL_DIR, 'report.json')

os.makedirs(MODEL_DIR, exist_ok=True)


# ── Data Loading ──────────────────────────────────────────────────────────────

def load_yfinance(period='5y', interval='1h', symbol='GC=F') -> pd.DataFrame:
    import yfinance as yf
    print(f'[DATA] Downloading {symbol} ({interval}, {period}) from Yahoo Finance …')
    df = yf.download(symbol, period=period, interval=interval, auto_adjust=True)
    if df.empty: return df
    
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
        
    df.columns = [str(c).lower() for c in df.columns]
    df.index   = pd.to_datetime(df.index, utc=True).tz_convert('UTC')
    print(f'[DATA] Downloaded {len(df)} rows.')
    return df


def load_csv(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, index_col=0, parse_dates=True)
    df.columns = [c.lower() for c in df.columns]
    if df.index.tz is None:
        df.index = df.index.tz_localize('UTC')
    print(f'[DATA] Loaded {len(df)} rows from {path}.')
    return df


# ── Training ──────────────────────────────────────────────────────────────────

def train(df: pd.DataFrame, dxy_df=None, yields_df=None, lookahead: int = 4):
    print('[FEAT] Building features …')
    df = build_features(df, dxy_df=dxy_df, yields_df=yields_df, lookahead=lookahead)

    available = [c for c in FEATURE_COLS if c in df.columns]
    X = df[available].astype(float)
    y = df['label'].astype(int)

    print(f'[FEAT] {len(X)} samples · {len(available)} features · '
          f'buy={y.sum()} ({y.mean()*100:.1f}%) sell={(~y.astype(bool)).sum()}')

    # Walk-forward cross-validation
    tscv    = TimeSeriesSplit(n_splits=5)
    scores  = []
    aucs    = []

    params = dict(
        n_estimators       = 500,
        max_depth          = 6,
        learning_rate      = 0.05,
        subsample          = 0.8,
        colsample_bytree   = 0.8,
        min_child_weight   = 5,
        gamma              = 0.1,
        reg_alpha          = 0.1,
        reg_lambda         = 1.0,
        use_label_encoder  = False,
        eval_metric        = 'logloss',
        tree_method        = 'hist',
        random_state       = 42,
    )

    print('[TRAIN] Walk-forward cross-validation …')
    for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
        X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_tr, y_val = y.iloc[train_idx], y.iloc[val_idx]

        scaler = StandardScaler()
        X_tr_s  = scaler.fit_transform(X_tr)
        X_val_s = scaler.transform(X_val)

        params['early_stopping_rounds'] = 30
        model = xgb.XGBClassifier(**params)
        model.fit(
            X_tr_s, y_tr,
            eval_set=[(X_val_s, y_val)],
            verbose=False,
        )
        preds = model.predict(X_val_s)
        probs = model.predict_proba(X_val_s)[:, 1]

        acc = accuracy_score(y_val, preds)
        auc = roc_auc_score(y_val, probs)
        scores.append(acc)
        aucs.append(auc)
        print(f'  Fold {fold+1}: Acc={acc:.3f}  AUC={auc:.3f}')

    print(f'\n[RESULT] Mean Acc={np.mean(scores):.3f} ± {np.std(scores):.3f}')
    print(f'[RESULT] Mean AUC={np.mean(aucs):.3f} ± {np.std(aucs):.3f}')

    # Final model on full data
    print('[TRAIN] Training final model on full dataset …')
    scaler_full = StandardScaler()
    X_full_s    = scaler_full.fit_transform(X)

    final_params = params.copy()
    if 'early_stopping_rounds' in final_params:
        del final_params['early_stopping_rounds']
        
    final_model = xgb.XGBClassifier(**final_params)
    final_model.fit(X_full_s, y, verbose=False)

    # Save artefacts
    final_model.save_model(MODEL_PATH)
    joblib.dump(scaler_full, SCALER_PATH)
    print(f'[SAVE] Model  → {MODEL_PATH}')
    print(f'[SAVE] Scaler → {SCALER_PATH}')

    # Classification report on last fold
    report = classification_report(y_val, preds, output_dict=True)
    meta   = {
        'mean_accuracy': float(np.mean(scores)),
        'mean_auc':      float(np.mean(aucs)),
        'feature_cols':  available,
        'lookahead':     lookahead,
        'report':        report,
        'top_features':  _top_features(final_model, available),
    }
    with open(REPORT_PATH, 'w') as f:
        json.dump(meta, f, indent=2)
    print(f'[SAVE] Report → {REPORT_PATH}')
    return final_model, scaler_full, meta


def _top_features(model, cols, n=10):
    importance = model.feature_importances_
    ranked     = sorted(zip(cols, importance), key=lambda x: -x[1])
    return {k: round(float(v), 4) for k, v in ranked[:n]}


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train XAU/USD XGBoost model')
    parser.add_argument('--csv',       type=str,  default=None, help='Path to custom CSV data file')
    parser.add_argument('--lookahead', type=int,  default=4,    help='Candles ahead to predict (default 4)')
    parser.add_argument('--period',    type=str,  default='5y', help='yfinance period (default 5y)')
    parser.add_argument('--interval',  type=str,  default='1h', help='yfinance interval (default 1h)')
    args = parser.parse_args()

    # Download all necessary instruments
    raw_gold = load_yfinance(args.period, args.interval)
    raw_dxy  = load_yfinance(args.period, args.interval, symbol='DX-Y.NYB')
    raw_yields = load_yfinance(args.period, args.interval, symbol='^TNX')
    
    model, scaler, report = train(raw_gold, dxy_df=raw_dxy, yields_df=raw_yields, lookahead=args.lookahead)

    print('\n[DONE] Training complete.')
    print(f"       Accuracy: {report['mean_accuracy']:.1%}")
    print(f"       AUC:      {report['mean_auc']:.3f}")
    print(f"\n  Top Features:")
    for feat, score in report['top_features'].items():
        print(f"    {feat:<25} {score:.4f}")
