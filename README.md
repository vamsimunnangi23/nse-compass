# NSE Compass

An educational, transparent technical-signal dashboard for a fixed list of
large-cap NSE stocks. Every score comes from a documented, rule-based
formula (see `/methodology` in the app) computed from live Yahoo Finance
data — no mock or fabricated values are ever shown; a failed fetch renders
an explicit error instead.

**This is not investment advice.** See `/methodology` and `/track-record`
in the running app for the full picture, including honest limitations.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run lint    # eslint
npm test        # vitest (indicator math, scoring engine, cache, track record stats)
```

## Track Record setup (optional, for production)

The `/track-record` page reports real, measured forward performance of each
signal (Bullish/Watch/Neutral/Caution) — but it needs a database to
snapshot daily results into, and a scheduled job to capture them. Without
this configured, the page just shows a clear "not set up" message; nothing
fakes data.

1. **Add a database.** In the Vercel dashboard, go to your project's
   **Storage** tab and add a Postgres database (Vercel's Postgres storage is
   backed by Neon). This automatically sets a `DATABASE_URL` (or
   `POSTGRES_URL`) environment variable on your project — no manual
   connection string needed.
2. **Set a cron secret.** Add an environment variable named `CRON_SECRET`
   in your Vercel project settings (Settings → Environment Variables). Any
   long random string works, e.g.:
   ```
   5259424057d0cdcc5bd1d7667a4a51cd8370de5a94bf086f
   ```
   (Generate your own instead of reusing this one — treat it like a
   password.) This is what authorizes the scheduled job to write snapshots;
   without it, the capture endpoint refuses all requests.
3. **Redeploy.** `vercel.json` already defines a daily weekday cron
   (`/api/cron/snapshot`, 10:30 UTC ≈ 4:00 PM IST, after the NSE session
   closes) that Vercel will pick up automatically on the next deploy.
4. **Wait.** The Track Record page needs at least 6 trading sessions of
   captured data before it can show a 5-session-forward comparison. There's
   no way to backfill history — it only starts counting from whenever the
   cron job first runs successfully.

To run the capture manually (e.g. to test locally with a database
configured):

```bash
curl -H "Authorization: Bearer <your CRON_SECRET>" http://localhost:3000/api/cron/snapshot
```

## Deploying

Import this repo at [vercel.com/new](https://vercel.com/new) — Next.js is
auto-detected, no build configuration needed. The core dashboard works with
zero environment variables (Yahoo Finance needs no API key); Track Record
setup above is separate and optional.
