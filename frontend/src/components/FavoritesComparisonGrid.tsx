"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentWeather } from "@/lib/api";
import { describeWeatherCode } from "@/lib/weatherCodes";
import { temperatureUnitLabel, toDisplayTemperature, type UnitSystem } from "@/lib/units";
import { useFavoriteLocations } from "@/hooks/useFavoriteLocations";
import type { SelectedLocation } from "@/lib/location";

function FavoriteConditionsTile({ location, unit }: { location: SelectedLocation; unit: UnitSystem }) {
  // Same query key as CurrentWeatherCard -- if this favorite is also the
  // currently selected location, TanStack Query serves the cached result
  // instead of firing a second request.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["current-weather", location.latitude, location.longitude],
    queryFn: () => getCurrentWeather(location.latitude, location.longitude),
  });

  return (
    <div className="flex min-w-[8rem] flex-col items-center gap-1 rounded-2xl border border-border bg-card px-3 py-2.5 text-center shadow-sm">
      <span className="text-xs text-ink-muted">{location.label}</span>
      {isLoading && <span className="text-xs text-ink-secondary">…</span>}
      {isError && <span className="text-xs text-ink-secondary">n/a</span>}
      {data && (
        <>
          <span className="text-xl" aria-hidden>
            {describeWeatherCode(data.weatherCode).icon}
          </span>
          <span className="text-sm font-medium text-ink-primary">
            {Math.round(toDisplayTemperature(data.temperatureC, unit))}
            {temperatureUnitLabel(unit)}
          </span>
        </>
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
