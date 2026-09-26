"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { isValidSelectedLocation, type SelectedLocation } from "@/lib/location";

const STORAGE_KEY = "weathermap:favorite-locations";
const MAX_FAVORITES = 8;

function sameLocation(a: SelectedLocation, b: SelectedLocation): boolean {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

export function useFavoriteLocations() {
  const [stored, setStored] = useLocalStorage<SelectedLocation[]>(STORAGE_KEY);
  // Guard against a corrupted/malformed stored value the same way
  // WeatherDashboard guards the single "last location" entry — drop
  // whichever array elements don't pass validation instead of trusting the
  // whole list.
  const favorites = useMemo(
    () => (Array.isArray(stored) ? stored.filter(isValidSelectedLocation) : []),
    [stored],
  );

  const isFavorite = useCallback(
    (location: SelectedLocation) => favorites.some((fav) => sameLocation(fav, location)),
    [favorites],
  );

  const addFavorite = useCallback(
    (location: SelectedLocation) => {
      if (favorites.some((fav) => sameLocation(fav, location))) {
        return;
      }
      // Drop the oldest favorite rather than growing the list forever —
      // this is a quick-switch shortlist, not a full history.
      const next = [...favorites, location].slice(-MAX_FAVORITES);
      setStored(next);
    },
    [favorites, setStored],
  );

  const removeFavorite = useCallback(
    (location: SelectedLocation) => {
      const next = favorites.filter((fav) => !sameLocation(fav, location));
      setStored(next.length > 0 ? next : null);
    },
    [favorites, setStored],
  );

  return { favorites, isFavorite, addFavorite, removeFavorite } as const;
}
