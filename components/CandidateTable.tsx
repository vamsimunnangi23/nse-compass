"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Candidate, RiskTier, Signal } from "@/lib/types";
import { useMode } from "./ModeContext";
import { RiskBadge, ScoreBadge, SignalBadge } from "./Badges";

const RISK_RANK: Record<RiskTier, number> = { Low: 0, Medium: 1, High: 2 };
// Ascending mirrors the scoring thresholds: most cautious first, most bullish last.
const SIGNAL_RANK: Record<Signal, number> = { Caution: 0, Neutral: 1, Watch: 2, Bullish: 3 };

type SortKey = "price" | "signal" | "risk";
type SortDir = "asc" | "desc";
interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

const SORT_VALUE: Record<SortKey, (c: Candidate) => number> = {
  price: (c) => c.price,
  signal: (c) => SIGNAL_RANK[c.signal],
  risk: (c) => RISK_RANK[c.riskTier],
};

function symbolSlug(symbol: string): string {
  return encodeURIComponent(symbol.replace(/\.NS$/, ""));
}

export function CandidateTable({ candidates }: { candidates: Candidate[] }) {
  const { mode } = useMode();
  const advanced = mode === "Advanced";
  const [sort, setSort] = useState<SortState>({ key: null, dir: "asc" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sorted = useMemo(() => {
    if (!sort.key) return candidates;
    const getValue = SORT_VALUE[sort.key];
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...candidates].sort((a, b) => (getValue(a) - getValue(b)) * dir);
  }, [candidates, sort]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function updateScrollState() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
    // Column count and row content can change the table's natural width
    // without resizing the scroll container itself, so re-measure then too.
  }, [sorted, advanced]);

  function toggleSort(key: SortKey) {
    setSort((current) => {
      if (current.key !== key) return { key, dir: "asc" };
      if (current.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: "asc" };
    });
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="overflow-x-auto rounded-xl border border-border bg-surface"
      >
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">
                <SortableHeader
                  label="Price"
                  active={sort.key === "price"}
                  dir={sort.dir}
                  onClick={() => toggleSort("price")}
                />
              </th>
              <th className="px-4 py-3 font-medium">Change</th>
              <th className="px-4 py-3 font-medium">
                <SortableHeader
                  label="Signal"
                  active={sort.key === "signal"}
                  dir={sort.dir}
                  onClick={() => toggleSort("signal")}
                />
              </th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">
                <SortableHeader
                  label="Risk"
                  active={sort.key === "risk"}
                  dir={sort.dir}
                  onClick={() => toggleSort("risk")}
                />
              </th>
              {advanced && <th className="px-4 py-3 font-medium">RSI (14)</th>}
              {advanced && <th className="px-4 py-3 font-medium">Vol vs 20d avg</th>}
              {advanced && <th className="px-4 py-3 font-medium">Off 52W high</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const positive = c.changePercent >= 0;
              return (
                <tr key={c.symbol} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/stocks/${symbolSlug(c.symbol)}`}
                      className="font-semibold hover:text-accent transition-colors"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted">{c.sector}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {c.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td
                    className={`px-4 py-3 tabular-nums font-medium ${positive ? "text-accent" : "text-danger"}`}
                  >
                    {positive ? "+" : ""}
                    {c.changePercent.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    <SignalBadge signal={c.signal} />
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={c.score} />
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge risk={c.riskTier} />
                  </td>
                  {advanced && (
                    <td className="px-4 py-3 tabular-nums">
                      {c.indicators.rsi14.toFixed(0)}
                    </td>
                  )}
                  {advanced && (
                    <td className="px-4 py-3 tabular-nums">
                      {c.indicators.volumeRatio.toFixed(2)}x
                    </td>
                  )}
                  {advanced && (
                    <td className="px-4 py-3 tabular-nums">
                      {(
                        ((c.indicators.week52High - c.price) / c.indicators.week52High) *
                        100
                      ).toFixed(1)}
                      %
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canScrollLeft && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-xl bg-gradient-to-r from-surface to-transparent"
        />
      )}
      {canScrollRight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-xl bg-gradient-to-l from-surface to-transparent"
        />
      )}
    </div>
  );
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  const state = active ? dir : "none";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 uppercase tracking-wide text-muted hover:text-foreground transition-colors"
      title={`Sort by ${label.toLowerCase()}`}
      aria-label={`Sort by ${label.toLowerCase()}, currently ${
        state === "asc" ? "low to high" : state === "desc" ? "high to low" : "unsorted"
      }`}
    >
      {label}
      <SortIcon state={state} />
    </button>
  );
}

function SortIcon({ state }: { state: SortDir | "none" }) {
  if (state === "asc") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    );
  }
  if (state === "desc") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.5}>
      <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
    </svg>
  );
}
