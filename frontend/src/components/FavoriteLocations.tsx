"use client";

import { useFavoriteLocations } from "@/hooks/useFavoriteLocations";
import type { SelectedLocation } from "@/lib/location";

export function FavoriteLocations({
  selected,
  onSelect,
}: {
  selected: SelectedLocation | null;
  onSelect: (location: SelectedLocation) => void;
}) {
  const { favorites, isFavorite, addFavorite, removeFavorite } = useFavoriteLocations();

  if (favorites.length === 0 && !selected) {
    return null;
  }

  const selectedIsFavorite = selected ? isFavorite(selected) : false;

  return (
    <div className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-2">
      {selected && (
        <button
          type="button"
          onClick={() => (selectedIsFavorite ? removeFavorite(selected) : addFavorite(selected))}
          aria-label={selectedIsFavorite ? "Remove from favorites" : "Save to favorites"}
          aria-pressed={selectedIsFavorite}
          className="rounded-full px-2 py-1 text-sm text-ink-secondary transition-colors hover:bg-accent/10 hover:text-accent"
        >
          <span aria-hidden>{selectedIsFavorite ? "★" : "☆"}</span>
        </button>
      )}

      {favorites.map((favorite) => {
        // The chips never showed which favorite is the one currently on screen -- every chip
        // looked the same, including the active one.
        const isCurrent =
          selected !== null && selected.latitude === favorite.latitude && selected.longitude === favorite.longitude;
        return (
          <button
            key={`${favorite.latitude},${favorite.longitude}`}
            type="button"
            onClick={() => onSelect(favorite)}
            aria-current={isCurrent ? "true" : undefined}
            className={`rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-accent/10 hover:text-accent ${
              isCurrent ? "bg-accent/10 text-accent" : "bg-card text-ink-secondary"
            }`}
          >
            {favorite.label}
          </button>
        );
      })}
    </div>
  );
}
