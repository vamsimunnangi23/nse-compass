import type { FundCategoryDefinition } from "./types";

/**
 * A curated subset of AMFI's ~98 raw category strings, same spirit as
 * lib/symbols.ts hand-curating the NIFTY 50 list rather than tracking every
 * NSE-listed stock. AMFI's raw taxonomy mixes current and legacy naming
 * (e.g. "Equity Scheme -" vs "Equity Schemes -", or "Short Duration Fund"
 * vs the older "Short Term Fund"), so each entry lists every raw string
 * observed for that category.
 */
export const EQUITY_FUND_CATEGORIES: FundCategoryDefinition[] = [
  {
    bucket: "Equity",
    label: "Large Cap",
    amfiCategories: ["Equity Scheme - Large Cap Fund", "Equity Schemes - Large Cap Fund"],
  },
  {
    bucket: "Equity",
    label: "Flexi Cap",
    amfiCategories: ["Equity Scheme - Flexi Cap Fund", "Equity Schemes - Flexi Cap Fund"],
  },
  {
    bucket: "Equity",
    label: "Mid Cap",
    amfiCategories: ["Equity Scheme - Mid Cap Fund", "Equity Schemes - Mid Cap Fund"],
  },
  {
    bucket: "Equity",
    label: "ELSS (tax saving)",
    amfiCategories: [
      "Equity Scheme - ELSS",
      "Equity Schemes - ELSS- Tax Saver Fund",
      "Equity Schemes - ELSS-Tax Saver Fund",
    ],
  },
];

export const DEBT_FUND_CATEGORIES: FundCategoryDefinition[] = [
  {
    bucket: "Debt",
    label: "Liquid Fund",
    amfiCategories: ["Debt Scheme - Liquid Fund", "Income/Debt Oriented Schemes - Liquid Fund"],
  },
  {
    bucket: "Debt",
    label: "Short Duration",
    amfiCategories: [
      "Debt Scheme - Short Duration Fund",
      "Income/Debt Oriented Schemes - Short Term Fund",
    ],
  },
  {
    bucket: "Debt",
    label: "Corporate Bond",
    amfiCategories: [
      "Debt Scheme - Corporate Bond Fund",
      "Income/Debt Oriented Schemes - Corporate Bond Fund",
    ],
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
  },
];

export const DEBT_ETF_CATEGORIES: FundCategoryDefinition[] = [
  {
    bucket: "Debt",
    label: "Debt ETF",
    amfiCategories: ["Exchange Traded Funds (ETFs) - Debt ETF"],
  },
  {
    bucket: "Debt",
    label: "Gold ETF",
    amfiCategories: ["Exchange Traded Funds (ETFs) - Gold ETF"],
  },
];
