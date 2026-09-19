import { fail, ok } from "@/lib/apiResult";
import { getMarketSnapshot } from "@/lib/marketData";

export async function GET() {
  try {
    const snapshot = await getMarketSnapshot();
    return ok(snapshot);
  } catch (err) {
    return fail(err);
  }
}
