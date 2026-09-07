export type SelectedLocation = {
  label: string;
  latitude: number;
  longitude: number;
  source: "geolocation" | "search" | "default";
};

// Shown on first visit instead of auto-prompting for browser geolocation —
// asking for a permission the moment the page loads reads as pushy. Users
// can still opt in via the "Use my location" button.
export const DEFAULT_LOCATION: SelectedLocation = {
  label: "Warsaw, Poland",
  latitude: 52.2297,
  longitude: 21.0122,
  source: "default",
};

// Guards against a corrupted/malformed value read back from localStorage
// (manual tampering, a browser extension, or a future incompatible schema
// change) — an invalid latitude/longitude would otherwise reach Leaflet
// (which throws on non-finite coordinates) or the API as garbage.
export function isValidSelectedLocation(value: unknown): value is SelectedLocation {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { label, latitude, longitude, source } = value as Partial<SelectedLocation>;

  return (
    typeof label === "string" &&
    label.length > 0 &&
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    (source === "geolocation" || source === "search" || source === "default")
  );
}
