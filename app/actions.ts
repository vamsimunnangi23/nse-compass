"use server";

import { invalidateMarketCache } from "@/lib/marketData";

export async function refreshMarketData(symbol?: string) {
  invalidateMarketCache(symbol);
}
