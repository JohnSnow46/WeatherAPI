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
    if (trimmed.length < 2) {
      return;
    }

    let ignore = false;

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      setError(null);

      searchLocations(trimmed)
        .then((locations) => {
          // Guards against out-of-order responses: a slower request for an
          // earlier query could otherwise resolve after a faster one for a
          // later query and overwrite its fresher results.
          if (ignore) {
            return;
          }
          setResults(locations);
          setIsOpen(true);
        })
        .catch((err: unknown) => {
          if (ignore) {
            return;
          }
          setError(err instanceof ApiError ? err.message : "Search failed. Please try again.");
        })
        .finally(() => {
          if (!ignore) {
            setIsSearching(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <div className="relative w-full max-w-sm flex-1">
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <circle cx="9" cy="9" r="6.5" />
        <path d="M17.5 17.5 14 14" strokeLinecap="round" />
      </svg>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="Search for a city…"
        className="w-full rounded-full bg-transparent py-2 pl-10 pr-4 text-sm text-ink-primary outline-none placeholder:text-ink-muted"
      />

      {isOpen && (query.trim().length >= 2) && (
        <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          {isSearching && <li className="px-4 py-2 text-sm text-ink-secondary">Searching…</li>}
          {!isSearching && error && <li className="px-4 py-2 text-sm text-red-500">{error}</li>}
          {!isSearching && !error && results.length === 0 && (
            <li className="px-4 py-2 text-sm text-ink-secondary">No matching locations.</li>
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
                  className="block w-full px-4 py-2 text-left text-sm text-ink-primary hover:bg-accent/10"
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
