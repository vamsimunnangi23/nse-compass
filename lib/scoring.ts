import type { Indicators, RiskTier, Signal, TrendState } from "./types";

/**
 * Documented scoring weights. The methodology page renders these constants
 * directly so the UI can never drift from what's disclosed to users.
 */
export const SCORE_WEIGHTS = {
  trend: 0.35,
  momentum: 0.3,
  volume: 0.2,
  yearRange: 0.15,
} as const;

export const YEAR_RANGE_THRESHOLDS = {
  nearHighPercent: 5, // within this % of the 52-week high
  nearLowPercent: 5, // within this % of the 52-week low
  moderatelyOffHighPercent: 20,
} as const;

export const MARKET_HEADWIND_PENALTY = 8; // points subtracted when NIFTY 50 is in a downtrend

export const SIGNAL_THRESHOLDS = {
  bullish: 70,
  watch: 55,
  neutral: 40,
} as const;

export const RISK_THRESHOLDS = {
  lowMaxAtrPercent: 1.8,
  mediumMaxAtrPercent: 3.2,
} as const;

interface SubScoreResult {
  score: number; // 0-100
  reasons: string[];
}

function scoreTrend(ind: Indicators): SubScoreResult {
  const { price, sma20, sma50 } = ind;
  const reasons: string[] = [];
  let score = 50;

  if (price > sma20 && price > sma50) {
    score += 25;
    reasons.push("Price is above both its 20- and 50-day averages");
  } else if (price < sma20 && price < sma50) {
    score -= 25;
    reasons.push("Price is below both its 20- and 50-day averages");
  } else {
    reasons.push("Price is mixed relative to its 20- and 50-day averages");
  }

  if (sma20 > sma50) {
    score += 15;
    reasons.push("Short-term average (20d) is above the longer-term average (50d)");
  } else {
    score -= 15;
    reasons.push("Short-term average (20d) is below the longer-term average (50d)");
  }

  return { score: clamp(score), reasons };
}

function scoreMomentum(ind: Indicators): SubScoreResult {
  const { rsi14, roc10 } = ind;
  const reasons: string[] = [];
  let score = 50;

  if (rsi14 >= 50 && rsi14 <= 70) {
    score += 25;
    reasons.push(`RSI at ${rsi14.toFixed(0)} — healthy upward momentum`);
  } else if (rsi14 > 70) {
    score += 5;
    reasons.push(`RSI at ${rsi14.toFixed(0)} — overbought, momentum may be stretched`);
  } else if (rsi14 < 30) {
    score -= 15;
    reasons.push(`RSI at ${rsi14.toFixed(0)} — oversold, downward momentum`);
  } else {
    score -= 5;
    reasons.push(`RSI at ${rsi14.toFixed(0)} — weak momentum`);
  }

  if (roc10 > 0) {
    score += 15;
    reasons.push(`Up ${roc10.toFixed(1)}% over the last 10 sessions`);
  } else {
    score -= 15;
    reasons.push(`Down ${Math.abs(roc10).toFixed(1)}% over the last 10 sessions`);
  }

  return { score: clamp(score), reasons };
}

function scoreVolume(ind: Indicators): SubScoreResult {
  const { volumeRatio } = ind;
  const reasons: string[] = [];
  let score = 50;

  if (volumeRatio >= 1.5) {
    score = 90;
    reasons.push(`Volume ${volumeRatio.toFixed(1)}x the 20-day average — strong interest`);
  } else if (volumeRatio >= 1.0) {
    score = 65;
    reasons.push(`Volume ${volumeRatio.toFixed(1)}x the 20-day average — moderate interest`);
  } else {
    score = 35;
    reasons.push(`Volume ${volumeRatio.toFixed(1)}x the 20-day average — below-average interest`);
  }

  return { score: clamp(score), reasons };
}

function scoreYearRange(ind: Indicators): SubScoreResult {
  const { price, week52High, week52Low } = ind;
  const reasons: string[] = [];

  const pctOffHigh = week52High > 0 ? ((week52High - price) / week52High) * 100 : 0;
  const pctAboveLow = week52Low > 0 ? ((price - week52Low) / week52Low) * 100 : 0;

  let score: number;
  if (pctOffHigh <= YEAR_RANGE_THRESHOLDS.nearHighPercent) {
    score = 90;
    reasons.push(`Within ${YEAR_RANGE_THRESHOLDS.nearHighPercent}% of its 52-week high`);
  } else if (pctAboveLow <= YEAR_RANGE_THRESHOLDS.nearLowPercent) {
    score = 15;
    reasons.push(`Within ${YEAR_RANGE_THRESHOLDS.nearLowPercent}% of its 52-week low`);
  } else if (pctOffHigh <= YEAR_RANGE_THRESHOLDS.moderatelyOffHighPercent) {
    score = 60;
    reasons.push(`${pctOffHigh.toFixed(1)}% below its 52-week high`);
  } else {
    score = 40;
    reasons.push(
      `${pctOffHigh.toFixed(1)}% below its 52-week high, ${pctAboveLow.toFixed(1)}% above its 52-week low`,
    );
  }

  return { score: clamp(score), reasons };
}

function riskTierFromAtrPercent(atrPercent: number): RiskTier {
  if (atrPercent <= RISK_THRESHOLDS.lowMaxAtrPercent) return "Low";
  if (atrPercent <= RISK_THRESHOLDS.mediumMaxAtrPercent) return "Medium";
  return "High";
}

function signalFromScore(score: number): Signal {
  if (score >= SIGNAL_THRESHOLDS.bullish) return "Bullish";
  if (score >= SIGNAL_THRESHOLDS.watch) return "Watch";
  if (score >= SIGNAL_THRESHOLDS.neutral) return "Neutral";
  return "Caution";
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

export interface ScoreResult {
  score: number;
  signal: Signal;
  riskTier: RiskTier;
  reasons: string[];
}

export function scoreCandidate(ind: Indicators, marketTrend: TrendState): ScoreResult {
  const trend = scoreTrend(ind);
  const momentum = scoreMomentum(ind);
  const volume = scoreVolume(ind);
  const yearRange = scoreYearRange(ind);

  let score =
    trend.score * SCORE_WEIGHTS.trend +
    momentum.score * SCORE_WEIGHTS.momentum +
    volume.score * SCORE_WEIGHTS.volume +
    yearRange.score * SCORE_WEIGHTS.yearRange;

  const reasons = [...trend.reasons, ...momentum.reasons, ...volume.reasons, ...yearRange.reasons];

  if (marketTrend === "Downtrend") {
    score -= MARKET_HEADWIND_PENALTY;
    reasons.push("NIFTY 50 is in a downtrend — a headwind for individual stocks");
  } else if (marketTrend === "Uptrend") {
    reasons.push("NIFTY 50 is in an uptrend — a supportive backdrop");
  }

  // Round before deriving the signal so the label always matches the
  // score actually shown in the UI, even right at a threshold boundary.
  const rounded = Math.round(clamp(score));

  return {
    score: rounded,
    signal: signalFromScore(rounded),
    riskTier: riskTierFromAtrPercent(ind.atrPercent),
    reasons,
  };
}

export function indexTrend(price: number, sma20: number, sma50: number): TrendState {
  if (price > sma20 && sma20 > sma50) return "Uptrend";
  if (price < sma20 && sma20 < sma50) return "Downtrend";
  return "Sideways";
}
