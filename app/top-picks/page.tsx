import { Suspense } from "react";
import { DisclaimerBanner, ErrorBanner } from "@/components/Banners";
import { MarketFreshness } from "@/components/MarketFreshness";
import { TopPicksExplorer } from "@/components/TopPicksExplorer";
import { attempt } from "@/lib/attempt";
import { getAllCandidates } from "@/lib/marketData";

export const revalidate = 0;
export const metadata = { title: "Top Picks — NSE Compass" };

async function Picks() {
  const result = await attempt(getAllCandidates);
  if (!result.ok) return <ErrorBanner message={result.error} />;
  return <TopPicksExplorer candidates={result.data} />;
}

export default function TopPicksPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">Top Picks</h1>
          <p className="mt-2 max-w-2xl text-muted">
            The full tracked universe, ranked by score. Combine this with
            your own research — a high score reflects favorable historical
            technical conditions, not a prediction.
          </p>
        </div>
        <MarketFreshness />
      </div>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
          }
        >
          <Picks />
        </Suspense>
      </div>
    </div>
  );
}
