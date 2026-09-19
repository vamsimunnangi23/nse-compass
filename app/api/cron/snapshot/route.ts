import { NextResponse } from "next/server";
import { getAllCandidates } from "@/lib/marketData";
import { insertSnapshots } from "@/lib/trackRecordDb";

export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const candidates = await getAllCandidates();
    const captured = await insertSnapshots(candidates);
    return NextResponse.json({ ok: true, captured });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
