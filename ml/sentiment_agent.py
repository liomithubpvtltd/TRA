import time
import random
import os
import sys
import requests
from datetime import datetime, timedelta
from gdeltdoc import GdeltDoc, Filters

# Add parent dir to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from backend.services.database import db_service, TradeLog

class SentimentAgent:
    """Institutional Sentiment Matrix Portal — Correlating Geopolitics and Financial Wires."""
    
    def __init__(self):
        self.gd = GdeltDoc()
        self.finnhub_key = os.getenv("FINNHUB_API_KEY", "")
        self.freenews_key = os.getenv("FREENEWS_API_KEY", "")
        self.sentiment_score = 0.0 # Integrated score (-1 to +1)
        self.current_mood = "INITIALIZING"
        self.risk_mode = "OBSERVING"
        self.provider_details = {"gdelt": 0.0, "finnhub": 0.0, "freenews": 0.0}

    def fetch_gdelt_sentiment(self):
        """Fetches geopolitical tone from GDELT universe."""
        f = Filters(keyword="(Gold OR XAU OR \"Interest Rates\")", timespan="1h", num_records=5)
        try:
            timeline = self.gd.timeline_search("timelinetone", f)
            if not timeline.empty:
                avg_tone = timeline['Average Tone'].mean()
                score = round(max(min(avg_tone / 5.0, 1.0), -1.0), 2)
                self.provider_details["gdelt"] = score
                return score
        except Exception: pass
        return 0.0

    def fetch_finnhub_sentiment(self):
        """Fetches institutional news sentiment from Finnhub.io."""
        if not self.finnhub_key: return 0.0
        try:
            # Check market sentiment for XAU/USD (Gold) related symbols/sectors
            # Finnhub provides aggregate sentiment for symbols
            res = requests.get(f"https://finnhub.io/api/v1/news-sentiment?symbol=GC=F&token={self.finnhub_key}", timeout=2)
            if res.status_code == 200:
                data = res.json()
                # Use 'bullishPercent' to calculate our -1 to +1 score
                bullish = data.get('sentiment', {}).get('bullishPercent', 0.5)
                score = round((bullish - 0.5) * 2, 2)
                self.provider_details["finnhub"] = score
                return score
        except Exception: pass
        return 0.0

    def fetch_freenews_sentiment(self):
        """Fetches global general news sentiment from FreeNewsAPI.io."""
        if not self.freenews_key: return 0.0
        try:
            # Query broad gold/macro news
            res = requests.get(f"https://freenewsapi.io/api/v1/search?q=Gold&apiKey={self.freenews_key}", timeout=2)
            if res.status_code == 200:
                data = res.json()
                # Placeholder logic: count positive vs negative words in headlines
                pos_words = ['up', 'surge', 'high', 'gain', 'growth', 'bull', 'strong']
                neg_words = ['down', 'fall', 'low', 'loss', 'drop', 'bear', 'weak']
                text = str(data.get('articles', [])).lower()
                p_count = sum(text.count(w) for w in pos_words)
                n_count = sum(text.count(w) for w in neg_words)
                score = round((p_count - n_count) / max(p_count + n_count, 1), 2)
                self.provider_details["freenews"] = score
                return score
        except Exception: pass
        return 0.0

    def calculate_integrated_mood(self):
        """Orchestrates the Triple-Core narrative consensus."""
        g_score = self.fetch_gdelt_sentiment()
        f_score = self.fetch_finnhub_sentiment()
        fn_score = self.fetch_freenews_sentiment()
        
        # Weighted Triple-Consensus:
        # Finnhub (40% Institutional), GDELT (30% Geopolitical), FreeNews (30% Broadcast)
        self.sentiment_score = round((f_score * 0.4) + (g_score * 0.3) + (fn_score * 0.3), 2)
        
        if self.sentiment_score > 0.3:
            self.current_mood = "BULLISH (DUAL-SYNC)"
            self.risk_mode = "RISK-ON"
        elif self.sentiment_score < -0.3:
            self.current_mood = "BEARISH (DUAL-SYNC)"
            self.risk_mode = "RISK-OFF"
        else:
            self.current_mood = "NEUTRAL / SIDEWAYS"
            self.risk_mode = "CAUTIOUS"

        print(f"[SENTIMENT-MATRIX] GDELT: {g_score} | Finnhub: {f_score} | Integrated: {self.sentiment_score}")

    def update_forensic_logs(self):
        """Logs the narrative shift into the institutional database."""
        session = db_service.Session()
        try:
            log = TradeLog(
                symbol="MACRO_MATRIX",
                action="DUAL_SENTIMENT_SYNC",
                price=self.sentiment_score,
                details=f"Integrated Mood: {self.current_mood} | Risk: {self.risk_mode} | Source: Finnhub+GDELT",
                timestamp=datetime.now()
            )
            session.add(log)
            session.commit()
        except Exception as e:
            print(f"Error logging sync: {e}")
            session.rollback()
        finally:
            session.close()

    def perpetual_scan(self):
        """Infinite loop for high-fidelity situational mapping."""
        print("Neural Sentiment Matrix Online. Status: DUAL-SYNC ACTIVE.")
        try:
            while True:
                self.calculate_integrated_mood()
                self.update_forensic_logs()
                time.sleep(random.randint(400, 800))
        except KeyboardInterrupt:
            print("Sentiment Matrix suspended.")

if __name__ == "__main__":
    agent = SentimentAgent()
    agent.perpetual_scan()
