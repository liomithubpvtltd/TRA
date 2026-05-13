import os
from datetime import datetime
from services.database import db_service, TradeLog

class ForensicEngine:
    """Neural Forensic Inquest — Learning from Market Engagement."""
    
    def __init__(self):
        self.performance_biases = {
            "sentiment_weight_offset": 0.0,
            "structural_weight_offset": 0.0,
            "macro_weight_offset": 0.0
        }

    def analyze_recent_trades(self):
        """Perform forensic attribution on the last 10 trades."""
        session = db_service.Session()
        try:
            trades = session.query(TradeLog).order_by(TradeLog.timestamp.desc()).limit(10).all()
            if not trades: return
            
            wins = [t for t in trades if t.profit > 0]
            losses = [t for t in trades if t.profit <= 0]
            
            # Simple Self-Correction Logic:
            # If excessive losses occur, it typically means 'Over-reliance' on certain indicators
            if len(losses) > 7:
                # Volatility adaptive: Reduce sentiment sensitivity, rely more on Hard Yield Data
                self.performance_biases["sentiment_weight_offset"] -= 0.1
                self.performance_biases["macro_weight_offset"] += 0.1
                return "[FORENSIC_ALERT] High Volatility Bias Detected. Shifting Priority to SOVEREIGN_DATA."
            
            elif len(wins) > 7:
                return "[FORENSIC_OPTIMAL] Regime Synchronized. Weights Localized."
                
        except Exception as e:
            return f"[FORENSIC_ERROR] Diagnostic Failure: {str(e)}"
        finally:
            session.close()
        return "FORENSIC_IDLE: Awaiting significant sample size."

    def get_calibrated_weights(self, base_weights):
        """Applies neural offsets to the core weights."""
        calibrated = base_weights.copy()
        calibrated["sentiment"] += self.performance_biases["sentiment_weight_offset"]
        calibrated["macro"] += self.performance_biases["macro_weight_offset"]
        return calibrated

forensic_engine = ForensicEngine()
