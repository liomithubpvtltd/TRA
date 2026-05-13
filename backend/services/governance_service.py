import time

class GovernanceShield:
    """Institutional Rate-Limit Broker — Safeguarding Free Tier Integrity."""
    
    def __init__(self):
        self.cache = {}
        # Strict Rate Limits (Seconds between calls)
        self.rules = {
            "alpha_vantage": 3600,   # 25/day (1 per hour = 24/day)
            "twelve_data": 300,     # 800/day (1 per 5 min = 288/day)
            "finnhub": 20,          # 60/min (conservative: 3/min)
            "freenews": 1800,       # 5000/day (conservative: 2/hour)
            "news_api": 3600,       # 1000/day (conservative: 1/hour)
            "fred": 3600,           # 1000/day (conservative: 1/hour)
            "fmp": 300              # 250/day (approx)
        }

    def can_fetch(self, provider):
        """Determines if the shield allows a fresh ingestion."""
        now = time.time()
        config = self.cache.get(provider, {"last_hit": 0, "value": None})
        
        if now - config["last_hit"] > self.rules.get(provider, 300):
            return True # Ingress Allowed
        return False # Serve from Cache

    def update_cache(self, provider, value):
        self.cache[provider] = {
            "last_hit": time.time(),
            "value": value,
            "status": "OPTIMAL (SHIELD ACTIVE)"
        }

    def get_value(self, provider):
        return self.cache.get(provider, {}).get("value")

    def get_diagnostics(self):
        """Returns health telemetry for the Governance Dashboard."""
        diag = {}
        now = time.time()
        for p, r in self.rules.items():
            last = self.cache.get(p, {}).get("last_hit", 0)
            diag[p] = {
                "safe": "GOVERNED",
                "next_sync": max(0, int(r - (now - last))),
                "credits_daily_est": int(86400 / r) if r > 0 else 0
            }
        return diag

governance_shield = GovernanceShield()
