import { Schema, model, models } from "mongoose";

const ReportSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: "Analysis",
      default: null,
    },
    title: {
      type: String,
      default: "",
      required: true,
      trim: true,
    },
    executiveSummary: {
      type: String,
      default: "",
    },
    methodology: {
      type: [String],
      default: [],
    },
    keyStats: {
      type: Schema.Types.Mixed,
      default: null,
    },
    wardFindings: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    priorityActions: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    nextSteps: {
      type: [String],
      default: [],
    },
    generatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: true,
  }
);

const Report = models.Report || model("Report", ReportSchema);

export default Report;