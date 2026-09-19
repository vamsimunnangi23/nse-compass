import { Suspense } from "react";
import { attempt } from "@/lib/attempt";
import { getAllCandidates, getMarketDataFetchedAt } from "@/lib/marketData";
import { RefreshBar } from "./RefreshBar";

async function Loader() {
  await attempt(getAllCandidates);
  return <RefreshBar updatedAt={getMarketDataFetchedAt()} />;
}

export function MarketFreshness() {
  return (
    <Suspense fallback={<RefreshBar updatedAt={undefined} />}>
      <Loader />
    </Suspense>
  );
}
