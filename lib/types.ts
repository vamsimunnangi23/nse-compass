export type Sector =
  | "Energy"
  | "IT"
  | "Financials"
  | "Consumer"
  | "Auto"
  | "Pharma"
  | "Metals & Mining"
  | "Cement"
  | "Infrastructure"
  | "Telecom"
  | "Utilities";

export interface SymbolInfo {
  symbol: string; // Yahoo ticker, e.g. "RELIANCE.NS"
  name: string; // display name
  sector: Sector;
}

export interface OhlcvBar {
  date: string; // ISO date
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TrendState = "Uptrend" | "Downtrend" | "Sideways";
export type Signal = "Bullish" | "Watch" | "Neutral" | "Caution";
export type RiskTier = "Low" | "Medium" | "High";

export interface Indicators {
  price: number;
  sma20: number;
  sma50: number;
  rsi14: number;
  roc10: number; // % rate of change over 10 sessions
  avgVolume20: number;
  latestVolume: number;
  volumeRatio: number; // latestVolume / avgVolume20
  atr14: number;
  atrPercent: number; // atr14 / price * 100
}

export interface Candidate {
  symbol: string;
  name: string;
  sector: Sector;
  price: number;
  changePercent: number;
  indicators: Indicators;
  score: number; // 0-100
  signal: Signal;
  riskTier: RiskTier;
  reasons: string[];
  asOf: string; // ISO date of the session this is based on
}

export interface IndexSnapshot {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  trend: TrendState;
  asOf: string; // ISO date/time of the session this is based on
  sessionLabel: string; // e.g. "Latest completed session"
}

export interface MarketSnapshot {
  index: IndexSnapshot;
  advancers: number;
  decliners: number;
  unchanged: number;
  tracked: number;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
