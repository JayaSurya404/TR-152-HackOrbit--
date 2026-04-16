import { asNumber, clamp, toTitleCase } from "@/lib/utils";

export type WardSatelliteContext = {
  wardName: string;
  builtUpDensity: number | null;
  vegetationScarcity: number | null;
  waterStress: number | null;
  roadVisibility: number | null;
  confidence: number | null;
};

export type NormalizedSatellitePayload = {
  mode: "summary";
  summary: {
    global: {
      builtUpDensity: number | null;
      vegetationScarcity: number | null;
      waterStress: number | null;
      roadVisibility: number | null;
      confidence: number | null;
    };
    byWard: WardSatelliteContext[];
  };
  warnings: string[];
  uploadedAt: string;
};

function normalizeScore(value: unknown) {
  const numberValue = asNumber(value);
  if (numberValue === null) return null;
  return clamp(numberValue, 0, 100);
}

export function normalizeSatelliteSummary(input: Record<string, unknown>): NormalizedSatellitePayload {
  const source = (input.summary as Record<string, unknown>) || input;

  const global = {
    builtUpDensity: normalizeScore(source.builtUpDensity),
    vegetationScarcity: normalizeScore(source.vegetationScarcity),
    waterStress: normalizeScore(source.waterStress),
    roadVisibility: normalizeScore(source.roadVisibility),
    confidence: normalizeScore(source.confidence),
  };

  const byWardInput = Array.isArray(source.byWard) ? source.byWard : [];

  const byWard: WardSatelliteContext[] = byWardInput.map((item) => {
    const entry = item as Record<string, unknown>;

    return {
      wardName: toTitleCase(String(entry.wardName || entry.ward || entry.name || "Unknown")),
      builtUpDensity: normalizeScore(entry.builtUpDensity),
      vegetationScarcity: normalizeScore(entry.vegetationScarcity),
      waterStress: normalizeScore(entry.waterStress),
      roadVisibility: normalizeScore(entry.roadVisibility),
      confidence: normalizeScore(entry.confidence),
    };
  });

  const warnings: string[] = [];

  if (!byWard.length) {
    warnings.push("No ward-level satellite summary detected. Global summary will be used.");
  }

  return {
    mode: "summary",
    summary: {
      global,
      byWard,
    },
    warnings,
    uploadedAt: new Date().toISOString(),
  };
}

export function getWardSatelliteContext(
  payload: NormalizedSatellitePayload | null | undefined,
  wardName: string
) {
  if (!payload) return null;

  const match = payload.summary.byWard.find(
    (item) => item.wardName.toLowerCase() === wardName.toLowerCase()
  );

  if (match) return match;

  return {
    wardName,
    builtUpDensity: payload.summary.global.builtUpDensity,
    vegetationScarcity: payload.summary.global.vegetationScarcity,
    waterStress: payload.summary.global.waterStress,
    roadVisibility: payload.summary.global.roadVisibility,
    confidence: payload.summary.global.confidence,
  };
}