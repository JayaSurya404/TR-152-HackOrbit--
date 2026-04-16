import { toTitleCase } from "@/lib/utils";

type GeoJsonFeature = {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

const PROPERTY_CANDIDATES = [
  "ward",
  "ward_name",
  "wardname",
  "name",
  "cluster",
  "cluster_name",
  "area",
  "area_name",
  "zone",
  "id",
  "gid",
  "objectid",
];

export function parseBoundaryGeoJson(input: string | Record<string, unknown>) {
  const parsed =
    typeof input === "string" ? (JSON.parse(input) as Record<string, unknown>) : input;

  let featureCollection: GeoJsonFeatureCollection;

  if (parsed.type === "FeatureCollection" && Array.isArray(parsed.features)) {
    featureCollection = parsed as GeoJsonFeatureCollection;
  } else if (parsed.type === "Feature") {
    featureCollection = {
      type: "FeatureCollection",
      features: [parsed as GeoJsonFeature],
    };
  } else {
    throw new Error("Boundary file must be a valid GeoJSON FeatureCollection or Feature");
  }

  const firstFeature = featureCollection.features[0];
  const firstProps = firstFeature?.properties || {};

  let wardPropertyKey: string | null = null;

  for (const key of Object.keys(firstProps)) {
    if (PROPERTY_CANDIDATES.includes(key.toLowerCase())) {
      wardPropertyKey = key;
      break;
    }
  }

  const normalizedFeatures = featureCollection.features.map((feature, index) => {
    const props = feature.properties || {};
    const inferredName =
      (wardPropertyKey ? props[wardPropertyKey] : null) || `Ward ${index + 1}`;

    return {
      ...feature,
      properties: {
        ...props,
        __wardName: toTitleCase(String(inferredName)),
      },
    };
  });

  const wardNames = normalizedFeatures.map((feature) =>
    String(feature.properties?.__wardName || "")
  );

  return {
    geojson: {
      type: "FeatureCollection",
      features: normalizedFeatures,
    },
    featureCount: normalizedFeatures.length,
    wardPropertyKey,
    wardNames,
    previewWardNames: wardNames.slice(0, 10),
  };
}