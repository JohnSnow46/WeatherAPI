"use client";

import { useEffect, useState } from "react";
import { ApiError, type LocationDto, searchLocations } from "@/lib/api";

const DEBOUNCE_MS = 350;

function formatLocationLabel(location: LocationDto): string {
  return [location.name, location.admin1, location.country].filter(Boolean).join(", ");
}

export function LocationSearch({ onSelect }: { onSelect: (location: LocationDto) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    // Stale results/errors from a previous longer query are harmless here:
    // the dropdown below only renders when the query is long enough anyway.
    if (trimmed.length < 2) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      setError(null);

      searchLocations(trimmed)
        .then((locations) => {
          setResults(locations);
          setIsOpen(true);
        })
        .catch((err: unknown) => {
          setError(err instanceof ApiError ? err.message : "Search failed. Please try again.");
        })
        .finally(() => setIsSearching(false));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="relative w-full max-w-sm">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="Search for a city…"
        className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black shadow-sm outline-none focus:border-black/30 dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:focus:border-white/30"
      />

      {isOpen && (query.trim().length >= 2) && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg dark:border-white/15 dark:bg-zinc-900">
          {isSearching && <li className="px-4 py-2 text-sm text-zinc-500">Searching…</li>}
          {!isSearching && error && <li className="px-4 py-2 text-sm text-red-500">{error}</li>}
          {!isSearching && !error && results.length === 0 && (
            <li className="px-4 py-2 text-sm text-zinc-500">No matching locations.</li>
          )}
          {!isSearching &&
            !error &&
            results.map((location, index) => (
              <li key={`${location.latitude}-${location.longitude}-${index}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(location);
                    setQuery("");
                    setResults([]);
                    setIsOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                >
                  {formatLocationLabel(location)}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
