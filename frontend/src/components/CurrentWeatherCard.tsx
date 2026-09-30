"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, getCurrentWeather, type CurrentWeatherDto } from "@/lib/api";
import { describeWeatherCode } from "@/lib/weatherCodes";
import type { SelectedLocation } from "@/lib/location";
import { useOfflineFallback, locationCacheKey } from "@/hooks/useOfflineForecastCache";
import { StaleDataBanner } from "@/components/StaleDataBanner";
import {
  precipitationUnitLabel,
  speedUnitLabel,
  temperatureUnitLabel,
  toDisplayPrecipitation,
  toDisplaySpeed,
  toDisplayTemperature,
  type UnitSystem,
} from "@/lib/units";

const STAT_TILES = [
  {
    key: "apparentTemperatureC" as const,
    icon: "🌡️",
    label: "Feels like",
    format: (v: number, unit: UnitSystem) =>
      `${Math.round(toDisplayTemperature(v, unit))}${temperatureUnitLabel(unit)}`,
  },
  {
    key: "windSpeedKmh" as const,
    icon: "💨",
    label: "Wind",
    format: (v: number, unit: UnitSystem) => `${Math.round(toDisplaySpeed(v, unit))} ${speedUnitLabel(unit)}`,
  },
  {
    key: "precipitationMm" as const,
    icon: "💧",
    label: "Precipitation",
    format: (v: number, unit: UnitSystem) =>
      `${toDisplayPrecipitation(v, unit).toFixed(unit === "imperial" ? 2 : 1)} ${precipitationUnitLabel(unit)}`,
  },
];

export function CurrentWeatherCard({ location, unit }: { location: SelectedLocation; unit: UnitSystem }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["current-weather", location.latitude, location.longitude],
    queryFn: () => getCurrentWeather(location.latitude, location.longitude),
  });
  const cacheKey = locationCacheKey(location.latitude, location.longitude);
  const fallback = useOfflineFallback<CurrentWeatherDto>("current", cacheKey, data, isError);
  const displayData = data ?? fallback?.data;

  return (
    <section className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-sm font-medium text-ink-secondary">{location.label}</h2>

      {isLoading && <p className="mt-4 text-sm text-ink-secondary">Loading current weather…</p>}

      {isError && !fallback && (
        <p className="mt-4 text-sm text-red-500">
          {error instanceof ApiError ? error.message : "Could not load current weather."}
        </p>
      )}

      {fallback && <StaleDataBanner cachedAt={fallback.cachedAt} />}

      {displayData && (
        <>
          {(() => {
            const { label, icon } = describeWeatherCode(displayData.weatherCode);
            return (
              <div className="mt-3 flex items-center gap-4">
                <span className="text-6xl leading-none" aria-hidden>
                  {icon}
                </span>
                <div>
                  <p className="text-6xl font-semibold tracking-tight text-ink-primary">
                    {Math.round(toDisplayTemperature(displayData.temperatureC, unit))}°
                  </p>
                  <p className="text-sm text-ink-secondary">{label}</p>
                </div>
              </div>
            );
          })()}

          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
            {STAT_TILES.map(({ key, icon, label, format }) => (
              <div key={key}>
                <dt className="flex items-center gap-1 text-xs text-ink-muted">
                  <span aria-hidden>{icon}</span>
                  {label}
                </dt>
                <dd className="mt-0.5 font-medium text-ink-primary">{format(displayData[key], unit)}</dd>
              </div>
            ))}
            <div>
              <dt className="flex items-center gap-1 text-xs text-ink-muted">
                <span aria-hidden>{displayData.isDay ? "☀️" : "🌙"}</span>
                Time of day
              </dt>
              <dd className="mt-0.5 font-medium text-ink-primary">{displayData.isDay ? "Day" : "Night"}</dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
