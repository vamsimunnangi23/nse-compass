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
  week52High: number;
  week52Low: number;
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

export type FundBucket = "Equity" | "Debt" | "Hybrid" | "Other";
export type RiskProfileName = "Conservative" | "Balanced" | "Aggressive";

export interface MutualFundScheme {
  schemeCode: string;
  name: string;
  amc: string;
  rawCategory: string; // AMFI's own category string, e.g. "Equity Scheme - Large Cap Fund"
  nav: number;
  navDate: string; // ISO date
}

export interface FundCategoryDefinition {
  bucket: FundBucket;
  label: string; // display label, e.g. "Large Cap"
  amfiCategories: string[]; // raw AMFI category strings this label matches (case-insensitive)
  /**
   * This category's share of its group (Equity or Debt) for each risk
   * profile — must sum to 100 across every category within the same group.
   * E.g. Conservative favors Large Cap over Mid Cap; Aggressive is the
   * reverse. Disclosed directly on the methodology page.
   */
  riskWeights: Record<RiskProfileName, number>;
}
