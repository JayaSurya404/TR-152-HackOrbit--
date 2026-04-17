"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L, { type LatLngBoundsExpression, type PathOptions } from "leaflet";
import { Layers3 } from "lucide-react";

import type { AnalysisPayload, GeoFeatureCollection } from "@/types/workspace";
import { MAP_LAYER_OPTIONS } from "@/lib/constants";

type MetricMode =
  | "overall"
  | "water"
  | "sanitation"
  | "electricity"
  | "road";

type BaseMode = "satellite" | "street";
type AdminScope = "ward" | "village" | "overall";

type InteractiveMapClientProps = {
  boundaryGeoJson: GeoFeatureCollection | null;
  analysis: AnalysisPayload | null;
  selectedWardName: string;
  onSelectWard: (wardName: string) => void;
  searchHighlightGeoJson: GeoFeatureCollection | null;
  selectedUnitName: string;
  adminScope?: AdminScope;
};

function getGeometryBounds(
  geojson: GeoFeatureCollection
): LatLngBoundsExpression | null {
  const layer = L.geoJSON(geojson as any);
  const bounds = layer.getBounds();

  if (!bounds.isValid()) return null;
  return bounds;
}

function isPathLayer(layer: L.Layer): layer is L.Path {
  return layer instanceof L.Path;
}

function FitPriority({
  searchGeoJson,
  projectGeoJson,
}: {
  searchGeoJson: GeoFeatureCollection | null;
  projectGeoJson: GeoFeatureCollection | null;
}) {
  const map = useMap();

  const bounds = useMemo(() => {
    if (searchGeoJson?.features?.length) return getGeometryBounds(searchGeoJson);
    if (projectGeoJson?.features?.length) return getGeometryBounds(projectGeoJson);
    return null;
  }, [searchGeoJson, projectGeoJson]);

  useEffect(() => {
    if (!bounds) return;

    map.fitBounds(bounds, {
      padding: [30, 30],
      maxZoom: 14,
    });
  }, [bounds, map]);

  return null;
}

function getColor(score?: number | null) {
  if (score === null || score === undefined) return "#64748b";
  if (score >= 65) return "#ef4444";
  if (score >= 45) return "#f97316";
  if (score >= 25) return "#f59e0b";
  return "#22c55e";
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
  return (
    MAP_LAYER_OPTIONS.find((item) => item.id === mode)?.label ||
    "Overall Priority"
  );
}

function getFeatureName(feature: any) {
  return String(
    feature?.properties?.__wardName ||
      feature?.properties?.ward_name ||
      feature?.properties?.ward ||
      feature?.properties?.name ||
      "Unknown"
  );
}

