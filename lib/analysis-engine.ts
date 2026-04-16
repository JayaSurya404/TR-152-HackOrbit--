import { getBenchmarkProfile, MetricKey } from "@/lib/benchmarks";
import { CanonicalSurveyRow } from "@/lib/csv";
import { NormalizedSatellitePayload, getWardSatelliteContext } from "@/lib/satellite";
import {
  averageNumber,
  clamp,
  roundNumber,
  severityBand,
  toTitleCase,
  uniqueStrings,
} from "@/lib/utils";

type BoundaryGeoJson = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties?: Record<string, unknown>;
    geometry: {
      type: string;
      coordinates: unknown;
    };
  }>;
};

type ActualScores = Record<MetricKey, number | null>;
type GapScores = Record<MetricKey, number>;

const METRIC_LABELS: Record<MetricKey, string> = {
  water: "Water Access",
  sanitation: "Sanitation",
  electricity: "Electricity",
  road: "Road Connectivity",
  drainage: "Drainage",
  waste: "Waste Management",
};

function buildActualScores(rows: CanonicalSurveyRow[]): ActualScores {
  return {
    water: averageNumber(rows.map((row) => row.waterScore)),
    sanitation: averageNumber(rows.map((row) => row.sanitationScore)),
    electricity: averageNumber(rows.map((row) => row.electricityScore)),
    road: averageNumber(rows.map((row) => row.roadScore)),
    drainage: averageNumber(rows.map((row) => row.drainageScore)),
    waste: averageNumber(rows.map((row) => row.wasteScore)),
  };
}

function calculateGap(actual: number | null, target: number) {
  if (actual === null) return roundNumber(target * 0.75, 2);
  return clamp(roundNumber(target - actual, 2), 0, 100);
}

function buildGaps(actualScores: ActualScores, targets: Record<MetricKey, number>): GapScores {
  return {
    water: calculateGap(actualScores.water, targets.water),
    sanitation: calculateGap(actualScores.sanitation, targets.sanitation),
    electricity: calculateGap(actualScores.electricity, targets.electricity),
    road: calculateGap(actualScores.road, targets.road),
    drainage: calculateGap(actualScores.drainage, targets.drainage),
    waste: calculateGap(actualScores.waste, targets.waste),
  };
}

