import time
import threading
from datetime import datetime
from services.database import db_service, Position, TradeLog

class PaperTrader:
    def __init__(self, backend_url="http://localhost:8001"):
        self.backend_url = backend_url
        self.auto_trade_enabled = True
        self.confidence_threshold = 70.0 # Only auto-trade above 70% confidence
        self.running = False
        self.thread = None

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
            self.thread.start()
            print("[PaperTrader] Auto-Trader monitoring started.")

    def stop(self):
        self.running = False

    def _monitor_loop(self):
        import requests
        while self.running:
            try:
                # Fetch live prediction from local API
                response = requests.get(f"{self.backend_url}/api/prediction")
                if response.status_code == 200:
                    pred = response.json()
                    self._process_prediction(pred)
            except Exception as e:
                print(f"[PaperTrader] Sync Error: {e}")
            
            time.sleep(300) # Check every 5 minutes

    def _process_prediction(self, pred):
        buy_p = pred.get('buy_probability', 0)
        sell_p = pred.get('sell_probability', 0)
        
        # Simple Logic: If confidence is high, and no open position, trade.
        if buy_p > self.confidence_threshold:
            self._execute_trade('buy', pred, confidence=buy_p)
        elif sell_p > self.confidence_threshold:
            self._execute_trade('sell', pred, confidence=sell_p)

    def _execute_trade(self, side, pred, confidence=0):
        session = db_service.Session()
        try:
            # Check if we already have an open position for XAUUSD (symbol handled by prediction)
            existing = session.query(Position).filter_by(symbol='XAUUSD', status='open').first()
            if existing:
                # If existing is same side, do nothing. If opposite, maybe flip? 
                # For simplicity: just one trade at a time.
                return
            
            # Fetch current price (using gold price from our market-data logic)
            # In a real scenario we'd fetch live price again
            import requests
            m_res = requests.get(f"{self.backend_url}/api/market-data")
            current_price = 0
            if m_res.status_code == 200:
                data = m_res.json()
                for item in data:
                    if item['symbol'] == 'XAU/USD':
                        current_price = item['price']
            
            if current_price == 0: return

            new_pos = Position(
                symbol='XAUUSD',
                side=side,
                entry_price=current_price,
                size=1.0, # 1 lot default
                timestamp=datetime.now(),
                status='open'
            )
            session.add(new_pos)
            
            # Log the trade
            log = TradeLog(
                symbol='XAUUSD',
                action='trade_opened',
                price=current_price,
                details=f"Auto-executed {side} at {confidence}% confidence",
                timestamp=datetime.now()
            )
            session.add(log)
            session.commit()
            print(f"[PaperTrader] Auto-Executed {side.upper()} @ {current_price}")
        except Exception as e:
            session.rollback()
            print(f"[PaperTrader] Trade Error: {e}")
        finally:
            session.close()

paper_trader = PaperTrader()
