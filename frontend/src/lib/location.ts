export type SelectedLocation = {
  label: string;
  latitude: number;
  longitude: number;
  source: "geolocation" | "search";
};
