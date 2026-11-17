const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5230";

export type LocationDto = {
  name: string;
  country: string | null;
  admin1: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
};

export type CurrentWeatherDto = {
  time: string;
  temperatureC: number;
  apparentTemperatureC: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  precipitationMm: number;
  weatherCode: number;
  isDay: boolean;
};

export type CoordinatesDto = {
  latitude: number;
  longitude: number;
};

// The backend echoes each requested coordinate pair back next to its weather, so a result
// can be matched to its location without relying on the response order.
export type BatchCurrentWeatherItemDto = CoordinatesDto & {
  weather: CurrentWeatherDto;
};

export type HourlyForecastPointDto = {
  time: string;
  temperatureC: number;
  precipitationMm: number;
  windSpeedKmh: number;
  weatherCode: number;
};

export type DailyForecastPointDto = {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationSumMm: number;
  weatherCode: number;
};

export type ForecastDto = {
  hourly: HourlyForecastPointDto[];
  daily: DailyForecastPointDto[];
};

export type AirQualityDto = {
  time: string;
  pm2_5: number;
  pm10: number;
  europeanAqi: number;
};

// A plain field rather than a `public status` constructor parameter: Node's built-in
// TypeScript support (used by `npm test`) only strips types and rejects parameter properties.
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ProblemDetails = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

// Mirrors the backend's own Polly timeout policy (10s per upstream attempt,
// see PollyPolicies.GetTimeoutPolicy) — without this, `fetch` has no default
// timeout at all, so a hung backend request would leave the UI stuck on its
// loading state indefinitely instead of surfacing an error.
const REQUEST_TIMEOUT_MS = 15_000;

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const problem: ProblemDetails | null = await response.json().catch(() => null);
    const message = problem?.detail ?? problem?.title ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export function searchLocations(query: string, count = 5): Promise<LocationDto[]> {
  const params = new URLSearchParams({ query, count: String(count) });
  return apiFetch<LocationDto[]>(`/api/locations/search?${params.toString()}`);
}

export function getCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeatherDto> {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude) });
  return apiFetch<CurrentWeatherDto>(`/api/weather/current?${params.toString()}`);
}

// Must match GetCurrentWeatherBatchQueryValidator.MaxLocations on the API.
export const MAX_BATCH_LOCATIONS = 10;

// One round-trip for several locations (roadmap #15). Each location still goes through the
// backend's per-location cache, so this only saves requests, not freshness.
export function getCurrentWeatherBatch(locations: CoordinatesDto[]): Promise<BatchCurrentWeatherItemDto[]> {
  return apiFetch<BatchCurrentWeatherItemDto[]>("/api/weather/current/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(locations),
  });
}

export function getForecast(latitude: number, longitude: number, days = 5): Promise<ForecastDto> {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), days: String(days) });
  return apiFetch<ForecastDto>(`/api/weather/forecast?${params.toString()}`);
}

export function getAirQuality(latitude: number, longitude: number): Promise<AirQualityDto> {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude) });
  return apiFetch<AirQualityDto>(`/api/weather/air-quality?${params.toString()}`);
}

// OpenWeatherMap's Weather Maps 1.0 free-tier layers, proxied through the
// backend (must match GetMapTileQueryValidator.AllowedLayers on the API).
export type MapTileLayer = "wind_new" | "clouds_new" | "precipitation_new" | "pressure_new" | "temp_new";

// Leaflet substitutes {z}/{x}/{y} itself, so this is just a URL template,
// not a per-tile fetch — the backend proxies each requested tile.
export function mapTileUrlTemplate(layer: MapTileLayer): string {
  return `${API_BASE_URL}/api/weather/map-tiles/${layer}/{z}/{x}/{y}`;
}
