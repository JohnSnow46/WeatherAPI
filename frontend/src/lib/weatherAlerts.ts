import type { CurrentWeatherDto, HourlyForecastPointDto } from "@/lib/api";
import {
  precipitationUnitLabel,
  speedUnitLabel,
  toDisplayPrecipitation,
  toDisplaySpeed,
  type UnitSystem,
} from "@/lib/units";

export type WeatherAlert = {
  id: string;
  message: string;
};

const STRONG_WIND_KMH = 50;
const HEAVY_RAIN_MM_PER_HOUR = 10;
const UPCOMING_ALERT_WINDOW_HOURS = 6;

// Pure, client-side threshold checks over data the app already fetches for
// CurrentWeatherCard/ForecastPanel -- the backend-free option from
// docs/roadmap.md #4, so no new DTO fields or endpoint are needed. Thresholds
// themselves stay in metric (the DTOs are always km/h/mm) -- only the
// rendered message text respects `unit`, same as CurrentWeatherCard/ForecastPanel.
export function evaluateWeatherAlerts(
  current: CurrentWeatherDto | undefined,
  upcomingHourly: readonly HourlyForecastPointDto[],
  unit: UnitSystem,
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (current && current.windSpeedKmh > STRONG_WIND_KMH) {
    alerts.push({
      id: "strong-wind-now",
      message: `Strong wind right now: ${Math.round(toDisplaySpeed(current.windSpeedKmh, unit))} ${speedUnitLabel(unit)}.`,
    });
  }

  if (current && current.precipitationMm > HEAVY_RAIN_MM_PER_HOUR) {
    alerts.push({
      id: "heavy-rain-now",
      message: `Heavy rain right now: ${toDisplayPrecipitation(current.precipitationMm, unit).toFixed(unit === "imperial" ? 2 : 1)} ${precipitationUnitLabel(unit)}/h.`,
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
