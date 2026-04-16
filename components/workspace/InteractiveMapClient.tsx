"use client";

import { useMemo, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L, { LatLngBoundsExpression } from "leaflet";
import { AlertTriangle, Layers3, MapPinned } from "lucide-react";
import { AnalysisPayload, GeoFeatureCollection } from "@/types/workspace";

type InteractiveMapClientProps = {
  boundaryGeoJson: GeoFeatureCollection | null;
  analysis: AnalysisPayload | null;
  selectedWardName: string;
  onSelectWard: (wardName: string) => void;
};

type MetricMode = "overall" | "water" | "sanitation" | "electricity" | "road";
type BaseMode = "satellite" | "street";

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

function getColor(score?: number | null) {
  if (score === null || score === undefined) return "#475569";
  if (score >= 65) return "#ef4444";
  if (score >= 45) return "#f97316";
  if (score >= 25) return "#f59e0b";
  return "#10b981";
}

function getMetricValue(ward: any, mode: MetricMode) {
  if (!ward) return null;

  if (mode === "overall") return ward.priorityScore ?? null;
  if (mode === "water") return ward.gaps?.water ?? null;
  if (mode === "sanitation") return ward.gaps?.sanitation ?? null;
  if (mode === "electricity") return ward.gaps?.electricity ?? null;
  if (mode === "road") return ward.gaps?.road ?? null;

  return ward.priorityScore ?? null;
}

function getMetricLabel(mode: MetricMode) {
  if (mode === "overall") return "Overall Priority";
  if (mode === "water") return "Water Gap";
  if (mode === "sanitation") return "Sanitation Gap";
  if (mode === "electricity") return "Electricity Gap";
  return "Road Gap";
}

export default function InteractiveMapClient({
  boundaryGeoJson,
  analysis,
  selectedWardName,
  onSelectWard,
}: InteractiveMapClientProps) {
  const [metricMode, setMetricMode] = useState<MetricMode>("overall");
  const [baseMode, setBaseMode] = useState<BaseMode>("satellite");

  const wardMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const ward of analysis?.wardScores || []) {
      map.set(String(ward.wardName || "").toLowerCase(), ward);
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
          Click <span className="font-semibold text-white">Demo Seed</span> or upload a
          ward GeoJSON to render the choropleth map and clickable service-deficit polygons.
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

        {baseMode === "satellite" ? (
          <>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={0.22}
            />
          </>
        ) : (
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

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

            const ward = wardMap.get(wardName.toLowerCase());
            const score = getMetricValue(ward, metricMode);
            const isSelected =
              selectedWardName &&
              wardName.toLowerCase() === selectedWardName.toLowerCase();

            return {
              color: isSelected ? "#ffffff" : "rgba(255,255,255,0.32)",
              weight: isSelected ? 3 : 1.4,
              fillColor: getColor(score),
              fillOpacity: isSelected ? 0.72 : 0.58,
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

            const ward = wardMap.get(wardName.toLowerCase());

            layer.on({
              click: () => onSelectWard(wardName),
              mouseover: () => layer.setStyle({ weight: 3, fillOpacity: 0.78 }),
              mouseout: () => {
                const isSelected =
                  selectedWardName &&
                  wardName.toLowerCase() === selectedWardName.toLowerCase();

                layer.setStyle({
                  weight: isSelected ? 3 : 1.4,
                  fillOpacity: isSelected ? 0.72 : 0.58,
                });
              },
            });

            const metricValue = getMetricValue(ward, metricMode);

            layer.bindTooltip(
              `
                <div class="map-tooltip-card">
                  <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${wardName}</div>
                  <div style="font-size:12px;opacity:0.92;">${getMetricLabel(metricMode)}: ${metricValue ?? "--"}</div>
                  <div style="font-size:12px;opacity:0.92;">Severity: ${ward?.severity ?? "--"}</div>
                  <div style="font-size:12px;opacity:0.92;">Rows: ${ward?.rowCount ?? 0}</div>
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

      <div className="absolute left-4 top-4 z-[500] flex max-w-[calc(100%-32px)] flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/75 p-3 backdrop-blur-xl">
        <div className="mr-2 inline-flex items-center gap-2 text-xs font-medium text-white">
          <Layers3 className="h-4 w-4 text-cyan-200" />
          Layers
        </div>

        {(["overall", "water", "sanitation", "electricity", "road"] as MetricMode[]).map(
          (mode) => (
            <button
              key={mode}
              onClick={() => setMetricMode(mode)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                metricMode === mode
                  ? "bg-cyan-400/18 text-cyan-100 ring-1 ring-cyan-300/25"
                  : "bg-white/[0.05] text-slate-200 ring-1 ring-white/10"
              }`}
            >
              {getMetricLabel(mode)}
            </button>
          )
        )}

        <div className="mx-1 h-6 w-px bg-white/10" />

        <button
          onClick={() => setBaseMode("satellite")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            baseMode === "satellite"
              ? "bg-emerald-400/18 text-emerald-100 ring-1 ring-emerald-300/25"
              : "bg-white/[0.05] text-slate-200 ring-1 ring-white/10"
          }`}
        >
          Satellite
        </button>

        <button
          onClick={() => setBaseMode("street")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            baseMode === "street"
              ? "bg-emerald-400/18 text-emerald-100 ring-1 ring-emerald-300/25"
              : "bg-white/[0.05] text-slate-200 ring-1 ring-white/10"
          }`}
        >
          Street
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] max-w-xs rounded-2xl border border-white/10 bg-slate-950/75 p-4 backdrop-blur-xl">
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
            <p className="mt-3 text-xs leading-5 text-slate-300">
              Overlay now shows: <span className="font-semibold text-white">{getMetricLabel(metricMode)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}