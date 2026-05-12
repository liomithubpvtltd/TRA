import os
import requests
from dotenv import load_dotenv

load_dotenv()

class BrokerService:
    def __init__(self):
        # OANDA — Forex / Metals
        self.oanda_token = os.getenv("OANDA_API_KEY")
        self.oanda_account = os.getenv("OANDA_ACCOUNT_ID")
        self.oanda_env = os.getenv("OANDA_ENV", "practice")
        self.oanda_url = (
            "https://api-fxtrade.oanda.com/v3"
            if self.oanda_env == "live"
            else "https://api-fxpractice.oanda.com/v3"
        )

        # Binance — Crypto Spot
        self.binance_key    = os.getenv("BINANCE_API_KEY")
        self.binance_secret = os.getenv("BINANCE_SECRET_KEY")

    # ------------------------------------------------------------------ #
    #  OANDA — Forex / Gold execution                                      #
    # ------------------------------------------------------------------ #
    def execute_forex_order(self, symbol: str, side: str, volume: float):
        """Submit a market order to OANDA; falls back to paper if keys missing."""
        if not self.oanda_token or not self.oanda_account:
            print("[Broker/OANDA] Keys missing — paper trade.")
            return {"status": "paper", "symbol": symbol, "side": side, "volume": volume}

        headers = {
            "Authorization": f"Bearer {self.oanda_token}",
            "Content-Type": "application/json",
        }
        units = int(100_000 * volume)
        if side.lower() == "sell":
            units = -units

        # Normalise: EURUSD → EUR_USD
        fmt = symbol.replace("/", "_").upper()
        if "_" not in fmt and len(fmt) == 6:
            fmt = f"{fmt[:3]}_{fmt[3:]}"

        payload = {
            "order": {
                "units": str(units),
                "instrument": fmt,
                "timeInForce": "FOK",
                "type": "MARKET",
                "positionFill": "DEFAULT",
            }
        }
        try:
            resp = requests.post(
                f"{self.oanda_url}/accounts/{self.oanda_account}/orders",
                headers=headers,
                json=payload,
                timeout=8,
            )
            data = resp.json()
            if resp.status_code == 201:
                fill_id = data.get("orderFillTransaction", {}).get("id")
                print(f"[OANDA] Filled — order ID: {fill_id}")
                return {"status": "live_filled", "data": data}
            print(f"[OANDA] Rejected: {data}")
            return {"status": "live_rejected", "error": data}
        except Exception as e:
            print(f"[OANDA] Exception: {e}")
            return {"status": "error", "error": str(e)}

    # ------------------------------------------------------------------ #
    #  Binance — Crypto Spot execution                                     #
    # ------------------------------------------------------------------ #
    def execute_crypto_order(self, symbol: str, side: str, quantity: float):
        """Submit a MARKET order to Binance Spot; falls back to paper if keys missing."""
        if not self.binance_key or not self.binance_secret:
            print("[Broker/Binance] Keys missing — paper trade.")
            return {"status": "paper", "symbol": symbol, "side": side, "quantity": quantity}

        import hmac, hashlib, time
        base_url = "https://api.binance.com"
        # Normalise: BTC/USDT → BTCUSDT
        pair = symbol.replace("/", "").upper()
        timestamp = int(time.time() * 1000)
        params = (
            f"symbol={pair}&side={side.upper()}&type=MARKET"
            f"&quantity={quantity}&timestamp={timestamp}"
        )
        signature = hmac.new(
            self.binance_secret.encode(), params.encode(), hashlib.sha256
        ).hexdigest()
        url = f"{base_url}/api/v3/order?{params}&signature={signature}"
        headers = {"X-MBX-APIKEY": self.binance_key}
        try:
            resp = requests.post(url, headers=headers, timeout=8)
            data = resp.json()
            if resp.status_code == 200:
                print(f"[Binance] Filled — orderId: {data.get('orderId')}")
                return {"status": "live_filled", "data": data}
            print(f"[Binance] Rejected: {data}")
            return {"status": "live_rejected", "error": data}
        except Exception as e:
            print(f"[Binance] Exception: {e}")
            return {"status": "error", "error": str(e)}

broker_service = BrokerService()
