"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, getCurrentWeather } from "@/lib/api";
import { describeWeatherCode } from "@/lib/weatherCodes";
import type { SelectedLocation } from "@/lib/location";

const STAT_TILES = [
  { key: "apparentTemperatureC" as const, icon: "🌡️", label: "Feels like", format: (v: number) => `${Math.round(v)}°C` },
  { key: "windSpeedKmh" as const, icon: "💨", label: "Wind", format: (v: number) => `${Math.round(v)} km/h` },
  { key: "precipitationMm" as const, icon: "💧", label: "Precipitation", format: (v: number) => `${v.toFixed(1)} mm` },
];

export function CurrentWeatherCard({ location }: { location: SelectedLocation }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["current-weather", location.latitude, location.longitude],
    queryFn: () => getCurrentWeather(location.latitude, location.longitude),
  });

  return (
    <section className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-sm font-medium text-ink-secondary">{location.label}</h2>

      {isLoading && <p className="mt-4 text-sm text-ink-secondary">Loading current weather…</p>}

      {isError && (
        <p className="mt-4 text-sm text-red-500">
          {error instanceof ApiError ? error.message : "Could not load current weather."}
        </p>
      )}

      {data && (
        <>
          {(() => {
            const { label, icon } = describeWeatherCode(data.weatherCode);
            return (
              <div className="mt-3 flex items-center gap-4">
                <span className="text-6xl leading-none" aria-hidden>
                  {icon}
                </span>
                <div>
                  <p className="text-6xl font-semibold tracking-tight text-ink-primary">
                    {Math.round(data.temperatureC)}°
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
                <dd className="mt-0.5 font-medium text-ink-primary">{format(data[key])}</dd>
              </div>
            ))}
            <div>
              <dt className="flex items-center gap-1 text-xs text-ink-muted">
                <span aria-hidden>{data.isDay ? "☀️" : "🌙"}</span>
                Time of day
              </dt>
              <dd className="mt-0.5 font-medium text-ink-primary">{data.isDay ? "Day" : "Night"}</dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
