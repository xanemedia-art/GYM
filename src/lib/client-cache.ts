/**
 * Client-Side Memory Cache with Stale-While-Revalidate (SWR) Semantics
 * Eliminates blank screens and loading spinners when switching between menus.
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const memoryStore = new Map<string, CacheItem<any>>();

export function getClientCache<T>(key: string, maxAgeMs: number = 60000): T | null {
  if (typeof window === "undefined") return null;
  const item = memoryStore.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > maxAgeMs) {
    return null;
  }
  return item.data as T;
}

export function setClientCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  memoryStore.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function clearClientCache(key?: string): void {
  if (key) {
    memoryStore.delete(key);
  } else {
    memoryStore.clear();
  }
}
