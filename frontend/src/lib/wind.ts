const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

// Meteorological convention: the direction the wind blows FROM, 0° = north, clockwise.
// Eight points is enough for a one-glance label; anything finer reads as noise in a tile.
export function compassDirection(degrees: number): string {
  if (!Number.isFinite(degrees)) {
    return "";
  }
  const normalized = ((degrees % 360) + 360) % 360;
  return COMPASS_POINTS[Math.round(normalized / 45) % COMPASS_POINTS.length];
}
