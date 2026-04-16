export const SERVICE_LABELS: Record<string, string> = {
  water: "Water",
  sanitation: "Sanitation",
  electricity: "Electricity",
  road: "Road",
  drainage: "Drainage",
  waste: "Waste",
};

export const METRIC_LABELS: Record<string, string> = {
  water: "Water Access",
  sanitation: "Sanitation",
  electricity: "Electricity",
  road: "Road Connectivity",
  drainage: "Drainage",
  waste: "Waste Management",
};

export const MAP_LAYER_OPTIONS = [
  { id: "overall", label: "Overall Priority" },
  { id: "water", label: "Water Gap" },
  { id: "sanitation", label: "Sanitation Gap" },
  { id: "electricity", label: "Electricity Gap" },
  { id: "road", label: "Road Gap" },
] as const;

export const SEVERITY_COLORS = {
  stable: "#10b981",
  moderate: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
  unknown: "#475569",
};

export const DEFAULT_BENCHMARK_PROFILE = "urban-slum-v1";
export const DEFAULT_BENCHMARK_LABEL = "Urban Informal Settlement Benchmark v1";

export const DEFAULT_GLOBAL_SUMMARY = {
  totalWards: 0,
  criticalWards: 0,
  highWards: 0,
  moderateWards: 0,
  stableWards: 0,
  averagePriorityScore: null,
  averageConfidence: null,
  averageServiceScores: {
    water: null,
    sanitation: null,
    electricity: null,
    road: null,
    drainage: null,
    waste: null,
  },
};