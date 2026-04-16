export type MetricKey =
  | "water"
  | "sanitation"
  | "electricity"
  | "road"
  | "drainage"
  | "waste";

export type BenchmarkProfile = {
  id: string;
  label: string;
  description: string;
  targets: Record<MetricKey, number>;
  weights: Record<MetricKey, number>;
};

const BENCHMARKS: Record<string, BenchmarkProfile> = {
  "urban-slum-v1": {
    id: "urban-slum-v1",
    label: "Urban Informal Settlement Benchmark v1",
    description:
      "Balanced benchmark for ward-level service adequacy in dense low-income settlements.",
    targets: {
      water: 85,
      sanitation: 80,
      electricity: 90,
      road: 75,
      drainage: 70,
      waste: 70,
    },
    weights: {
      water: 0.24,
      sanitation: 0.24,
      electricity: 0.16,
      road: 0.14,
      drainage: 0.12,
      waste: 0.10,
    },
  },
};

export function getBenchmarkProfile(profileId?: string) {
  return BENCHMARKS[profileId || "urban-slum-v1"] || BENCHMARKS["urban-slum-v1"];
}

export function getAllBenchmarks() {
  return Object.values(BENCHMARKS);
}