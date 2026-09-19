# Tech Stack — NSE Compass

## Core framework

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Server Components by default; pages stream via `Suspense`, data-fetching lives in async server components — no client-side data-fetching library needed. |
| Language | **TypeScript 5** | Strict mode. Shared domain types live in `lib/types.ts` (e.g. `Candidate`, `MutualFundScheme`, `FundCategoryDefinition`). |
| UI runtime | **React 19** | Almost entirely Server Components; the handful of client components (`Navbar`, `ModeContext`, `ThemeToggle`, `CandidateTable`, `PriceChart`, `RefreshBar`) are the interactive exceptions. |
| Styling | **Tailwind CSS v4** | Design tokens (colors, fonts) defined via CSS variables in `app/globals.css` and wired into Tailwind's `@theme inline`. Dark mode is a `data-theme` attribute + `@custom-variant`, not the OS media query. |

## Data sources (all live, no local dataset)

| Source | Used for | How it's accessed |
|---|---|---|
| **Yahoo Finance** | NSE stock OHLCV history, NIFTY 50 index quote | `yahoo-finance2` npm client (`lib/yahoo.ts`) — unofficial but widely used; no API key. |
| **AMFI** (`amfiindia.com/spages/NAVAll.txt`) | Mutual fund & ETF scheme names, categories, NAV | Plain `fetch()` + a hand-written parser (`lib/mutualFunds.ts`) — no client library exists for this, so the raw semicolon-delimited text format is parsed directly. |

Both integrations follow the same rule: **a failed fetch renders an explicit error, never mock or stale data.** See `lib/attempt.ts` and the `ApiResult`/error-banner pattern used throughout `app/`.

## Persistence

| Choice | Used for |
|---|---|
| **Postgres via Neon** (`@neondatabase/serverless`) | The only stateful part of the app — `/track-record`'s daily snapshot log (`lib/trackRecordDb.ts`). Everything else is computed live on each request from Yahoo/AMFI, with a short in-memory cache (`lib/cache.ts`), and holds no database. |

## Domain logic (all pure, all unit-tested)

- `lib/indicators.ts` — SMA, RSI, ATR, 52-week range, rate-of-change (technical indicator math)
- `lib/scoring.ts` — the trend/momentum/volume/52-week-range weighted scoring formula behind stock signals
- `lib/allocation.ts` — the `/diversify` allocation engine (instrument-type + risk-profile + fund-mix logic)
- `lib/trackRecord.ts` — forward-return pairing and per-signal performance summary

These have no I/O and are exercised directly by **Vitest** (`*.test.ts` next to each module) — 84 tests as of this writing, covering indicator math, the scoring engine, the cache's TTL/coalescing behavior, the AMFI parser (against a fixed sample mirroring the real file), and the allocation engine's rounding/weighting.

## Tooling

| Tool | Purpose |
|---|---|
| **ESLint 9** + `eslint-config-next` | Linting, including the React Compiler-aware hooks rules bundled with recent Next.js. |
| **Vitest 5** | Unit tests, run with `npm test`. |
| **npm** | Package manager (no yarn/pnpm lockfile). |

## Deployment

- **Vercel** — the app is deployed straight from the GitHub repo (`vamsimunnangi23/nse-compass`), auto-detected as Next.js, zero build config.
- **Vercel Cron** (`vercel.json`) — triggers `/api/cron/snapshot` on weekdays after the NSE session closes, which is what populates the Track Record database. Protected by a `CRON_SECRET` environment variable.
- Every data-fetching route/page sets `maxDuration = 60` to give a cold cache (fetching ~50 stocks + the AMFI file) enough headroom on Vercel's serverless functions.

## What's deliberately *not* here

- No database ORM (Prisma/Drizzle) — the one table (`daily_snapshots`) is managed with hand-written SQL via the Neon client; not enough schema complexity to justify an ORM.
- No client-side data-fetching library (React Query/SWR) — Server Components fetch data directly; the few interactive bits (sorting, theme, mode) are plain `useState`.
- No component library (MUI/shadcn) — every component in `components/` is hand-built with Tailwind utility classes.
- No mutual-fund/ETF ranking model — by design (see `/methodology`); only category-level allocation with disclosed weights.
