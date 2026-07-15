"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, getForecast } from "@/lib/api";
import { describeWeatherCode } from "@/lib/weatherCodes";
import type { SelectedLocation } from "@/lib/location";

const HOURLY_POINTS_SHOWN = 24;

function formatHour(isoTime: string): string {
  // The backend already localizes this timestamp to the location's own
  // timezone, so read the hour directly from the string instead of
  // reinterpreting it through the browser's local timezone.
  return isoTime.slice(11, 16);
}

function formatWeekday(isoDate: string): string {
  // Pinned to en-US rather than the viewer's locale, so labels stay
  // consistent with the rest of the UI regardless of browser/OS settings.
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}

export function ForecastPanel({ location }: { location: SelectedLocation }) {
  // Lazy initializer: runs once on mount rather than on every render, so
  // "upcoming" filtering below doesn't call an impure function during render.
  const [now] = useState(() => Date.now());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["forecast", location.latitude, location.longitude],
    queryFn: () => getForecast(location.latitude, location.longitude),
  });

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading forecast…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500">
        {error instanceof ApiError ? error.message : "Could not load the forecast."}
      </p>
    );
  }

  if (!data) {
    return null;
  }

  const upcomingHourly = data.hourly
    .filter((point) => new Date(point.time).getTime() >= now)
    .slice(0, HOURLY_POINTS_SHOWN);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <section>
        <h3 className="mb-2 text-sm font-medium text-zinc-500">Next hours</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {upcomingHourly.map((point) => {
            const { icon } = describeWeatherCode(point.weatherCode);
            return (
              <div
                key={point.time}
                className="flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl border border-black/10 bg-white px-3 py-2 text-center dark:border-white/15 dark:bg-zinc-900"
              >
                <span className="text-xs text-zinc-500">{formatHour(point.time)}</span>
                <span className="text-xl" aria-hidden>
                  {icon}
                </span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {Math.round(point.temperatureC)}°
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-zinc-500">Next days</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {data.daily.map((point) => {
            const { label, icon } = describeWeatherCode(point.weatherCode);
            return (
              <div
                key={point.date}
                className="flex flex-col items-center gap-1 rounded-2xl border border-black/10 bg-white px-3 py-3 text-center dark:border-white/15 dark:bg-zinc-900"
              >
                <span className="text-sm font-medium text-black dark:text-white">{formatWeekday(point.date)}</span>
                <span className="text-2xl" aria-hidden title={label}>
                  {icon}
                </span>
                <span className="text-sm text-black dark:text-white">
                  {Math.round(point.tempMaxC)}° / {Math.round(point.tempMinC)}°
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
