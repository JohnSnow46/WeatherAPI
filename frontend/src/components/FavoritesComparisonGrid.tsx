"use client";

import { useQuery } from "@tanstack/react-query";
import { getAirQuality, getCurrentWeather, getForecast, type CurrentWeatherDto } from "@/lib/api";
import { describeWeatherCode } from "@/lib/weatherCodes";
import { temperatureUnitLabel, toDisplayTemperature, type UnitSystem } from "@/lib/units";
import { useFavoriteLocations } from "@/hooks/useFavoriteLocations";
import type { SelectedLocation } from "@/lib/location";
import { describeEuropeanAqi } from "@/lib/airQuality";
import { evaluateWeatherAlerts } from "@/lib/weatherAlerts";
import { useOfflineFallback, locationCacheKey } from "@/hooks/useOfflineForecastCache";

function FavoriteConditionsTile({ location, unit }: { location: SelectedLocation; unit: UnitSystem }) {
  // Same query keys as CurrentWeatherCard / AirQualityPanel / WeatherAlertBanner -- if this favorite is also the
  // currently selected location, TanStack Query serves the cached result
  // instead of firing a second request.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["current-weather", location.latitude, location.longitude],
    queryFn: () => getCurrentWeather(location.latitude, location.longitude),
  });
  const airQuality = useQuery({
    queryKey: ["air-quality", location.latitude, location.longitude],
    queryFn: () => getAirQuality(location.latitude, location.longitude),
  });
  const forecast = useQuery({
    queryKey: ["forecast", location.latitude, location.longitude],
    queryFn: () => getForecast(location.latitude, location.longitude),
  });
  const alerts = evaluateWeatherAlerts(data, forecast.data?.hourly ?? []);

  // Same "current" cache key/kind as CurrentWeatherCard -- a favorite that's also the
  // selected location reuses that entry instead of writing a second copy.
  const cacheKey = locationCacheKey(location.latitude, location.longitude);
  const fallback = useOfflineFallback<CurrentWeatherDto>("current", cacheKey, data, isError);
  const displayData = data ?? fallback?.data;

  return (
    <div className="flex min-w-[8rem] flex-col items-center gap-1 rounded-2xl border border-border bg-card px-3 py-2.5 text-center shadow-sm">
      <span className="text-xs text-ink-muted">{location.label}</span>
      {isLoading && <span className="text-xs text-ink-secondary">…</span>}
      {isError && !fallback && <span className="text-xs text-ink-secondary">n/a</span>}
      {displayData && (
        <>
          <span className="text-xl" aria-hidden>
            {describeWeatherCode(displayData.weatherCode).icon}
          </span>
          <span className="text-sm font-medium text-ink-primary">
            {Math.round(toDisplayTemperature(displayData.temperatureC, unit))}
            {temperatureUnitLabel(unit)}
          </span>
          {fallback && (
            <span className="text-[0.65rem] text-amber-600 dark:text-amber-400" title="Showing last saved data">
              stale
            </span>
          )}
        </>
      )}
      {airQuality.data && (
        <span className={`text-xs font-medium ${describeEuropeanAqi(airQuality.data.europeanAqi).colorClass}`}>
          AQI {describeEuropeanAqi(airQuality.data.europeanAqi).label}
        </span>
      )}
      {alerts.length > 0 && (
        <span className="text-xs font-medium text-red-500" title={alerts.map((alert) => alert.message).join(" ")}>
          ⚠ {alerts.length} active {alerts.length === 1 ? "alert" : "alerts"}
        </span>
      )}
    </div>
  );
}

// Only worth showing once there's something to compare -- a single favorite
// is already covered by the main dashboard view for that location.
const MIN_FAVORITES_TO_COMPARE = 2;

export function FavoritesComparisonGrid({ unit }: { unit: UnitSystem }) {
  const { favorites } = useFavoriteLocations();

  if (favorites.length < MIN_FAVORITES_TO_COMPARE) {
    return null;
  }

  return (
    <section className="flex w-full max-w-3xl flex-col gap-2">
      <h3 className="text-sm font-medium text-ink-secondary">Comparing your favorites</h3>
      <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2">
        {favorites.map((favorite) => (
          <FavoriteConditionsTile key={`${favorite.latitude},${favorite.longitude}`} location={favorite} unit={unit} />
        ))}
      </div>
    </section>
  );
}
