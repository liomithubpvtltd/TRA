import yfinance as yf
import pandas as pd
import os
import sys

# Add backend to path for database access
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from backend.services.database import db_service

def fetch_5y_data():
    symbols = {
        'XAUUSD': 'GC=F',
        'DXY': 'DX-Y.NYB',
        'US10Y': '^TNX'
    }
    
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    for name, ticker in symbols.items():
        print(f"Fetching 5 years of {name} ({ticker})...")
        # Fetching 1h data for 5 years might need chunks as yfinance has limits
        # However, '5y' with '1d' is always safe. For '1h', max is 730 days usually.
        # So we fetch as much as possible for high-res or stay with 1d for long-term.
        
        # Start with 2 years of 1h (max limit for 1h)
        df_1h = yf.download(ticker, period='730d', interval='1h')
        df_1h.to_csv(os.path.join(data_dir, f'{name}_2y_1h.csv'))
        
        # Fetch 5 years of 1d
        df_1d = yf.download(ticker, period='5y', interval='1d')
        df_1d.to_csv(os.path.join(data_dir, f'{name}_5y_1d.csv'))
        
        # Save to MySQL
        try:
            db_service.insert_data(df_1d, name)
        except Exception as e:
            print(f"Skipping MySQL insertion for {name} (Database might not be running): {e}")
        
        print(f"Saved {name} data.")

if __name__ == "__main__":
    fetch_5y_data()
