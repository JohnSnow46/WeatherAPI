"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, getAirQuality, type AirQualityDto } from "@/lib/api";
import { describeEuropeanAqi } from "@/lib/airQuality";
import type { SelectedLocation } from "@/lib/location";
import { useOfflineFallback, locationCacheKey } from "@/hooks/useOfflineForecastCache";
import { StaleDataBanner } from "@/components/StaleDataBanner";
import { ColdStartNotice } from "@/components/ColdStartNotice";
import { useIsSlow } from "@/hooks/useIsSlow";
import { ExportSnapshotButton } from "@/components/ExportSnapshotButton";

export function AirQualityPanel({ location }: { location: SelectedLocation }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["air-quality", location.latitude, location.longitude],
    queryFn: () => getAirQuality(location.latitude, location.longitude),
  });
  const cacheKey = locationCacheKey(location.latitude, location.longitude);
  const fallback = useOfflineFallback<AirQualityDto>("air-quality", cacheKey, data, isError);
  const displayData = data ?? fallback?.data;
  const isSlow = useIsSlow(isLoading);
  const panelRef = useRef<HTMLElement>(null);

  return (
    <section ref={panelRef} className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-medium text-ink-secondary">Air quality</h2>
        {displayData && <ExportSnapshotButton targetRef={panelRef} fileName={`air-quality-${location.label}`} />}
      </div>

      {isLoading && <p className="mt-4 text-sm text-ink-secondary">Loading air quality…</p>}
      {isSlow && <ColdStartNotice />}

      {isError && !fallback && (
        <p className="mt-4 text-sm text-red-500">
          {error instanceof ApiError ? error.message : "Could not load air quality."}
        </p>
      )}

      {fallback && <StaleDataBanner cachedAt={fallback.cachedAt} />}

      {displayData &&
        (() => {
          const { label, colorClass } = describeEuropeanAqi(displayData.europeanAqi);
          return (
            <>
              <p className={`mt-3 text-2xl font-semibold tracking-tight ${colorClass}`}>{label}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                <div>
                  <dt className="text-xs text-ink-muted">PM2.5</dt>
                  <dd className="mt-0.5 font-medium text-ink-primary">{displayData.pm2_5.toFixed(1)} µg/m³</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">PM10</dt>
                  <dd className="mt-0.5 font-medium text-ink-primary">{displayData.pm10.toFixed(1)} µg/m³</dd>
                </div>
              </dl>
            </>
          );
        })()}
    </section>
  );
}
