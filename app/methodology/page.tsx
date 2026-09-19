import {
  MARKET_HEADWIND_PENALTY,
  RISK_THRESHOLDS,
  SCORE_WEIGHTS,
  SIGNAL_THRESHOLDS,
} from "@/lib/scoring";

export const metadata = { title: "Methodology — NSE Compass" };

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-3xl sm:text-4xl">Methodology</h1>
      <p className="mt-2 text-muted">
        Every score on this dashboard comes from the same rule-based formula
        below — nothing hidden, no separate &ldquo;secret sauce.&rdquo;
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Data</h2>
        <p className="mt-2 text-muted">
          Prices and volume come from the latest completed NSE trading
          session via Yahoo Finance. If that data can&apos;t be fetched, the
          dashboard shows an error — it never substitutes mock, cached-stale,
          or estimated numbers.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">The score</h2>
        <p className="mt-2 text-muted">
          Each stock gets a 0–100 score from three weighted sub-scores:
        </p>
        <ul className="mt-3 flex flex-col gap-1 text-muted">
          <li>
            <span className="font-semibold text-foreground">
              Trend — {Math.round(SCORE_WEIGHTS.trend * 100)}%
            </span>{" "}
            of the score: price vs. its 20- and 50-day moving averages.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Momentum — {Math.round(SCORE_WEIGHTS.momentum * 100)}%
            </span>{" "}
            of the score: 14-day RSI and 10-session rate of change.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Volume — {Math.round(SCORE_WEIGHTS.volume * 100)}%
            </span>{" "}
            of the score: latest volume vs. its 20-day average.
          </li>
        </ul>
        <p className="mt-3 text-muted">
          If the NIFTY 50 index itself is in a downtrend, every score is
          reduced by a flat {MARKET_HEADWIND_PENALTY}-point headwind penalty.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Signal labels</h2>
        <ul className="mt-3 flex flex-col gap-1 text-muted">
          <li>
            <span className="font-semibold text-foreground">Bullish</span> —
            score ≥ {SIGNAL_THRESHOLDS.bullish}
          </li>
          <li>
            <span className="font-semibold text-foreground">Watch</span> —
            score ≥ {SIGNAL_THRESHOLDS.watch}
          </li>
          <li>
            <span className="font-semibold text-foreground">Neutral</span> —
            score ≥ {SIGNAL_THRESHOLDS.neutral}
          </li>
          <li>
            <span className="font-semibold text-foreground">Caution</span> —
            below {SIGNAL_THRESHOLDS.neutral}
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Risk tier</h2>
        <p className="mt-2 text-muted">
          Based on 14-day Average True Range (ATR) as a percentage of price:
        </p>
        <ul className="mt-3 flex flex-col gap-1 text-muted">
          <li>
            <span className="font-semibold text-foreground">Low</span> — ATR
            ≤ {RISK_THRESHOLDS.lowMaxAtrPercent}% of price
          </li>
          <li>
            <span className="font-semibold text-foreground">Medium</span> —
            up to {RISK_THRESHOLDS.mediumMaxAtrPercent}% of price
          </li>
          <li>
            <span className="font-semibold text-foreground">High</span> —
            above {RISK_THRESHOLDS.mediumMaxAtrPercent}% of price
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Limits</h2>
        <p className="mt-2 text-muted">
          This is a technical screener over a fixed list of large-cap NSE
          stocks — it does not read news, fundamentals, or order-book depth,
          and a high score describes favorable historical conditions, not a
          prediction. Treat it as one input among many, not a
          recommendation.
        </p>
      </section>
    </div>
  );
}
