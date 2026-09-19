import { describe, expect, it } from "vitest";
import { indexTrend, scoreCandidate, SCORE_WEIGHTS } from "./scoring";
import type { Indicators } from "./types";

function indicators(overrides: Partial<Indicators> = {}): Indicators {
  return {
    price: 100,
    sma20: 100,
    sma50: 100,
    rsi14: 50,
    roc10: 0,
    avgVolume20: 1000,
    latestVolume: 1000,
    volumeRatio: 1,
    atr14: 1,
    atrPercent: 1,
    week52High: 120,
    week52Low: 80,
    ...overrides,
  };
}

describe("SCORE_WEIGHTS", () => {
  it("sums to 1, matching the 35/30/20/15 split disclosed on the methodology page", () => {
    expect(
      SCORE_WEIGHTS.trend + SCORE_WEIGHTS.momentum + SCORE_WEIGHTS.volume + SCORE_WEIGHTS.yearRange,
    ).toBeCloseTo(1, 10);
  });
});

describe("scoreCandidate", () => {
  it("scores a clean bullish setup as Bullish / Low risk", () => {
    const ind = indicators({
      price: 110,
      sma20: 105,
      sma50: 100,
      rsi14: 60,
      roc10: 5,
      volumeRatio: 1.6,
      atrPercent: 1.0,
      // pctOffHigh = (120-110)/120*100 = 8.33% -> the "moderately off high" tier
    });

    const result = scoreCandidate(ind, "Uptrend");

    // trend: above both averages (+25) and sma20>sma50 (+15) -> 90
    // momentum: rsi in [50,70] (+25) and roc10>0 (+15) -> 90
    // volume: ratio >= 1.5 -> 90
    // yearRange: 8.33% off the 52-week high -> 60
    // weighted = 90*0.35 + 90*0.30 + 90*0.20 + 60*0.15 = 31.5+27+18+9 = 85.5 -> rounds to 86
    expect(result.score).toBe(86);
    expect(result.signal).toBe("Bullish");
    expect(result.riskTier).toBe("Low");
    expect(result.reasons).toContain("NIFTY 50 is in an uptrend — a supportive backdrop");
  });

  it("scores a weak setup in a downtrend as Caution / Medium risk, applying the headwind penalty", () => {
    const ind = indicators({
      price: 90,
      sma20: 95,
      sma50: 100,
      rsi14: 25,
      roc10: -5,
      volumeRatio: 0.8,
      atrPercent: 2.5,
      // pctOffHigh = (120-90)/120*100 = 25% -> the "far from high" tier
    });

    const result = scoreCandidate(ind, "Downtrend");

    // trend: below both averages (-25) and sma20<sma50 (-15) -> 10
    // momentum: rsi<30 (-15) and roc10<=0 (-15) -> 20
    // volume: ratio < 1.0 -> 35
    // yearRange: 25% below the 52-week high, not near the low -> 40
    // weighted = 10*0.35 + 20*0.30 + 35*0.20 + 40*0.15 = 3.5+6+7+6 = 22.5
    // minus the 8-point downtrend headwind penalty = 14.5 -> rounds to 15
    expect(result.score).toBe(15);
    expect(result.signal).toBe("Caution");
    expect(result.riskTier).toBe("Medium");
    expect(result.reasons).toContain(
      "NIFTY 50 is in a downtrend — a headwind for individual stocks",
    );
  });

  it("lands exactly on the Watch threshold for a mixed-trend, overbought setup in a sideways market", () => {
    const ind = indicators({
      price: 101,
      sma20: 100,
      sma50: 105,
      rsi14: 75,
      roc10: 3,
      volumeRatio: 1.2,
      atrPercent: 1.8,
      // pctOffHigh = (120-101)/120*100 = 15.83% -> the "moderately off high" tier
    });

    const result = scoreCandidate(ind, "Sideways");

    // trend: mixed (no ±25) and sma20<sma50 (-15) -> 35
    // momentum: rsi>70 (+5) and roc10>0 (+15) -> 70
    // volume: 1.0 <= ratio < 1.5 -> 65
    // yearRange: 15.83% off the 52-week high -> 60
    // weighted = 35*0.35 + 70*0.30 + 65*0.20 + 60*0.15 = 12.25+21+13+9 = 55.25 -> rounds to 55
    expect(result.score).toBe(55);
    expect(result.signal).toBe("Watch");
    expect(result.riskTier).toBe("Low");
  });

  it("rewards a price within 5% of its 52-week high", () => {
    const ind = indicators({ week52High: 105, week52Low: 60 });
    // price=100 (default): pctOffHigh = (105-100)/105*100 = 4.76% -> "near high" tier (90)

    const result = scoreCandidate(ind, "Sideways");

    // trend: price==sma20==sma50 -> mixed (50), sma20==sma50 -> else branch (-15) -> 35
    // momentum: rsi=50 in [50,70] (+25), roc=0 not >0 (-15) -> 60
    // volume: ratio==1 -> 65
    // yearRange: within 5% of the 52-week high -> 90
    // weighted = 35*0.35 + 60*0.30 + 65*0.20 + 90*0.15 = 12.25+18+13+13.5 = 56.75 -> rounds to 57
    expect(result.score).toBe(57);
    expect(result.signal).toBe("Watch");
    expect(result.reasons).toContain("Within 5% of its 52-week high");
  });

  it("penalizes a price within 5% of its 52-week low", () => {
    const ind = indicators({ week52High: 150, week52Low: 98 });
    // price=100 (default): pctAboveLow = (100-98)/98*100 = 2.04% -> "near low" tier (15)

    const result = scoreCandidate(ind, "Sideways");

    // Same trend/momentum/volume sub-scores as the near-high case above (35/60/65).
    // yearRange: within 5% of the 52-week low -> 15
    // weighted = 35*0.35 + 60*0.30 + 65*0.20 + 15*0.15 = 12.25+18+13+2.25 = 45.5 -> rounds to 46
    expect(result.score).toBe(46);
    expect(result.signal).toBe("Neutral");
    expect(result.reasons).toContain("Within 5% of its 52-week low");
  });

  it("never scores outside the documented 0-100 range", () => {
    const worst = indicators({
      price: 50,
      sma20: 100,
      sma50: 150,
      rsi14: 5,
      roc10: -20,
      volumeRatio: 0.1,
      week52High: 200,
      week52Low: 49,
    });
    const best = indicators({
      price: 200,
      sma20: 150,
      sma50: 100,
      rsi14: 60,
      roc10: 20,
      volumeRatio: 3,
      week52High: 200,
      week52Low: 100,
    });

    expect(scoreCandidate(worst, "Downtrend").score).toBeGreaterThanOrEqual(0);
    expect(scoreCandidate(best, "Uptrend").score).toBeLessThanOrEqual(100);
  });
});

describe("indexTrend", () => {
  it("is Uptrend when price and the short average both lead", () => {
    expect(indexTrend(110, 105, 100)).toBe("Uptrend");
  });

  it("is Downtrend when price and the short average both lag", () => {
    expect(indexTrend(90, 95, 100)).toBe("Downtrend");
  });

  it("is Sideways for anything else", () => {
    expect(indexTrend(100, 100, 100)).toBe("Sideways");
    expect(indexTrend(105, 100, 110)).toBe("Sideways");
  });
});
