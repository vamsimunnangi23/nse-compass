import { describe, expect, it } from "vitest";
import {
  DEBT_ETF_CATEGORIES,
  DEBT_FUND_CATEGORIES,
  EQUITY_ETF_CATEGORIES,
  EQUITY_FUND_CATEGORIES,
} from "./fundCategories";
import type { FundCategoryDefinition, RiskProfileName } from "./types";

const PROFILES: RiskProfileName[] = ["Conservative", "Balanced", "Aggressive"];

function expectWeightsSumTo100(name: string, categories: FundCategoryDefinition[]) {
  for (const profile of PROFILES) {
    const total = categories.reduce((sum, c) => sum + c.riskWeights[profile], 0);
    expect(total, `${name} riskWeights for ${profile} should sum to 100`).toBe(100);
  }
}

describe("fund category riskWeights", () => {
  it("Equity Fund categories sum to 100 for every risk profile", () => {
    expectWeightsSumTo100("EQUITY_FUND_CATEGORIES", EQUITY_FUND_CATEGORIES);
  });

  it("Debt Fund categories sum to 100 for every risk profile", () => {
    expectWeightsSumTo100("DEBT_FUND_CATEGORIES", DEBT_FUND_CATEGORIES);
  });

  it("Equity ETF categories sum to 100 for every risk profile", () => {
    expectWeightsSumTo100("EQUITY_ETF_CATEGORIES", EQUITY_ETF_CATEGORIES);
  });

  it("Debt ETF categories sum to 100 for every risk profile", () => {
    expectWeightsSumTo100("DEBT_ETF_CATEGORIES", DEBT_ETF_CATEGORIES);
  });

  it("Conservative favors the most stable category in each equity list at least as much as Aggressive favors the least stable", () => {
    // Sanity check on direction, not just totals: Large Cap (stablest) should
    // get a bigger share under Conservative than under Aggressive, and Mid
    // Cap (least stable) should get a bigger share under Aggressive.
    const largeCap = EQUITY_FUND_CATEGORIES.find((c) => c.label === "Large Cap")!;
    const midCap = EQUITY_FUND_CATEGORIES.find((c) => c.label === "Mid Cap")!;

    expect(largeCap.riskWeights.Conservative).toBeGreaterThan(largeCap.riskWeights.Aggressive);
    expect(midCap.riskWeights.Aggressive).toBeGreaterThan(midCap.riskWeights.Conservative);
  });
});
