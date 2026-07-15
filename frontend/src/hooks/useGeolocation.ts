"use client";

import { useCallback, useMemo, useState } from "react";

type GeolocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; latitude: number; longitude: number }
  | { status: "error"; message: string };

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: "idle" });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "error", message: "Geolocation is not supported by this browser." });
      return;
    }

    setState({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: "success",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setState({ status: "error", message: error.message || "Location permission was denied." });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // Memoized so consumers can depend on the whole returned object without
  // the effect re-running every render (it would otherwise be a fresh
  // object literal each time, even though `request` itself is stable).
  return useMemo(() => ({ state, request }), [state, request]);
}
