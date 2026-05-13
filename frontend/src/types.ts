export interface MarketTicker {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  volume?: number;
}

export interface Prediction {
  buy_probability: number;
  sell_probability: number;
  trend: string;
  confidence: string;
  features_detected: string[];
  volatility_score: number;
  regime: string;
  reasoning?: string;
  model_accuracy?: number;
  
  // Advanced Signaling Interface
  entry_price?: number;
  stop_loss?: number;
  targets?: number[];
  score?: number;      // e.g. 7 out of 10
  duration?: string;   // e.g. "3-15 Days"
  asset_name?: string;
  current_gain?: number;
  rr_ratio?: string;
  session_bias?: string;
  confluence_score?: number;
  execution_log?: string[];
  error?: string;
}

export interface SMCPattern {
  type: 'BOS' | 'CHOCH' | 'OB' | 'Liquidity' | 'FVG';
  direction: 'bullish' | 'bearish';
  level: number;
  timeframe: string;
  strength: 'Strong' | 'Medium' | 'Weak';
}

export interface NewsItem {
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  time: string;
  event: string;
  currency: string;
}

export interface MacroData {
  dxy: { value: number; change: number; trend: 'up' | 'down' };
  us10y: { value: number; change: number; trend: 'up' | 'down' };
  session: 'London' | 'New York' | 'Tokyo' | 'Sydney' | 'Pre-Market';
  vix: number;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
