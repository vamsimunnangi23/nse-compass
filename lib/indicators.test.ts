import { describe, expect, it } from "vitest";
import {
  atr,
  averageVolume,
  computeIndicators,
  fiftyTwoWeekRange,
  rateOfChange,
  rsi,
  sma,
} from "./indicators";
import type { OhlcvBar } from "./types";

function bar(overrides: Partial<OhlcvBar> = {}): OhlcvBar {
  return {
    date: "2026-01-01T00:00:00.000Z",
    open: 100,
    high: 101,
    low: 99,
    close: 100,
    volume: 1000,
    ...overrides,
  };
}

describe("sma", () => {
  it("averages the trailing `period` values", () => {
    expect(sma([1, 2, 3, 4, 5], 5)).toBe(3);
    expect(sma([10, 20, 30], 2)).toBe(25);
  });

  it("returns NaN when there isn't enough history", () => {
    expect(sma([1, 2, 3], 5)).toBeNaN();
  });
});

describe("rsi", () => {
  it("is 100 for a strictly rising series (no losses)", () => {
    const closes = Array.from({ length: 15 }, (_, i) => i + 1); // 1..15
    expect(rsi(closes, 14)).toBe(100);
  });

  it("is 0 for a strictly falling series (no gains, avgLoss > 0)", () => {
    const closes = Array.from({ length: 15 }, (_, i) => 15 - i); // 15..1
    expect(rsi(closes, 14)).toBe(0);
  });

  it("is 50 when average gains equal average losses", () => {
    // 14 alternating +1/-1 deltas: 7 gains of 1, 7 losses of 1.
    const closes = [10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10];
    expect(rsi(closes, 14)).toBe(50);
  });

  it("returns NaN when there isn't enough history", () => {
    expect(rsi([1, 2, 3], 14)).toBeNaN();
  });
});

describe("rateOfChange", () => {
  it("computes the % change from `period` sessions ago to the latest close", () => {
    const closes = Array.from({ length: 11 }, (_, i) => 100 + i); // 100..110
    expect(rateOfChange(closes, 10)).toBeCloseTo(10, 10);
  });

  it("returns NaN when there isn't enough history", () => {
    expect(rateOfChange([1, 2, 3], 10)).toBeNaN();
  });

  it("returns NaN rather than divide-by-zero when the past close was 0", () => {
    const closes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(rateOfChange(closes, 10)).toBeNaN();
  });
});

describe("averageVolume", () => {
  it("delegates to sma", () => {
    expect(averageVolume([1000, 2000, 3000], 3)).toBe(2000);
  });
});

describe("atr", () => {
  it("computes the true range for a simple two-bar case", () => {
    const bars = [
      bar({ high: 10, low: 8, close: 9 }),
      bar({ high: 11, low: 9, close: 10 }),
    ];
    // TR = max(high-low=2, |high-prevClose|=|11-9|=2, |low-prevClose|=|9-9|=0) = 2
    expect(atr(bars, 1)).toBe(2);
  });

  it("returns NaN when there isn't enough history", () => {
    const bars = [bar(), bar()];
    expect(atr(bars, 5)).toBeNaN();
  });
});

describe("fiftyTwoWeekRange", () => {
  it("returns the max high and min low across the whole window when it fits", () => {
    const bars = [
      bar({ high: 110, low: 90 }),
      bar({ high: 130, low: 70 }),
      bar({ high: 100, low: 95 }),
    ];
    expect(fiftyTwoWeekRange(bars)).toEqual({ high: 130, low: 70 });
  });

  it("only looks at the trailing 252 sessions, ignoring older extremes", () => {
    const old = Array.from({ length: 10 }, () => bar({ high: 1000, low: 900 }));
    const recent = Array.from({ length: 252 }, () => bar({ high: 50, low: 40 }));
    expect(fiftyTwoWeekRange([...old, ...recent])).toEqual({ high: 50, low: 40 });
  });
});

describe("computeIndicators", () => {
  it("returns null when there are fewer than 51 bars", () => {
    const bars = Array.from({ length: 50 }, (_, i) => bar({ close: 100 + i }));
    expect(computeIndicators(bars)).toBeNull();
  });

  it("computes every field correctly for a hand-verifiable 51-bar series", () => {
    // Monotonic +1/day closes from 100..150, constant volume except a spike
    // on the final bar. Chosen so every indicator has a clean, hand-checkable
    // expected value (see the comments below).
    const bars = Array.from({ length: 51 }, (_, i) => {
      const close = 100 + i;
      const isLast = i === 50;
      return bar({
        close,
        high: close + 1,
        low: close - 1,
        volume: isLast ? 2000 : 1000,
      });
    });

    const result = computeIndicators(bars);
    expect(result).not.toBeNull();
    const ind = result!;

    expect(ind.price).toBe(150); // last close

    // sma20 = average of closes[31..50] = avg(131..150) = (131+150)/2
    expect(ind.sma20).toBeCloseTo(140.5, 10);
    // sma50 = average of closes[1..50] = avg(101..150) = (101+150)/2
    expect(ind.sma50).toBeCloseTo(125.5, 10);

    // Every day rises by 1 -> 14 straight gains -> RSI = 100
    expect(ind.rsi14).toBe(100);

    // roc10 = (close[50] - close[40]) / close[40] * 100 = (150-140)/140*100
    expect(ind.roc10).toBeCloseTo(((150 - 140) / 140) * 100, 10);

    // avgVolume20 = (19 * 1000 + 1 * 2000) / 20
    expect(ind.avgVolume20).toBeCloseTo(1050, 10);
    expect(ind.latestVolume).toBe(2000);
    expect(ind.volumeRatio).toBeCloseTo(2000 / 1050, 10);

    // high-low is always 2, and with high=close+1/low=close-1 on a strictly
    // +1/day series, every true range works out to exactly 2.
    expect(ind.atr14).toBeCloseTo(2, 10);
    expect(ind.atrPercent).toBeCloseTo((2 / 150) * 100, 10);

    // Monotonic series: the highest high and lowest low are the last and
    // first bars respectively (high = close+1, low = close-1).
    expect(ind.week52High).toBe(151);
    expect(ind.week52Low).toBe(99);
  });
});
