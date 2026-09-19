import { cached } from "./cache";
import type { MutualFundScheme } from "./types";

const AMFI_NAV_URL = "https://www.amfiindia.com/spages/NAVAll.txt";
const STALE_AFTER_DAYS = 10;
const TTL = 24 * 60 * 60 * 1000; // AMFI publishes once daily

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function parseAmfiDate(raw: string): Date | null {
  // AMFI date format: "18-Sep-2026"
  const match = raw.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const month = MONTHS[match[2]];
  if (month === undefined) return null;
  return new Date(Date.UTC(Number(match[3]), month, Number(match[1])));
}

const SECTION_HEADER = /^(Open Ended Schemes|Close Ended Schemes|Interval Fund Schemes)\((.+)\)$/;

/**
 * Parses AMFI's NAVAll.txt into usable schemes: Open Ended only (Close
 * Ended / Interval funds aren't purchasable anytime), Direct plan, Growth
 * option only (excludes every IDCW/dividend variant), and a recent NAV date
 * (the file mixes in stale/inactive scheme rows alongside live ones).
 *
 * Pure and network-free so it can be unit tested against a fixed sample —
 * see lib/mutualFunds.test.ts.
 */
export function parseNavAllText(text: string, now: Date = new Date()): MutualFundScheme[] {
  const schemes: MutualFundScheme[] = [];
  let currentCategory = "";
  let currentAmc = "";
  let inOpenEnded = false;

  const staleCutoff = now.getTime() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const sectionMatch = line.match(SECTION_HEADER);
    if (sectionMatch) {
      inOpenEnded = sectionMatch[1] === "Open Ended Schemes";
      currentCategory = sectionMatch[2];
      currentAmc = "";
      continue;
    }

    if (!inOpenEnded) continue;

    const fields = line.split(";").map((f) => f.trim());
    if (fields.length !== 8 || !/^\d+$/.test(fields[0])) {
      // Not a data row within an Open Ended section -> an AMC name header.
      currentAmc = line;
      continue;
    }

    const [schemeCode, , , schemeName, plan, option, navRaw, dateRaw] = fields;

    if (!plan.toLowerCase().includes("direct")) continue;
    if (!option.toLowerCase().includes("growth")) continue;

    const nav = Number(navRaw);
    if (!Number.isFinite(nav) || nav <= 0) continue;

    const navDate = parseAmfiDate(dateRaw);
    if (!navDate || navDate.getTime() < staleCutoff) continue;

    schemes.push({
      schemeCode,
      name: schemeName,
      amc: currentAmc,
      rawCategory: currentCategory,
      nav,
      navDate: navDate.toISOString(),
    });
  }

  return schemes;
}

async function fetchAllSchemes(): Promise<MutualFundScheme[]> {
  const res = await fetch(AMFI_NAV_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!res.ok) {
    throw new Error(`AMFI returned ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const schemes = parseNavAllText(text);

  if (schemes.length === 0) {
    throw new Error("No mutual fund schemes could be parsed from AMFI data");
  }

  return schemes;
}

export async function getAllSchemes(): Promise<MutualFundScheme[]> {
  return cached("mutual-fund-schemes", TTL, fetchAllSchemes);
}
