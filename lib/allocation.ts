import { SIGNAL_THRESHOLDS } from "./scoring";
import type { Candidate, FundCategoryDefinition, MutualFundScheme, Sector } from "./types";

export type RiskProfileName = "Conservative" | "Balanced" | "Aggressive";
export type InstrumentType = "Stocks" | "MutualFunds" | "Etf";
export type FundMix = "Equity" | "Debt" | "Both";

/** Fixed display/processing order, independent of how the user checked them. */
export const INSTRUMENT_TYPE_ORDER: InstrumentType[] = ["Stocks", "MutualFunds", "Etf"];

/**
 * User-facing choice that overrides the risk profile's equity/debt split
 * within the Mutual Funds and ETF buckets — direct control instead of only
 * an inferred one. Each option ships with a one-line explanation shown in
 * the UI, not just a raw label.
 */
export const FUND_MIX_OPTIONS: { value: FundMix; label: string; description: string }[] = [
  { value: "Equity", label: "Equity only", description: "Higher growth potential, more volatility." },
  { value: "Debt", label: "Debt only", description: "More stable, lower expected returns." },
  { value: "Both", label: "Equity + Debt", description: "Balanced mix based on your risk profile." },
];

function equityShareForMix(fundMix: FundMix, profileEquityShare: number): number {
  if (fundMix === "Equity") return 100;
  if (fundMix === "Debt") return 0;
  return profileEquityShare;
}

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
  selectedTypes: InstrumentType[];
  fundMix: FundMix;
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

/**
 * Splits `amount` across whichever instrument types are selected, in
 * INSTRUMENT_TYPE_ORDER, by renormalizing the profile's three weights to
 * sum to 100% over just the selected subset (so relative proportions are
 * preserved — e.g. Balanced's stocks:mutualFunds ratio stays 25:45 whether
 * or not ETFs are also selected). The last selected type absorbs the
 * rounding remainder so the shares always reconcile exactly to `amount`.
 */
export function splitBySelectedTypes(
  amount: number,
  weights: RiskProfileWeights,
  selectedTypes: InstrumentType[],
): Partial<Record<InstrumentType, number>> {
  const selected = INSTRUMENT_TYPE_ORDER.filter((t) => selectedTypes.includes(t));
  if (selected.length === 0) return {};

  const rawPercent: Record<InstrumentType, number> = {
    Stocks: weights.stocksPercent,
    MutualFunds: weights.mutualFundsPercent,
    Etf: weights.etfPercent,
  };
  const totalPercent = selected.reduce((sum, t) => sum + rawPercent[t], 0);

  const amounts: Partial<Record<InstrumentType, number>> = {};
  let runningTotal = 0;

  selected.forEach((type, i) => {
    if (i === selected.length - 1) {
      amounts[type] = amount - runningTotal;
      return;
    }
    const share = totalPercent > 0 ? rawPercent[type] / totalPercent : 1 / selected.length;
    const shareAmount = Math.round(amount * share);
    amounts[type] = shareAmount;
    runningTotal += shareAmount;
  });

  return amounts;
}

export function buildAllocation(
  amount: number,
  profile: RiskProfileName,
  selectedTypes: InstrumentType[],
  candidates: Candidate[],
  allSchemes: MutualFundScheme[],
  equityFundCategories: FundCategoryDefinition[],
  debtFundCategories: FundCategoryDefinition[],
  equityEtfCategories: FundCategoryDefinition[],
  debtEtfCategories: FundCategoryDefinition[],
  fundMix: FundMix = "Both",
): AllocationPlan {
  const weights = RISK_PROFILES[profile];
  const selected = INSTRUMENT_TYPE_ORDER.filter((t) => selectedTypes.includes(t));
  const amounts = splitBySelectedTypes(amount, weights, selected);
  const equityShare = equityShareForMix(fundMix, weights.equityShareWithinFunds);

  const buckets: AllocationBucket[] = [];

  if (amounts.Stocks !== undefined) {
    buckets.push(buildStocksBucket(amounts.Stocks, candidates));
  }
  if (amounts.MutualFunds !== undefined) {
    buckets.push(
      buildFundsBucket(
        "Mutual Funds",
        amounts.MutualFunds,
        equityShare,
        allSchemes,
        equityFundCategories,
        debtFundCategories,
      ),
    );
  }
  if (amounts.Etf !== undefined) {
    buckets.push(
      buildFundsBucket(
        "ETFs",
        amounts.Etf,
        equityShare,
        allSchemes,
        equityEtfCategories,
        debtEtfCategories,
      ),
    );
  }

  return { totalAmount: amount, profile, selectedTypes: selected, fundMix, buckets };
}
