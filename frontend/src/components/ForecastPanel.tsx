"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, getForecast, type ForecastDto } from "@/lib/api";
import { describeWeatherCode } from "@/lib/weatherCodes";
import type { SelectedLocation } from "@/lib/location";
import { precipitationUnitLabel, toDisplayPrecipitation, toDisplayTemperature, type UnitSystem } from "@/lib/units";
import { useOfflineFallback, locationCacheKey } from "@/hooks/useOfflineForecastCache";
import { StaleDataBanner } from "@/components/StaleDataBanner";
import { ColdStartNotice } from "@/components/ColdStartNotice";
import { useIsSlow } from "@/hooks/useIsSlow";
import { ExportSnapshotButton } from "@/components/ExportSnapshotButton";

const HOURLY_POINTS_SHOWN = 24;
const DAY_RANGE_OPTIONS = [3, 7, 14] as const;
type DayRange = (typeof DAY_RANGE_OPTIONS)[number];

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

export function ForecastPanel({ location, unit }: { location: SelectedLocation; unit: UnitSystem }) {
  // Lazy initializer: runs once on mount rather than on every render, so
  // "upcoming" filtering below doesn't call an impure function during render.
  const [now] = useState(() => Date.now());
  const [days, setDays] = useState<DayRange>(7);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["forecast", location.latitude, location.longitude, days],
    queryFn: () => getForecast(location.latitude, location.longitude, days),
  });
  const cacheKey = locationCacheKey(location.latitude, location.longitude);
  const fallback = useOfflineFallback<ForecastDto>("forecast", cacheKey, data, isError);
  const displayData = data ?? fallback?.data;
  const isSlow = useIsSlow(isLoading);
  const panelRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div>
        <p className="text-sm text-ink-secondary">Loading forecast…</p>
        {isSlow && <ColdStartNotice />}
      </div>
    );
  }

  if (isError && !fallback) {
    return (
      <p className="text-sm text-red-500">
        {error instanceof ApiError ? error.message : "Could not load the forecast."}
      </p>
    );
  }

  if (!displayData) {
    return null;
  }

  const upcomingHourly = displayData.hourly
    .filter((point) => new Date(point.time).getTime() >= now)
    .slice(0, HOURLY_POINTS_SHOWN);

  return (
    <div ref={panelRef} className="flex w-full max-w-3xl flex-col gap-6">
      {fallback && <StaleDataBanner cachedAt={fallback.cachedAt} />}
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-ink-secondary">Next hours</h3>
          <ExportSnapshotButton targetRef={panelRef} fileName={`forecast-${location.label}`} />
        </div>
        <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2">
          {upcomingHourly.map((point) => {
            const { icon } = describeWeatherCode(point.weatherCode);
            return (
              <div
                key={point.time}
                className="flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl border border-border bg-card px-3 py-2.5 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="text-xs text-ink-muted">{formatHour(point.time)}</span>
                <span className="text-xl" aria-hidden>
                  {icon}
                </span>
                <span className="text-sm font-medium text-ink-primary">
                  {Math.round(toDisplayTemperature(point.temperatureC, unit))}°
                </span>
                {/* Same treatment the daily cards got for precipitationSumMm -- the hourly
                    precipitationMm was fetched but never shown, so "which hour will it rain"
                    was only guessable from the icon. */}
                {point.precipitationMm > 0 && (
                  <span className="text-[10px] text-ink-muted">
                    💧 {toDisplayPrecipitation(point.precipitationMm, unit).toFixed(unit === "imperial" ? 2 : 1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-ink-secondary">Next days</h3>
          <div role="group" aria-label="Forecast range" className="flex gap-1">
            {DAY_RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                aria-pressed={days === option}
                className={`rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors ${
                  days === option
                    ? "bg-accent/10 text-accent"
                    : "bg-card text-ink-secondary hover:bg-accent/10 hover:text-accent"
                }`}
              >
                {option} days
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {displayData.daily.map((point) => {
            const { label, icon } = describeWeatherCode(point.weatherCode);
            return (
              <div
                key={point.date}
                className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card px-3 py-3 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="text-sm font-medium text-ink-primary">{formatWeekday(point.date)}</span>
                <span className="text-2xl" aria-hidden title={label}>
                  {icon}
                </span>
                <span className="text-sm text-ink-secondary">
                  <span className="font-medium text-ink-primary">
                    {Math.round(toDisplayTemperature(point.tempMaxC, unit))}°
                  </span>
                  {" / "}
                  {Math.round(toDisplayTemperature(point.tempMinC, unit))}°
                </span>
                {/* precipitationSumMm was always on DailyForecastPointDto but never rendered --
                    the icon alone can't tell a passing shower from an all-day soak. */}
                {point.precipitationSumMm > 0 && (
                  <span className="text-xs text-ink-muted">
                    💧 {toDisplayPrecipitation(point.precipitationSumMm, unit).toFixed(unit === "imperial" ? 2 : 1)}{" "}
                    {precipitationUnitLabel(unit)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
