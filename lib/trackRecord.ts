import type { Signal } from "./types";

export interface SnapshotRow {
  symbol: string;
  sessionDate: string; // ISO date, e.g. "2026-09-15"
  price: number;
  score: number;
  signal: Signal;
}

export interface PerformancePoint {
  symbol: string;
  signal: Signal;
  fromDate: string;
  toDate: string;
  returnPercent: number;
}

/**
 * Pairs each snapshot with the one captured `sessionsForward` *captured*
 * sessions later for the same symbol (not calendar days — if a session was
 * ever missed, e.g. the daily snapshot job didn't run, this quietly counts
 * fewer real trading sessions than intended for that gap).
 */
export function pairForwardReturns(
  rows: SnapshotRow[],
  sessionsForward: number,
): PerformancePoint[] {
  const bySymbol = new Map<string, SnapshotRow[]>();
  for (const row of rows) {
    const list = bySymbol.get(row.symbol) ?? [];
    list.push(row);
    bySymbol.set(row.symbol, list);
  }

  const points: PerformancePoint[] = [];
  for (const list of bySymbol.values()) {
    const sorted = [...list].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
    for (let i = 0; i + sessionsForward < sorted.length; i++) {
      const from = sorted[i];
      const to = sorted[i + sessionsForward];
      if (from.price === 0) continue;
      points.push({
        symbol: from.symbol,
        signal: from.signal,
        fromDate: from.sessionDate,
        toDate: to.sessionDate,
        returnPercent: ((to.price - from.price) / from.price) * 100,
      });
    }
  }
  return points;
}

export interface SignalPerformanceSummary {
  signal: Signal;
  sampleSize: number;
  avgReturnPercent: number;
  winRatePercent: number;
}

const SIGNAL_ORDER: Signal[] = ["Bullish", "Watch", "Neutral", "Caution"];

/** Summarized in a fixed, documented order (Bullish first), skipping signals with no data yet. */
export function summarizeBySignal(points: PerformancePoint[]): SignalPerformanceSummary[] {
  const bySignal = new Map<Signal, PerformancePoint[]>();
  for (const p of points) {
    const list = bySignal.get(p.signal) ?? [];
    list.push(p);
    bySignal.set(p.signal, list);
  }

  const summaries: SignalPerformanceSummary[] = [];
  for (const signal of SIGNAL_ORDER) {
    const list = bySignal.get(signal);
    if (!list || list.length === 0) continue;

    const avgReturnPercent = list.reduce((sum, p) => sum + p.returnPercent, 0) / list.length;
    const wins = list.filter((p) => p.returnPercent > 0).length;

    summaries.push({
      signal,
      sampleSize: list.length,
      avgReturnPercent,
      winRatePercent: (wins / list.length) * 100,
    });
  }
  return summaries;
}
