import { MetricKey } from "@/lib/benchmarks";
import { METRIC_LABELS } from "@/lib/constants";

export function buildShortExplanation(
  wardName: string,
  severity: string,
  topDeficits: Array<{ metric: MetricKey; gap: number }>
) {
  const topLabels = topDeficits
    .slice(0, 2)
    .map((item) => METRIC_LABELS[item.metric].toLowerCase())
    .join(" and ");

  return `${wardName} is classified as ${severity} priority mainly due to deficits in ${
    topLabels || "multiple services"
  }.`;
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
    (analysis.globalSummary?.criticalWards || 0) +
    (analysis.globalSummary?.highWards || 0);

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
      summary: `${ward.wardName} is marked ${ward.severity} priority because of weaker ${
        deficitText || "service coverage"
      } relative to the benchmark. Confidence for this ward is ${ward.confidence}.`,
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