"use client";

import { useMemo, useState } from "react";
import type { Candidate } from "@/lib/types";
import { CandidateTable } from "./CandidateTable";

export function StocksExplorer({ candidates }: { candidates: Candidate[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q),
    );
  }, [candidates, query]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, symbol, or sector…"
        className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm"
      />
      <p className="text-sm text-muted">
        {filtered.length} of {candidates.length} tracked stocks
      </p>
      <CandidateTable candidates={filtered} />
    </div>
  );
}
