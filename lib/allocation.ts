import { SIGNAL_THRESHOLDS } from "./scoring";
import type { Candidate, FundCategoryDefinition, MutualFundScheme, Sector } from "./types";

export type RiskProfileName = "Conservative" | "Balanced" | "Aggressive";
export type InstrumentScope = "Mix" | "StocksOnly" | "MutualFundsOnly" | "EtfOnly";

export interface RiskProfileWeights {
  stocksPercent: number;
  mutualFundsPercent: number;
  etfPercent: number;
  /** Applied to both the Mutual Funds and ETF buckets' internal equity/debt split. */
  equityShareWithinFunds: number;
}

/**
 * Illustrative presets, not personalized advice — the app never infers a
 * risk profile from anything about the user; they pick one of these three
 * themselves. Documented here and rendered directly on the methodology
 * page, same pattern as SCORE_WEIGHTS.
 */
export const RISK_PROFILES: Record<RiskProfileName, RiskProfileWeights> = {
  Conservative: {
    stocksPercent: 10,
    mutualFundsPercent: 60,
    etfPercent: 30,
    equityShareWithinFunds: 25,
  },
  Balanced: {
    stocksPercent: 25,
    mutualFundsPercent: 45,
    etfPercent: 30,
    equityShareWithinFunds: 55,
  },
  Aggressive: {
    stocksPercent: 40,
    mutualFundsPercent: 35,
    etfPercent: 25,
    equityShareWithinFunds: 80,
  },
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
  group: "Equity" | "Debt";
}

export interface AllocationBucket {
  bucket: "Stocks" | "Mutual Funds" | "ETFs";
  amount: number;
  allocations: (StockAllocation | FundCategoryAllocation)[];
}

export interface AllocationPlan {
  totalAmount: number;
  profile: RiskProfileName;
  scope: InstrumentScope;
  buckets: AllocationBucket[];
}

/** Splits `amount` into `count` whole-number shares that sum back to exactly `amount`. */
export function splitEqually(amount: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Splits `amount` into [equity, debt] shares that sum back to exactly `amount`. */
export function splitByEquityShare(amount: number, equitySharePercent: number): [number, number] {
  const equity = Math.round((amount * equitySharePercent) / 100);
  return [equity, amount - equity];
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
  group: "Equity" | "Debt",
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
      group,
    };
  });
}

function buildStocksBucket(amount: number, candidates: Candidate[]): AllocationBucket {
  const stocks = pickDiversifiedStocks(candidates, MAX_STOCKS, MAX_STOCKS_PER_SECTOR);
  const shares = splitEqually(amount, stocks.length);
  return {
    bucket: "Stocks",
    amount,
    allocations: stocks.map((c, i) => ({
      type: "stock" as const,
      symbol: c.symbol,
      name: c.name,
      sector: c.sector,
      amount: shares[i],
    })),
  };
}

function buildFundsBucket(
  bucket: "Mutual Funds" | "ETFs",
  amount: number,
  equitySharePercent: number,
  allSchemes: MutualFundScheme[],
  equityCategories: FundCategoryDefinition[],
  debtCategories: FundCategoryDefinition[],
): AllocationBucket {
  const [equityShare, debtShare] = splitByEquityShare(amount, equitySharePercent);
  return {
    bucket,
    amount,
    allocations: [
      ...buildFundCategoryAllocations(equityShare, equityCategories, allSchemes, "Equity"),
      ...buildFundCategoryAllocations(debtShare, debtCategories, allSchemes, "Debt"),
    ],
  };
}

export function buildAllocation(
  amount: number,
  profile: RiskProfileName,
  scope: InstrumentScope,
  candidates: Candidate[],
  allSchemes: MutualFundScheme[],
  equityFundCategories: FundCategoryDefinition[],
  debtFundCategories: FundCategoryDefinition[],
  equityEtfCategories: FundCategoryDefinition[],
  debtEtfCategories: FundCategoryDefinition[],
): AllocationPlan {
  const weights = RISK_PROFILES[profile];

  let stocksAmount = 0;
  let mutualFundsAmount = 0;
  let etfAmount = 0;

  if (scope === "StocksOnly") {
    stocksAmount = amount;
  } else if (scope === "MutualFundsOnly") {
    mutualFundsAmount = amount;
  } else if (scope === "EtfOnly") {
    etfAmount = amount;
  } else {
    stocksAmount = Math.round((amount * weights.stocksPercent) / 100);
    mutualFundsAmount = Math.round((amount * weights.mutualFundsPercent) / 100);
    // ETF takes whatever's left so the three top-level amounts always
    // reconcile exactly to `amount`, regardless of rounding above.
    etfAmount = amount - stocksAmount - mutualFundsAmount;
  }

  const buckets: AllocationBucket[] = [];

  if (scope === "Mix" || scope === "StocksOnly") {
    buckets.push(buildStocksBucket(stocksAmount, candidates));
  }
  if (scope === "Mix" || scope === "MutualFundsOnly") {
    buckets.push(
      buildFundsBucket(
        "Mutual Funds",
        mutualFundsAmount,
        weights.equityShareWithinFunds,
        allSchemes,
        equityFundCategories,
        debtFundCategories,
      ),
    );
  }
  if (scope === "Mix" || scope === "EtfOnly") {
    buckets.push(
      buildFundsBucket(
        "ETFs",
        etfAmount,
        weights.equityShareWithinFunds,
        allSchemes,
        equityEtfCategories,
        debtEtfCategories,
      ),
    );
  }

  return { totalAmount: amount, profile, scope, buckets };
}
