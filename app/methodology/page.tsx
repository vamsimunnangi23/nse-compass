import Link from "next/link";
import { MAX_STOCKS, MAX_STOCKS_PER_SECTOR, RISK_PROFILES } from "@/lib/allocation";
import type { RiskProfileName } from "@/lib/allocation";
import { DEBT_FUND_CATEGORIES, EQUITY_FUND_CATEGORIES } from "@/lib/fundCategories";
import {
  MARKET_HEADWIND_PENALTY,
  RISK_THRESHOLDS,
  SCORE_WEIGHTS,
  SIGNAL_THRESHOLDS,
  YEAR_RANGE_THRESHOLDS,
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
          Each stock gets a 0–100 score from four weighted sub-scores:
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
          <li>
            <span className="font-semibold text-foreground">
              52-week range — {Math.round(SCORE_WEIGHTS.yearRange * 100)}%
            </span>{" "}
            of the score: how close the price is to its 52-week high vs. low.
            Within {YEAR_RANGE_THRESHOLDS.nearHighPercent}% of the high scores
            highest; within {YEAR_RANGE_THRESHOLDS.nearLowPercent}% of the low
            scores lowest.
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
        <h2 className="text-xl font-semibold">Diversification tool</h2>
        <p className="mt-2 text-muted">
          The{" "}
          <Link href="/diversify" className="text-accent hover:underline">
            Diversify
          </Link>{" "}
          page splits an amount you enter across Stocks, Equity Funds, and
          Debt Funds using a risk profile <em>you</em> pick — the app never
          infers your risk tolerance, goals, age, or tax situation:
        </p>
        <ul className="mt-3 flex flex-col gap-1 text-muted">
          {(Object.keys(RISK_PROFILES) as RiskProfileName[]).map((name) => {
            const weights = RISK_PROFILES[name];
            return (
              <li key={name}>
                <span className="font-semibold text-foreground">{name}</span> —{" "}
                {weights.stocksPercent}% stocks / {weights.equityFundsPercent}% equity funds /{" "}
                {weights.debtFundsPercent}% debt funds
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-muted">
          The stocks bucket is split equally across the top {MAX_STOCKS} tracked
          stocks scoring Watch or better, capped at {MAX_STOCKS_PER_SECTOR} per
          sector so picks aren&apos;t clustered in one industry. The fund
          buckets are split equally across a curated set of categories
          (Equity: {EQUITY_FUND_CATEGORIES.map((c) => c.label).join(", ")};
          Debt: {DEBT_FUND_CATEGORIES.map((c) => c.label).join(", ")}), each
          showing a few real Direct-Growth scheme names from India&apos;s
          public AMFI data as examples — <strong>never ranked or picked as
          &ldquo;best,&rdquo;</strong> since past fund returns are weak evidence
          and picking individual schemes edges into regulated investment-advisory
          territory this app doesn&apos;t claim to offer.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Limits</h2>
        <p className="mt-2 text-muted">
          This is a technical screener over a fixed list of large-cap NSE
          stocks — it does not read news, fundamentals, or order-book depth,
          and a high score describes favorable historical conditions, not a
          prediction. This formula was designed from common technical-analysis
          conventions, not backtested or reviewed by a financial professional.
          Treat it as one input among many, not a recommendation.
        </p>
        <p className="mt-3 text-muted">
          Don&apos;t just take our word for whether these signals mean
          anything —{" "}
          <Link href="/track-record" className="text-accent hover:underline">
            see the Track Record
          </Link>{" "}
          for measured, real forward performance of each signal over time.
        </p>
      </section>
    </div>
  );
}
