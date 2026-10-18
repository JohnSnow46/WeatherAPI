"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentWeather, getForecast, type CurrentWeatherDto, type ForecastDto } from "@/lib/api";
import { evaluateWeatherAlerts } from "@/lib/weatherAlerts";
import type { SelectedLocation } from "@/lib/location";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { useForegroundAlertNotifications } from "@/hooks/useForegroundAlertNotifications";
import { useOfflineFallback, locationCacheKey } from "@/hooks/useOfflineForecastCache";
import { StaleDataBanner } from "@/components/StaleDataBanner";
import type { UnitSystem } from "@/lib/units";

// How often to re-check for new alerts while notifications are enabled -- only then is
// the extra polling worth it, and only then is it kept alive while the tab is
// backgrounded (refetchIntervalInBackground), since that's the whole point of #13.
const ALERT_POLL_INTERVAL_MS = 60_000;

// Reuses the same query keys as CurrentWeatherCard/ForecastPanel, so
// TanStack Query serves this from the shared cache instead of firing an
// extra request for the same data.
export function WeatherAlertBanner({ location, unit }: { location: SelectedLocation; unit: UnitSystem }) {
  const [permission, requestPermission] = useNotificationPermission();
  const notificationsEnabled = permission === "granted";

  const current = useQuery({
    queryKey: ["current-weather", location.latitude, location.longitude],
    queryFn: () => getCurrentWeather(location.latitude, location.longitude),
    refetchInterval: notificationsEnabled ? ALERT_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: notificationsEnabled,
  });
  const forecast = useQuery({
    queryKey: ["forecast", location.latitude, location.longitude],
    queryFn: () => getForecast(location.latitude, location.longitude),
    refetchInterval: notificationsEnabled ? ALERT_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: notificationsEnabled,
  });

  // Same offline-fallback pattern as CurrentWeatherCard/ForecastPanel (roadmap #6) --
  // without it, a cold start or network blip made alerts (including an already-active
  // one) silently vanish instead of falling back to the last known state.
  const cacheKey = locationCacheKey(location.latitude, location.longitude);
  const currentFallback = useOfflineFallback<CurrentWeatherDto>("current", cacheKey, current.data, current.isError);
  const forecastFallback = useOfflineFallback<ForecastDto>("forecast", cacheKey, forecast.data, forecast.isError);
  const displayCurrent = current.data ?? currentFallback?.data;
  const displayForecast = forecast.data ?? forecastFallback?.data;

  const alerts = evaluateWeatherAlerts(displayCurrent, displayForecast?.hourly ?? [], unit);
  const locationKey = `${location.latitude},${location.longitude}`;

  useForegroundAlertNotifications(locationKey, alerts, notificationsEnabled);

  if (alerts.length === 0 && permission !== "default") {
    return null;
  }

  // Same StaleDataBanner CurrentWeatherCard/ForecastPanel/AirQualityPanel already show --
  // an alert based on cached data (current or forecast) deserves the same "might be
  // outdated" transparency as any other panel's fallback value.
  const fallback = currentFallback ?? forecastFallback;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-2">
      {fallback && alerts.length > 0 && <StaleDataBanner cachedAt={fallback.cachedAt} />}
      {permission === "default" && (
        <button
          type="button"
          onClick={requestPermission}
          className="self-start rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-ink-secondary transition-colors hover:bg-accent/10 hover:text-accent"
        >
          🔔 Enable alert notifications
        </button>
      )}
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
