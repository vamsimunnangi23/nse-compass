import type { Indicators, OhlcvBar } from "./types";

export function sma(values: number[], period: number): number {
  if (values.length < period) return NaN;
  const slice = values.slice(values.length - period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

/** Wilder's RSI over the trailing `period` sessions. */
export function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return NaN;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1];
    if (delta >= 0) gainSum += delta;
    else lossSum += -delta;
  }
  const avgGain = gainSum / period;
  const avgLoss = lossSum / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** % price change from `period` sessions ago to the latest close. */
export function rateOfChange(closes: number[], period = 10): number {
  if (closes.length < period + 1) return NaN;
  const past = closes[closes.length - 1 - period];
  const latest = closes[closes.length - 1];
  if (past === 0) return NaN;
  return ((latest - past) / past) * 100;
}

export function averageVolume(volumes: number[], period = 20): number {
  return sma(volumes, period);
}

/** Average True Range over the trailing `period` sessions. */
export function atr(bars: OhlcvBar[], period = 14): number {
  if (bars.length < period + 1) return NaN;

  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const cur = bars[i];
    const prevClose = bars[i - 1].close;
    const tr = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prevClose),
      Math.abs(cur.low - prevClose),
    );
    trueRanges.push(tr);
  }
  return sma(trueRanges, period);
}

const FIFTY_TWO_WEEK_TRADING_DAYS = 252;

/**
 * High/low over the trailing ~52 weeks of trading sessions. Degrades
 * gracefully to whatever history is available (e.g. a recently listed
 * stock) rather than requiring a full year of data.
 */
export function fiftyTwoWeekRange(bars: OhlcvBar[]): { high: number; low: number } {
  const window = bars.slice(-FIFTY_TWO_WEEK_TRADING_DAYS);
  const high = Math.max(...window.map((b) => b.high));
  const low = Math.min(...window.map((b) => b.low));
  return { high, low };
}

export function computeIndicators(bars: OhlcvBar[]): Indicators | null {
  if (bars.length < 51) return null;

  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume);
  const price = closes[closes.length - 1];
  const atr14 = atr(bars, 14);
  const { high: week52High, low: week52Low } = fiftyTwoWeekRange(bars);

  return {
    price,
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    rsi14: rsi(closes, 14),
    roc10: rateOfChange(closes, 10),
    avgVolume20: averageVolume(volumes, 20),
    latestVolume: volumes[volumes.length - 1],
    volumeRatio: volumes[volumes.length - 1] / averageVolume(volumes, 20),
    atr14,
    atrPercent: (atr14 / price) * 100,
    week52High,
    week52Low,
  };
}
