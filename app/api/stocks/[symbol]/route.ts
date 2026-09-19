import { fail, ok } from "@/lib/apiResult";
import { getCandidate, getStockBars } from "@/lib/marketData";

function toYahooSymbol(raw: string): string {
  const upper = decodeURIComponent(raw).toUpperCase();
  return upper.endsWith(".NS") ? upper : `${upper}.NS`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { symbol: rawSymbol } = await params;
    const symbol = toYahooSymbol(rawSymbol);

    const [candidate, bars] = await Promise.all([
      getCandidate(symbol),
      getStockBars(symbol),
    ]);

    if (!candidate) {
      return fail(new Error(`${symbol} is not in the tracked universe`), 404);
    }

    return ok({ candidate, bars: bars.slice(-90) });
  } catch (err) {
    return fail(err);
  }
}
