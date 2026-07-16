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
