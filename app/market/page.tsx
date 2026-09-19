import { Suspense } from "react";
import { BreadthBar } from "@/components/BreadthBar";
import { ErrorBanner } from "@/components/Banners";
import { IndexCard } from "@/components/IndexCard";
import { MarketFreshness } from "@/components/MarketFreshness";
import { attempt } from "@/lib/attempt";
import { getMarketSnapshot } from "@/lib/marketData";
import type { TrendState } from "@/lib/types";

export const revalidate = 0;
export const metadata = { title: "Market — NSE Compass" };

const TREND_COPY: Record<TrendState, string> = {
  Uptrend:
    "Price is above both its 20- and 50-day averages, with the shorter average leading — a supportive backdrop for individual stocks.",
  Downtrend:
    "Price is below both its 20- and 50-day averages, with the shorter average lagging — a headwind that this dashboard factors into every stock's score.",
  Sideways:
    "The index isn't clearly trending either way based on its moving averages.",
};

async function MarketOverview() {
  const result = await attempt(getMarketSnapshot);
  if (!result.ok) return <ErrorBanner message={result.error} />;
  const snapshot = result.data;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <IndexCard snapshot={snapshot.index} />
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">
            Trend state: {snapshot.index.trend}
          </p>
          <p className="mt-1 text-sm text-muted">
            {TREND_COPY[snapshot.index.trend]}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Market breadth</h2>
        <p className="mt-1 text-sm text-muted">
          How many of the {snapshot.tracked} tracked stocks rose or fell in
          the latest completed session.
        </p>
        <div className="mt-4">
          <BreadthBar
            advancers={snapshot.advancers}
            decliners={snapshot.decliners}
            unchanged={snapshot.unchanged}
          />
        </div>
      </div>
    </div>
  );
}

export default function MarketPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">Market</h1>
          <p className="mt-2 max-w-2xl text-muted">
            A read on the NIFTY 50 index and how broadly that&apos;s reflected
            across the tracked stock universe.
          </p>
        </div>
        <MarketFreshness />
      </div>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
          }
        >
          <MarketOverview />
        </Suspense>
      </div>
    </div>
  );
}
