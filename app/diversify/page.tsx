import Link from "next/link";
import { Suspense } from "react";
import { DisclaimerBanner, ErrorBanner } from "@/components/Banners";
import { attempt } from "@/lib/attempt";
import { buildAllocation, INSTRUMENT_TYPE_ORDER, RISK_PROFILES } from "@/lib/allocation";
import type { AllocationPlan, InstrumentType, RiskProfileName } from "@/lib/allocation";
import {
  DEBT_ETF_CATEGORIES,
  DEBT_FUND_CATEGORIES,
  EQUITY_ETF_CATEGORIES,
  EQUITY_FUND_CATEGORIES,
} from "@/lib/fundCategories";
import { getAllCandidates } from "@/lib/marketData";
import { getAllSchemes } from "@/lib/mutualFunds";

export const revalidate = 0;
export const maxDuration = 60;
export const metadata = { title: "Diversify — NSE Compass" };

const PROFILE_NAMES = Object.keys(RISK_PROFILES) as RiskProfileName[];

const TYPE_LABELS: Record<InstrumentType, string> = {
  Stocks: "Stocks",
  MutualFunds: "Mutual Funds",
  Etf: "ETFs",
};

function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function isRiskProfile(value: string | undefined): value is RiskProfileName {
  return !!value && (PROFILE_NAMES as string[]).includes(value);
}

function parseSelectedTypes(raw: string | string[] | undefined): InstrumentType[] {
  const values = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  return INSTRUMENT_TYPE_ORDER.filter((t) => values.includes(t));
}

function symbolSlug(symbol: string): string {
  return encodeURIComponent(symbol.replace(/\.NS$/, ""));
}

function formatRupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

async function Results({
  amount,
  profile,
  selectedTypes,
}: {
  amount: number;
  profile: RiskProfileName;
  selectedTypes: InstrumentType[];
}) {
  const result = await attempt(async () => {
    const [candidates, schemes] = await Promise.all([getAllCandidates(), getAllSchemes()]);
    return buildAllocation(
      amount,
      profile,
      selectedTypes,
      candidates,
      schemes,
      EQUITY_FUND_CATEGORIES,
      DEBT_FUND_CATEGORIES,
      EQUITY_ETF_CATEGORIES,
      DEBT_ETF_CATEGORIES,
    );
  });

  if (!result.ok) return <ErrorBanner message={result.error} />;
  return <AllocationResult plan={result.data} />;
}

function AllocationResult({ plan }: { plan: AllocationPlan }) {
  return (
    <div className="flex flex-col gap-6">
      {plan.buckets.map((bucket) => {
        const equityAllocations = bucket.allocations.filter(
          (a) => a.type === "fundCategory" && a.group === "Equity",
        );
        const debtAllocations = bucket.allocations.filter(
          (a) => a.type === "fundCategory" && a.group === "Debt",
        );
        const stockAllocations = bucket.allocations.filter((a) => a.type === "stock");

        return (
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
              <div className="mt-3 flex flex-col gap-4">
                {stockAllocations.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {stockAllocations.map((a) => {
                      if (a.type !== "stock") return null;
                      return (
                        <li key={a.symbol} className="flex items-center justify-between text-sm">
                          <Link
                            href={`/stocks/${symbolSlug(a.symbol)}`}
                            className="font-medium hover:text-accent transition-colors"
                          >
                            {a.name} <span className="text-muted">· {a.sector}</span>
                          </Link>
                          <span className="tabular-nums font-medium">{formatRupees(a.amount)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {equityAllocations.length > 0 && (
                  <FundGroup title="Equity" allocations={equityAllocations} />
                )}
                {debtAllocations.length > 0 && <FundGroup title="Debt" allocations={debtAllocations} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FundGroup({
  title,
  allocations,
}: {
  title: string;
  allocations: AllocationPlan["buckets"][number]["allocations"];
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <ul className="mt-2 flex flex-col gap-3">
        {allocations.map((a) => {
          if (a.type !== "fundCategory") return null;
          return (
            <li key={a.label} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{a.label}</span>
                <span className="tabular-nums font-medium">{formatRupees(a.amount)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {a.exampleSchemes.length > 0
                  ? `Examples (not a recommendation): ${a.exampleSchemes.join(", ")}`
                  : "No current schemes found in this category."}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function DiversifyPage({
  searchParams,
}: {
  searchParams: Promise<{
    amount?: string;
    profile?: string;
    type?: string | string[];
    submitted?: string;
  }>;
}) {
  const params = await searchParams;
  const amount = parseAmount(params.amount);
  const invalidAmount = params.amount !== undefined && amount === null;
  const profile: RiskProfileName = isRiskProfile(params.profile) ? params.profile : "Balanced";

  // On a fresh visit (no form submission yet) default to all three checked.
  // Once submitted, respect exactly what's checked — including "none".
  const wasSubmitted = params.submitted === "1";
  const selectedTypes = wasSubmitted
    ? parseSelectedTypes(params.type)
    : [...INSTRUMENT_TYPE_ORDER];
  const noneSelected = wasSubmitted && selectedTypes.length === 0;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-3xl sm:text-4xl">Diversify</h1>
      <p className="mt-2 text-muted">
        Enter an amount, check any combination of instrument types, and pick a risk profile
        yourself — this tool splits your amount using simple, disclosed rules. It does not know
        your goals, age, taxes, or existing holdings, and it never picks a &ldquo;best&rdquo;
        mutual fund or ETF scheme for you.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <DisclaimerBanner />
        <div className="rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning">
          This performs arithmetic on presets you choose — it is not an assessment of your
          financial situation. Mutual fund and ETF categories show real, current example scheme
          names from public AMFI data, never ranked by past performance. Always check the
          fund&apos;s own factsheet before investing, and note that ETFs are bought and sold on
          the exchange like a stock, not through a fund house application.
        </div>
      </div>

      <form
        method="GET"
        className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      >
        <input type="hidden" name="submitted" value="1" />

        <div className="flex flex-wrap items-end gap-4">
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
              className="w-44 rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Risk profile</span>
            <select
              name="profile"
              defaultValue={profile}
              className="w-40 rounded-lg border border-border bg-background px-3 py-2"
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
        </div>

        <div>
          <p className="text-sm text-muted">Invest in (check any combination)</p>
          <div className="mt-2 flex flex-wrap gap-4">
            {INSTRUMENT_TYPE_ORDER.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="type"
                  value={t}
                  defaultChecked={selectedTypes.includes(t)}
                  className="h-4 w-4 rounded border-border"
                />
                {TYPE_LABELS[t]}
              </label>
            ))}
          </div>
        </div>
      </form>

      {selectedTypes.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          {selectedTypes.length === 1
            ? `Risk profile only affects the equity/debt split within ${TYPE_LABELS[selectedTypes[0]]}.`
            : "The risk profile decides both the split across what you checked and the equity/debt split within Mutual Funds and ETFs. Checking fewer types renormalizes their relative weights — it doesn't change their ratio to each other."}
        </p>
      )}

      {invalidAmount && (
        <p className="mt-3 text-sm text-danger">Enter a valid amount greater than zero.</p>
      )}
      {noneSelected && (
        <p className="mt-3 text-sm text-danger">Check at least one instrument type.</p>
      )}

      {amount && !noneSelected && (
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
            }
          >
            <Results amount={amount} profile={profile} selectedTypes={selectedTypes} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
