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

function createFallbackGlobalSummary(
  benchmarkProfile = "urban-slum-v1",
  benchmarkLabel = "Urban Informal Settlement Benchmark v1"
) {
  return {
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
    benchmarkProfile,
    benchmarkLabel,
    generatedAt: new Date().toISOString(),
  };
}

function getDemoProjectName() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `Tensor Demo Settlement ${hh}-${mm}-${ss}`;
}

export async function POST() {
  try {
    await connectDB();

    const seed = getDemoSeed();

    const project = await Project.create({
      ...seed.project,
      name: getDemoProjectName(),
      survey: seed.survey,
      boundary: seed.boundary,
      satellite: seed.satellite,
      status: "data_ready",
    });

    const computed = computeAnalysis({
      surveyRows: seed.survey.normalizedRows,
      boundaryGeoJson: seed.boundary.geojson as any,
      benchmarkProfileId: String(project.benchmarkProfile || "urban-slum-v1"),
      satellite: seed.satellite as any,
    });

    const benchmarkProfile = String(
      computed?.benchmarkProfile || project.benchmarkProfile || "urban-slum-v1"
    );

    const benchmarkLabel = String(
      computed?.benchmarkLabel || "Urban Informal Settlement Benchmark v1"
    );

    const globalSummary =
      computed?.globalSummary ||
      createFallbackGlobalSummary(benchmarkProfile, benchmarkLabel);

    const wardScores = Array.isArray(computed?.wardScores)
      ? computed.wardScores
      : [];

    const priorityInterventions = Array.isArray(computed?.priorityInterventions)
      ? computed.priorityInterventions
      : [];

    const insights = buildProjectInsightsFromAnalysis(
      {
        name: String(project.name || "Tensor Demo Settlement"),
        city: String(project.city || ""),
        state: String(project.state || ""),
      },
      {
        globalSummary,
        wardScores,
        priorityInterventions,
      }
    );

    const analysis = await Analysis.create({
      projectId: project._id,
      projectName: String(project.name || "Tensor Demo Settlement"),
      benchmarkProfile,
      benchmarkLabel,
      globalSummary,
      wardScores,
      priorityInterventions,
      insights,
    });

    const reportPayload = buildReportPayload(
      {
        _id: String(project._id),
        name: String(project.name || "Tensor Demo Settlement"),
        city: String(project.city || ""),
        state: String(project.state || ""),
        country: String(project.country || "India"),
        benchmarkProfile,
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
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}