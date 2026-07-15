"use client";

import { useEffect, useRef } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { LocationDto } from "@/lib/api";
import type { SelectedLocation } from "@/lib/location";
import { LocationSearch } from "@/components/LocationSearch";
import { CurrentWeatherCard } from "@/components/CurrentWeatherCard";
import { ForecastPanel } from "@/components/ForecastPanel";

const STORAGE_KEY = "weathermap:selected-location";

function formatSearchLabel(location: LocationDto): string {
  return [location.name, location.country].filter(Boolean).join(", ");
}

export function WeatherDashboard() {
  const [selected, setSelected] = useLocalStorage<SelectedLocation>(STORAGE_KEY);
  const geolocation = useGeolocation();
  const hasAutoRequested = useRef(false);

  // Ask for the browser's location on first visit only, when nothing is
  // stored yet. Reads localStorage directly here (rather than trusting the
  // `selected` value from useLocalStorage) because on the very first
  // client render `selected` can still reflect the SSR-safe `null`
  // snapshot — useSyncExternalStore only resolves the real value a render
  // later. Trusting that transient `null` would fire geolocation and then
  // overwrite an already-persisted location once it resolves.
  useEffect(() => {
    if (hasAutoRequested.current) {
      return;
    }
    const alreadyStored = window.localStorage.getItem(STORAGE_KEY);
    if (alreadyStored) {
      return;
    }
    hasAutoRequested.current = true;
    geolocation.request();
  }, [geolocation]);

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
    <div className="flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
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
          className="whitespace-nowrap rounded-full border border-black/10 px-4 py-2 text-sm text-black hover:bg-black/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
        >
          Use my location
        </button>
      </div>

      {!selected && geolocation.state.status === "loading" && (
        <p className="text-sm text-zinc-500">Requesting your location…</p>
      )}

      {!selected && geolocation.state.status === "error" && (
        <p className="max-w-sm text-center text-sm text-zinc-500">
          {geolocation.state.message} Search for a city instead.
        </p>
      )}

      {selected && (
        <div className="flex w-full flex-col items-center gap-6">
          <CurrentWeatherCard location={selected} />
          <ForecastPanel location={selected} />
        </div>
      )}
    </div>
  );
}
