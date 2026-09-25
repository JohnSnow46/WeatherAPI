"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { UnitSystem } from "@/lib/units";

const STORAGE_KEY = "weathermap:unit-system";

// Defaults to metric whenever nothing (valid) is stored yet, rather than
// exposing the raw nullable value from useLocalStorage to every consumer.
export function useUnitPreference(): readonly [UnitSystem, (next: UnitSystem) => void] {
  const [stored, setStored] = useLocalStorage<UnitSystem>(STORAGE_KEY);
  const unit: UnitSystem = stored === "imperial" ? "imperial" : "metric";
  return [unit, setStored] as const;
}
