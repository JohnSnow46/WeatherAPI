"use client";

import { useSyncExternalStore } from "react";

export type NotificationPermissionState = "unsupported" | NotificationPermission;

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): NotificationPermissionState {
  return "Notification" in window ? Notification.permission : "unsupported";
}

function getServerSnapshot(): NotificationPermissionState {
  return "unsupported";
}

/**
 * Tracks the browser Notification permission and exposes a function to request it.
 * Reads via `useSyncExternalStore` (not an effect + setState) so the server-rendered
 * "unsupported" snapshot never mismatches the real client-side permission during
 * hydration -- there's no native change event for `Notification.permission`, so
 * `request()` notifies the module-level listener set itself once the prompt resolves.
 */
export function useNotificationPermission(): [NotificationPermissionState, () => void] {
  const permission = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function request(): void {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    Notification.requestPermission()
      .then(() => notifyListeners())
      .catch(() => {
        // Some browsers reject instead of resolving "denied" when requested outside a
        // user gesture or after too many prior denials -- nothing to update.
      });
  }

  return [permission, request];
}
