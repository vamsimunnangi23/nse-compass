import { describe, expect, it } from "vitest";
import { parseNavAllText } from "./mutualFunds";

// Mirrors the real AMFI NAVAll.txt structure I fetched and inspected while
// planning this feature: a header row, "Open Ended Schemes(<category>)" /
// "Close Ended Schemes(<category>)" section headers, AMC name lines (plain
// text, no semicolons), and single-space separator lines between blocks.
const SAMPLE = `Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Plan;Option;Net Asset Value;Date

Open Ended Schemes(Equity Scheme - Large Cap Fund)

Axis Mutual Fund

100001;INF001;-;Axis Bluechip Fund;Direct Plan;Growth Option;55.1234;18-Sep-2026
100002;INF002;-;Axis Bluechip Fund;Direct Plan;IDCW Option;30.0000;18-Sep-2026
100003;INF003;-;Axis Bluechip Fund;Regular Plan;Growth Option;50.0000;18-Sep-2026
100004;INF004;-;Axis Bluechip Fund;Regular Plan;IDCW Option;28.0000;18-Sep-2026

HDFC Mutual Fund

100005;INF005;-;HDFC Large Cap Fund;Direct Plan;Growth;900.5000;18-Sep-2026
100006;INF006;-;HDFC Large Cap Fund;Direct Plan;Growth;NA;18-Sep-2026
100007;INF007;-;HDFC Large Cap Fund;Direct Plan;Growth;850.0000;01-Aug-2026

Open Ended Schemes(Debt Scheme - Liquid Fund)

ICICI Prudential Mutual Fund

100008;INF008;-;ICICI Prudential Liquid Fund;Direct Plan;Growth;350.1200;18-Sep-2026

Close Ended Schemes(Income)

Some Fund House

100009;INF009;-;Some Closed Term Plan;Direct Plan;Growth;10.0000;18-Sep-2026
`;

const NOW = new Date("2026-09-19T00:00:00.000Z");

describe("parseNavAllText", () => {
  it("includes only Direct plan + Growth option rows", () => {
    const schemes = parseNavAllText(SAMPLE, NOW);
    const names = schemes.map((s) => `${s.name}|${s.nav}`);

    expect(names).toContain("Axis Bluechip Fund|55.1234");
    // Regular plan and IDCW option variants must be excluded
    expect(schemes.some((s) => s.nav === 30)).toBe(false);
    expect(schemes.some((s) => s.nav === 50)).toBe(false);
    expect(schemes.some((s) => s.nav === 28)).toBe(false);
  });

  it("excludes rows with a non-numeric NAV", () => {
    const schemes = parseNavAllText(SAMPLE, NOW);
    expect(schemes.some((s) => s.name === "HDFC Large Cap Fund" && s.nav === 900.5)).toBe(true);
    // The "NA" NAV row for the same fund must not appear
    expect(schemes.filter((s) => s.name === "HDFC Large Cap Fund")).toHaveLength(1);
  });

  it("excludes rows with a stale NAV date (older than 10 days)", () => {
    const schemes = parseNavAllText(SAMPLE, NOW);
    // 01-Aug-2026 is well over 10 days before the reference date
    expect(schemes.some((s) => s.nav === 850)).toBe(false);
  });

  it("excludes Close Ended and Interval Fund sections entirely", () => {
    const schemes = parseNavAllText(SAMPLE, NOW);
    expect(schemes.some((s) => s.name === "Some Closed Term Plan")).toBe(false);
  });

  it("tags each scheme with its section category and the most recent AMC header", () => {
    const schemes = parseNavAllText(SAMPLE, NOW);
    const axis = schemes.find((s) => s.name === "Axis Bluechip Fund")!;
    expect(axis.amc).toBe("Axis Mutual Fund");
    expect(axis.rawCategory).toBe("Equity Scheme - Large Cap Fund");

    const hdfc = schemes.find((s) => s.name === "HDFC Large Cap Fund")!;
    expect(hdfc.amc).toBe("HDFC Mutual Fund");

    const icici = schemes.find((s) => s.name === "ICICI Prudential Liquid Fund")!;
    expect(icici.rawCategory).toBe("Debt Scheme - Liquid Fund");
    expect(icici.amc).toBe("ICICI Prudential Mutual Fund");
  });

  it("returns an empty array for empty or unrecognized input without throwing", () => {
    expect(parseNavAllText("", NOW)).toEqual([]);
    expect(parseNavAllText("garbage\nmore garbage\n", NOW)).toEqual([]);
  });
});
