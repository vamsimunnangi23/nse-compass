"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { refreshMarketData } from "@/app/actions";

export function RefreshBar({
  updatedAt,
  symbol,
}: {
  updatedAt: number | undefined;
  symbol?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    // Formats in the viewer's local time zone after mount, so the server
    // (which may be in a different zone) and the first client render match.
    const next = updatedAt
      ? new Date(updatedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(next);
  }, [updatedAt]);

  function handleRefresh() {
    startTransition(async () => {
      await refreshMarketData(symbol);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-60"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isPending ? "animate-spin" : undefined}
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
        {isPending ? "Refreshing…" : "Refresh"}
      </button>
      <span suppressHydrationWarning>{label ? `Updated ${label}` : " "}</span>
    </div>
  );
}
