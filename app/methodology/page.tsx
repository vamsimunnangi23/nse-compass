import Link from "next/link";
import { FUND_MIX_OPTIONS, MAX_STOCKS, MAX_STOCKS_PER_SECTOR, RISK_PROFILES } from "@/lib/allocation";
import type { RiskProfileName } from "@/lib/allocation";
import {
  DEBT_ETF_CATEGORIES,
  DEBT_FUND_CATEGORIES,
  EQUITY_ETF_CATEGORIES,
  EQUITY_FUND_CATEGORIES,
} from "@/lib/fundCategories";
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
          page splits an amount you enter across whichever instrument types
          you check — Stocks, Mutual Funds, ETFs, any two of them, or all
          three. A risk profile <em>you</em> pick decides the split; the app
          never infers your risk tolerance, goals, age, or tax situation.
        </p>
        <p className="mt-3 text-muted">
          Each profile defines a baseline weight for all three types. When
          you check all three, the split matches those weights exactly; when
          you check fewer, the weights of just the checked types are
          renormalized to sum to 100% — so, for example, checking only
          Stocks and Mutual Funds keeps their relative ratio to each other
          the same as it would be in the full mix, it just excludes ETFs
          rather than silently changing how Stocks and Mutual Funds compare:
        </p>
        <ul className="mt-3 flex flex-col gap-1 text-muted">
          {(Object.keys(RISK_PROFILES) as RiskProfileName[]).map((name) => {
            const weights = RISK_PROFILES[name];
            return (
              <li key={name}>
                <span className="font-semibold text-foreground">{name}</span> —{" "}
                {weights.stocksPercent}% stocks / {weights.mutualFundsPercent}% mutual funds /{" "}
                {weights.etfPercent}% ETFs
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-muted">
          By default, the same profile also decides the equity/debt split{" "}
          <em>within</em> the Mutual Funds and ETF buckets, whether or not
          the other instrument types are also checked — e.g. Balanced puts{" "}
          {RISK_PROFILES.Balanced.equityShareWithinFunds}% of that money into
          equity-type categories and the rest into debt-type categories. You
          can override this directly with the &ldquo;Within Mutual Funds &amp;
          ETFs, favor&rdquo; choice:
        </p>
        <ul className="mt-3 flex flex-col gap-1 text-muted">
          {FUND_MIX_OPTIONS.map((o) => (
            <li key={o.value}>
              <span className="font-semibold text-foreground">{o.label}</span> —{" "}
              {o.description}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-muted">
          The stocks bucket is split equally across the top {MAX_STOCKS} tracked
          stocks scoring Watch or better, capped at {MAX_STOCKS_PER_SECTOR} per
          sector so picks aren&apos;t clustered in one industry.
        </p>
        <p className="mt-3 text-muted">
          The fund and ETF buckets are split across a curated set of
          categories — not equally, but by a per-category weight that shifts
          with your risk profile (more stable categories get a bigger share
          under Conservative; more volatile, higher-growth-potential ones get
          a bigger share under Aggressive). Each category also shows a few
          real current scheme names from India&apos;s public AMFI data as
          examples — <strong>never ranked or picked as &ldquo;best,&rdquo;</strong>{" "}
          since past fund returns are weak evidence and picking individual
          schemes edges into regulated investment-advisory territory this
          app doesn&apos;t claim to offer.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[420px] text-left text-sm text-muted">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide">
                <th className="px-3 py-2 font-medium">Equity fund category</th>
                <th className="px-3 py-2 font-medium">Conservative</th>
                <th className="px-3 py-2 font-medium">Balanced</th>
                <th className="px-3 py-2 font-medium">Aggressive</th>
              </tr>
            </thead>
            <tbody>
              {EQUITY_FUND_CATEGORIES.map((c) => (
                <tr key={c.label} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium text-foreground">{c.label}</td>
                  <td className="px-3 py-2">{c.riskWeights.Conservative}%</td>
                  <td className="px-3 py-2">{c.riskWeights.Balanced}%</td>
                  <td className="px-3 py-2">{c.riskWeights.Aggressive}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[420px] text-left text-sm text-muted">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide">
                <th className="px-3 py-2 font-medium">Debt fund category</th>
                <th className="px-3 py-2 font-medium">Conservative</th>
                <th className="px-3 py-2 font-medium">Balanced</th>
                <th className="px-3 py-2 font-medium">Aggressive</th>
              </tr>
            </thead>
            <tbody>
              {DEBT_FUND_CATEGORIES.map((c) => (
                <tr key={c.label} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium text-foreground">{c.label}</td>
                  <td className="px-3 py-2">{c.riskWeights.Conservative}%</td>
                  <td className="px-3 py-2">{c.riskWeights.Balanced}%</td>
                  <td className="px-3 py-2">{c.riskWeights.Aggressive}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-muted">
          ETF categories follow the same idea: {EQUITY_ETF_CATEGORIES[0].label}{" "}
          is the only equity ETF category tracked, so it always gets the
          whole equity ETF share; between the debt ETF categories,{" "}
          {DEBT_ETF_CATEGORIES[0].label} gets{" "}
          {DEBT_ETF_CATEGORIES[0].riskWeights.Conservative}% under
          Conservative down to {DEBT_ETF_CATEGORIES[0].riskWeights.Aggressive}%
          under Aggressive, with {DEBT_ETF_CATEGORIES[1].label} taking the
          rest.
        </p>
        <p className="mt-3 text-muted">
          One factual note: ETFs are bought and sold on the exchange like a
          stock (via a demat account), not through a fund house application
          the way traditional mutual funds are — which is also why AMFI&apos;s
          data has no Direct/Regular plan distinction for them.
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
