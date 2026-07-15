"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, getCurrentWeather } from "@/lib/api";
import { describeWeatherCode } from "@/lib/weatherCodes";
import type { SelectedLocation } from "@/lib/location";

export function CurrentWeatherCard({ location }: { location: SelectedLocation }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["current-weather", location.latitude, location.longitude],
    queryFn: () => getCurrentWeather(location.latitude, location.longitude),
  });

  return (
    <section className="w-full max-w-sm rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-zinc-900">
      <h2 className="text-sm font-medium text-zinc-500">{location.label}</h2>

      {isLoading && <p className="mt-4 text-sm text-zinc-500">Loading current weather…</p>}

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
              <div className="mt-2 flex items-center gap-3">
                <span className="text-5xl" aria-hidden>
                  {icon}
                </span>
                <div>
                  <p className="text-4xl font-semibold text-black dark:text-white">
                    {Math.round(data.temperatureC)}°C
                  </p>
                  <p className="text-sm text-zinc-500">{label}</p>
                </div>
              </div>
            );
          })()}

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-zinc-500">Feels like</dt>
              <dd className="text-black dark:text-white">{Math.round(data.apparentTemperatureC)}°C</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Wind</dt>
              <dd className="text-black dark:text-white">{Math.round(data.windSpeedKmh)} km/h</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Precipitation</dt>
              <dd className="text-black dark:text-white">{data.precipitationMm.toFixed(1)} mm</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Time of day</dt>
              <dd className="text-black dark:text-white">{data.isDay ? "Day" : "Night"}</dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
