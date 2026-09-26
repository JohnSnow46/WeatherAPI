import type { CurrentWeatherDto, HourlyForecastPointDto } from "@/lib/api";

export type WeatherAlert = {
  id: string;
  message: string;
};

const STRONG_WIND_KMH = 50;
const HEAVY_RAIN_MM_PER_HOUR = 10;
const UPCOMING_ALERT_WINDOW_HOURS = 6;

// Pure, client-side threshold checks over data the app already fetches for
// CurrentWeatherCard/ForecastPanel -- the backend-free option from
// docs/roadmap.md #4, so no new DTO fields or endpoint are needed.
export function evaluateWeatherAlerts(
  current: CurrentWeatherDto | undefined,
  upcomingHourly: readonly HourlyForecastPointDto[],
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (current && current.windSpeedKmh > STRONG_WIND_KMH) {
    alerts.push({
      id: "strong-wind-now",
      message: `Strong wind right now: ${Math.round(current.windSpeedKmh)} km/h.`,
    });
  }

  if (current && current.precipitationMm > HEAVY_RAIN_MM_PER_HOUR) {
    alerts.push({
      id: "heavy-rain-now",
      message: `Heavy rain right now: ${current.precipitationMm.toFixed(1)} mm/h.`,
    });
  }

  const upcomingHeavyRain = upcomingHourly
    .slice(0, UPCOMING_ALERT_WINDOW_HOURS)
    .some((point) => point.precipitationMm > HEAVY_RAIN_MM_PER_HOUR);

  if (upcomingHeavyRain) {
    alerts.push({
      id: "heavy-rain-upcoming",
      message: `Heavy rain expected in the next ${UPCOMING_ALERT_WINDOW_HOURS} hours.`,
    });
  }

  return alerts;
}
