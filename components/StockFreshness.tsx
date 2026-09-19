import { Suspense } from "react";
import { attempt } from "@/lib/attempt";
import { getStockBars, getStockFetchedAt } from "@/lib/marketData";
import { RefreshBar } from "./RefreshBar";

async function Loader({ symbol }: { symbol: string }) {
  await attempt(() => getStockBars(symbol));
  return <RefreshBar updatedAt={getStockFetchedAt(symbol)} symbol={symbol} />;
}

export function StockFreshness({ symbol }: { symbol: string }) {
  return (
    <Suspense fallback={<RefreshBar updatedAt={undefined} symbol={symbol} />}>
      <Loader symbol={symbol} />
    </Suspense>
  );
}
