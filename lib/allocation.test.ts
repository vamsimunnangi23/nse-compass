import { describe, expect, it } from "vitest";
import {
  buildAllocation,
  buildFundCategoryAllocations,
  pickDiversifiedStocks,
  RISK_PROFILES,
  splitByEquityShare,
  splitBySelectedTypes,
  splitEqually,
} from "./allocation";
import type { InstrumentType } from "./allocation";
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

describe("splitByEquityShare", () => {
  it("splits into [equity, debt] that reconciles exactly", () => {
    expect(splitByEquityShare(1000, 55)).toEqual([550, 450]);
    expect(splitByEquityShare(1000, 33)).toEqual([330, 670]);
  });

  it("handles 0% and 100% equity share", () => {
    expect(splitByEquityShare(500, 0)).toEqual([0, 500]);
    expect(splitByEquityShare(500, 100)).toEqual([500, 0]);
  });
});

describe("splitBySelectedTypes", () => {
  const balanced = RISK_PROFILES.Balanced; // stocks 25 / mutualFunds 45 / etf 30

  it("returns an empty object for an empty selection", () => {
    expect(splitBySelectedTypes(10_000, balanced, [])).toEqual({});
  });

  it("gives a single selected type the full amount", () => {
    expect(splitBySelectedTypes(1000, balanced, ["MutualFunds"])).toEqual({ MutualFunds: 1000 });
  });

  it("renormalizes two selected types to preserve their relative ratio", () => {
    // stocks:mutualFunds = 25:45 -> stocks share = 25/70, mutualFunds gets the remainder
    const result = splitBySelectedTypes(10_000, balanced, ["Stocks", "MutualFunds"]);
    expect(result).toEqual({ Stocks: 3571, MutualFunds: 6429 });
    expect((result.Stocks ?? 0) + (result.MutualFunds ?? 0)).toBe(10_000);
  });

  it("matches the plain profile percentages when all three are selected", () => {
    const result = splitBySelectedTypes(10_000, balanced, ["Stocks", "MutualFunds", "Etf"]);
    expect(result).toEqual({ Stocks: 2500, MutualFunds: 4500, Etf: 3000 });
  });

  it("is order-independent — selection order doesn't change the result", () => {
    const a = splitBySelectedTypes(10_000, balanced, ["Etf", "Stocks"]);
    const b = splitBySelectedTypes(10_000, balanced, ["Stocks", "Etf"]);
    expect(a).toEqual(b);
  });
});

