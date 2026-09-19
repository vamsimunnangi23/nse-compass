import { NextResponse } from "next/server";
import type { ApiResult } from "./types";

export function ok<T>(data: T) {
  return NextResponse.json({ ok: true, data } satisfies ApiResult<T>);
}

export function fail(error: unknown, status = 502) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json(
    { ok: false, error: `Live data unavailable: ${message}` } satisfies ApiResult<never>,
    { status },
  );
}
