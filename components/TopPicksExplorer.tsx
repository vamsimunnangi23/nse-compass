"use client";

import { useMemo, useState } from "react";
import type { Candidate, RiskTier } from "@/lib/types";
import { CandidateTable } from "./CandidateTable";

const RISK_OPTIONS: Array<RiskTier | "All"> = ["All", "Low", "Medium", "High"];

export function TopPicksExplorer({ candidates }: { candidates: Candidate[] }) {
  const [sector, setSector] = useState<string>("All");
  const [risk, setRisk] = useState<RiskTier | "All">("All");

  const sectors = useMemo(
    () => ["All", ...Array.from(new Set(candidates.map((c) => c.sector))).sort()],
    [candidates],
  );

  const filtered = useMemo(
    () =>
      candidates.filter(
        (c) =>
          (sector === "All" || c.sector === sector) &&
          (risk === "All" || c.riskTier === risk),
      ),
    [candidates, sector, risk],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted">Sector</span>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-muted">Risk</span>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value as RiskTier | "All")}
            className="rounded-lg border border-border bg-surface px-2 py-1.5"
          >
            {RISK_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <span className="text-muted">
          {filtered.length} of {candidates.length} tracked stocks
        </span>
      </div>

      <CandidateTable candidates={filtered} />
    </div>
  );
}
