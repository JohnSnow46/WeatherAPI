"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentWeather, getForecast } from "@/lib/api";
import { evaluateWeatherAlerts } from "@/lib/weatherAlerts";
import type { SelectedLocation } from "@/lib/location";

// Reuses the same query keys as CurrentWeatherCard/ForecastPanel, so
// TanStack Query serves this from the shared cache instead of firing an
// extra request for the same data.
export function WeatherAlertBanner({ location }: { location: SelectedLocation }) {
  const current = useQuery({
    queryKey: ["current-weather", location.latitude, location.longitude],
    queryFn: () => getCurrentWeather(location.latitude, location.longitude),
  });
  const forecast = useQuery({
    queryKey: ["forecast", location.latitude, location.longitude],
    queryFn: () => getForecast(location.latitude, location.longitude),
  });

  const alerts = evaluateWeatherAlerts(current.data, forecast.data?.hourly ?? []);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          role="alert"
          className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900"
        >
          <span aria-hidden className="mr-2">
            ⚠️
          </span>
          {alert.message}
        </div>
      ))}
    </div>
  );
}