export default function InteractiveMapClient({
  boundaryGeoJson,
  analysis,
  selectedWardName,
  onSelectWard,
  searchHighlightGeoJson,
  selectedUnitName,
  adminScope,
}: InteractiveMapClientProps) {
  void adminScope;

  const geoJsonRef = useRef<L.GeoJSON<any> | null>(null);

  const [metricMode, setMetricMode] = useState<MetricMode>("overall");
  const [baseMode, setBaseMode] = useState<BaseMode>("street");

  const wardMap = useMemo(() => {
    const map = new Map<string, any>();

    for (const ward of analysis?.wardScores || []) {
      map.set(String(ward.wardName || "").toLowerCase(), ward);
    }

    return map;
  }, [analysis]);

  const getFeatureStyle = (feature: any): PathOptions => {
    const featureName = getFeatureName(feature);
    const ward = wardMap.get(featureName.toLowerCase());
    const score = getMetricValue(ward, metricMode);

    const isSelectedByWard =
      !!selectedWardName &&
      featureName.toLowerCase() === selectedWardName.toLowerCase();

    const isSelectedByFilter =
      !!selectedUnitName &&
      featureName.toLowerCase() === selectedUnitName.toLowerCase();

    const isFocused = isSelectedByWard || isSelectedByFilter;
    const faded = Boolean(selectedUnitName) && !isFocused;

    return {
      color: isFocused ? "#ffffff" : "rgba(255,255,255,0.30)",
      weight: isFocused ? 3.5 : 1.2,
      fillColor: getColor(score),
      fillOpacity: faded ? 0.05 : isFocused ? 0.82 : 0.48,
    };
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        zoomControl={false}
        className="h-full w-full"
      >
        <ZoomControl position="bottomright" />

        {baseMode === "satellite" ? (
          <>
            <TileLayer
              attribution="&copy; OpenStreetMap contributors &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={0.14}
            />
          </>
        ) : (
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        <FitPriority
          searchGeoJson={searchHighlightGeoJson}
          projectGeoJson={boundaryGeoJson}
        />

        {searchHighlightGeoJson?.features?.length ? (
          <GeoJSON
            key={`search-${selectedUnitName || "none"}`}
            data={searchHighlightGeoJson as any}
            style={() => ({
              color: "#22d3ee",
              weight: 3,
              fillColor: "#22d3ee",
              fillOpacity: 0.05,
            })}
          />
        ) : null}

        {boundaryGeoJson?.features?.length ? (
          <GeoJSON
            key={`boundary-${metricMode}-${selectedWardName || "none"}-${selectedUnitName || "none"}`}
            ref={geoJsonRef}
            data={boundaryGeoJson as any}
            style={(feature: any) => getFeatureStyle(feature)}
            onEachFeature={(feature: any, layer: L.Layer) => {
              const featureName = getFeatureName(feature);
              const ward = wardMap.get(featureName.toLowerCase());

              layer.on({
                click: () => onSelectWard(featureName),
                mouseover: () => {
                  if (!isPathLayer(layer)) return;

                  layer.setStyle({
                    weight: 3.5,
                    fillOpacity: 0.84,
                  });
                },
                mouseout: () => {
                  if (!isPathLayer(layer)) return;

                  if (geoJsonRef.current) {
                    geoJsonRef.current.resetStyle(layer);
                    return;
                  }

                  layer.setStyle(getFeatureStyle(feature));
                },
              });

              const metricValue = getMetricValue(ward, metricMode);

              if ("bindTooltip" in layer && typeof layer.bindTooltip === "function") {
                layer.bindTooltip(
                  `
                    <div class="map-tooltip-card">
                      <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${featureName}</div>
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
              }
            }}
          />
        ) : null}
      </MapContainer>

      <div className="absolute right-4 top-4 z-[740] w-[min(560px,calc(100vw-2rem))] rounded-[28px] liquid-glass px-4 py-4">
        <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-white">
          <Layers3 className="h-4 w-4 text-cyan-200" />
          Layers
        </div>

        <div className="flex flex-wrap gap-2">
          {MAP_LAYER_OPTIONS.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setMetricMode(mode.id as MetricMode)}
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                metricMode === mode.id
                  ? "bg-cyan-400/22 text-cyan-100 ring-1 ring-cyan-300/28"
                  : "bg-white/[0.08] text-slate-100 ring-1 ring-white/12"
              }`}
            >
              {mode.label}
            </button>
          ))}

          <div className="mx-1 h-10 w-px self-center bg-white/10" />

          <button
            onClick={() => setBaseMode("satellite")}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
              baseMode === "satellite"
                ? "bg-emerald-400/22 text-emerald-100 ring-1 ring-emerald-300/28"
                : "bg-white/[0.08] text-slate-100 ring-1 ring-white/12"
            }`}
          >
            Satellite
          </button>

          <button
            onClick={() => setBaseMode("street")}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
              baseMode === "street"
                ? "bg-emerald-400/22 text-emerald-100 ring-1 ring-emerald-300/28"
                : "bg-white/[0.08] text-slate-100 ring-1 ring-white/12"
            }`}
          >
            Street
          </button>
        </div>
      </div>
    </div>
  );
}