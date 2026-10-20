"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
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
  // Index of the keyboard-highlighted result (-1 = none), reset whenever a new result list arrives.
  const [activeIndex, setActiveIndex] = useState(-1);

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
          setActiveIndex(-1);
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

  function selectLocation(location: LocationDto) {
    onSelect(location);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    setIsOpen(false);
  }

  const showResults = isOpen && query.trim().length >= 2;
  const navigableResults = showResults && !isSearching && !error ? results : [];

  // Arrow keys move through the dropdown, Enter picks the highlighted result, Escape closes
  // it -- previously the list was mouse-only, so a keyboard user could type a query but
  // never choose a result.
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (navigableResults.length === 0) {
      if (e.key === "ArrowDown" && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % navigableResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? navigableResults.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < navigableResults.length) {
      e.preventDefault();
      selectLocation(navigableResults[activeIndex]);
    }
  }

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
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={showResults}
        aria-controls="location-search-results"
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `location-search-result-${activeIndex}` : undefined}
        placeholder="Search for a city…"
        // Mirrors SearchLocationsQueryValidator's MaximumLength(200) on the
        // backend, so pasting an overlong string is rejected in the UI
        // instead of round-tripping to the API only to fail validation.
        maxLength={200}
        className="w-full rounded-full bg-transparent py-2 pl-10 pr-4 text-sm text-ink-primary outline-none placeholder:text-ink-muted"
      />

      {showResults && (
        <ul
          id="location-search-results"
          role="listbox"
          className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
        >
          {isSearching && <li className="px-4 py-2 text-sm text-ink-secondary">Searching…</li>}
          {!isSearching && error && <li className="px-4 py-2 text-sm text-red-500">{error}</li>}
          {!isSearching && !error && results.length === 0 && (
            <li className="px-4 py-2 text-sm text-ink-secondary">No matching locations.</li>
          )}
          {!isSearching &&
            !error &&
            results.map((location, index) => (
              <li
                key={`${location.latitude}-${location.longitude}-${index}`}
                id={`location-search-result-${index}`}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectLocation(location)}
                  className={`block w-full px-4 py-2 text-left text-sm text-ink-primary hover:bg-accent/10 ${
                    index === activeIndex ? "bg-accent/10" : ""
                  }`}
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
