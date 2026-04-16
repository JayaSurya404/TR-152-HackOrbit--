import { MetricKey } from "@/lib/benchmarks";
import { CanonicalSurveyRow } from "@/lib/csv";
import { NormalizedSatellitePayload, getWardSatelliteContext } from "@/lib/satellite";
import { averageNumber, clamp, roundNumber, severityBand } from "@/lib/utils";

export type ActualScores = Record<MetricKey, number | null>;
export type GapScores = Record<MetricKey, number>;

export function buildActualScores(rows: CanonicalSurveyRow[]): ActualScores {
  return {
    water: averageNumber(rows.map((row) => row.waterScore)),
    sanitation: averageNumber(rows.map((row) => row.sanitationScore)),
    electricity: averageNumber(rows.map((row) => row.electricityScore)),
    road: averageNumber(rows.map((row) => row.roadScore)),
    drainage: averageNumber(rows.map((row) => row.drainageScore)),
    waste: averageNumber(rows.map((row) => row.wasteScore)),
  };
}

export function calculateGap(actual: number | null, target: number) {
  if (actual === null) return roundNumber(target * 0.75, 2);
  return clamp(roundNumber(target - actual, 2), 0, 100);
}

export function buildGaps(
  actualScores: ActualScores,
  targets: Record<MetricKey, number>
): GapScores {
  return {
    water: calculateGap(actualScores.water, targets.water),
    sanitation: calculateGap(actualScores.sanitation, targets.sanitation),
    electricity: calculateGap(actualScores.electricity, targets.electricity),
    road: calculateGap(actualScores.road, targets.road),
    drainage: calculateGap(actualScores.drainage, targets.drainage),
    waste: calculateGap(actualScores.waste, targets.waste),
  };
}

export function calculatePriorityScore(
  gaps: GapScores,
  weights: Record<MetricKey, number>,
  builtUpPressure: number,
  environmentalStress: number
) {
  const weightedServices =
    gaps.water * weights.water +
    gaps.sanitation * weights.sanitation +
    gaps.electricity * weights.electricity +
    gaps.road * weights.road +
    gaps.drainage * weights.drainage +
    gaps.waste * weights.waste;

  const supportingPressure = builtUpPressure * 0.08 + environmentalStress * 0.06;

  return clamp(roundNumber(weightedServices + supportingPressure, 2), 0, 100);
}

export function computeConfidence(
  actualScores: ActualScores,
  rowCount: number,
  hasSatellite: boolean
) {
  const availableMetricCount = Object.values(actualScores).filter(
    (value) => value !== null
  ).length;

  const metricCoverage = (availableMetricCount / 6) * 70;
  const sampleCoverage = (Math.min(rowCount, 20) / 20) * 20;
  const satelliteBonus = hasSatellite ? 10 : 0;

  return clamp(roundNumber(metricCoverage + sampleCoverage + satelliteBonus, 2), 10, 100);
}

export function deriveBuiltUpPressure(
  satellite: NormalizedSatellitePayload | null | undefined,
  wardName: string,
  avgHouseholdSize: number | null
) {
  const satelliteContext = getWardSatelliteContext(satellite || null, wardName);

  return (
    satelliteContext?.builtUpDensity ??
    clamp((((avgHouseholdSize ?? 4.5) - 4) / 4) * 100, 12, 88)
  );
}

export function deriveEnvironmentalStress(
  satellite: NormalizedSatellitePayload | null | undefined,
  wardName: string
) {
  const satelliteContext = getWardSatelliteContext(satellite || null, wardName);

  return (
    averageNumber([
      satelliteContext?.vegetationScarcity ?? null,
      satelliteContext?.waterStress ?? null,
      satelliteContext?.roadVisibility !== null &&
      satelliteContext?.roadVisibility !== undefined
        ? 100 - satelliteContext.roadVisibility
        : null,
    ]) ?? 28
  );
}

export function simulateImprovedScores(
  actualScores: ActualScores,
  improvements: Partial<Record<MetricKey, number>>
): ActualScores {
  return {
    water: clamp((actualScores.water ?? 40) + (improvements.water || 0), 0, 100),
    sanitation: clamp((actualScores.sanitation ?? 40) + (improvements.sanitation || 0), 0, 100),
    electricity: clamp((actualScores.electricity ?? 50) + (improvements.electricity || 0), 0, 100),
    road: clamp((actualScores.road ?? 45) + (improvements.road || 0), 0, 100),
    drainage: clamp((actualScores.drainage ?? 40) + (improvements.drainage || 0), 0, 100),
    waste: clamp((actualScores.waste ?? 45) + (improvements.waste || 0), 0, 100),
  };
}

export function getSeverityFromPriority(score: number) {
  return severityBand(score);
}