import mongoose, { Schema, model, models } from "mongoose";

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "India" },
    track: {
      type: String,
      enum: ["industry", "societal", "r&d"],
      default: "societal",
    },
    benchmarkProfile: { type: String, default: "urban-slum-v1" },
    status: {
      type: String,
      enum: [
        "draft",
        "survey_uploaded",
        "boundary_uploaded",
        "data_ready",
        "analyzed",
        "reported",
      ],
      default: "draft",
    },
    survey: { type: Schema.Types.Mixed, default: null },
    boundary: { type: Schema.Types.Mixed, default: null },
    satellite: { type: Schema.Types.Mixed, default: null },
    currentAnalysisId: {
      type: Schema.Types.ObjectId,
      ref: "Analysis",
      default: null,
    },
    latestReportId: {
      type: Schema.Types.ObjectId,
      ref: "Report",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Project = models.Project || model("Project", ProjectSchema);
export default Project;