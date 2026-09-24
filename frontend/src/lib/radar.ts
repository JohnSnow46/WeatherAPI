const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5230";

export type RadarFrameDto = {
  time: number;
  path: string;
};

export type RadarInfoDto = {
  host: string;
  past: RadarFrameDto[];
  nowcast: RadarFrameDto[];
};

// Mirrors the backend's own Polly timeout policy (10s per upstream attempt,
// see PollyPolicies.GetTimeoutPolicy) — without this, `fetch` has no default
// timeout at all, so a hung backend request would leave the radar overlay
// pending indefinitely instead of just being omitted from the map.
const REQUEST_TIMEOUT_MS = 15_000;

export async function getRadarInfo(): Promise<RadarInfoDto> {
  const response = await fetch(`${API_BASE_URL}/api/weather/radar-tiles`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to load radar info (status ${response.status}).`);
  }

  return response.json() as Promise<RadarInfoDto>;
}

// RainViewer tile URL scheme: {host}{path}/{size}/{z}/{x}/{y}/{color}/{options}.png
// size=256, color=2 (universal blue palette), options=1_1 (smooth + snow).
export function radarTileUrlTemplate(host: string, path: string): string {
  return `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;
}
