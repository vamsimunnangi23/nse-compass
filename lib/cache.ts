interface CacheEntry<T> {
  value: T;
  fetchedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * In-memory, per-server-process cache. Fine for a single-instance deployment;
 * a multi-instance deployment would need a shared cache (e.g. Redis) instead.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing && Date.now() - existing.fetchedAt < ttlMs) {
    return existing.value;
  }

  // Coalesce concurrent misses (e.g. several page sections reading the same
  // key right after a cache invalidation) into a single upstream fetch.
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = fetcher()
    .then((value) => {
      store.set(key, { value, fetchedAt: Date.now() });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export function invalidate(key: string): void {
  store.delete(key);
}

export function invalidateByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function getFetchedAt(key: string): number | undefined {
  return store.get(key)?.fetchedAt;
}

export const TTL = {
  index: 15 * 60 * 1000, // 15 minutes
  candidates: 15 * 60 * 1000,
  stockDetail: 15 * 60 * 1000,
};
