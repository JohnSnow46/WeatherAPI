"use client";

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useUnitPreference } from "@/hooks/useUnitPreference";
import type { LocationDto } from "@/lib/api";
import { DEFAULT_LOCATION, isValidSelectedLocation, type SelectedLocation } from "@/lib/location";
import { LocationSearch } from "@/components/LocationSearch";
import { CurrentWeatherCard } from "@/components/CurrentWeatherCard";
import { AirQualityPanel } from "@/components/AirQualityPanel";
import { ForecastPanel } from "@/components/ForecastPanel";
import { FavoriteLocations } from "@/components/FavoriteLocations";
import { FavoritesComparisonGrid } from "@/components/FavoritesComparisonGrid";
import { WeatherAlertBanner } from "@/components/WeatherAlertBanner";

// Leaflet touches `window` at import time, so it can't be prerendered on the
// server even inside a "use client" file — load it client-only.
const WeatherMap = dynamic(() => import("@/components/WeatherMap").then((mod) => mod.WeatherMap), {
  ssr: false,
  loading: () => <p className="text-sm text-ink-secondary">Loading map…</p>,
});

const STORAGE_KEY = "weathermap:selected-location";

// Keeps the region (admin1) that LocationSearch's dropdown already shows -- without it, picking
// "Springfield, Illinois" and "Springfield, Missouri" both stored "Springfield, United States",
// so the two favorites, comparison tiles and the tab title were indistinguishable.
function formatSearchLabel(location: LocationDto): string {
  return [location.name, location.admin1, location.country].filter(Boolean).join(", ");
}

export function WeatherDashboard() {
  const [storedLocation, setSelected] = useLocalStorage<SelectedLocation>(STORAGE_KEY);
  // Guard against a corrupted/malformed stored value (manual tampering, a
  // browser extension, or a future incompatible schema change) reaching
  // Leaflet or the API as garbage — treat it the same as nothing being
  // stored rather than trusting it as-is.
  const selected = storedLocation && isValidSelectedLocation(storedLocation) ? storedLocation : null;
  const geolocation = useGeolocation();
  const [unit, setUnit] = useUnitPreference();
  const hasAppliedDefault = useRef(false);

  // Fall back to a fixed default on first visit (or when the stored value
  // is missing/corrupted) rather than auto-prompting for browser
  // geolocation — asking for that permission the moment the page loads
  // reads as pushy. Reads localStorage directly here (rather than trusting
  // the `selected` value from useLocalStorage) because on the very first
  // client render `selected` can still reflect the SSR-safe `null`
  // snapshot — useSyncExternalStore only resolves the real value a render
  // later. Trusting that transient `null` would overwrite an
  // already-persisted location once this effect runs.
  useEffect(() => {
    if (hasAppliedDefault.current) {
      return;
    }
    let hasValidStoredLocation = false;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      hasValidStoredLocation = raw !== null && isValidSelectedLocation(JSON.parse(raw));
    } catch {
      // Storage unavailable (private browsing, quota, disabled), or the
      // stored value is malformed JSON — fall through to default.
    }
    if (hasValidStoredLocation) {
      return;
    }
    hasAppliedDefault.current = true;
    setSelected(DEFAULT_LOCATION);
  }, [setSelected]);

  // Every non-geolocation way of picking a location goes through here, so a leftover
  // geolocation error from an earlier attempt doesn't linger under the new selection.
  const { reset: resetGeolocation } = geolocation;
  const selectLocation = useCallback(
    (location: SelectedLocation) => {
      resetGeolocation();
      setSelected(location);
    },
    [resetGeolocation, setSelected],
  );

  // The tab always read just "WeatherMap" (layout.tsx metadata), so with a few tabs open --
  // or the page left in the background -- nothing said which location it was showing.
  useEffect(() => {
    document.title = selected ? `${selected.label} · WeatherMap` : "WeatherMap";
  }, [selected]);

  useEffect(() => {
    if (geolocation.state.status === "success") {
      setSelected({
        label: "Your location",
        latitude: geolocation.state.latitude,
        longitude: geolocation.state.longitude,
        source: "geolocation",
      });
    }
  }, [geolocation, setSelected]);

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-8 px-4 pb-10 pt-6">
      <div className="flex w-full flex-col items-center gap-3 rounded-full border border-border bg-card p-2 shadow-sm sm:flex-row sm:justify-center">
        <LocationSearch
          onSelect={(location) =>
            selectLocation({
              label: formatSearchLabel(location),
              latitude: location.latitude,
              longitude: location.longitude,
              source: "search",
            })
          }
        />
        {/* Clicking again while a request was pending fired a second getCurrentPosition, and the
            button gave no hint anything was happening besides the small status line below. */}
        <button
          type="button"
          onClick={geolocation.request}
          disabled={geolocation.state.status === "loading"}
          className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-accent/10 hover:text-accent disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-ink-secondary"
        >
          {geolocation.state.status === "loading" ? "Locating…" : "Use my location"}
        </button>
        <button
          type="button"
          onClick={() => setUnit(unit === "imperial" ? "metric" : "imperial")}
          className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-accent/10 hover:text-accent"
          aria-label="Toggle between metric and imperial units"
        >
          {unit === "imperial" ? "°F" : "°C"}
        </button>
      </div>

      <FavoriteLocations
        selected={selected}
        onSelect={selectLocation}
      />
      <FavoritesComparisonGrid selected={selected} unit={unit} onSelect={selectLocation} />

      {geolocation.state.status === "loading" && (
        <p className="text-sm text-ink-secondary">Requesting your location…</p>
      )}

      {geolocation.state.status === "error" && (
        <p className="max-w-sm text-center text-sm text-ink-secondary">{geolocation.state.message}</p>
      )}

      {selected && (
        <div className="flex w-full flex-col items-center gap-6">
          <WeatherAlertBanner location={selected} unit={unit} />
          <CurrentWeatherCard location={selected} unit={unit} />
          <AirQualityPanel location={selected} />
          <ForecastPanel location={selected} unit={unit} />
          <WeatherMap location={selected} unit={unit} />
        </div>
      )}
    </div>
  );
}
