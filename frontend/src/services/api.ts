import type { CandleData, MacroData, MarketTicker, NewsItem, Prediction, SMCPattern } from '../types';

// Use the backend when available, otherwise fall back to live mock data
const API_BASE = 'http://localhost:8001/api';

// ─── Simulate realistic fluctuating data ─────────────────────────────────────
let goldBase = 2350.45;
let dxyBase = 104.12;
let yieldBase = 4.31;

function jitter(base: number, pct = 0.001) {
  return +(base + base * (Math.random() - 0.5) * pct).toFixed(2);
}

export async function fetchMarketData(category: string = 'XAUUSD'): Promise<MarketTicker[]> {
  try {
    const res = await fetch(`${API_BASE}/market-data?category=${category}`);
    if (res.ok) return await res.json();
  } catch (_) { /* backend unavailable */ }

  if (category === 'CRYPTO') {
    return [
      { symbol: 'BTC/USD', price: 64230.50, change: 1240.20, changePct: 1.95, trend: 'bullish' },
      { symbol: 'ETH/USD', price: 3450.12,  change: -45.10,  changePct: -1.2,  trend: 'bearish' },
      { symbol: 'SOL/USD', price: 142.80,   change: 8.45,    changePct: 6.2,   trend: 'bullish' },
    ];
  }

  if (category === 'FOREX') {
    return [
      { symbol: 'EUR/USD', price: 1.0845,   change: 0.0012,  changePct: 0.11,  trend: 'bullish' },
      { symbol: 'GBP/USD', price: 1.2640,   change: -0.0005, changePct: -0.04, trend: 'bearish' },
      { symbol: 'USD/JPY', price: 151.20,   change: 0.45,    changePct: 0.3,   trend: 'bullish' },
    ];
  }

  goldBase = jitter(goldBase, 0.0005);
  dxyBase  = jitter(dxyBase, 0.0003);

  return [
    { symbol: 'XAU/USD', price: goldBase, change: +(goldBase - 2340).toFixed(2), changePct: +((goldBase - 2340) / 2340 * 100).toFixed(2), trend: 'bullish' },
    { symbol: 'DXY', price: dxyBase, change: +(dxyBase - 104.5).toFixed(2), changePct: +((dxyBase - 104.5) / 104.5 * 100).toFixed(2), trend: 'bullish' },
    { symbol: 'US10Y', price: yieldBase, change: -0.04, changePct: -0.92, trend: 'bullish' },
  ];
}

