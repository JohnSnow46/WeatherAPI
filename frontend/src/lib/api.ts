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

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ProblemDetails = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

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

export function getForecast(latitude: number, longitude: number, days = 5): Promise<ForecastDto> {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), days: String(days) });
  return apiFetch<ForecastDto>(`/api/weather/forecast?${params.toString()}`);
}
