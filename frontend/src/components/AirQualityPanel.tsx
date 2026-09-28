"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, getAirQuality } from "@/lib/api";
import { describeEuropeanAqi } from "@/lib/airQuality";
import type { SelectedLocation } from "@/lib/location";

export function AirQualityPanel({ location }: { location: SelectedLocation }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["air-quality", location.latitude, location.longitude],
    queryFn: () => getAirQuality(location.latitude, location.longitude),
  });

  return (
    <section className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-sm font-medium text-ink-secondary">Air quality</h2>

      {isLoading && <p className="mt-4 text-sm text-ink-secondary">Loading air quality…</p>}

      {isError && (
        <p className="mt-4 text-sm text-red-500">
          {error instanceof ApiError ? error.message : "Could not load air quality."}
        </p>
      )}

      {data &&
        (() => {
          const { label, colorClass } = describeEuropeanAqi(data.europeanAqi);
          return (
            <>
              <p className={`mt-3 text-2xl font-semibold tracking-tight ${colorClass}`}>{label}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                <div>
                  <dt className="text-xs text-ink-muted">PM2.5</dt>
                  <dd className="mt-0.5 font-medium text-ink-primary">{data.pm2_5.toFixed(1)} µg/m³</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">PM10</dt>
                  <dd className="mt-0.5 font-medium text-ink-primary">{data.pm10.toFixed(1)} µg/m³</dd>
                </div>
              </dl>
            </>
          );
        })()}
    </section>
  );
}
