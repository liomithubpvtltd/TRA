# VISION — XAU/USD AI Trading System

> Professional ML-powered Gold trading intelligence dashboard.

---

## Project Structure

```
Vision/
├── frontend/          # React + Vite dashboard (Midnight Navy & Gold UI)
│   └── src/
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── AnimatedBackground.tsx
│       │   ├── MarketWatch.tsx         # XAU/USD, DXY, US10Y live tickers
│       │   ├── PriceChart.tsx          # Candlestick chart (EMA 20/50)
│       │   ├── PredictionEngine.tsx    # AI buy/sell probability gauge
│       │   ├── SMCPanel.tsx            # Smart Money Concepts patterns
│       │   ├── MacroPanel.tsx          # DXY, Yields, VIX, Session
│       │   └── EconomicCalendar.tsx    # High-impact news events
│       ├── services/api.ts             # API layer (real + mock fallback)
│       └── types.ts
│
├── backend/           # Python FastAPI REST API
│   ├── main.py        # API endpoints
│   ├── services/
│   │   └── indicator_service.py
│   └── requirements.txt
│
└── ml/                # Machine Learning Pipeline
    ├── preprocess.py  # Feature engineering (30+ features)
    ├── train.py       # XGBoost training with walk-forward CV
    ├── inference.py   # Real-time prediction engine
    └── model/         # Saved model (generated after training)
```

---

## Quick Start

### 1. Frontend (Dashboard)
```bash
cd frontend
npm install
npm run dev
# → Open http://localhost:5173
```

### 2. Backend (Optional — for live data)
```bash
cd backend
pip install -r requirements.txt
python main.py
# → API runs on http://localhost:8000
```

### 3. Train the ML Model
```bash
cd ml
pip install pandas numpy xgboost scikit-learn yfinance ta joblib
python train.py           # Downloads 5 years of GC=F 1H data automatically
python train.py --period 2y --lookahead 6   # Custom settings
```

---

## ML System

| Feature Group | Features |
|---|---|
| Trend | EMA 9/20/50/200 |
| Momentum | RSI, MACD, MACD Signal, MACD Hist |
| Volatility | ATR, ATR%, Bollinger Width, BB Position |
| Candle | Body ratio, Wicks, Bullish flag |
| Market Structure | HH, HL, LL, LH (BOS/CHOCH detection) |
| Session | London, NY, Overlap, Tokyo, Hour sin/cos |

**Model**: XGBoost with 5-fold walk-forward cross-validation  
**Target**: 55–65% accuracy (professional-grade with 1:2+ RR is profitable)

---

## Dashboard Sections

| Panel | Description |
|---|---|
| Market Watch | Live XAU/USD, DXY, US10Y tickers |
| Price Chart | 1H candlestick + EMA 20/50 |
| AI Prediction | Buy/Sell probability gauge + confidence |
| SMC Panel | BOS, CHOCH, Order Blocks, Liquidity, FVG |
| Macro Panel | DXY, Yields, VIX, Active Session |
| Economic Calendar | CPI, NFP, FOMC with impact/sentiment |

---

## Disclaimer
> For educational and analytical use only. Not financial advice.
