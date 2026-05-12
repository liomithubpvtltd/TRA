import os
import pandas as pd
import joblib
from train import train
import yfinance as yf

def run_auto_training():
    print("Starting Automated 5-Year Training Cycle...")
    
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    
    # Load 5y Daily data for long-term trends
    gold_df = pd.read_csv(os.path.join(data_dir, 'XAUUSD_5y_1d.csv'), index_col=0, parse_dates=True)
    dxy_df = pd.read_csv(os.path.join(data_dir, 'DXY_5y_1d.csv'), index_col=0, parse_dates=True)
    yields_df = pd.read_csv(os.path.join(data_dir, 'US10Y_5y_1d.csv'), index_col=0, parse_dates=True)
    
    # Preprocessing to align columns
    for df in [gold_df, dxy_df, yields_df]:
        df.columns = [str(c).lower() for c in df.columns]
        
    print(f"Feeding 5 years of Gold data ({len(gold_df)} days)...")
    
    # In a real system, we would combine 1h and 1d data.
    # For this POC, we'll train the primary model on the merged daily dataset with correlations.
    
    # Note: build_features is called inside train()
    # We pass the custom dataframes to train
    
    # Normally train() takes a single df and builds features.
    # We'll modify the training logic slightly to handle the 5y merge.
    
    # Actually, let's just use the train.py script which handles yfinance directly but for 5y.
    # We already have the logic in train.py to download '5y'.
    
    from train import load_yfinance, train as train_model
    
    # Automatic 5y training
    raw_gold = load_yfinance(period='5y', interval='1d')
    # train_model will handle the rest
    model, scaler, report = train_model(raw_gold)
    
    print("Auto-Training Complete.")
    print(f"Full Report: {report['mean_accuracy']:.2f} Accuracy")

if __name__ == "__main__":
    run_auto_training()
