import { Suspense } from "react";
import { ErrorBanner } from "@/components/Banners";
import { SignalBadge } from "@/components/Badges";
import { attempt } from "@/lib/attempt";
import { pairForwardReturns, summarizeBySignal } from "@/lib/trackRecord";
import { countDistinctSessions, fetchAllSnapshots } from "@/lib/trackRecordDb";

export const revalidate = 0;
export const maxDuration = 30;
export const metadata = { title: "Track Record — NSE Compass" };

const FORWARD_SESSIONS = 5;
const MIN_SESSIONS_NEEDED = FORWARD_SESSIONS + 1;

async function TrackRecordContent() {
  const sessionsResult = await attempt(countDistinctSessions);
  if (!sessionsResult.ok) {
    return (
      <ErrorBanner
        message={`Track record isn't set up yet — ${sessionsResult.error}`}
      />
    );
  }

  const sessions = sessionsResult.data;
  if (sessions < MIN_SESSIONS_NEEDED) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="font-semibold">Not enough data yet</p>
        <p className="mt-2 text-sm text-muted">
          {sessions === 0
            ? "Tracking hasn't captured a session yet."
            : `Tracking has captured ${sessions} session${sessions === 1 ? "" : "s"} so far.`}{" "}
          Come back once at least {MIN_SESSIONS_NEEDED} trading sessions have been captured to see
          real {FORWARD_SESSIONS}-session-forward performance by signal.
        </p>
      </div>
    );
  }

  const snapshotsResult = await attempt(fetchAllSnapshots);
  if (!snapshotsResult.ok) return <ErrorBanner message={snapshotsResult.error} />;

  const points = pairForwardReturns(snapshotsResult.data, FORWARD_SESSIONS);
  const summary = summarizeBySignal(points);

  if (summary.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
        No signal has {FORWARD_SESSIONS}-session-old paired data yet. Check back soon.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium">Signal</th>
            <th className="px-4 py-3 font-medium">Sample size</th>
            <th className="px-4 py-3 font-medium">Avg {FORWARD_SESSIONS}-session return</th>
            <th className="px-4 py-3 font-medium">Win rate</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((s) => (
            <tr key={s.signal} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <SignalBadge signal={s.signal} />
              </td>
              <td className="px-4 py-3 tabular-nums">{s.sampleSize}</td>
              <td
                className={`px-4 py-3 tabular-nums font-medium ${
                  s.avgReturnPercent >= 0 ? "text-accent" : "text-danger"
                }`}
              >
                {s.avgReturnPercent >= 0 ? "+" : ""}
                {s.avgReturnPercent.toFixed(2)}%
              </td>
              <td className="px-4 py-3 tabular-nums">{s.winRatePercent.toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrackRecordPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-serif text-3xl sm:text-4xl">Track Record</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Real, measured performance — not a claim. Every trading session, this app snapshots its
        own signals; this page compares what it said against what actually happened{" "}
        {FORWARD_SESSIONS} sessions later. If Bullish doesn&apos;t outperform Caution here, don&apos;t
        trust it.
      </p>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
          }
        >
          <TrackRecordContent />
        </Suspense>
      </div>
    </div>
  );
}
