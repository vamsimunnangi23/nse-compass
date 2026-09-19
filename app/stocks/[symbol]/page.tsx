import Link from "next/link";
import { notFound } from "next/navigation";
import { RiskBadge, ScoreBadge, SignalBadge } from "@/components/Badges";
import { ErrorBanner } from "@/components/Banners";
import { PriceChart } from "@/components/PriceChart";
import { StockFreshness } from "@/components/StockFreshness";
import { attempt } from "@/lib/attempt";
import { getCandidate, getStockBars } from "@/lib/marketData";

export const revalidate = 0;
export const maxDuration = 60;

function toYahooSymbol(raw: string): string {
  const upper = decodeURIComponent(raw).toUpperCase();
  return upper.endsWith(".NS") ? upper : `${upper}.NS`;
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: rawSymbol } = await params;
  const symbol = toYahooSymbol(rawSymbol);

  const result = await attempt(() =>
    Promise.all([getCandidate(symbol), getStockBars(symbol)]),
  );

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <ErrorBanner message={result.error} />
      </div>
    );
  }

  const [candidate, bars] = result.data;
  if (!candidate) notFound();

  const positive = candidate.changePercent >= 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/stocks" className="text-sm text-muted hover:text-foreground">
          &lsaquo; Back to Stocks
        </Link>
        <StockFreshness symbol={candidate.symbol} />
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">{candidate.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {candidate.symbol} &middot; {candidate.sector}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">
            {candidate.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </p>
          <p
            className={`text-sm font-medium tabular-nums ${positive ? "text-accent" : "text-danger"}`}
          >
            {positive ? "+" : ""}
            {candidate.changePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SignalBadge signal={candidate.signal} />
        <RiskBadge risk={candidate.riskTier} />
        <ScoreBadge score={candidate.score} />
        <span className="text-xs text-muted">
          As of {new Date(candidate.asOf).toLocaleDateString("en-IN")}
        </span>
      </div>

      <div className="mt-6">
        <PriceChart bars={bars.slice(-90)} name={candidate.name} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="SMA 20" value={candidate.indicators.sma20.toFixed(2)} />
        <Stat label="SMA 50" value={candidate.indicators.sma50.toFixed(2)} />
        <Stat label="RSI (14)" value={candidate.indicators.rsi14.toFixed(0)} />
        <Stat
          label="Vol vs 20d avg"
          value={`${candidate.indicators.volumeRatio.toFixed(2)}x`}
        />
        <Stat
          label="10-session change"
          value={`${candidate.indicators.roc10.toFixed(1)}%`}
        />
        <Stat
          label="ATR (14)"
          value={`${candidate.indicators.atrPercent.toFixed(1)}% of price`}
        />
        <Stat
          label="52-week high"
          value={candidate.indicators.week52High.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
          })}
        />
        <Stat
          label="52-week low"
          value={candidate.indicators.week52Low.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
          })}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Why this signal</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {candidate.reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {reason}
            </li>
          ))}
        </ul>
        <Link
          href="/methodology"
          className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          How this score is calculated &rsaquo;
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
