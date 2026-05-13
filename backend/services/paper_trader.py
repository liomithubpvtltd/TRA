import time
import threading
from datetime import datetime
import requests
from services.database import db_service, Position, TradeLog, StrategyBenchmark, User
from services.forensic_service import forensic_engine

class PaperTrader:
    def __init__(self, backend_url="http://localhost:8001"):
        self.backend_url = backend_url
        self.confidence_threshold = 80.0
        self.running = False
        self.thread = None
        self.execution_pause = 60 # 1 minute cycles for real-time rally capture

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._autonomous_cycle, daemon=True)
            self.thread.start()
            print("[PaperTrader] Institutional Auto-Execution started.")

    def stop(self):
        self.running = False

    def _autonomous_cycle(self):
        while self.running:
            try:
                # 1. Fetch multi-asset predictions (Gold, Crypto, Forex)
                # For now we use the main /api/prediction which covers XAUUSD
                # We can extend this to hit specific asset predictors
                res = requests.get(f"{self.backend_url}/api/prediction")
                if res.status_code == 200:
                    pred = res.json()
                    self._process_signal('XAUUSD', pred)

                # TODO: Add Crypto/Forex signal fetching if different endpoints exist
                # time.sleep(self.execution_pause)
            except Exception as e:
                print(f"[PaperTrader] Cycle Error: {e}")
            
            time.sleep(self.execution_pause)

    def _process_signal(self, symbol, signal):
        buy_p = signal.get('buy_probability', 0)
        sell_p = signal.get('sell_probability', 0)
        price = signal.get('current_price', 0)
        
        if price == 0: return

        # Dynamic Threshold Adjustment based on Edge Strategy integration
        session = db_service.Session()
        try:
            integrated = session.query(StrategyBenchmark).filter_by(status='INTEGRATED').count()
            threshold = self.confidence_threshold - (5.0 if integrated > 0 else 0)

            if buy_p >= threshold:
                self._execute_autonomous_trade('BUY', symbol, price, buy_p)
            elif sell_p >= threshold:
                self._execute_autonomous_trade('SELL', symbol, price, sell_p)
        finally:
            session.close()

    def _execute_autonomous_trade(self, side, symbol, price, confidence):
        session = db_service.Session()
        try:
            # 1. Verification: Account Balance (Support for "if wallet me fund he toh")
            # Usually we use the admin user for global paper trading or the first user
            admin = session.query(User).filter_by(role='admin').first()
            if not admin or admin.balance < 100: # Minimum $100 for paper trading simulation
                print(f"[PaperTrader] Execution Prevented: Insufficient Balance (${admin.balance if admin else 0})")
                return

            # 2. Check for duplicate positions
            existing = session.query(Position).filter_by(symbol=symbol, status='open').first()
            if existing:
                return

            # 3. Governance: Forensic attribution
            governance_report = forensic_engine.analyze_prediction_quality({
                'symbol': symbol,
                'confidence': confidence,
                'side': side,
                'price': price
            })

            # 4. Create Position
            lot_size = 1.0 # Institutional default
            new_pos = Position(
                symbol=symbol,
                side=side,
                entry_price=price,
                quantity=lot_size,
                status='open',
                timestamp=datetime.now(),
                user_email=admin.email
            )
            session.add(new_pos)

            # 5. Deduct Balance (Paper Simulation)
            # In a real broker this happens automatically, here we track it
            # admin.balance -= (price * lot_size * 0.01) # Margin simulation

            # 6. Log Trade
            log = TradeLog(
                symbol=symbol,
                action=f'AUTO_{side}',
                price=price,
                quantity=lot_size,
                details=f"Autonomous Breakout Capture | Confidence: {confidence}% | Forensic Note: {governance_report}",
                timestamp=datetime.now(),
                user_email=admin.email
            )
            session.add(log)
            session.commit()
            print(f"[PaperTrader] Successfully Auto-Executed {side} {symbol} @ {price}")

        except Exception as e:
            session.rollback()
            print(f"[PaperTrader] Execution Error: {e}")
        finally:
            session.close()

paper_trader = PaperTrader()
