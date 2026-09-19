import { neon } from "@neondatabase/serverless";
import type { Candidate } from "./types";
import type { SnapshotRow } from "./trackRecord";

function getSql() {
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "Track record has no database configured (missing DATABASE_URL). See README for setup.",
    );
  }
  return neon(connectionString);
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS daily_snapshots (
        id SERIAL PRIMARY KEY,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        session_date DATE NOT NULL,
        price NUMERIC NOT NULL,
        score INTEGER NOT NULL,
        signal TEXT NOT NULL,
        risk_tier TEXT NOT NULL,
        captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (symbol, session_date)
      )
    `.then(() => undefined);
  }
  return schemaReady;
}

/** Inserts one row per candidate for today's session; safe to re-run (no duplicates). */
export async function insertSnapshots(candidates: Candidate[]): Promise<number> {
  await ensureSchema();
  const sql = getSql();
  let inserted = 0;

  for (const c of candidates) {
    const sessionDate = c.asOf.slice(0, 10);
    await sql`
      INSERT INTO daily_snapshots (symbol, name, session_date, price, score, signal, risk_tier)
      VALUES (${c.symbol}, ${c.name}, ${sessionDate}, ${c.price}, ${c.score}, ${c.signal}, ${c.riskTier})
      ON CONFLICT (symbol, session_date) DO NOTHING
    `;
    inserted++;
  }

  return inserted;
}

export async function countDistinctSessions(): Promise<number> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT COUNT(DISTINCT session_date) AS count FROM daily_snapshots`;
  return Number(rows[0]?.count ?? 0);
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export async function fetchAllSnapshots(): Promise<SnapshotRow[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT symbol, session_date, price, score, signal
    FROM daily_snapshots
    ORDER BY session_date ASC
  `;
  return rows.map((r) => ({
    symbol: r.symbol as string,
    sessionDate: toIsoDate(r.session_date),
    price: Number(r.price),
    score: Number(r.score),
    signal: r.signal as SnapshotRow["signal"],
  }));
}