describe("RISK_PROFILES", () => {
  it("each profile's top-level percentages (stocks/mutual funds/ETFs) sum to 100", () => {
    for (const weights of Object.values(RISK_PROFILES)) {
      expect(weights.stocksPercent + weights.mutualFundsPercent + weights.etfPercent).toBe(100);
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
    {
      bucket: "Equity",
      label: "Large Cap",
      amfiCategories: ["Equity Scheme - Large Cap Fund"],
      riskWeights: { Conservative: 70, Balanced: 50, Aggressive: 30 },
    },
    {
      bucket: "Equity",
      label: "Mid Cap",
      amfiCategories: ["Equity Scheme - Mid Cap Fund"],
      riskWeights: { Conservative: 30, Balanced: 50, Aggressive: 70 },
    },
  ];

  it("splits the amount by each category's risk weight for the given profile, tags the group, and reconciles exactly", () => {
    const balanced = buildFundCategoryAllocations(1000, categories, [], "Equity", "Balanced");
    expect(balanced.map((a) => a.amount)).toEqual([500, 500]);
    expect(balanced.every((a) => a.group === "Equity")).toBe(true);
  });

  it("gives a different split for a different risk profile, using the same categories", () => {
    const conservative = buildFundCategoryAllocations(
      1000,
      categories,
      [],
      "Equity",
      "Conservative",
    );
    const aggressive = buildFundCategoryAllocations(1000, categories, [], "Equity", "Aggressive");

    expect(conservative.map((a) => a.amount)).toEqual([700, 300]); // Large Cap favored
    expect(aggressive.map((a) => a.amount)).toEqual([300, 700]); // Mid Cap favored
    expect(conservative.reduce((s, a) => s + a.amount, 0)).toBe(1000);
    expect(aggressive.reduce((s, a) => s + a.amount, 0)).toBe(1000);
  });

  it("lists real, de-duplicated, alphabetically sorted scheme names per category", () => {
    const schemes = [
      scheme({ name: "Zed Large Cap Fund", rawCategory: "Equity Scheme - Large Cap Fund" }),
      scheme({ name: "Alpha Large Cap Fund", rawCategory: "Equity Scheme - Large Cap Fund" }),
      scheme({ name: "Alpha Large Cap Fund", rawCategory: "Equity Scheme - Large Cap Fund" }), // duplicate share class
      scheme({ name: "Some Mid Cap Fund", rawCategory: "Equity Scheme - Mid Cap Fund" }),
    ];
    const allocations = buildFundCategoryAllocations(1000, categories, schemes, "Equity", "Balanced");

    const largeCap = allocations.find((a) => a.label === "Large Cap")!;
    expect(largeCap.exampleSchemes).toEqual(["Alpha Large Cap Fund", "Zed Large Cap Fund"]);

    const midCap = allocations.find((a) => a.label === "Mid Cap")!;
    expect(midCap.exampleSchemes).toEqual(["Some Mid Cap Fund"]);
  });

  it("caps the number of example schemes shown per category", () => {
    const schemes = Array.from({ length: 10 }, (_, i) =>
      scheme({ name: `Fund ${i}`, rawCategory: "Equity Scheme - Large Cap Fund" }),
    );
    const allocations = buildFundCategoryAllocations(
      1000,
      [categories[0]],
      schemes,
      "Equity",
      "Balanced",
      3,
    );
    expect(allocations[0].exampleSchemes).toHaveLength(3);
  });
});

describe("buildAllocation", () => {
  // Single-entry lists throughout — each always gets 100% of its group's
  // share regardless of the weight value, so a flat weight keeps these
  // fixtures focused on what buildAllocation itself is responsible for.
  const flatWeights = { Conservative: 100, Balanced: 100, Aggressive: 100 };
  const equityFunds: FundCategoryDefinition[] = [
    {
      bucket: "Equity",
      label: "Large Cap",
      amfiCategories: ["Equity Scheme - Large Cap Fund"],
      riskWeights: flatWeights,
    },
  ];
  const debtFunds: FundCategoryDefinition[] = [
    {
      bucket: "Debt",
      label: "Liquid Fund",
      amfiCategories: ["Debt Scheme - Liquid Fund"],
      riskWeights: flatWeights,
    },
  ];
  const equityEtfs: FundCategoryDefinition[] = [
    {
      bucket: "Equity",
      label: "Equity ETF",
      amfiCategories: ["ETF - Equity ETF"],
      riskWeights: flatWeights,
    },
  ];
  const debtEtfs: FundCategoryDefinition[] = [
    {
      bucket: "Debt",
      label: "Gold ETF",
      amfiCategories: ["ETF - Gold ETF"],
      riskWeights: flatWeights,
    },
  ];

  it("all three selected: splits into Stocks / Mutual Funds / ETFs per the profile, reconciling exactly", () => {
    const plan = buildAllocation(
      10_000,
      "Balanced",
      ["Stocks", "MutualFunds", "Etf"],
      [],
      [],
      equityFunds,
      debtFunds,
      equityEtfs,
      debtEtfs,
    );

    // Balanced: 25% stocks, 45% mutual funds, 30% ETFs
    expect(plan.buckets.map((b) => [b.bucket, b.amount])).toEqual([
      ["Stocks", 2500],
      ["Mutual Funds", 4500],
      ["ETFs", 3000],
    ]);
    expect(plan.buckets.reduce((sum, b) => sum + b.amount, 0)).toBe(10_000);
  });

  it("splits each fund bucket into equity/debt using the profile's equityShareWithinFunds", () => {
    const plan = buildAllocation(
      10_000,
      "Balanced",
      ["Stocks", "MutualFunds", "Etf"],
      [],
      [],
      equityFunds,
      debtFunds,
      equityEtfs,
      debtEtfs,
    );
    const mutualFunds = plan.buckets.find((b) => b.bucket === "Mutual Funds")!;

    // Balanced equityShareWithinFunds = 55%; bucket amount = 4500
    // equity = round(4500*0.55) = 2475, debt = 4500-2475 = 2025
    const largeCap = mutualFunds.allocations.find(
      (a) => a.type === "fundCategory" && a.label === "Large Cap",
    );
    const liquid = mutualFunds.allocations.find(
      (a) => a.type === "fundCategory" && a.label === "Liquid Fund",
    );
    expect(largeCap).toMatchObject({ amount: 2475, group: "Equity" });
    expect(liquid).toMatchObject({ amount: 2025, group: "Debt" });
  });

  it("only Stocks selected: puts the entire amount into Stocks and no other bucket appears", () => {
    const candidates = [candidate({ symbol: "A", sector: "IT", score: 90 })];
    const plan = buildAllocation(
      1000,
      "Conservative",
      ["Stocks"],
      candidates,
      [],
      equityFunds,
      debtFunds,
      equityEtfs,
      debtEtfs,
    );
    expect(plan.buckets).toHaveLength(1);
    expect(plan.buckets[0]).toMatchObject({ bucket: "Stocks", amount: 1000 });
  });

  it("only Mutual Funds selected: puts the entire amount there, split by equityShareWithinFunds", () => {
    const plan = buildAllocation(
      1000,
      "Balanced",
      ["MutualFunds"],
      [],
      [],
      equityFunds,
      debtFunds,
      equityEtfs,
      debtEtfs,
    );
    expect(plan.buckets).toHaveLength(1);
    expect(plan.buckets[0].bucket).toBe("Mutual Funds");
    expect(plan.buckets[0].amount).toBe(1000);
    // 55% equity of 1000 = 550, debt = 450
    expect(plan.buckets[0].allocations).toEqual([
      { type: "fundCategory", label: "Large Cap", amount: 550, exampleSchemes: [], group: "Equity" },
      { type: "fundCategory", label: "Liquid Fund", amount: 450, exampleSchemes: [], group: "Debt" },
    ]);
  });

  it("only ETFs selected: puts the entire amount there, split by equityShareWithinFunds", () => {
    const plan = buildAllocation(
      1000,
      "Aggressive",
      ["Etf"],
      [],
      [],
      equityFunds,
      debtFunds,
      equityEtfs,
      debtEtfs,
    );
    expect(plan.buckets).toHaveLength(1);
    expect(plan.buckets[0].bucket).toBe("ETFs");
    // Aggressive equityShareWithinFunds = 80%: equity=800, debt=200
    expect(plan.buckets[0].allocations).toEqual([
      { type: "fundCategory", label: "Equity ETF", amount: 800, exampleSchemes: [], group: "Equity" },
      { type: "fundCategory", label: "Gold ETF", amount: 200, exampleSchemes: [], group: "Debt" },
    ]);
  });

  it("two selected types: renormalizes their weights and produces exactly two buckets", () => {
    const plan = buildAllocation(
      10_000,
      "Aggressive",
      ["MutualFunds", "Etf"],
      [],
      [],
      equityFunds,
      debtFunds,
      equityEtfs,
      debtEtfs,
    );
    // Aggressive mutualFunds:etf = 35:25 -> mutualFunds share = 35/60
    expect(plan.buckets.map((b) => [b.bucket, b.amount])).toEqual([
      ["Mutual Funds", 5833],
      ["ETFs", 4167],
    ]);
    expect(plan.buckets.reduce((sum, b) => sum + b.amount, 0)).toBe(10_000);
  });

  it("reconciles exactly for every non-empty combination, even when the amount doesn't divide cleanly", () => {
    const all: InstrumentType[] = ["Stocks", "MutualFunds", "Etf"];
    const combinations: InstrumentType[][] = [
      ["Stocks"],
      ["MutualFunds"],
      ["Etf"],
      ["Stocks", "MutualFunds"],
      ["Stocks", "Etf"],
      ["MutualFunds", "Etf"],
      all,
    ];
    for (const combo of combinations) {
      const plan = buildAllocation(
        10_003,
        "Aggressive",
        combo,
        [],
        [],
        equityFunds,
        debtFunds,
        equityEtfs,
        debtEtfs,
      );
      expect(plan.buckets.reduce((sum, b) => sum + b.amount, 0)).toBe(10_003);
    }
  });

  it('fundMix "Equity": sends the entire Mutual Funds/ETF amount to equity categories, none to debt', () => {
    const plan = buildAllocation(
      1000,
      "Balanced",
      ["MutualFunds"],
      [],
      [],
      equityFunds,
      debtFunds,
      equityEtfs,
      debtEtfs,
      "Equity",
    );
    const mutualFunds = plan.buckets.find((b) => b.bucket === "Mutual Funds")!;
    expect(mutualFunds.allocations).toEqual([
      { type: "fundCategory", label: "Large Cap", amount: 1000, exampleSchemes: [], group: "Equity" },
      { type: "fundCategory", label: "Liquid Fund", amount: 0, exampleSchemes: [], group: "Debt" },
    ]);
    expect(plan.fundMix).toBe("Equity");
  });

  it('fundMix "Debt": sends the entire Mutual Funds/ETF amount to debt categories, none to equity', () => {
    const plan = buildAllocation(
      1000,
      "Aggressive",
      ["Etf"],
      [],
      [],
      equityFunds,
      debtFunds,
      equityEtfs,
      debtEtfs,
      "Debt",
    );
    // Even though Aggressive's equityShareWithinFunds is 80%, "Debt" overrides it entirely.
    expect(plan.buckets[0].allocations).toEqual([
      { type: "fundCategory", label: "Equity ETF", amount: 0, exampleSchemes: [], group: "Equity" },
      { type: "fundCategory", label: "Gold ETF", amount: 1000, exampleSchemes: [], group: "Debt" },
    ]);
  });

  it('fundMix "Both" (the default) falls back to the profile\'s own equityShareWithinFunds', () => {
    const withDefault = buildAllocation(
      1000,
      "Balanced",
      ["MutualFunds"],
      [],
      [],
      equityFunds,
      debtFunds,
      equityEtfs,
      debtEtfs,
    );
    const explicit = buildAllocation(
      1000,
      "Balanced",
      ["MutualFunds"],
      [],
      [],
      equityFunds,
      debtFunds,
      equityEtfs,
      debtEtfs,
      "Both",
    );
    expect(withDefault).toEqual(explicit);
    expect(withDefault.fundMix).toBe("Both");
  });
});
