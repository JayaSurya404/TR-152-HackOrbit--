export type Severity = "critical" | "high" | "moderate" | "stable" | string;

export type ProjectSummary = {
  _id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  track?: string;
  benchmarkProfile?: string;
  status?: string;
  survey?: {
    rowCount?: number;
  } | null;
  boundary?: {
    featureCount?: number;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type GeoFeature = {
  type: "Feature";
  properties?: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
  };
};

export type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

export type ProjectDetail = ProjectSummary & {
  survey?: {
    filename?: string;
    rowCount?: number;
    headers?: string[];
    aliasMap?: Record<string, string | null>;
    warnings?: string[];
    preview?: Record<string, unknown>[];
    normalizedRows?: Array<Record<string, unknown>>;
    uploadedAt?: string;
  } | null;
  boundary?: {
    filename?: string;
    featureCount?: number;
    wardPropertyKey?: string | null;
    wardNames?: string[];
    previewWardNames?: string[];
    geojson?: GeoFeatureCollection;
    uploadedAt?: string;
  } | null;
  satellite?: {
    mode?: string;
    summary?: {
      global?: Record<string, number | null>;
      byWard?: Array<Record<string, any>>;
    };
    warnings?: string[];
    uploadedAt?: string;
    filename?: string;
    note?: string;
  } | null;
  currentAnalysisId?: string | null;
  latestReportId?: string | null;
};

export type WardScore = {
  wardName: string;
  rowCount: number;
  actualScores: Record<string, number | null>;
  benchmarkTargets: Record<string, number>;
  gaps: Record<string, number>;
  supporting?: {
    avgHouseholdSize?: number | null;
    builtUpPressure?: number | null;
    environmentalStress?: number | null;
    satelliteContext?: Record<string, any> | null;
  };
  priorityScore: number;
  severity: Severity;
  confidence: number;
  topDeficits: Array<{
    metric: string;
    gap: number;
  }>;
  explanation?: string;
  recommendedActions: Array<{
    wardName: string;
    metric: string;
    metricLabel: string;
    title: string;
    description: string;
    gapValue: number;
    urgency: string;
    costTier: string;
    estimatedPriorityDrop: number;
  }>;
};

export type AnalysisPayload = {
  _id: string;
  projectId?: string;
  projectName?: string;
  benchmarkProfile: string;
  benchmarkLabel: string;
  globalSummary: {
    totalWards?: number;
    criticalWards?: number;
    highWards?: number;
    moderateWards?: number;
    stableWards?: number;
    averagePriorityScore?: number | null;
    averageConfidence?: number | null;
    averageServiceScores?: Record<string, number | null>;
    generatedAt?: string;
  };
  wardScores: WardScore[];
  priorityInterventions: Array<{
    rank: number;
    wardName: string;
    metric: string;
    metricLabel: string;
    title: string;
    description: string;
    gapValue: number;
    urgency: string;
    costTier: string;
    estimatedPriorityDrop: number;
  }>;
  insights?: {
    executiveSummary?: string;
    wardNarratives?: Array<{
      wardName: string;
      summary: string;
    }>;
    recommendationSummary?: string;
    generatedAt?: string;
  } | null;
};

export type ReportPayload = {
  _id: string;
  title: string;
  executiveSummary: string;
  methodology: string[];
  keyStats?: Record<string, unknown> | null;
  wardFindings: Array<Record<string, unknown>>;
  priorityActions: Array<Record<string, unknown>>;
  nextSteps: string[];
  generatedAt: string;
};

export type SimulationPayload = {
  wardName: string;
  before: {
    actualScores: Record<string, number | null>;
    gaps: Record<string, number>;
    priorityScore: number;
    severity: Severity;
  };
  after: {
    actualScores: Record<string, number | null>;
    gaps: Record<string, number>;
    priorityScore: number;
    severity: Severity;
  };
  improvementDelta: number;
  appliedImprovements: Record<string, number>;
};