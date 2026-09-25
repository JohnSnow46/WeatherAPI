export type UnitSystem = "metric" | "imperial";

const CELSIUS_TO_FAHRENHEIT_FACTOR = 9 / 5;
const CELSIUS_TO_FAHRENHEIT_OFFSET = 32;
const KMH_PER_MPH = 1.609344;
const MM_PER_INCH = 25.4;

export function toDisplayTemperature(celsius: number, unit: UnitSystem): number {
  return unit === "imperial" ? celsius * CELSIUS_TO_FAHRENHEIT_FACTOR + CELSIUS_TO_FAHRENHEIT_OFFSET : celsius;
}

export function toDisplaySpeed(kmh: number, unit: UnitSystem): number {
  return unit === "imperial" ? kmh / KMH_PER_MPH : kmh;
}

export function toDisplayPrecipitation(mm: number, unit: UnitSystem): number {
  return unit === "imperial" ? mm / MM_PER_INCH : mm;
}

export function temperatureUnitLabel(unit: UnitSystem): string {
  return unit === "imperial" ? "°F" : "°C";
}

export function speedUnitLabel(unit: UnitSystem): string {
  return unit === "imperial" ? "mph" : "km/h";
}

export function precipitationUnitLabel(unit: UnitSystem): string {
  return unit === "imperial" ? "in" : "mm";
}
