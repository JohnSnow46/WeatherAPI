"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { speedUnitLabel, temperatureUnitLabel, toDisplaySpeed, toDisplayTemperature, type UnitSystem } from "@/lib/units";

type ColorStop = { value: number; color: string };

// Color stops are OpenWeatherMap's own published scale (openweathermap.org/map_legend,
// "Default styles for weather layers"), not re-derived -- pressure converted from the
// page's Pa values to hPa (/100) for a more familiar unit.
const WIND_STOPS: ColorStop[] = [
  { value: 1, color: "rgba(255,255,255,0)" },
  { value: 5, color: "rgba(238,206,206,0.4)" },
  { value: 15, color: "rgba(179,100,188,0.7)" },
  { value: 25, color: "rgba(63,33,59,0.8)" },
  { value: 50, color: "rgba(116,76,172,0.9)" },
  { value: 100, color: "rgba(70,0,175,1)" },
  { value: 200, color: "rgba(13,17,38,1)" },
];

const CLOUD_STOPS: ColorStop[] = [
  { value: 0, color: "rgba(255,255,255,0)" },
  { value: 50, color: "rgba(247,247,255,0.5)" },
  { value: 100, color: "rgba(240,240,255,1)" },
];

const PRESSURE_STOPS: ColorStop[] = [
  { value: 940, color: "rgba(0,115,255,1)" },
  { value: 960, color: "rgba(0,170,255,1)" },
  { value: 980, color: "rgba(75,208,214,1)" },
  { value: 1000, color: "rgba(141,231,199,1)" },
  { value: 1010, color: "rgba(176,247,32,1)" },
  { value: 1020, color: "rgba(240,184,0,1)" },
  { value: 1040, color: "rgba(251,85,21,1)" },
  { value: 1060, color: "rgba(243,54,59,1)" },
  { value: 1080, color: "rgba(198,0,0,1)" },
];

const TEMPERATURE_STOPS: ColorStop[] = [
  { value: -40, color: "rgba(130,22,146,1)" },
  { value: -30, color: "rgba(130,87,219,1)" },
  { value: -20, color: "rgba(32,140,236,1)" },
  { value: -10, color: "rgba(32,196,232,1)" },
  { value: 0, color: "rgba(35,221,221,1)" },
  { value: 10, color: "rgba(194,255,40,1)" },
  { value: 20, color: "rgba(255,240,40,1)" },
  { value: 25, color: "rgba(255,194,40,1)" },
  { value: 30, color: "rgba(252,128,20,1)" },
];

interface LegendEntry {
  overlayName: string;
  title: string;
  unit: string;
  stops: ColorStop[];
  labelValues: number[];
  /** Converts a stop value (in OWM's own unit) to the displayed label; identity when omitted. */
  formatValue?: (value: number) => number;
}

const KMH_PER_MS = 3.6;

// Stops stay in OWM's own units (they position the gradient); only the displayed
// labels follow the page's metric/imperial toggle. Metric keeps OWM's published
// m/s for wind rather than re-deriving km/h, imperial converts through lib/units.ts
// the same way every other number on the page does.
function gradientLegends(unit: UnitSystem): LegendEntry[] {
  const imperial = unit === "imperial";
  return [
    {
      overlayName: "Wind",
      title: "Wind",
      unit: imperial ? speedUnitLabel(unit) : "m/s",
      stops: WIND_STOPS,
      labelValues: [1, 15, 50, 200],
      formatValue: imperial ? (ms) => toDisplaySpeed(ms * KMH_PER_MS, unit) : undefined,
    },
    { overlayName: "Clouds", title: "Clouds", unit: "%", stops: CLOUD_STOPS, labelValues: [0, 50, 100] },
    { overlayName: "Pressure", title: "Pressure", unit: "hPa", stops: PRESSURE_STOPS, labelValues: [940, 1000, 1040, 1080] },
    {
      overlayName: "Temperature",
      title: "Temperature",
      unit: temperatureUnitLabel(unit),
      stops: TEMPERATURE_STOPS,
      labelValues: [-40, 0, 20, 30],
      formatValue: (celsius) => toDisplayTemperature(celsius, unit),
    },
  ];
}