function calculatePriorityScore(
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

function computeConfidence(
  actualScores: ActualScores,
  rowCount: number,
  hasSatellite: boolean
) {
  const availableMetricCount = Object.values(actualScores).filter(
    (value) => value !== null
  ).length;

  const metricCoverage = (availableMetricCount / 6) * 70;
  const sampleCoverage = Math.min(rowCount, 20) / 20 * 20;
  const satelliteBonus = hasSatellite ? 10 : 0;

  return clamp(roundNumber(metricCoverage + sampleCoverage + satelliteBonus, 2), 10, 100);
}

function buildWardActions(
  wardName: string,
  gaps: GapScores,
  weights: Record<MetricKey, number>
) {
  const actionTemplates: Record<
    MetricKey,
    { title: string; description: string; costTier: "low" | "medium" | "high" }
  > = {
    water: {
      title: "Improve reliable water access",
      description:
        "Expand piped supply, repair intermittent supply points, or strengthen shared standpost access.",
      costTier: "medium",
    },
    sanitation: {
      title: "Upgrade sanitation coverage",
      description:
        "Prioritize toilets, septic upgrades, and safe sanitation facilities in underserved clusters.",
      costTier: "high",
    },
    electricity: {
      title: "Close electricity access gap",
      description:
        "Formalize household connections, improve street-light coverage, and address unsafe wiring zones.",
      costTier: "medium",
    },
    road: {
      title: "Strengthen last-mile road connectivity",
      description:
        "Target internal street access, paving, and mobility bottlenecks for service vehicles and residents.",
      costTier: "high",
    },
    drainage: {
      title: "Improve drainage resilience",
      description:
        "Address stagnant water and runoff bottlenecks through drains, desilting, and flood-path clearance.",
      costTier: "medium",
    },
    waste: {
      title: "Improve waste collection coverage",
      description:
        "Increase collection frequency, designated disposal points, and community waste handling support.",
      costTier: "low",
    },
  };

  const ranked = Object.entries(gaps)
    .map(([metric, gap]) => ({
      metric: metric as MetricKey,
      gap,
    }))
    .sort((a, b) => b.gap - a.gap)
    .filter((item) => item.gap > 5)
    .slice(0, 3);

  return ranked.map((item) => {
    const template = actionTemplates[item.metric];
    const estimatedPriorityDrop = roundNumber(item.gap * (weights[item.metric] + 0.18), 2);

    return {
      wardName,
      metric: item.metric,
      metricLabel: METRIC_LABELS[item.metric],
      title: template.title,
      description: template.description,
      gapValue: item.gap,
      urgency:
        item.gap >= 35 ? "immediate" : item.gap >= 20 ? "priority" : "planned",
      costTier: template.costTier,
      estimatedPriorityDrop,
    };
  });
}

function buildShortExplanation(
  wardName: string,
  severity: string,
  topDeficits: Array<{ metric: MetricKey; gap: number }>
) {
  const topLabels = topDeficits
    .slice(0, 2)
    .map((item) => METRIC_LABELS[item.metric].toLowerCase())
    .join(" and ");

  return `${wardName} is classified as ${severity} priority mainly due to deficits in ${topLabels || "multiple services"}.`;
}

export function computeAnalysis(params: {
  surveyRows: CanonicalSurveyRow[];
  boundaryGeoJson?: BoundaryGeoJson | null;
  benchmarkProfileId?: string;
  satellite?: NormalizedSatellitePayload | null;
}) {
  const { surveyRows, boundaryGeoJson, benchmarkProfileId, satellite } = params;
  const benchmark = getBenchmarkProfile(benchmarkProfileId);

  const groupedSurvey = surveyRows.reduce<Record<string, CanonicalSurveyRow[]>>((acc, row) => {
    const wardName = toTitleCase(row.wardName || "Unassigned");
    if (!acc[wardName]) acc[wardName] = [];
    acc[wardName].push({ ...row, wardName });
    return acc;
  }, {});

  const boundaryWardNames =
    boundaryGeoJson?.features?.map((feature) =>
      String(feature.properties?.__wardName || "")
    ) || [];

  const allWardNames = uniqueStrings([
    ...Object.keys(groupedSurvey),
    ...boundaryWardNames,
  ]);

  if (!allWardNames.length) {
    throw new Error("No ward or cluster names detected for analysis");
  }

  const wardScores = allWardNames
    .map((wardName) => {
      const rows = groupedSurvey[wardName] || [];
      const actualScores = buildActualScores(rows);
      const avgHouseholdSize = averageNumber(rows.map((row) => row.householdSize));
      const satelliteContext = getWardSatelliteContext(satellite || null, wardName);

      const builtUpPressure =
        satelliteContext?.builtUpDensity ??
        clamp(((avgHouseholdSize ?? 4.5) - 4) / 4 * 100, 12, 88);

      const environmentalStress =
        averageNumber([
          satelliteContext?.vegetationScarcity ?? null,
          satelliteContext?.waterStress ?? null,
          satelliteContext?.roadVisibility !== null &&
          satelliteContext?.roadVisibility !== undefined
            ? 100 - satelliteContext.roadVisibility
            : null,
        ]) ?? 28;

      const gaps = buildGaps(actualScores, benchmark.targets);

      const priorityScore = calculatePriorityScore(
        gaps,
        benchmark.weights,
        builtUpPressure,
        environmentalStress
      );

      const severity = severityBand(priorityScore);

      const confidence = computeConfidence(
        actualScores,
        rows.length,
        !!satelliteContext
      );

      const topDeficits = Object.entries(gaps)
        .map(([metric, gap]) => ({
          metric: metric as MetricKey,
          gap,
        }))
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 3);

      const recommendedActions = buildWardActions(
        wardName,
        gaps,
        benchmark.weights
      );

      return {
        wardName,
        rowCount: rows.length,
        actualScores,
        benchmarkTargets: benchmark.targets,
        gaps,
        supporting: {
          avgHouseholdSize,
          builtUpPressure: roundNumber(builtUpPressure, 2),
          environmentalStress: roundNumber(environmentalStress, 2),
          satelliteContext,
        },
        priorityScore,
        severity,
        confidence,
        topDeficits,
        explanation: buildShortExplanation(wardName, severity, topDeficits),
        recommendedActions,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const priorityInterventions = wardScores
    .flatMap((ward) => ward.recommendedActions.slice(0, 2))
    .sort((a, b) => b.estimatedPriorityDrop - a.estimatedPriorityDrop)
    .slice(0, 12)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  const globalSummary = {
    totalWards: wardScores.length,
    criticalWards: wardScores.filter((item) => item.severity === "critical").length,
    highWards: wardScores.filter((item) => item.severity === "high").length,
    moderateWards: wardScores.filter((item) => item.severity === "moderate").length,
    stableWards: wardScores.filter((item) => item.severity === "stable").length,
    averagePriorityScore: averageNumber(wardScores.map((item) => item.priorityScore)),
    averageConfidence: averageNumber(wardScores.map((item) => item.confidence)),
    averageServiceScores: {
      water: averageNumber(wardScores.map((item) => item.actualScores.water)),
      sanitation: averageNumber(wardScores.map((item) => item.actualScores.sanitation)),
      electricity: averageNumber(wardScores.map((item) => item.actualScores.electricity)),
      road: averageNumber(wardScores.map((item) => item.actualScores.road)),
      drainage: averageNumber(wardScores.map((item) => item.actualScores.drainage)),
      waste: averageNumber(wardScores.map((item) => item.actualScores.waste)),
    },
    benchmarkProfile: benchmark.id,
    benchmarkLabel: benchmark.label,
    generatedAt: new Date().toISOString(),
  };

  return {
    benchmarkProfile: benchmark.id,
    benchmarkLabel: benchmark.label,
    globalSummary,
    wardScores,
    priorityInterventions,
  };
}

export function buildProjectInsightsFromAnalysis(
  project: { name: string; city?: string; state?: string },
  analysis: {
    globalSummary: any;
    wardScores: any[];
    priorityInterventions: any[];
  }
) {
  const topWard = analysis.wardScores[0];
  const criticalOrHigh =
    (analysis.globalSummary.criticalWards || 0) +
    (analysis.globalSummary.highWards || 0);

  const executiveSummary = `${project.name} analysis identified ${criticalOrHigh} wards in high or critical priority. ${
    topWard
      ? `${topWard.wardName} currently shows the highest intervention urgency with a priority score of ${topWard.priorityScore}.`
      : ""
  }`;

  const wardNarratives = analysis.wardScores.slice(0, 8).map((ward) => {
    const deficitText = ward.topDeficits
      .slice(0, 2)
      .map((item: { metric: MetricKey }) => METRIC_LABELS[item.metric].toLowerCase())
      .join(" and ");

    return {
      wardName: ward.wardName,
      summary: `${ward.wardName} is marked ${ward.severity} priority because of weaker ${deficitText || "service coverage"} relative to the benchmark. Confidence for this ward is ${ward.confidence}.`,
    };
  });

  const recommendationSummary = analysis.priorityInterventions
    .slice(0, 5)
    .map((item) => `${item.wardName}: ${item.title}`)
    .join("; ");

  return {
    executiveSummary,
    wardNarratives,
    recommendationSummary,
    generatedAt: new Date().toISOString(),
  };
}

export function buildReportPayload(
  project: {
    _id?: string;
    name: string;
    city?: string;
    state?: string;
    country?: string;
    benchmarkProfile?: string;
  },
  analysis: {
    _id?: string;
    globalSummary: any;
    wardScores: any[];
    priorityInterventions: any[];
    insights?: any;
  }
) {
  return {
    projectId: project._id,
    analysisId: analysis._id,
    title: `${project.name} Infrastructure Gap Assessment`,
    executiveSummary:
      analysis.insights?.executiveSummary ||
      `${project.name} shows concentrated infrastructure gaps across priority wards, with the highest deficits clustered in water, sanitation, and local access conditions.`,
    methodology: [
      "Survey CSV rows were normalized and aggregated at ward/cluster level.",
      "Boundary GeoJSON was used for ward-aware spatial grouping and map visualization.",
      "Service adequacy was compared against benchmark targets for water, sanitation, electricity, roads, drainage, and waste.",
      "Satellite summary signals, when present, were used as supporting contextual indicators for built-up pressure and environmental stress.",
      "Priority interventions were ranked by estimated score reduction and service urgency.",
    ],
    keyStats: analysis.globalSummary,
    wardFindings: analysis.wardScores.map((ward) => ({
      wardName: ward.wardName,
      priorityScore: ward.priorityScore,
      severity: ward.severity,
      confidence: ward.confidence,
      topDeficits: ward.topDeficits,
      actualScores: ward.actualScores,
      recommendedActions: ward.recommendedActions,
    })),
    priorityActions: analysis.priorityInterventions,
    nextSteps: [
      "Validate highest-risk wards with field teams or municipal officers.",
      "Shortlist immediate low-cost interventions for severe wards.",
      "Use ward comparison mode to sequence medium-term investments.",
      "Regenerate analysis after updated survey or satellite context is available.",
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function simulateWardImprovement(params: {
  ward: any;
  benchmarkProfileId?: string;
  improvements: Partial<Record<MetricKey, number>>;
}) {
  const { ward, benchmarkProfileId, improvements } = params;
  const benchmark = getBenchmarkProfile(benchmarkProfileId);

  const beforeActual = ward.actualScores as ActualScores;

  const afterActual: ActualScores = {
    water: clamp((beforeActual.water ?? 40) + (improvements.water || 0), 0, 100),
    sanitation: clamp((beforeActual.sanitation ?? 40) + (improvements.sanitation || 0), 0, 100),
    electricity: clamp((beforeActual.electricity ?? 50) + (improvements.electricity || 0), 0, 100),
    road: clamp((beforeActual.road ?? 45) + (improvements.road || 0), 0, 100),
    drainage: clamp((beforeActual.drainage ?? 40) + (improvements.drainage || 0), 0, 100),
    waste: clamp((beforeActual.waste ?? 45) + (improvements.waste || 0), 0, 100),
  };

  const beforeGaps = buildGaps(beforeActual, benchmark.targets);
  const afterGaps = buildGaps(afterActual, benchmark.targets);

  const beforePriority = calculatePriorityScore(
    beforeGaps,
    benchmark.weights,
    ward.supporting?.builtUpPressure || 30,
    ward.supporting?.environmentalStress || 25
  );

  const afterPriority = calculatePriorityScore(
    afterGaps,
    benchmark.weights,
    ward.supporting?.builtUpPressure || 30,
    ward.supporting?.environmentalStress || 25
  );

  return {
    wardName: ward.wardName,
    before: {
      actualScores: beforeActual,
      gaps: beforeGaps,
      priorityScore: beforePriority,
      severity: severityBand(beforePriority),
    },
    after: {
      actualScores: afterActual,
      gaps: afterGaps,
      priorityScore: afterPriority,
      severity: severityBand(afterPriority),
    },
    improvementDelta: roundNumber(beforePriority - afterPriority, 2),
    appliedImprovements: improvements,
  };
}