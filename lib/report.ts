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
      "Survey CSV rows were normalized and aggregated at ward or cluster level.",
      "Boundary GeoJSON was used for ward-aware spatial grouping and map visualization.",
      "Service adequacy was compared against benchmark targets for water, sanitation, electricity, roads, drainage, and waste.",
      "Satellite summary signals, when present, were used as contextual indicators for built-up pressure and environmental stress.",
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
      benchmarkTargets: ward.benchmarkTargets,
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