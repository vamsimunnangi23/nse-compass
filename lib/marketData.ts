import { cached, getFetchedAt, invalidate, invalidateByPrefix, TTL } from "./cache";
import { computeIndicators } from "./indicators";
import { indexTrend, scoreCandidate } from "./scoring";
import { NIFTY50_SYMBOLS, NIFTY_INDEX_NAME, NIFTY_INDEX_SYMBOL } from "./symbols";
import type { Candidate, IndexSnapshot, MarketSnapshot, OhlcvBar } from "./types";
import { fetchBars, fetchQuote } from "./yahoo";

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i]) };
      } catch (err) {
        results[i] = { status: "rejected", reason: err };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

function dayChangePercent(bars: OhlcvBar[]): number {
  if (bars.length < 2) return 0;
  const prev = bars[bars.length - 2].close;
  const latest = bars[bars.length - 1].close;
  return ((latest - prev) / prev) * 100;
}

async function computeIndexSnapshot(): Promise<IndexSnapshot> {
  const [bars, quote] = await Promise.all([
    fetchBars(NIFTY_INDEX_SYMBOL),
    fetchQuote(NIFTY_INDEX_SYMBOL),
  ]);

  const indicators = computeIndicators(bars);
  const trend = indicators
    ? indexTrend(quote.price, indicators.sma20, indicators.sma50)
    : "Sideways";

  return {
    symbol: NIFTY_INDEX_SYMBOL,
    name: NIFTY_INDEX_NAME,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    trend,
    asOf: quote.asOf,
    sessionLabel: "Latest completed session",
  };
}

export async function getIndexSnapshot(): Promise<IndexSnapshot> {
  return cached("index-snapshot", TTL.index, computeIndexSnapshot);
}

async function computeAllCandidates(): Promise<Candidate[]> {
  const index = await getIndexSnapshot();

  const settled = await mapWithConcurrency(
    NIFTY50_SYMBOLS,
    6,
    async (info) => {
      const bars = await fetchBars(info.symbol);
      const indicators = computeIndicators(bars);
      if (!indicators) {
        throw new Error(`Not enough price history for ${info.symbol}`);
      }
      const result = scoreCandidate(indicators, index.trend);
      const candidate: Candidate = {
        symbol: info.symbol,
        name: info.name,
        sector: info.sector,
        price: indicators.price,
        changePercent: dayChangePercent(bars),
        indicators,
        score: result.score,
        signal: result.signal,
        riskTier: result.riskTier,
        reasons: result.reasons,
        asOf: bars[bars.length - 1].date,
      };
      return candidate;
    },
  );

  const candidates: Candidate[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") candidates.push(r.value);
  }

  if (candidates.length === 0) {
    throw new Error("Unable to compute signals for any tracked stock");
  }

  return candidates.sort((a, b) => b.score - a.score);
}

export async function getAllCandidates(): Promise<Candidate[]> {
  return cached("all-candidates", TTL.candidates, computeAllCandidates);
}

export async function getCandidate(symbol: string): Promise<Candidate | undefined> {
  const candidates = await getAllCandidates();
  return candidates.find((c) => c.symbol === symbol);
}

export async function getStockBars(symbol: string): Promise<OhlcvBar[]> {
  return cached(`bars:${symbol}`, TTL.stockDetail, () => fetchBars(symbol));
}

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const [index, candidates] = await Promise.all([
    getIndexSnapshot(),
    getAllCandidates(),
  ]);

  const advancers = candidates.filter((c) => c.changePercent > 0).length;
  const decliners = candidates.filter((c) => c.changePercent < 0).length;
  const unchanged = candidates.length - advancers - decliners;

  return { index, advancers, decliners, unchanged, tracked: candidates.length };
}

/** Timestamp (ms) of the last successful fetch behind the index/candidates data, if any. */
export function getMarketDataFetchedAt(): number | undefined {
  return getFetchedAt("all-candidates") ?? getFetchedAt("index-snapshot");
}

export function getStockFetchedAt(symbol: string): number | undefined {
  return getFetchedAt(`bars:${symbol}`);
}

/** Clears cached market data so the next read re-fetches from Yahoo Finance. */
export function invalidateMarketCache(symbol?: string): void {
  invalidate("index-snapshot");
  invalidate("all-candidates");
  if (symbol) {
    invalidate(`bars:${symbol}`);
  } else {
    invalidateByPrefix("bars:");
  }
}
