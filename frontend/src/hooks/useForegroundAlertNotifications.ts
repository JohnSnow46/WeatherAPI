"use client";

import { useEffect, useRef } from "react";
import type { WeatherAlert } from "@/lib/weatherAlerts";

/**
 * Fires a browser Notification for each alert that becomes active while the tab is open
 * but not the focused/visible one — the in-page banner (WeatherAlertBanner) already
 * covers the foreground case, so this only upgrades the "open in another tab" case
 * (roadmap #13: explicitly foreground/open-tab only, no server-persisted push).
 *
 * Tracks which alert ids have already been notified per location, so the same alert
 * doesn't re-fire on every poll while it's still active, but a genuinely new alert (or
 * the same id recurring at a different location) still does.
 */
export function useForegroundAlertNotifications(
  locationKey: string,
  alerts: readonly WeatherAlert[],
  enabled: boolean,
): void {
  const notifiedRef = useRef<{ locationKey: string; ids: Set<string> }>({ locationKey, ids: new Set() });

  useEffect(() => {
    if (notifiedRef.current.locationKey !== locationKey) {
      notifiedRef.current = { locationKey, ids: new Set() };
    }
  }, [locationKey]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    if (Notification.permission !== "granted") {
      return;
    }
    // The tab must still be open, just not the focused/visible one.
    if (document.visibilityState === "visible" && document.hasFocus()) {
      return;
    }

    for (const alert of alerts) {
      if (notifiedRef.current.ids.has(alert.id)) {
        continue;
      }
      notifiedRef.current.ids.add(alert.id);
      new Notification("WeatherMap alert", { body: alert.message, tag: `${locationKey}:${alert.id}` });
    }
  }, [alerts, enabled, locationKey]);
}
