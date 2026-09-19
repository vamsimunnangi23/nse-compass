import Link from "next/link";
import { Suspense } from "react";
import { DisclaimerBanner, ErrorBanner } from "@/components/Banners";
import { attempt } from "@/lib/attempt";
import { buildAllocation, RISK_PROFILES } from "@/lib/allocation";
import type { AllocationPlan, RiskProfileName } from "@/lib/allocation";
import { DEBT_FUND_CATEGORIES, EQUITY_FUND_CATEGORIES } from "@/lib/fundCategories";
import { getAllCandidates } from "@/lib/marketData";
import { getAllSchemes } from "@/lib/mutualFunds";

export const revalidate = 0;
export const maxDuration = 60;
export const metadata = { title: "Diversify — NSE Compass" };

const PROFILE_NAMES = Object.keys(RISK_PROFILES) as RiskProfileName[];

function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function isRiskProfile(value: string | undefined): value is RiskProfileName {
  return !!value && (PROFILE_NAMES as string[]).includes(value);
}

function symbolSlug(symbol: string): string {
  return encodeURIComponent(symbol.replace(/\.NS$/, ""));
}

function formatRupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

async function Results({ amount, profile }: { amount: number; profile: RiskProfileName }) {
  const result = await attempt(async () => {
    const [candidates, schemes] = await Promise.all([getAllCandidates(), getAllSchemes()]);
    return buildAllocation(
      amount,
      profile,
      candidates,
      schemes,
      EQUITY_FUND_CATEGORIES,
      DEBT_FUND_CATEGORIES,
    );
  });

  if (!result.ok) return <ErrorBanner message={result.error} />;
  return <AllocationResult plan={result.data} />;
}

function AllocationResult({ plan }: { plan: AllocationPlan }) {
  return (
    <div className="flex flex-col gap-6">
      {plan.buckets.map((bucket) => (
        <div key={bucket.bucket} className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold">{bucket.bucket}</h3>
            <p className="text-lg font-bold tabular-nums">{formatRupees(bucket.amount)}</p>
          </div>

          {bucket.allocations.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              {bucket.bucket === "Stocks"
                ? "No tracked stock currently scores Watch or better — this bucket has no picks right now."
                : "No matching fund data available right now."}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {bucket.allocations.map((a) =>
                a.type === "stock" ? (
                  <li key={a.symbol} className="flex items-center justify-between text-sm">
                    <Link
                      href={`/stocks/${symbolSlug(a.symbol)}`}
                      className="font-medium hover:text-accent transition-colors"
                    >
                      {a.name} <span className="text-muted">· {a.sector}</span>
                    </Link>
                    <span className="tabular-nums font-medium">{formatRupees(a.amount)}</span>
                  </li>
                ) : (
                  <li key={a.label} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.label}</span>
                      <span className="tabular-nums font-medium">{formatRupees(a.amount)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {a.exampleSchemes.length > 0
                        ? `Examples (Direct Growth, not a recommendation): ${a.exampleSchemes.join(", ")}`
                        : "No current Direct Growth schemes found in this category."}
                    </p>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export default async function DiversifyPage({
  searchParams,
}: {
  searchParams: Promise<{ amount?: string; profile?: string }>;
}) {
  const params = await searchParams;
  const amount = parseAmount(params.amount);
  const invalidAmount = params.amount !== undefined && amount === null;
  const profile: RiskProfileName = isRiskProfile(params.profile) ? params.profile : "Balanced";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-3xl sm:text-4xl">Diversify</h1>
      <p className="mt-2 text-muted">
        Enter an amount and pick a risk profile yourself — this tool splits it across the
        tracked stocks and mutual fund categories using simple, disclosed rules. It does not
        know your goals, age, taxes, or existing holdings, and it never picks a &ldquo;best&rdquo;
        mutual fund scheme for you.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <DisclaimerBanner />
        <div className="rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning">
          This performs arithmetic on presets you choose — it is not an assessment of your
          financial situation. Mutual fund categories show real, current example scheme names
          from public AMFI data, never ranked by past performance. Always check the fund&apos;s
          own factsheet before investing.
        </div>
      </div>

      <form
        method="GET"
        className="mt-8 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-5"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Amount to invest (₹)</span>
          <input
            type="number"
            name="amount"
            min={1}
            step="1"
            defaultValue={amount ?? ""}
            placeholder="e.g. 100000"
            required
            className="w-48 rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Risk profile</span>
          <select
            name="profile"
            defaultValue={profile}
            className="w-48 rounded-lg border border-border bg-background px-3 py-2"
          >
            {PROFILE_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Build allocation
        </button>
      </form>

      {invalidAmount && (
        <p className="mt-3 text-sm text-danger">Enter a valid amount greater than zero.</p>
      )}

      {amount && (
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
            }
          >
            <Results amount={amount} profile={profile} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
