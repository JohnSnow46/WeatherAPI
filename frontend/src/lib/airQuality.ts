// Open-Meteo's european_aqi is a 0-100+ index on the EU Common Air Quality
// Index scale; banding per Open-Meteo's own documentation for that field.
export type AirQualityLevel = {
  label: string;
  colorClass: string;
};

export function describeEuropeanAqi(aqi: number): AirQualityLevel {
  if (aqi <= 20) return { label: "Good", colorClass: "text-emerald-600" };
  if (aqi <= 40) return { label: "Fair", colorClass: "text-lime-600" };
  if (aqi <= 60) return { label: "Moderate", colorClass: "text-amber-600" };
  if (aqi <= 80) return { label: "Poor", colorClass: "text-orange-600" };
  if (aqi <= 100) return { label: "Very poor", colorClass: "text-red-600" };
  return { label: "Extremely poor", colorClass: "text-red-800" };
}
