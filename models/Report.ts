import mongoose, { Schema, model, models } from "mongoose";

const AnalysisSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    projectName: { type: String, required: true },
    benchmarkProfile: { type: String, required: true },
    benchmarkLabel: { type: String, required: true },
    globalSummary: { type: Schema.Types.Mixed, required: true },
    wardScores: { type: [Schema.Types.Mixed], default: [] },
    priorityInterventions: { type: [Schema.Types.Mixed], default: [] },
    insights: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  }
);

const Analysis = models.Analysis || model("Analysis", AnalysisSchema);
export default Analysis;