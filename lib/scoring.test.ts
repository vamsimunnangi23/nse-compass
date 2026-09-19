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
    ...overrides,
  };
}

describe("SCORE_WEIGHTS", () => {
  it("sums to 1, matching the 40/35/25 split disclosed on the methodology page", () => {
    expect(SCORE_WEIGHTS.trend + SCORE_WEIGHTS.momentum + SCORE_WEIGHTS.volume).toBeCloseTo(1, 10);
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
    });

    const result = scoreCandidate(ind, "Uptrend");

    // trend: above both averages (+25) and sma20>sma50 (+15) -> 90
    // momentum: rsi in [50,70] (+25) and roc10>0 (+15) -> 90
    // volume: ratio >= 1.5 -> 90
    // weighted = 90*0.4 + 90*0.35 + 90*0.25 = 90, no penalty (uptrend)
    expect(result.score).toBe(90);
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
    });

    const result = scoreCandidate(ind, "Downtrend");

    // trend: below both averages (-25) and sma20<sma50 (-15) -> 10
    // momentum: rsi<30 (-15) and roc10<=0 (-15) -> 20
    // volume: ratio < 1.0 -> 35
    // weighted = 10*0.4 + 20*0.35 + 35*0.25 = 4 + 7 + 8.75 = 19.75
    // minus the 8-point downtrend headwind penalty = 11.75 -> rounds to 12
    expect(result.score).toBe(12);
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
    });

    const result = scoreCandidate(ind, "Sideways");

    // trend: mixed (no ±25) and sma20<sma50 (-15) -> 35
    // momentum: rsi>70 (+5) and roc10>0 (+15) -> 70
    // volume: 1.0 <= ratio < 1.5 -> 65
    // weighted = 35*0.4 + 70*0.35 + 65*0.25 = 14 + 24.5 + 16.25 = 54.75 -> rounds to 55
    expect(result.score).toBe(55);
    expect(result.signal).toBe("Watch");
    expect(result.riskTier).toBe("Low");
  });

  it("never scores outside the documented 0-100 range", () => {
    const worst = indicators({
      price: 50,
      sma20: 100,
      sma50: 150,
      rsi14: 5,
      roc10: -20,
      volumeRatio: 0.1,
    });
    const best = indicators({
      price: 200,
      sma20: 150,
      sma50: 100,
      rsi14: 60,
      roc10: 20,
      volumeRatio: 3,
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
