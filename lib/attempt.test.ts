import { describe, expect, it } from "vitest";
import { attempt } from "./attempt";

describe("attempt", () => {
  it("returns ok:true with the resolved value on success", async () => {
    const result = await attempt(async () => 42);
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it("returns ok:false with the Error message on rejection", async () => {
    const result = await attempt(async () => {
      throw new Error("network down");
    });
    expect(result).toEqual({ ok: false, error: "network down" });
  });

  it("falls back to a generic message when a non-Error is thrown", async () => {
    const result = await attempt(async () => {
      throw "raw string";
    });
    expect(result).toEqual({ ok: false, error: "Failed to fetch" });
  });
});
