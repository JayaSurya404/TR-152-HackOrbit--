import Papa from "papaparse";
import {
  asNumber,
  normalizeKey,
  scoreFromMixed,
  toTitleCase,
} from "@/lib/utils";

export type CanonicalSurveyRow = {
  wardName: string;
  waterScore: number | null;
  sanitationScore: number | null;
  electricityScore: number | null;
  roadScore: number | null;
  drainageScore: number | null;
  wasteScore: number | null;
  householdSize: number | null;
  sourceRow: Record<string, unknown>;
};

const HEADER_ALIASES = {
  wardName: [
    "ward",
    "wardname",
    "ward_name",
    "cluster",
    "clustername",
    "cluster_name",
    "area",
    "area_name",
    "zone",
    "locality",
    "settlement",
    "settlement_name",
    "habitation",
    "name",
  ],
  waterScore: [
    "water",
    "wateraccess",
    "water_access",
    "wateravailability",
    "tapwater",
    "drinkingwater",
    "watersupply",
    "watercoverage",
  ],
  sanitationScore: [
    "sanitation",
    "sanitationaccess",
    "sanitation_access",
    "toilet",
    "toiletaccess",
    "toilet_access",
    "toiletcoverage",
  ],
  electricityScore: [
    "electricity",
    "electricityaccess",
    "electricity_access",
    "power",
    "poweraccess",
    "power_access",
    "lighting",
  ],
  roadScore: [
    "road",
    "roadaccess",
    "road_access",
    "roadcondition",
    "road_condition",
    "streetaccess",
    "street_access",
    "connectivity",
  ],
  drainageScore: [
    "drainage",
    "drainageaccess",
    "drainage_access",
    "drainagecondition",
    "drainage_condition",
    "stormwater",
  ],
  wasteScore: [
    "waste",
    "wastedisposal",
    "waste_disposal",
    "solidwaste",
    "garbage",
    "garbagecollection",
    "wastemanagement",
  ],
  householdSize: [
    "householdsize",
    "household_size",
    "familysize",
    "family_size",
    "members",
    "population",
    "hhsize",
    "hh_size",
  ],
};

function findHeader(
  headers: string[],
  aliases: string[]
): string | null {
  const normalizedMap = new Map<string, string>();

  for (const header of headers) {
    normalizedMap.set(normalizeKey(header), header);
  }

  for (const alias of aliases) {
    const found = normalizedMap.get(normalizeKey(alias));
    if (found) return found;
  }

  return null;
}

export function parseSurveyCsv(csvText: string) {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length) {
    throw new Error(parsed.errors[0]?.message || "CSV parsing failed");
  }

  const rows = parsed.data || [];
  const headers = parsed.meta.fields || [];

  const aliasMap = {
    wardName: findHeader(headers, HEADER_ALIASES.wardName),
    waterScore: findHeader(headers, HEADER_ALIASES.waterScore),
    sanitationScore: findHeader(headers, HEADER_ALIASES.sanitationScore),
    electricityScore: findHeader(headers, HEADER_ALIASES.electricityScore),
    roadScore: findHeader(headers, HEADER_ALIASES.roadScore),
    drainageScore: findHeader(headers, HEADER_ALIASES.drainageScore),
    wasteScore: findHeader(headers, HEADER_ALIASES.wasteScore),
    householdSize: findHeader(headers, HEADER_ALIASES.householdSize),
  };

  const warnings: string[] = [];

  if (!aliasMap.wardName) {
    warnings.push("Ward/cluster/area column not detected. Rows will be grouped as Unassigned.");
  }

  const metricFields = [
    "waterScore",
    "sanitationScore",
    "electricityScore",
    "roadScore",
    "drainageScore",
    "wasteScore",
  ] as const;

  for (const field of metricFields) {
    if (!aliasMap[field]) {
      warnings.push(`Metric column not detected for ${field}.`);
    }
  }

  const normalizedRows: CanonicalSurveyRow[] = rows.map((row, index) => {
    const wardRaw =
      (aliasMap.wardName ? row[aliasMap.wardName] : "") || `Unassigned ${index + 1}`;

    const householdRaw = aliasMap.householdSize
      ? row[aliasMap.householdSize]
      : null;

    return {
      wardName: toTitleCase(String(wardRaw || `Unassigned ${index + 1}`)),
      waterScore: aliasMap.waterScore ? scoreFromMixed(row[aliasMap.waterScore]) : null,
      sanitationScore: aliasMap.sanitationScore
        ? scoreFromMixed(row[aliasMap.sanitationScore])
        : null,
      electricityScore: aliasMap.electricityScore
        ? scoreFromMixed(row[aliasMap.electricityScore])
        : null,
      roadScore: aliasMap.roadScore ? scoreFromMixed(row[aliasMap.roadScore]) : null,
      drainageScore: aliasMap.drainageScore
        ? scoreFromMixed(row[aliasMap.drainageScore])
        : null,
      wasteScore: aliasMap.wasteScore ? scoreFromMixed(row[aliasMap.wasteScore]) : null,
      householdSize: asNumber(householdRaw),
      sourceRow: row,
    };
  });

  return {
    headers,
    rowCount: rows.length,
    rows,
    normalizedRows,
    aliasMap,
    warnings,
    preview: rows.slice(0, 5),
  };
}