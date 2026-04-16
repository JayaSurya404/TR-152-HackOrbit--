"use client";

import { useMemo } from "react";
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L, { LatLngBoundsExpression } from "leaflet";
import { AlertTriangle, MapPinned } from "lucide-react";
import { AnalysisPayload, GeoFeatureCollection } from "@/types/workspace";

type InteractiveMapClientProps = {
  boundaryGeoJson: GeoFeatureCollection | null;
  analysis: AnalysisPayload | null;
  selectedWardName: string;
  onSelectWard: (wardName: string) => void;
};

function getScoreColor(score?: number) {
  if (score === undefined || score === null) return "#4b5563";
  if (score >= 65) return "#ef4444";
  if (score >= 45) return "#f97316";
  if (score >= 25) return "#f59e0b";
  return "#10b981";
}

function getGeometryBounds(geojson: GeoFeatureCollection): LatLngBoundsExpression | null {
  const layer = L.geoJSON(geojson as any);
  const bounds = layer.getBounds();
  if (!bounds.isValid()) return null;
  return bounds;
}

function FitToGeoJson({ geojson }: { geojson: GeoFeatureCollection }) {
  const map = useMap();

  const bounds = useMemo(() => getGeometryBounds(geojson), [geojson]);

  if (bounds) {
    map.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: 15,
    });
  }

  return null;
}

export default function InteractiveMapClient({
  boundaryGeoJson,
  analysis,
  selectedWardName,
  onSelectWard,
}: InteractiveMapClientProps) {
  const wardMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const ward of analysis?.wardScores || []) {
      map.set(ward.wardName.toLowerCase(), ward);
    }
    return map;
  }, [analysis]);

  const hasMap = Boolean(boundaryGeoJson?.features?.length);

  const center = useMemo<[number, number]>(() => {
    if (!boundaryGeoJson) return [10.80, 78.69];
    const first = boundaryGeoJson.features?.[0];
    const coords = first?.geometry?.coordinates;
    const sample =
      Array.isArray(coords) &&
      Array.isArray(coords[0]) &&
      Array.isArray(coords[0][0]) &&
      Array.isArray(coords[0][0][0])
        ? coords[0][0][0]
        : Array.isArray(coords) &&
          Array.isArray(coords[0]) &&
          Array.isArray(coords[0][0])
        ? coords[0][0]
        : null;

    if (sample && typeof sample[1] === "number" && typeof sample[0] === "number") {
      return [sample[1], sample[0]];
    }

    return [10.80, 78.69];
  }, [boundaryGeoJson]);

  if (!hasMap) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-slate-950/20 px-6 text-center">
        <MapPinned className="h-10 w-10 text-cyan-200" />
        <h3 className="mt-4 text-lg font-semibold text-white">
          Boundary map not loaded
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
          Upload a ward or cluster GeoJSON to render the choropleth map and clickable
          service-deficit polygons.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-[24px]">
      <MapContainer
        center={center}
        zoom={13}
        zoomControl={false}
        className="h-full w-full"
      >
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.22}
        />

        {boundaryGeoJson ? <FitToGeoJson geojson={boundaryGeoJson} /> : null}

        <GeoJSON
          data={boundaryGeoJson as any}
          style={(feature: any) => {
            const wardName = String(
              feature?.properties?.__wardName ||
                feature?.properties?.ward_name ||
                feature?.properties?.ward ||
                feature?.properties?.name ||
                ""
            );

            const match = wardMap.get(wardName.toLowerCase());
            const score = match?.priorityScore;
            const isSelected =
              selectedWardName &&
              wardName.toLowerCase() === selectedWardName.toLowerCase();

            return {
              color: isSelected ? "#ffffff" : "rgba(255,255,255,0.35)",
              weight: isSelected ? 3 : 1.4,
              fillColor: getScoreColor(score),
              fillOpacity: isSelected ? 0.66 : 0.52,
            };
          }}
          onEachFeature={(feature: any, layer) => {
            const wardName = String(
              feature?.properties?.__wardName ||
                feature?.properties?.ward_name ||
                feature?.properties?.ward ||
                feature?.properties?.name ||
                "Unknown"
            );

            const match = wardMap.get(wardName.toLowerCase());

            layer.on({
              click: () => onSelectWard(wardName),
              mouseover: () => layer.setStyle({ weight: 3, fillOpacity: 0.7 }),
              mouseout: () => {
                const isSelected =
                  selectedWardName &&
                  wardName.toLowerCase() === selectedWardName.toLowerCase();

                layer.setStyle({
                  weight: isSelected ? 3 : 1.4,
                  fillOpacity: isSelected ? 0.66 : 0.52,
                });
              },
            });

            layer.bindTooltip(
              `
                <div class="map-tooltip-card">
                  <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${wardName}</div>
                  <div style="font-size:12px;opacity:0.9;">Priority: ${match?.priorityScore ?? "--"}</div>
                  <div style="font-size:12px;opacity:0.9;">Severity: ${match?.severity ?? "--"}</div>
                  <div style="font-size:12px;opacity:0.9;">Rows: ${match?.rowCount ?? 0}</div>
                </div>
              `,
              {
                sticky: true,
                direction: "top",
                opacity: 1,
              }
            );
          }}
        />
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 z-[500] max-w-xs rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
          <div>
            <p className="text-sm font-semibold text-white">Severity Legend</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                Stable
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                Moderate
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-500" />
                High
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                Critical
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}