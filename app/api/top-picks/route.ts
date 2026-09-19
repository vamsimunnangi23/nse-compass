import { fail, ok } from "@/lib/apiResult";
import { getAllCandidates } from "@/lib/marketData";

export const maxDuration = 60;

export async function GET() {
  try {
    const candidates = await getAllCandidates();
    return ok(candidates);
  } catch (err) {
    return fail(err);
  }
}
