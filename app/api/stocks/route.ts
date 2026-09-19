import { fail, ok } from "@/lib/apiResult";
import { getAllCandidates } from "@/lib/marketData";

export async function GET() {
  try {
    const candidates = await getAllCandidates();
    const bySymbol = [...candidates].sort((a, b) => a.name.localeCompare(b.name));
    return ok(bySymbol);
  } catch (err) {
    return fail(err);
  }
}
