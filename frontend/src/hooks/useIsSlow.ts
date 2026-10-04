"use client";

import { useEffect, useState } from "react";

export function useIsSlow(isPending: boolean, thresholdMs = 5000): boolean {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isPending) {
      return;
    }
    const timer = window.setTimeout(() => setIsSlow(true), thresholdMs);
    return () => {
      window.clearTimeout(timer);
      setIsSlow(false);
    };
  }, [isPending, thresholdMs]);

  return isPending && isSlow;
}
