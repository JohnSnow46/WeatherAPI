"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { LocationDto } from "@/lib/api";
import { DEFAULT_LOCATION, type SelectedLocation } from "@/lib/location";
import { LocationSearch } from "@/components/LocationSearch";
import { CurrentWeatherCard } from "@/components/CurrentWeatherCard";
import { ForecastPanel } from "@/components/ForecastPanel";

// Leaflet touches `window` at import time, so it can't be prerendered on the
// server even inside a "use client" file — load it client-only.
const WeatherMap = dynamic(() => import("@/components/WeatherMap").then((mod) => mod.WeatherMap), {
  ssr: false,
  loading: () => <p className="text-sm text-ink-secondary">Loading map…</p>,
});

const STORAGE_KEY = "weathermap:selected-location";

function formatSearchLabel(location: LocationDto): string {
  return [location.name, location.country].filter(Boolean).join(", ");
}

export function WeatherDashboard() {
  const [selected, setSelected] = useLocalStorage<SelectedLocation>(STORAGE_KEY);
  const geolocation = useGeolocation();
  const hasAppliedDefault = useRef(false);

  // Fall back to a fixed default on first visit rather than auto-prompting
  // for browser geolocation — asking for that permission the moment the
  // page loads reads as pushy. Reads localStorage directly here (rather
  // than trusting the `selected` value from useLocalStorage) because on
  // the very first client render `selected` can still reflect the
  // SSR-safe `null` snapshot — useSyncExternalStore only resolves the
  // real value a render later. Trusting that transient `null` would
  // overwrite an already-persisted location once this effect runs.
  useEffect(() => {
    if (hasAppliedDefault.current) {
      return;
    }
    const alreadyStored = window.localStorage.getItem(STORAGE_KEY);
    if (alreadyStored) {
      return;
    }
    hasAppliedDefault.current = true;
    setSelected(DEFAULT_LOCATION);
  }, [setSelected]);

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
            setSelected({
              label: formatSearchLabel(location),
              latitude: location.latitude,
              longitude: location.longitude,
              source: "search",
            })
          }
        />
        <button
          type="button"
          onClick={geolocation.request}
          className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-accent/10 hover:text-accent"
        >
          Use my location
        </button>
      </div>

      {geolocation.state.status === "loading" && (
        <p className="text-sm text-ink-secondary">Requesting your location…</p>
      )}

      {geolocation.state.status === "error" && (
        <p className="max-w-sm text-center text-sm text-ink-secondary">{geolocation.state.message}</p>
      )}

      {selected && (
        <div className="flex w-full flex-col items-center gap-6">
          <CurrentWeatherCard location={selected} />
          <ForecastPanel location={selected} />
          <WeatherMap location={selected} />
        </div>
      )}
    </div>
  );
}
