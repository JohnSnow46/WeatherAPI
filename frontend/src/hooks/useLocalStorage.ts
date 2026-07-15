"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getServerSnapshot() {
  return null;
}

// Syncs with localStorage via useSyncExternalStore (the React-sanctioned way
// to read an external store during render, with no SSR/hydration mismatch
// and no synchronous setState-in-effect).
export function useLocalStorage<T>(key: string): readonly [T | null, (next: T | null) => void] {
  const getSnapshot = useCallback(() => window.localStorage.getItem(key), [key]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let value: T | null = null;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = null;
    }
  }

  const setValue = useCallback(
    (next: T | null) => {
      try {
        if (next === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(next));
        }
      } catch {
        // Storage unavailable (private browsing, quota) — ignore.
      }
      // The native "storage" event only fires in *other* tabs. Dispatch it
      // locally too so this tab's useSyncExternalStore subscribers re-render.
      window.dispatchEvent(new StorageEvent("storage"));
    },
    [key],
  );

  return [value, setValue] as const;
}
