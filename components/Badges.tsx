import type { RiskTier, Signal } from "@/lib/types";

const SIGNAL_STYLES: Record<Signal, string> = {
  Bullish: "bg-accent-soft text-accent border-accent/30",
  Watch: "bg-accent-soft text-accent border-accent/30",
  Neutral: "bg-black/5 text-muted border-border dark:bg-white/5",
  Caution: "bg-danger-bg text-danger border-danger-border",
};

export function SignalBadge({ signal }: { signal: Signal }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SIGNAL_STYLES[signal]}`}
    >
      {signal}
    </span>
  );
}

const RISK_STYLES: Record<RiskTier, string> = {
  Low: "bg-accent-soft text-accent border-accent/30",
  Medium: "bg-warning-bg text-warning border-warning-border",
  High: "bg-danger-bg text-danger border-danger-border",
};

export function RiskBadge({ risk }: { risk: RiskTier }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RISK_STYLES[risk]}`}
    >
      {risk} risk
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-foreground text-background px-2.5 py-0.5 text-xs font-bold tabular-nums">
      {score}
    </span>
  );
}
