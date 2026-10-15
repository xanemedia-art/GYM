/**
 * Ultra-Short Lived Client Memory Cache
 * Prevents UI flicker on instant tab switching while strictly ensuring LIVE DATA ONLY.
 * No persistent storage (sessionStorage/localStorage) to guarantee zero stale data retention.
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const memoryStore = new Map<string, CacheItem<any>>();

export function getScopedKey(scope: string | undefined, key: string): string {
  return scope ? `${scope}:${key}` : key;
}

/**
 * Retrieves in-memory data if less than maxAgeMs old (default 5 seconds for live accuracy)
 */
export function getClientCache<T>(key: string, maxAgeMs: number = 5000): T | null {
  if (typeof window === "undefined") return null;

  const item = memoryStore.get(key);
  if (item && Date.now() - item.timestamp < maxAgeMs) {
    return item.data as T;
  }

  return null;
}

export function getSwrCache<T>(
  key: string,
  maxAgeMs: number = 5000
): { data: T | null; isFresh: boolean } {
  if (typeof window === "undefined") return { data: null, isFresh: false };

  const item = memoryStore.get(key);
  if (item) {
    const isFresh = Date.now() - item.timestamp < maxAgeMs;
    return { data: item.data as T, isFresh };
  }

  return { data: null, isFresh: false };
}

export function setClientCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  memoryStore.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function clearClientCache(key?: string): void {
  if (typeof window === "undefined") return;

  if (key) {
    memoryStore.delete(key);
  } else {
    memoryStore.clear();
  }
}

export function clearAllCaches(): void {
  clearClientCache();
}
