import Link from "next/link";
import { Suspense } from "react";
import { DisclaimerBanner, ErrorBanner } from "@/components/Banners";
import { CandidateTable } from "@/components/CandidateTable";
import { IndexCard, IndexCardError, IndexCardSkeleton } from "@/components/IndexCard";
import { MarketFreshness } from "@/components/MarketFreshness";
import { attempt } from "@/lib/attempt";
import { getAllCandidates, getIndexSnapshot } from "@/lib/marketData";

export const revalidate = 0;

async function IndexCardLoader() {
  const result = await attempt(getIndexSnapshot);
  if (!result.ok) return <IndexCardError message={result.error} />;
  return <IndexCard snapshot={result.data} />;
}

async function TopCandidates() {
  const result = await attempt(getAllCandidates);
  if (!result.ok) return <ErrorBanner message={result.error} />;
  return <CandidateTable candidates={result.data.slice(0, 8)} />;
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
          Live historical-data mode
        </span>
        <MarketFreshness />
      </div>

      <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
            What stocks should I watch tomorrow?
          </h1>
          <p className="mt-4 text-lg text-muted">
            Simple, transparent signals from the latest available completed
            session — never a guarantee.
          </p>
        </div>

        <Suspense fallback={<IndexCardSkeleton />}>
          <IndexCardLoader />
        </Suspense>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <DisclaimerBanner />
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Tomorrow&apos;s top candidates</h2>
          <p className="mt-1 text-sm text-muted">
            Ranked using trend, momentum, volume, market conditions, and
            estimated risk.
          </p>
        </div>
        <Link
          href="/methodology"
          className="shrink-0 text-sm font-medium text-accent hover:underline"
        >
          View methodology &rsaquo;
        </Link>
      </div>

      <div className="mt-4">
        <Suspense fallback={<TableSkeleton />}>
          <TopCandidates />
        </Suspense>
      </div>

      <p className="mt-10 text-center text-xs text-muted">
        Live data source: configured provider. If it is unavailable, the app
        shows an error rather than fabricated values.
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
  );
}