const RADAR_OVERLAY_NAME = "Precipitation / storm radar";

function GradientSwatch({ title, unit, stops, labelValues, formatValue }: Omit<LegendEntry, "overlayName">) {
  const min = stops[0].value;
  const max = stops[stops.length - 1].value;
  const gradient = `linear-gradient(to right, ${stops
    .map((stop) => `${stop.color} ${(((stop.value - min) / (max - min)) * 100).toFixed(1)}%`)
    .join(", ")})`;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-primary">
        {title} ({unit})
      </span>
      <div className="h-2.5 w-full rounded-full border border-border" style={{ background: gradient }} />
      <div className="relative h-3 text-[10px] text-ink-muted">
        {labelValues.map((value) => (
          <span
            key={value}
            className="absolute -translate-x-1/2"
            style={{ left: `${(((value - min) / (max - min)) * 100).toFixed(1)}%` }}
          >
            {formatValue ? Math.round(formatValue(value)) : value}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Legend for the map's overlay layers, shown only for whichever overlays the viewer has
 * currently checked in `LayersControl`. Rendered as a real Leaflet control (not just an
 * absolutely-positioned React child) so it sits inside the map's own stacking context and
 * corner-positioning system -- `useMap()` only works for a descendant of `MapContainer`,
 * and Leaflet's corner containers live inside the map's own DOM, not the React tree around it.
 */
export function MapLegend({
  initialActiveOverlays = [],
  unit,
}: {
  initialActiveOverlays?: readonly string[];
  unit: UnitSystem;
}) {
  const map = useMap();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [activeOverlays, setActiveOverlays] = useState<ReadonlySet<string>>(() => new Set(initialActiveOverlays));

  useEffect(() => {
    const control = new L.Control({ position: "bottomleft" });
    control.onAdd = () => {
      const div = L.DomUtil.create("div");
      // Stop map pan/zoom gestures from firing when interacting with the legend panel.
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      setContainer(div);
      return div;
    };
    control.addTo(map);

    function handleOverlayAdd(event: L.LayersControlEvent) {
      setActiveOverlays((prev) => new Set(prev).add(event.name));
    }
    function handleOverlayRemove(event: L.LayersControlEvent) {
      setActiveOverlays((prev) => {
        const next = new Set(prev);
        next.delete(event.name);
        return next;
      });
    }

    map.on("overlayadd", handleOverlayAdd);
    map.on("overlayremove", handleOverlayRemove);

    return () => {
      map.off("overlayadd", handleOverlayAdd);
      map.off("overlayremove", handleOverlayRemove);
      control.remove();
    };
  }, [map]);

  if (!container) {
    return null;
  }

  const visibleGradientLegends = gradientLegends(unit).filter((legend) => activeOverlays.has(legend.overlayName));
  const showRadarLegend = activeOverlays.has(RADAR_OVERLAY_NAME);

  if (visibleGradientLegends.length === 0 && !showRadarLegend) {
    return null;
  }

  return createPortal(
    <div className="flex max-w-[12rem] flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
      {showRadarLegend && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-primary">Precipitation / storm radar</span>
          <div
            className="h-2.5 w-full rounded-full border border-border"
            style={{ background: "linear-gradient(to right, #6ec6ff, #3fa9f5, #3dd16b, #ffd400, #ff7a1a, #d6336c)" }}
          />
          <span className="text-[10px] text-ink-muted">
            Illustrative: light to heavy (RainViewer, Universal Blue palette)
          </span>
        </div>
      )}
      {visibleGradientLegends.map((legend) => (
        <GradientSwatch
          key={legend.overlayName}
          title={legend.title}
          unit={legend.unit}
          stops={legend.stops}
          labelValues={legend.labelValues}
          formatValue={legend.formatValue}
        />
      ))}
      <span className="text-[10px] text-ink-muted">Source: openweathermap.org/map_legend</span>
    </div>,
    container,
  );
}
