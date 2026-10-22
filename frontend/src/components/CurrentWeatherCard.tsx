"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, getCurrentWeather, type CurrentWeatherDto } from "@/lib/api";
import { describeWeatherCode } from "@/lib/weatherCodes";
import type { SelectedLocation } from "@/lib/location";
import { useOfflineFallback, locationCacheKey } from "@/hooks/useOfflineForecastCache";
import { StaleDataBanner } from "@/components/StaleDataBanner";
import { useIsSlow } from "@/hooks/useIsSlow";
import { ColdStartNotice } from "@/components/ColdStartNotice";
import { ExportSnapshotButton } from "@/components/ExportSnapshotButton";
import { compassDirection } from "@/lib/wind";
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
    format: (d: CurrentWeatherDto, unit: UnitSystem) =>
      `${Math.round(toDisplayTemperature(d.apparentTemperatureC, unit))}${temperatureUnitLabel(unit)}`,
  },
  {
    key: "windSpeedKmh" as const,
    icon: "💨",
    label: "Wind",
    // windDirectionDeg was always on the DTO but never shown -- speed alone doesn't tell a
    // cyclist whether it's a headwind on the way home.
    format: (d: CurrentWeatherDto, unit: UnitSystem) =>
      `${Math.round(toDisplaySpeed(d.windSpeedKmh, unit))} ${speedUnitLabel(unit)} ${compassDirection(d.windDirectionDeg)}`.trim(),
  },
  {
    key: "precipitationMm" as const,
    icon: "💧",
    label: "Precipitation",
    format: (d: CurrentWeatherDto, unit: UnitSystem) =>
      `${toDisplayPrecipitation(d.precipitationMm, unit).toFixed(unit === "imperial" ? 2 : 1)} ${precipitationUnitLabel(unit)}`,
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
  const isSlow = useIsSlow(isLoading);
  const cardRef = useRef<HTMLElement>(null);

  return (
    <section ref={cardRef} className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-medium text-ink-secondary">{location.label}</h2>
        {displayData && <ExportSnapshotButton targetRef={cardRef} fileName={`weather-${location.label}`} />}
      </div>

      {isLoading && <p className="mt-4 text-sm text-ink-secondary">Loading current weather…</p>}
      {isSlow && <ColdStartNotice />}

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
                  {/* CurrentWeatherDto.time (the observation time, already in the location's own
                      UTC offset) was never shown -- without it there was no way to tell a
                      fresh reading from one Open-Meteo last updated a while ago. */}
                  <p className="text-xs text-ink-muted">Updated {displayData.time.slice(11, 16)} local time</p>
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
                <dd className="mt-0.5 font-medium text-ink-primary">{format(displayData, unit)}</dd>
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