export async function fetchPrediction(category: string = 'XAUUSD', symbol?: string): Promise<Prediction> {
  try {
    const url = symbol 
      ? `${API_BASE}/prediction?category=${category}&symbol=${symbol}`
      : `${API_BASE}/prediction?category=${category}`;
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (_) { /* backend unavailable */ }

  const buyProb = +(52 + Math.random() * 28).toFixed(1);
  const isBuy = buyProb > 50;

  let entry = 2350.45;
  let asset = "XAU/USD (Gold)";
  let reasons = ["Liquidity swept below 2340.", "Bulls defending psychological 2350 level."];

  if (category === 'CRYPTO') {
    entry = 64230.50;
    asset = "BTC/USD (Bitcoin)";
    reasons = ["Funding rates neutral.", "Daily closure above EMA 50.", "EFT Inflows increasing."];
  } else if (category === 'FOREX') {
    entry = 1.0845;
    asset = "EUR/USD (Euro)";
    reasons = ["CPI core cooling in EU.", "Strong support at 1.0800 psych level.", "DXY showing weakness."];
  }

  return {
    buy_probability: buyProb,
    sell_probability: +(100 - buyProb).toFixed(1),
    trend: buyProb > 65 ? 'Strong Bullish' : buyProb > 55 ? 'Bullish' : buyProb < 35 ? 'Strong Bearish' : 'Neutral',
    confidence: buyProb > 70 || buyProb < 30 ? 'High' : 'Medium',
    volatility_score: +(30 + Math.random() * 55).toFixed(1),
    regime: 'Trending',
    reasoning: reasons.join(" "),
    entry_price: entry,
    stop_loss: isBuy ? entry * 0.98 : entry * 1.02,
    targets: isBuy ? [entry * 1.01, entry * 1.03, entry * 1.05] : [entry * 0.99, entry * 0.97, entry * 0.95],
    score: Math.floor(6 + Math.random() * 4),
    duration: "3-15 Days",
    asset_name: asset,
    current_gain: +(Math.random() * 2 - 1).toFixed(2),
    features_detected: reasons,
    rr_ratio: "1:3.2",
    session_bias: category === 'XAUUSD' ? 'NY Session Expansion' : category === 'CRYPTO' ? 'Asian Session Accumulation' : 'London Session Breakout',
    confluence_score: Math.floor(75 + Math.random() * 20),
    execution_log: [
        `Liquidity sweep completed.`,
        `RSI Oversold condition detected.`,
        `Algorithm confirmed entry criteria.`
    ]
  };
}

export async function fetchSMCPatterns(category: string = 'XAUUSD', symbol?: string): Promise<SMCPattern[]> {
  try {
    const url = symbol 
      ? `${API_BASE}/smc?category=${category}&symbol=${symbol}`
      : `${API_BASE}/smc?category=${category}`;
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (_) { /* backend unavailable */ }

  let level = 2341.50;
  if (category === 'CRYPTO') level = 62000;
  if (category === 'FOREX') level = 1.0810;

  return [
    { type: 'BOS',       direction: 'bullish', level: level, timeframe: '1H',  strength: 'Strong'  },
    { type: 'OB',        direction: 'bullish', level: level * 0.98, timeframe: '4H',  strength: 'Strong'  },
    { type: 'Liquidity', direction: 'bearish', level: level * 1.05, timeframe: '1D',  strength: 'Medium'  },
    { type: 'FVG',       direction: 'bullish', level: level * 0.995, timeframe: '15M', strength: 'Medium'  },
    { type: 'CHOCH',     direction: 'bearish', level: level * 1.02, timeframe: '4H',  strength: 'Weak'    },
  ];
}

export async function fetchMacroData(): Promise<MacroData> {
  return {
    dxy:   { value: dxyBase,   change: -0.38, trend: 'down' },
    us10y: { value: yieldBase, change: -0.04, trend: 'down' },
    session: getSession(),
    vix: +(12.5 + Math.random() * 6).toFixed(2),
  };
}

export async function fetchNews(): Promise<NewsItem[]> {
  return [
    { event: 'CPI y/y',        currency: 'USD', impact: 'HIGH',   sentiment: 'bearish', time: '14:30', title: 'US CPI data release – expected 3.2%'               },
    { event: 'FOMC Minutes',   currency: 'USD', impact: 'HIGH',   sentiment: 'neutral', time: '19:00', title: 'Federal Reserve meeting minutes'                   },
    { event: 'ISM Services',   currency: 'USD', impact: 'MEDIUM', sentiment: 'neutral', time: '15:00', title: 'ISM Services PMI – consensus 52.4'                  },
    { event: 'GDP Flash',      currency: 'EUR', impact: 'MEDIUM', sentiment: 'neutral', time: '10:00', title: 'Eurozone GDP flash estimate'                       },
    { event: 'Jobless Claims', currency: 'USD', impact: 'LOW',    sentiment: 'neutral', time: '13:30', title: 'Initial Jobless Claims – prior 235K'                },
  ];
}

export async function fetchOHLCV(symbol = 'GC=F', interval = '1h', period = '30d'): Promise<CandleData[]> {
  try {
    const res = await fetch(`${API_BASE}/ohlcv?symbol=${symbol}&interval=${interval}&period=${period}`);
    if (res.ok) return await res.json();
  } catch (_) { /* backend unavailable */ }
  return [];
}

function getSession(): MacroData['session'] {
  const utcHour = new Date().getUTCHours();
  if (utcHour >= 7  && utcHour < 13)  return 'London';
  if (utcHour >= 13 && utcHour < 22)  return 'New York';
  if (utcHour >= 0  && utcHour < 7)   return 'Tokyo';
  return 'Sydney';
}

export async function fetchPortfolio(): Promise<any> {
  const res = await fetch(`${API_BASE}/portfolio`);
  if (res.ok) return await res.json();
  return { 
    balance: 124530.42,
    equity: 126210.00,
    positions: [], 
    history: [] 
  };
}

export async function adjustCapital(amount: number): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/portfolio/adjust-capital?amount=${amount}`, {
            method: 'POST'
        });
        return await res.json();
    } catch (_) {
        return { success: true, newBalance: 124530.42 + amount };
    }
}

export async function fetchCryptoAssets(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/assets/crypto?limit=100`);
  if (res.ok) return await res.json();
  return [];
}

export async function fetchForexAssets(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/assets/forex`);
  if (res.ok) return await res.json();
  return [];
}

export async function addManualPosition(symbol: string, side: string, price: number): Promise<any> {
    const res = await fetch(`${API_BASE}/portfolio/add?symbol=${symbol}&side=${side}&price=${price}`, {
        method: 'POST'
    });
    return await res.json();
}

export async function triggerMLTraining(): Promise<any> {
    const res = await fetch(`${API_BASE}/ml/train`, {
        method: 'POST'
    });
    return await res.json();
}

export async function registerUser(data: any): Promise<any> {
    const res = await fetch(`${API_BASE.replace('/api', '')}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await res.json();
}

export async function loginUser(data: any): Promise<any> {
    const res = await fetch(`${API_BASE.replace('/api', '')}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await res.json();
}

export async function fetchAdminUsers(): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/admin/users`);
        if (res.ok) return await res.json();
    } catch (_) { }
    return [];
}
