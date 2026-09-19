import type { FundCategoryDefinition } from "./types";

/**
 * A curated subset of AMFI's ~98 raw category strings, same spirit as
 * lib/symbols.ts hand-curating the NIFTY 50 list rather than tracking every
 * NSE-listed stock. AMFI's raw taxonomy mixes current and legacy naming
 * (e.g. "Equity Scheme -" vs "Equity Schemes -", or "Short Duration Fund"
 * vs the older "Short Term Fund"), so each entry lists every raw string
 * observed for that category.
 *
 * Each category also carries a riskWeights table: its share of its group
 * (Equity or Debt) for each risk profile, summing to 100 within that group.
 * Conservative leans toward the more stable end of each list; Aggressive
 * leans toward the more volatile, higher-growth-potential end.
 */
export const EQUITY_FUND_CATEGORIES: FundCategoryDefinition[] = [
  {
    bucket: "Equity",
    label: "Large Cap",
    amfiCategories: ["Equity Scheme - Large Cap Fund", "Equity Schemes - Large Cap Fund"],
    riskWeights: { Conservative: 55, Balanced: 35, Aggressive: 15 },
  },
  {
    bucket: "Equity",
    label: "Flexi Cap",
    amfiCategories: ["Equity Scheme - Flexi Cap Fund", "Equity Schemes - Flexi Cap Fund"],
    riskWeights: { Conservative: 25, Balanced: 30, Aggressive: 25 },
  },
  {
    bucket: "Equity",
    label: "Mid Cap",
    amfiCategories: ["Equity Scheme - Mid Cap Fund", "Equity Schemes - Mid Cap Fund"],
    riskWeights: { Conservative: 10, Balanced: 20, Aggressive: 35 },
  },
  {
    bucket: "Equity",
    label: "ELSS (tax saving)",
    amfiCategories: [
      "Equity Scheme - ELSS",
      "Equity Schemes - ELSS- Tax Saver Fund",
      "Equity Schemes - ELSS-Tax Saver Fund",
    ],
    riskWeights: { Conservative: 10, Balanced: 15, Aggressive: 25 },
  },
];

export const DEBT_FUND_CATEGORIES: FundCategoryDefinition[] = [
  {
    bucket: "Debt",
    label: "Liquid Fund",
    amfiCategories: ["Debt Scheme - Liquid Fund", "Income/Debt Oriented Schemes - Liquid Fund"],
    riskWeights: { Conservative: 50, Balanced: 35, Aggressive: 20 },
  },
  {
    bucket: "Debt",
    label: "Short Duration",
    amfiCategories: [
      "Debt Scheme - Short Duration Fund",
      "Income/Debt Oriented Schemes - Short Term Fund",
    ],
    riskWeights: { Conservative: 35, Balanced: 35, Aggressive: 35 },
  },
  {
    bucket: "Debt",
    label: "Corporate Bond",
    amfiCategories: [
      "Debt Scheme - Corporate Bond Fund",
      "Income/Debt Oriented Schemes - Corporate Bond Fund",
    ],
    riskWeights: { Conservative: 15, Balanced: 30, Aggressive: 45 },
  },
];

/**
 * ETFs trade on the exchange (via a demat account, like a stock) rather
 * than through an AMC folio, so unlike the categories above there's no
 * Direct/Regular or Growth/IDCW distinction — AMFI lists one row per fund.
 */
export const EQUITY_ETF_CATEGORIES: FundCategoryDefinition[] = [
  {
    bucket: "Equity",
    label: "Equity ETF",
    amfiCategories: ["Exchange Traded Funds (ETFs) - Equity ETF"],
    // Only one category in this group, so the weight value itself has no
    // effect on the split — it always gets 100% of the equity share.
    riskWeights: { Conservative: 100, Balanced: 100, Aggressive: 100 },
  },
];

export const DEBT_ETF_CATEGORIES: FundCategoryDefinition[] = [
  {
    bucket: "Debt",
    label: "Debt ETF",
    amfiCategories: ["Exchange Traded Funds (ETFs) - Debt ETF"],
    riskWeights: { Conservative: 75, Balanced: 60, Aggressive: 45 },
  },
  {
    bucket: "Debt",
    label: "Gold ETF",
    amfiCategories: ["Exchange Traded Funds (ETFs) - Gold ETF"],
    // Gold is meaningfully more volatile than a debt ETF, so it gets a
    // larger share as the profile gets more aggressive, same direction as
    // every other category above.
    riskWeights: { Conservative: 25, Balanced: 40, Aggressive: 55 },
  },
];
