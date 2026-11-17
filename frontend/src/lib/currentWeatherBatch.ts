import type { BatchCurrentWeatherItemDto, CoordinatesDto, CurrentWeatherDto } from "./api";

// The single-location query key used by CurrentWeatherCard, WeatherAlertBanner and the
// favorite tiles. The batched comparison writes its results under these same keys, so the
// selected location keeps sharing one cache entry with its favorite tile (roadmap #15).
export function currentWeatherQueryKey(latitude: number, longitude: number) {
  return ["current-weather", latitude, longitude] as const;
}

export function currentWeatherBatchQueryKey(locations: CoordinatesDto[]) {
  return ["current-weather-batch", ...locations.map((location) => `${location.latitude},${location.longitude}`)] as const;
}

// Turns a batch response into per-location cache entries. Matched on the coordinates the
// backend echoes back, not on position, so the order of the response doesn't matter.
export function toCurrentWeatherEntries(
  items: BatchCurrentWeatherItemDto[],
): Array<[ReturnType<typeof currentWeatherQueryKey>, CurrentWeatherDto]> {
  return items.map((item) => [currentWeatherQueryKey(item.latitude, item.longitude), item.weather]);
}
