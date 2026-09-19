import type { SymbolInfo } from "./types";

/**
 * Tracked universe: a representative set of large-cap NSE stocks (broadly
 * aligned with the NIFTY 50). Yahoo Finance has no reliable "current index
 * constituents" endpoint, so this list is maintained by hand and should be
 * reviewed periodically against the official NSE NIFTY 50 list.
 */
export const NIFTY50_SYMBOLS: SymbolInfo[] = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "IT" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Financials" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Financials" },
  { symbol: "INFY.NS", name: "Infosys", sector: "IT" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecom" },
  { symbol: "ITC.NS", name: "ITC", sector: "Consumer" },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Financials" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "Consumer" },
  { symbol: "LT.NS", name: "Larsen & Toubro", sector: "Infrastructure" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "IT" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "Financials" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", sector: "Auto" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", sector: "Pharma" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Financials" },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", sector: "Auto" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", sector: "Financials" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", sector: "Cement" },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp", sector: "Energy" },
  { symbol: "TITAN.NS", name: "Titan Company", sector: "Consumer" },
  { symbol: "NTPC.NS", name: "NTPC", sector: "Utilities" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", sector: "Auto" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", sector: "Infrastructure" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports & SEZ", sector: "Infrastructure" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", sector: "Consumer" },
  { symbol: "WIPRO.NS", name: "Wipro", sector: "IT" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", sector: "Metals & Mining" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", sector: "Financials" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corp", sector: "Utilities" },
  { symbol: "COALINDIA.NS", name: "Coal India", sector: "Metals & Mining" },
  { symbol: "NESTLEIND.NS", name: "Nestle India", sector: "Consumer" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", sector: "Metals & Mining" },
  { symbol: "GRASIM.NS", name: "Grasim Industries", sector: "Cement" },
  { symbol: "HDFCLIFE.NS", name: "HDFC Life Insurance", sector: "Financials" },
  { symbol: "TECHM.NS", name: "Tech Mahindra", sector: "IT" },
  { symbol: "SBILIFE.NS", name: "SBI Life Insurance", sector: "Financials" },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank", sector: "Financials" },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories", sector: "Pharma" },
  { symbol: "CIPLA.NS", name: "Cipla", sector: "Pharma" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors", sector: "Auto" },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries", sector: "Consumer" },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals", sector: "Consumer" },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories", sector: "Pharma" },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp", sector: "Auto" },
  { symbol: "BPCL.NS", name: "Bharat Petroleum", sector: "Energy" },
  { symbol: "UPL.NS", name: "UPL", sector: "Consumer" },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries", sector: "Metals & Mining" },
  { symbol: "TATACONSUM.NS", name: "Tata Consumer Products", sector: "Consumer" },
  { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto", sector: "Auto" },
  { symbol: "SHRIRAMFIN.NS", name: "Shriram Finance", sector: "Financials" },
];

export const NIFTY_INDEX_SYMBOL = "^NSEI";
export const NIFTY_INDEX_NAME = "NIFTY 50";
