import ccxt
import pandas as pd
import time
import os

class CryptoService:
    def __init__(self):
        # Use Binance authenticated connection if keys exist
        api_key = os.getenv('BINANCE_API_KEY')
        secret = os.getenv('BINANCE_SECRET_KEY')
        
        self.exchange = ccxt.binance({
            'apiKey': api_key,
            'secret': secret,
            'enableRateLimit': True,
        })
    
    def fetch_top_volume_coins(self, limit=50):
        """Fetch top coins by volume in the last 24h from Binance."""
        try:
            tickers = self.exchange.fetch_tickers()
            # Filter USDS pairs and sort by quoteVolume
            usdt_tickers = [
                {
                    'symbol': t['symbol'].replace('/USDT', ''),
                    'price': t['last'],
                    'changePct': t['percentage'],
                    'volume': t['quoteVolume'],
                    'high': t.get('high'),
                    'low': t.get('low')
                }
                for sym, t in tickers.items() if '/USDT' in sym and t['last'] is not None and t['quoteVolume'] is not None
            ]
            
            sorted_tickers = sorted(usdt_tickers, key=lambda x: x['volume'], reverse=True)
            return sorted_tickers[:limit]
        except Exception as e:
            print(f"[CryptoService] Error: {e}")
            return []

    def get_ticker_details(self, symbol='BTC'):
        """Fetch specific ticker details."""
        try:
            ticker = self.exchange.fetch_ticker(f"{symbol}/USDT")
            return {
                'symbol': symbol,
                'price': ticker['last'],
                'change': ticker['change'],
                'changePct': ticker['percentage'],
                'trend': 'bullish' if (ticker['percentage'] or 0) >= 0 else 'bearish',
                'volume': ticker['quoteVolume']
            }
        except:
            return None
