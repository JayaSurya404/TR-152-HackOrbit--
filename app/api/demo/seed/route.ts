import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  buildProjectInsightsFromAnalysis,
  buildReportPayload,
  computeAnalysis,
} from "@/lib/analysis-engine";
import { getDemoSeed } from "@/lib/demo-data";
import { getErrorMessage, toPlainJson } from "@/lib/utils";
import Project from "@/models/Project";
import Analysis from "@/models/Analysis";
import Report from "@/models/Report";

export const runtime = "nodejs";

export async function POST() {
  try {
    await connectDB();

    const seed = getDemoSeed();

    const project = await Project.create({
      ...seed.project,
      survey: seed.survey,
      boundary: seed.boundary,
      satellite: seed.satellite,
    });

    const computed = computeAnalysis({
      surveyRows: seed.survey.normalizedRows,
      boundaryGeoJson: seed.boundary.geojson as any,
      benchmarkProfileId: project.benchmarkProfile,
      satellite: seed.satellite as any,
    });

    const insights = buildProjectInsightsFromAnalysis(
      {
        name: project.name,
        city: project.city,
        state: project.state,
      },
      computed
    );

    const analysis = await Analysis.create({
      projectId: project._id,
      projectName: project.name,
      benchmarkProfile: computed.benchmarkProfile,
      benchmarkLabel: computed.benchmarkLabel,
      globalSummary: computed.globalSummary,
      wardScores: computed.wardScores,
      priorityInterventions: computed.priorityInterventions,
      insights,
    });

    const reportPayload = buildReportPayload(
      {
        _id: String(project._id),
        name: project.name,
        city: project.city,
        state: project.state,
        country: project.country,
        benchmarkProfile: project.benchmarkProfile,
      },
      {
        _id: String(analysis._id),
        globalSummary: analysis.globalSummary,
        wardScores: analysis.wardScores,
        priorityInterventions: analysis.priorityInterventions,
        insights: analysis.insights,
      }
    );

    const report = await Report.create(reportPayload);

    project.currentAnalysisId = analysis._id;
    project.latestReportId = report._id;
    project.status = "reported";
    await project.save();

    return NextResponse.json({
      success: true,
      message: "Demo project created successfully",
      projectId: String(project._id),
      analysisId: String(analysis._id),
      reportId: String(report._id),
      project: toPlainJson(project),
      analysis: toPlainJson(analysis),
      report: toPlainJson(report),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}