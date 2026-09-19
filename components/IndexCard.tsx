import type { IndexSnapshot } from "@/lib/types";

export function IndexCard({ snapshot }: { snapshot: IndexSnapshot }) {
  const positive = snapshot.change >= 0;
  return (
    <div className="w-full rounded-xl border border-border bg-surface p-5 shadow-sm sm:w-72">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {snapshot.name}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {snapshot.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </p>
      <p
        className={`mt-1 text-sm font-medium tabular-nums ${positive ? "text-accent" : "text-danger"}`}
      >
        {positive ? "+" : ""}
        {snapshot.change.toFixed(2)} ({positive ? "+" : ""}
        {snapshot.changePercent.toFixed(2)}%)
      </p>
      <p className="mt-2 text-xs text-muted">{snapshot.sessionLabel}</p>
    </div>
  );
}

export function IndexCardSkeleton() {
  return (
    <div className="w-full rounded-xl border border-border bg-surface p-5 shadow-sm sm:w-72">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        NIFTY 50
      </p>
      <p className="mt-1 text-2xl font-bold text-muted">Loading…</p>
      <p className="mt-2 text-xs text-accent">Latest completed session</p>
    </div>
  );
}

export function IndexCardError({ message }: { message: string }) {
  return (
    <div className="w-full rounded-xl border border-danger-border bg-surface p-5 shadow-sm sm:w-72">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        NIFTY 50
      </p>
      <p className="mt-1 text-lg font-semibold text-danger">Unavailable</p>
      <p className="mt-2 text-xs text-muted">{message}</p>
    </div>
  );
}
