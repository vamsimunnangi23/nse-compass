import { describe, expect, it } from "vitest";
import {
  buildAllocation,
  buildFundCategoryAllocations,
  pickDiversifiedStocks,
  RISK_PROFILES,
  splitEqually,
} from "./allocation";
import type { Candidate, FundCategoryDefinition, MutualFundScheme } from "./types";

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    symbol: "TEST.NS",
    name: "Test Co",
    sector: "IT",
    price: 100,
    changePercent: 0,
    indicators: {
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
    },
    score: 60,
    signal: "Watch",
    riskTier: "Low",
    reasons: [],
    asOf: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function scheme(overrides: Partial<MutualFundScheme> = {}): MutualFundScheme {
  return {
    schemeCode: "1",
    name: "Sample Fund",
    amc: "Sample AMC",
    rawCategory: "Equity Scheme - Large Cap Fund",
    nav: 100,
    navDate: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("splitEqually", () => {
  it("divides evenly when it divides evenly", () => {
    expect(splitEqually(300, 3)).toEqual([100, 100, 100]);
  });

  it("distributes the remainder one unit at a time so the total is exact", () => {
    const shares = splitEqually(100, 3);
    expect(shares).toEqual([34, 33, 33]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("returns an empty array for zero or negative count", () => {
    expect(splitEqually(100, 0)).toEqual([]);
    expect(splitEqually(100, -1)).toEqual([]);
  });
});

describe("RISK_PROFILES", () => {
  it("each profile's percentages sum to 100", () => {
    for (const weights of Object.values(RISK_PROFILES)) {
      expect(weights.stocksPercent + weights.equityFundsPercent + weights.debtFundsPercent).toBe(
        100,
      );
    }
  });
});

describe("pickDiversifiedStocks", () => {
  it("excludes anything below the Watch threshold", () => {
    const candidates = [
      candidate({ symbol: "A", score: 30, signal: "Caution" }),
      candidate({ symbol: "B", score: 60, signal: "Watch" }),
    ];
    const picked = pickDiversifiedStocks(candidates, 5, 2);
    expect(picked.map((c) => c.symbol)).toEqual(["B"]);
  });

  it("ranks by score descending", () => {
    const candidates = [
      candidate({ symbol: "A", sector: "IT", score: 60 }),
      candidate({ symbol: "B", sector: "Pharma", score: 90 }),
      candidate({ symbol: "C", sector: "Auto", score: 75 }),
    ];
    const picked = pickDiversifiedStocks(candidates, 5, 2);
    expect(picked.map((c) => c.symbol)).toEqual(["B", "C", "A"]);
  });

  it("caps how many picks come from the same sector", () => {
    const candidates = [
      candidate({ symbol: "A", sector: "IT", score: 90 }),
      candidate({ symbol: "B", sector: "IT", score: 85 }),
      candidate({ symbol: "C", sector: "IT", score: 80 }), // 3rd IT pick, should be dropped
      candidate({ symbol: "D", sector: "Pharma", score: 70 }),
    ];
    const picked = pickDiversifiedStocks(candidates, 5, 2);
    expect(picked.map((c) => c.symbol)).toEqual(["A", "B", "D"]);
  });

  it("stops at maxStocks", () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      candidate({ symbol: `S${i}`, sector: "IT", score: 90 - i }),
    );
    expect(pickDiversifiedStocks(candidates, 3, 10)).toHaveLength(3);
  });
});

describe("buildFundCategoryAllocations", () => {
  const categories: FundCategoryDefinition[] = [
    { bucket: "Equity", label: "Large Cap", amfiCategories: ["Equity Scheme - Large Cap Fund"] },
    { bucket: "Equity", label: "Mid Cap", amfiCategories: ["Equity Scheme - Mid Cap Fund"] },
  ];

  it("splits the amount equally across categories and reconciles exactly", () => {
    const allocations = buildFundCategoryAllocations(1000, categories, []);
    expect(allocations.map((a) => a.amount)).toEqual([500, 500]);
  });

  it("lists real, de-duplicated, alphabetically sorted scheme names per category", () => {
    const schemes = [
      scheme({ name: "Zed Large Cap Fund", rawCategory: "Equity Scheme - Large Cap Fund" }),
      scheme({ name: "Alpha Large Cap Fund", rawCategory: "Equity Scheme - Large Cap Fund" }),
      scheme({ name: "Alpha Large Cap Fund", rawCategory: "Equity Scheme - Large Cap Fund" }), // duplicate share class
      scheme({ name: "Some Mid Cap Fund", rawCategory: "Equity Scheme - Mid Cap Fund" }),
    ];
    const allocations = buildFundCategoryAllocations(1000, categories, schemes);

    const largeCap = allocations.find((a) => a.label === "Large Cap")!;
    expect(largeCap.exampleSchemes).toEqual(["Alpha Large Cap Fund", "Zed Large Cap Fund"]);

    const midCap = allocations.find((a) => a.label === "Mid Cap")!;
    expect(midCap.exampleSchemes).toEqual(["Some Mid Cap Fund"]);
  });

  it("caps the number of example schemes shown per category", () => {
    const schemes = Array.from({ length: 10 }, (_, i) =>
      scheme({ name: `Fund ${i}`, rawCategory: "Equity Scheme - Large Cap Fund" }),
    );
    const allocations = buildFundCategoryAllocations(1000, [categories[0]], schemes, 3);
    expect(allocations[0].exampleSchemes).toHaveLength(3);
  });
});

describe("buildAllocation", () => {
  it("splits the total into three buckets that reconcile exactly, per the chosen profile", () => {
    const candidates = [candidate({ symbol: "A", sector: "IT", score: 90 })];
    const plan = buildAllocation(10_000, "Balanced", candidates, [], [], []);

    // Balanced: 25% stocks, 35% equity funds, 40% debt funds
    expect(plan.buckets.map((b) => b.amount)).toEqual([2500, 3500, 4000]);
    expect(plan.buckets.reduce((sum, b) => sum + b.amount, 0)).toBe(10_000);
  });

  it("reconciles exactly even when the percentages don't divide the amount evenly", () => {
    // 10,003 doesn't split cleanly at 40/40/20 — exercises the rounding path.
    const plan = buildAllocation(10_003, "Aggressive", [], [], [], []);
    expect(plan.buckets.reduce((sum, b) => sum + b.amount, 0)).toBe(10_003);
  });

  it("equal-weights the stocks bucket across the diversified picks", () => {
    const candidates = [
      candidate({ symbol: "A", sector: "IT", score: 90 }),
      candidate({ symbol: "B", sector: "Pharma", score: 80 }),
    ];
    const plan = buildAllocation(1000, "Aggressive", candidates, [], [], []);
    const stocksBucket = plan.buckets.find((b) => b.bucket === "Stocks")!;

    // Aggressive stocks bucket = 40% of 1000 = 400, split across 2 picks
    expect(stocksBucket.amount).toBe(400);
    expect(stocksBucket.allocations).toEqual([
      { type: "stock", symbol: "A", name: "Test Co", sector: "IT", amount: 200 },
      { type: "stock", symbol: "B", name: "Test Co", sector: "Pharma", amount: 200 },
    ]);
  });

  it("leaves a bucket's allocations empty (not fabricated) when nothing qualifies", () => {
    const plan = buildAllocation(1000, "Balanced", [], [], [], []);
    const stocksBucket = plan.buckets.find((b) => b.bucket === "Stocks")!;
    expect(stocksBucket.allocations).toEqual([]);
  });
});
