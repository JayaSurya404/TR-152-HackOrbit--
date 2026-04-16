import { Schema, model, models } from "mongoose";

const defaultGlobalSummary = {
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
  benchmarkProfile: "urban-slum-v1",
  benchmarkLabel: "Urban Informal Settlement Benchmark v1",
  generatedAt: new Date().toISOString(),
};

const AnalysisSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    projectName: {
      type: String,
      default: "Untitled Project",
      required: true,
      trim: true,
    },
    benchmarkProfile: {
      type: String,
      default: "urban-slum-v1",
      required: true,
    },
    benchmarkLabel: {
      type: String,
      default: "Urban Informal Settlement Benchmark v1",
      required: true,
    },
    globalSummary: {
      type: Schema.Types.Mixed,
      default: () => ({
        ...defaultGlobalSummary,
        generatedAt: new Date().toISOString(),
      }),
      required: true,
    },
    wardScores: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    priorityInterventions: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    insights: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Analysis = models.Analysis || model("Analysis", AnalysisSchema);

export default Analysis;