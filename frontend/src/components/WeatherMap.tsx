"use client";

import L from "leaflet";
import { MapContainer, TileLayer, LayersControl, Marker, Popup } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { mapTileUrlTemplate, type MapTileLayer } from "@/lib/api";
import { getRadarInfo, radarTileUrlTemplate } from "@/lib/radar";
import type { SelectedLocation } from "@/lib/location";

// Bundlers break Leaflet's default marker icon path resolution; point it at
// the CDN-hosted images instead of trying to bundle leaflet/dist/images.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const OWM_ATTRIBUTION = '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>';

// OpenWeatherMap's global weather layers are low-resolution; capping native
// tile requests here (rather than the whole map's maxZoom) lets Leaflet
// upscale the last real tile instead of disabling zoom-in entirely.
const OWM_LAYERS: { layer: MapTileLayer; name: string; checked?: boolean }[] = [
  { layer: "wind_new", name: "Wind" },
  { layer: "clouds_new", name: "Clouds" },
  { layer: "pressure_new", name: "Pressure" },
  { layer: "temp_new", name: "Temperature" },
];

export function WeatherMap({ location }: { location: SelectedLocation }) {
  const { data: radarInfo } = useQuery({
    queryKey: ["radar-info"],
    queryFn: getRadarInfo,
  });

  const latestPastFrame = radarInfo?.past.at(-1);

  return (
    <section className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border shadow-sm">
      <MapContainer
        // MapContainer doesn't react to a changed `center` prop after mount,
        // so key it on the coordinates to remount when the location changes.
        key={`${location.latitude}-${location.longitude}`}
        center={[location.latitude, location.longitude]}
        zoom={7}
        maxZoom={19}
        scrollWheelZoom={false}
        style={{ height: "400px", width: "100%" }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          {latestPastFrame && (
            <LayersControl.Overlay checked name="Precipitation / storm radar">
              <TileLayer
                attribution='Radar &copy; <a href="https://www.rainviewer.com/">RainViewer</a>'
                url={radarTileUrlTemplate(radarInfo!.host, latestPastFrame.path)}
                opacity={0.6}
                // RainViewer only has real tiles up to this zoom; beyond it,
                // Leaflet upscales the last native tile instead of capping
                // the whole map's zoom (which `maxZoom` would do).
                maxNativeZoom={12}
                maxZoom={19}
              />
            </LayersControl.Overlay>
          )}

          {OWM_LAYERS.map(({ layer, name, checked }) => (
            <LayersControl.Overlay key={layer} checked={checked} name={name}>
              <TileLayer
                attribution={OWM_ATTRIBUTION}
                url={mapTileUrlTemplate(layer)}
                opacity={0.7}
                maxNativeZoom={9}
                maxZoom={19}
              />
            </LayersControl.Overlay>
          ))}
        </LayersControl>

        <Marker position={[location.latitude, location.longitude]}>
          <Popup>{location.label}</Popup>
        </Marker>
      </MapContainer>
    </section>
  );
}
