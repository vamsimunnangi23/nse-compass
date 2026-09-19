import { SIGNAL_THRESHOLDS } from "./scoring";
import type { Candidate, FundCategoryDefinition, MutualFundScheme, Sector } from "./types";

export type RiskProfileName = "Conservative" | "Balanced" | "Aggressive";

export interface RiskProfileWeights {
  stocksPercent: number;
  equityFundsPercent: number;
  debtFundsPercent: number;
}

/**
 * Illustrative presets, not personalized advice — the app never infers a
 * risk profile from anything about the user; they pick one of these
 * three themselves. Documented here and rendered directly on the
 * methodology page, same pattern as SCORE_WEIGHTS.
 */
export const RISK_PROFILES: Record<RiskProfileName, RiskProfileWeights> = {
  Conservative: { stocksPercent: 10, equityFundsPercent: 20, debtFundsPercent: 70 },
  Balanced: { stocksPercent: 25, equityFundsPercent: 35, debtFundsPercent: 40 },
  Aggressive: { stocksPercent: 40, equityFundsPercent: 40, debtFundsPercent: 20 },
};

export const MAX_STOCKS = 5;
export const MAX_STOCKS_PER_SECTOR = 2;
export const EXAMPLE_SCHEMES_PER_CATEGORY = 3;

export interface StockAllocation {
  type: "stock";
  symbol: string;
  name: string;
  sector: Sector;
  amount: number;
}

export interface FundCategoryAllocation {
  type: "fundCategory";
  label: string;
  amount: number;
  exampleSchemes: string[];
}

export interface AllocationBucket {
  bucket: "Stocks" | "Equity Funds" | "Debt Funds";
  amount: number;
  allocations: (StockAllocation | FundCategoryAllocation)[];
}

export interface AllocationPlan {
  totalAmount: number;
  profile: RiskProfileName;
  buckets: AllocationBucket[];
}

/** Splits `amount` into `count` whole-number shares that sum back to exactly `amount`. */
export function splitEqually(amount: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/**
 * Picks up to `maxStocks` candidates at Watch signal or better, ranked by
 * score, capped at `maxPerSector` per sector so the picks are actually
 * diversified rather than clustered in whichever sector is hot.
 */
export function pickDiversifiedStocks(
  candidates: Candidate[],
  maxStocks: number,
  maxPerSector: number,
): Candidate[] {
  const sorted = [...candidates]
    .filter((c) => c.score >= SIGNAL_THRESHOLDS.watch)
    .sort((a, b) => b.score - a.score);

  const picked: Candidate[] = [];
  const perSector = new Map<Sector, number>();

  for (const candidate of sorted) {
    if (picked.length >= maxStocks) break;
    const count = perSector.get(candidate.sector) ?? 0;
    if (count >= maxPerSector) continue;
    picked.push(candidate);
    perSector.set(candidate.sector, count + 1);
  }

  return picked;
}

export function buildFundCategoryAllocations(
  amount: number,
  categoryDefs: FundCategoryDefinition[],
  allSchemes: MutualFundScheme[],
  examplesPerCategory: number = EXAMPLE_SCHEMES_PER_CATEGORY,
): FundCategoryAllocation[] {
  const shares = splitEqually(amount, categoryDefs.length);

  return categoryDefs.map((def, i) => {
    const wanted = new Set(def.amfiCategories.map((c) => c.toLowerCase()));
    const schemeNames = Array.from(
      new Set(
        allSchemes.filter((s) => wanted.has(s.rawCategory.toLowerCase())).map((s) => s.name),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return {
      type: "fundCategory" as const,
      label: def.label,
      amount: shares[i],
      exampleSchemes: schemeNames.slice(0, examplesPerCategory),
    };
  });
}

export function buildAllocation(
  amount: number,
  profile: RiskProfileName,
  candidates: Candidate[],
  allSchemes: MutualFundScheme[],
  equityCategories: FundCategoryDefinition[],
  debtCategories: FundCategoryDefinition[],
): AllocationPlan {
  const weights = RISK_PROFILES[profile];

  const stocksAmount = Math.round((amount * weights.stocksPercent) / 100);
  const equityFundsAmount = Math.round((amount * weights.equityFundsPercent) / 100);
  // Debt takes whatever's left so the three buckets always reconcile exactly to `amount`.
  const debtFundsAmount = amount - stocksAmount - equityFundsAmount;

  const stocks = pickDiversifiedStocks(candidates, MAX_STOCKS, MAX_STOCKS_PER_SECTOR);
  const stockShares = splitEqually(stocksAmount, stocks.length);
  const stockAllocations: StockAllocation[] = stocks.map((c, i) => ({
    type: "stock" as const,
    symbol: c.symbol,
    name: c.name,
    sector: c.sector,
    amount: stockShares[i],
  }));

  const equityFundAllocations = buildFundCategoryAllocations(
    equityFundsAmount,
    equityCategories,
    allSchemes,
  );
  const debtFundAllocations = buildFundCategoryAllocations(
    debtFundsAmount,
    debtCategories,
    allSchemes,
  );

  return {
    totalAmount: amount,
    profile,
    buckets: [
      { bucket: "Stocks", amount: stocksAmount, allocations: stockAllocations },
      { bucket: "Equity Funds", amount: equityFundsAmount, allocations: equityFundAllocations },
      { bucket: "Debt Funds", amount: debtFundsAmount, allocations: debtFundAllocations },
    ],
  };
}
