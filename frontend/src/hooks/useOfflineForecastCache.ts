"use client";

import { useEffect } from "react";

type CachedEntry<T> = { data: T; cachedAt: string };

const STORAGE_PREFIX = "weathermap:offline-cache";

function storageKey(kind: string, cacheKey: string): string {
  return `${STORAGE_PREFIX}:${kind}:${cacheKey}`;
}

function readCache<T>(kind: string, cacheKey: string): CachedEntry<T> | null {
  try {
    const raw = window.localStorage.getItem(storageKey(kind, cacheKey));
    return raw ? (JSON.parse(raw) as CachedEntry<T>) : null;
  } catch {
    // Storage unavailable (private browsing, quota) or corrupted JSON — no fallback available.
    return null;
  }
}

function writeCache<T>(kind: string, cacheKey: string, data: T): void {
  try {
    const entry: CachedEntry<T> = { data, cachedAt: new Date().toISOString() };
    window.localStorage.setItem(storageKey(kind, cacheKey), JSON.stringify(entry));
  } catch {
    // Storage unavailable (private browsing, quota) — offline fallback just won't have anything to fall back to.
  }
}

/**
 * Persists a successful query result to localStorage as it arrives, and —
 * only once the live query has failed and returned nothing itself —
 * returns the last cached snapshot for the same key, so the UI can show
 * *something* (with a "stale data" notice) instead of just an error, e.g.
 * when offline or the backend is cold-starting (Render free tier spin-down).
 */
export function useOfflineFallback<T>(
  kind: string,
  cacheKey: string,
  data: T | undefined,
  isError: boolean,
): CachedEntry<T> | null {
  useEffect(() => {
    if (data !== undefined) {
      writeCache(kind, cacheKey, data);
    }
  }, [kind, cacheKey, data]);

  return isError && data === undefined ? readCache<T>(kind, cacheKey) : null;
}

// Rounded to ~1.1km precision — coarser than the raw coordinates so tiny
// float drift (e.g. re-deriving from a map click) doesn't fragment the cache.
export function locationCacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}
