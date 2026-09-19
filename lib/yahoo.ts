import YahooFinance from "yahoo-finance2";
import type { OhlcvBar } from "./types";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const HISTORY_DAYS = 400; // calendar days of buffer to safely cover a trailing 52-week (252 trading day) window

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function fetchBars(symbol: string): Promise<OhlcvBar[]> {
  const result = await yahooFinance.chart(symbol, {
    period1: daysAgo(HISTORY_DAYS),
    interval: "1d",
  });

  const bars: OhlcvBar[] = (result.quotes ?? [])
    .filter(
      (q) =>
        q.close != null &&
        q.open != null &&
        q.high != null &&
        q.low != null &&
        q.volume != null,
    )
    .map((q) => ({
      date: new Date(q.date).toISOString(),
      open: q.open as number,
      high: q.high as number,
      low: q.low as number,
      close: q.close as number,
      volume: q.volume as number,
    }));

  if (bars.length === 0) {
    throw new Error(`No price history returned for ${symbol}`);
  }

  return bars;
}

export interface RawQuote {
  price: number;
  change: number;
  changePercent: number;
  asOf: string;
}

export async function fetchQuote(symbol: string): Promise<RawQuote> {
  const quote = await yahooFinance.quote(symbol);

  if (quote.regularMarketPrice == null) {
    throw new Error(`No quote data returned for ${symbol}`);
  }

  return {
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange ?? 0,
    changePercent: quote.regularMarketChangePercent ?? 0,
    asOf: quote.regularMarketTime
      ? new Date(quote.regularMarketTime).toISOString()
      : new Date().toISOString(),
  };
}
