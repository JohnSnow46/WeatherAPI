"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAirQuality, getCurrentWeather, getForecast, type AirQualityDto, type CurrentWeatherDto } from "@/lib/api";
import { describeWeatherCode } from "@/lib/weatherCodes";
import { temperatureUnitLabel, toDisplayTemperature, type UnitSystem } from "@/lib/units";
import { useFavoriteLocations } from "@/hooks/useFavoriteLocations";
import type { SelectedLocation } from "@/lib/location";
import { describeEuropeanAqi } from "@/lib/airQuality";
import { evaluateWeatherAlerts } from "@/lib/weatherAlerts";
import { useOfflineFallback, locationCacheKey } from "@/hooks/useOfflineForecastCache";
import { ExportSnapshotButton } from "@/components/ExportSnapshotButton";

function FavoriteConditionsTile({ location, unit }: { location: SelectedLocation; unit: UnitSystem }) {
  // Same query keys as CurrentWeatherCard / AirQualityPanel / WeatherAlertBanner -- if this favorite is also the
  // currently selected location, TanStack Query serves the cached result
  // instead of firing a second request.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["current-weather", location.latitude, location.longitude],
    queryFn: () => getCurrentWeather(location.latitude, location.longitude),
  });
  const airQuality = useQuery({
    queryKey: ["air-quality", location.latitude, location.longitude],
    queryFn: () => getAirQuality(location.latitude, location.longitude),
  });
  const forecast = useQuery({
    queryKey: ["forecast", location.latitude, location.longitude],
    queryFn: () => getForecast(location.latitude, location.longitude),
  });
  const alerts = evaluateWeatherAlerts(data, forecast.data?.hourly ?? [], unit);

  // Same "current"/"air-quality" cache keys/kinds as CurrentWeatherCard/AirQualityPanel --
  // a favorite that's also the selected location reuses those entries instead of writing
  // a second copy. The temperature side already had this (roadmap #17); the AQI badge
  // never did, so it just showed nothing on a cold start/network blip instead of falling
  // back to the last known value like every other piece of data in this tile.
  const cacheKey = locationCacheKey(location.latitude, location.longitude);
  const fallback = useOfflineFallback<CurrentWeatherDto>("current", cacheKey, data, isError);
  const displayData = data ?? fallback?.data;
  const airQualityFallback = useOfflineFallback<AirQualityDto>(
    "air-quality",
    cacheKey,
    airQuality.data,
    airQuality.isError,
  );
  const displayAirQuality = airQuality.data ?? airQualityFallback?.data;

  return (
    <div className="flex min-w-[8rem] flex-col items-center gap-1 rounded-2xl border border-border bg-card px-3 py-2.5 text-center shadow-sm">
      <span className="text-xs text-ink-muted">{location.label}</span>
      {isLoading && <span className="text-xs text-ink-secondary">…</span>}
      {isError && !fallback && <span className="text-xs text-ink-secondary">n/a</span>}
      {displayData && (
        <>
          <span className="text-xl" aria-hidden>
            {describeWeatherCode(displayData.weatherCode).icon}
          </span>
          <span className="text-sm font-medium text-ink-primary">
            {Math.round(toDisplayTemperature(displayData.temperatureC, unit))}
            {temperatureUnitLabel(unit)}
          </span>
          {fallback && (
            <span className="text-[0.65rem] text-amber-600 dark:text-amber-400" title="Showing last saved data">
              stale
            </span>
          )}
        </>
      )}
      {displayAirQuality && (
        <span className={`text-xs font-medium ${describeEuropeanAqi(displayAirQuality.europeanAqi).colorClass}`}>
          AQI {describeEuropeanAqi(displayAirQuality.europeanAqi).label}
        </span>
      )}
      {alerts.length > 0 && (
        <span className="text-xs font-medium text-red-500" title={alerts.map((alert) => alert.message).join(" ")}>
          ⚠ {alerts.length} active {alerts.length === 1 ? "alert" : "alerts"}
        </span>
      )}
    </div>
  );
}

// Only worth showing once there's something to compare -- a single favorite
// is already covered by the main dashboard view for that location.
const MIN_FAVORITES_TO_COMPARE = 2;

export function FavoritesComparisonGrid({ unit }: { unit: UnitSystem }) {
  const { favorites } = useFavoriteLocations();
  const gridRef = useRef<HTMLElement>(null);

  if (favorites.length < MIN_FAVORITES_TO_COMPARE) {
    return null;
  }

  return (
    <section ref={gridRef} className="flex w-full max-w-3xl flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-ink-secondary">Comparing your favorites</h3>
        <ExportSnapshotButton targetRef={gridRef} fileName="weather-comparison" />
      </div>
      <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2">
        {favorites.map((favorite) => (
          <FavoriteConditionsTile key={`${favorite.latitude},${favorite.longitude}`} location={favorite} unit={unit} />
        ))}
      </div>
    </section>
  );
}
