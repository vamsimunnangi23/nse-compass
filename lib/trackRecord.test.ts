import { describe, expect, it } from "vitest";
import { pairForwardReturns, summarizeBySignal } from "./trackRecord";
import type { PerformancePoint, SnapshotRow } from "./trackRecord";

function row(overrides: Partial<SnapshotRow> = {}): SnapshotRow {
  return {
    symbol: "TEST.NS",
    sessionDate: "2026-01-01",
    price: 100,
    score: 50,
    signal: "Watch",
    ...overrides,
  };
}

describe("pairForwardReturns", () => {
  it("pairs each snapshot with the one N captured sessions later, for the same symbol", () => {
    const rows: SnapshotRow[] = [
      row({ sessionDate: "2026-01-01", price: 100 }),
      row({ sessionDate: "2026-01-02", price: 102 }),
      row({ sessionDate: "2026-01-03", price: 104 }),
      row({ sessionDate: "2026-01-04", price: 103 }),
      row({ sessionDate: "2026-01-05", price: 110 }),
      row({ sessionDate: "2026-01-06", price: 120 }),
    ];

    const points = pairForwardReturns(rows, 1);

    expect(points).toHaveLength(5);
    expect(points[0]).toMatchObject({ fromDate: "2026-01-01", toDate: "2026-01-02" });
    expect(points[0].returnPercent).toBeCloseTo(2, 10);
    expect(points[1].returnPercent).toBeCloseTo(((104 - 102) / 102) * 100, 10);
    expect(points[2].returnPercent).toBeCloseTo(((103 - 104) / 104) * 100, 10);
    expect(points[4].returnPercent).toBeCloseTo(((120 - 110) / 110) * 100, 10);
  });

  it("only produces a pair once there are at least sessionsForward+1 sessions", () => {
    const rows: SnapshotRow[] = [
      row({ sessionDate: "2026-01-01", price: 100 }),
      row({ sessionDate: "2026-01-02", price: 110 }),
    ];

    expect(pairForwardReturns(rows, 5)).toHaveLength(0);
    expect(pairForwardReturns(rows, 1)).toHaveLength(1);
  });

  it("groups by symbol independently and sorts by date regardless of input order", () => {
    const rows: SnapshotRow[] = [
      row({ symbol: "B.NS", sessionDate: "2026-01-02", price: 50 }),
      row({ symbol: "A.NS", sessionDate: "2026-01-02", price: 210 }),
      row({ symbol: "A.NS", sessionDate: "2026-01-01", price: 200 }),
      row({ symbol: "B.NS", sessionDate: "2026-01-01", price: 40 }),
    ];

    const points = pairForwardReturns(rows, 1);
    expect(points).toHaveLength(2);

    const a = points.find((p) => p.symbol === "A.NS")!;
    expect(a.returnPercent).toBeCloseTo(5, 10); // (210-200)/200*100

    const b = points.find((p) => p.symbol === "B.NS")!;
    expect(b.returnPercent).toBeCloseTo(25, 10); // (50-40)/40*100
  });

  it("skips a pair rather than dividing by zero when the starting price is 0", () => {
    const rows: SnapshotRow[] = [
      row({ sessionDate: "2026-01-01", price: 0 }),
      row({ sessionDate: "2026-01-02", price: 10 }),
    ];

    expect(pairForwardReturns(rows, 1)).toHaveLength(0);
  });
});

describe("summarizeBySignal", () => {
  function point(overrides: Partial<PerformancePoint> = {}): PerformancePoint {
    return {
      symbol: "TEST.NS",
      signal: "Watch",
      fromDate: "2026-01-01",
      toDate: "2026-01-02",
      returnPercent: 0,
      ...overrides,
    };
  }

  it("computes average return and win rate per signal", () => {
    const points = [
      point({ signal: "Bullish", returnPercent: 10 }),
      point({ signal: "Bullish", returnPercent: -2 }),
      point({ signal: "Caution", returnPercent: -5 }),
    ];

    const summary = summarizeBySignal(points);

    const bullish = summary.find((s) => s.signal === "Bullish")!;
    expect(bullish.sampleSize).toBe(2);
    expect(bullish.avgReturnPercent).toBeCloseTo(4, 10);
    expect(bullish.winRatePercent).toBeCloseTo(50, 10);

    const caution = summary.find((s) => s.signal === "Caution")!;
    expect(caution.sampleSize).toBe(1);
    expect(caution.avgReturnPercent).toBeCloseTo(-5, 10);
    expect(caution.winRatePercent).toBe(0);
  });

  it("orders results Bullish -> Watch -> Neutral -> Caution and skips signals with no data", () => {
    const points = [
      point({ signal: "Caution", returnPercent: 1 }),
      point({ signal: "Bullish", returnPercent: 1 }),
    ];

    const summary = summarizeBySignal(points);
    expect(summary.map((s) => s.signal)).toEqual(["Bullish", "Caution"]);
  });

  it("returns an empty array when there are no points", () => {
    expect(summarizeBySignal([])).toEqual([]);
  });
});
