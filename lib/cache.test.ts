import { describe, expect, it, vi } from "vitest";
import { cached, getFetchedAt, invalidate, invalidateByPrefix } from "./cache";

function uniqueKey(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

describe("cached", () => {
  it("returns the fetched value and reuses it within the TTL window", async () => {
    const key = uniqueKey("ttl");
    const fetcher = vi.fn().mockResolvedValue("first");

    expect(await cached(key, 1000, fetcher)).toBe("first");
    expect(await cached(key, 1000, fetcher)).toBe("first");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("refetches once the TTL has elapsed", async () => {
    const key = uniqueKey("ttl-expiry");
    const fetcher = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");

    expect(await cached(key, 10, fetcher)).toBe("first");
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(await cached(key, 10, fetcher)).toBe("second");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent misses into a single upstream fetch", async () => {
    const key = uniqueKey("coalesce");
    let calls = 0;
    const fetcher = vi.fn(async () => {
      calls++;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return "value";
    });

    const results = await Promise.all([
      cached(key, 1000, fetcher),
      cached(key, 1000, fetcher),
      cached(key, 1000, fetcher),
    ]);

    expect(results).toEqual(["value", "value", "value"]);
    expect(calls).toBe(1);
  });

  it("does not cache a rejected fetch, so the next call retries", async () => {
    const key = uniqueKey("reject");
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("recovered");

    await expect(cached(key, 1000, fetcher)).rejects.toThrow("boom");
    expect(await cached(key, 1000, fetcher)).toBe("recovered");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe("invalidate", () => {
  it("forces the next read to refetch", async () => {
    const key = uniqueKey("invalidate");
    const fetcher = vi.fn().mockResolvedValueOnce("a").mockResolvedValueOnce("b");

    expect(await cached(key, 10_000, fetcher)).toBe("a");
    invalidate(key);
    expect(await cached(key, 10_000, fetcher)).toBe("b");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe("invalidateByPrefix", () => {
  it("only clears keys matching the prefix", async () => {
    const prefix = uniqueKey("bars");
    const keyA = `${prefix}:AAA`;
    const keyB = `${prefix}:BBB`;
    const other = uniqueKey("other");

    await cached(keyA, 10_000, async () => "a1");
    await cached(keyB, 10_000, async () => "b1");
    await cached(other, 10_000, async () => "o1");

    invalidateByPrefix(`${prefix}:`);

    const fetcherA = vi.fn().mockResolvedValue("a2");
    const fetcherOther = vi.fn().mockResolvedValue("o2");

    expect(await cached(keyA, 10_000, fetcherA)).toBe("a2");
    expect(await cached(other, 10_000, fetcherOther)).toBe("o1");
    expect(fetcherOther).not.toHaveBeenCalled();
  });
});

describe("getFetchedAt", () => {
  it("is undefined for an unknown key, and a real timestamp once cached", async () => {
    const key = uniqueKey("fetched-at");
    expect(getFetchedAt(key)).toBeUndefined();

    const before = Date.now();
    await cached(key, 10_000, async () => "value");
    const after = Date.now();

    const fetchedAt = getFetchedAt(key);
    expect(fetchedAt).toBeGreaterThanOrEqual(before);
    expect(fetchedAt).toBeLessThanOrEqual(after);
  });
});
