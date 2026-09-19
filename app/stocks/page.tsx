import { Suspense } from "react";
import { ErrorBanner } from "@/components/Banners";
import { MarketFreshness } from "@/components/MarketFreshness";
import { StocksExplorer } from "@/components/StocksExplorer";
import { attempt } from "@/lib/attempt";
import { getAllCandidates } from "@/lib/marketData";

export const revalidate = 0;
export const maxDuration = 60;
export const metadata = { title: "Stocks — NSE Compass" };

async function AllStocks() {
  const result = await attempt(getAllCandidates);
  if (!result.ok) return <ErrorBanner message={result.error} />;
  const byName = [...result.data].sort((a, b) => a.name.localeCompare(b.name));
  return <StocksExplorer candidates={byName} />;
}

export default function StocksPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">Stocks</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Browse the full tracked universe of NSE large-caps and open any
            stock for a detailed signal breakdown.
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
          <AllStocks />
        </Suspense>
      </div>
    </div>
  );
}
