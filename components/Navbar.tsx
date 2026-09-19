"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMode } from "./ModeContext";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/top-picks", label: "Top Picks" },
  { href: "/stocks", label: "Stocks" },
  { href: "/market", label: "Market" },
  { href: "/diversify", label: "Diversify" },
  { href: "/track-record", label: "Track Record" },
  { href: "/learn", label: "Learn" },
  { href: "/methodology", label: "Methodology" },
];

export function Navbar() {
  const pathname = usePathname();
  const { mode, setMode } = useMode();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
            <path d="M4 20V10M11 20V4M18 20V14" strokeLinecap="round" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">
            NSE <span className="font-serif italic font-normal">Compass</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "font-semibold text-foreground"
                    : "text-muted hover:text-foreground transition-colors"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMode(mode === "Beginner" ? "Advanced" : "Beginner")}
            className="rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface transition-colors"
          >
            {mode}
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-6 py-3 text-sm md:hidden">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-2 py-2 ${
                  active
                    ? "font-semibold text-foreground bg-surface"
                    : "text-muted hover:text-foreground transition-colors"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
