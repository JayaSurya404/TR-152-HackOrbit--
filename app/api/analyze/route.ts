import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  computeAnalysis,
  buildProjectInsightsFromAnalysis,
} from "@/lib/analysis-engine";
import { getErrorMessage, toPlainJson } from "@/lib/utils";
import Project from "@/models/Project";
import Analysis from "@/models/Analysis";

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

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { projectId } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { success: false, error: "projectId is required" },
        { status: 400 }
      );
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const normalizedRows = project.survey?.normalizedRows || [];

    if (!normalizedRows.length) {
      return NextResponse.json(
        { success: false, error: "Survey data is required before analysis" },
        { status: 400 }
      );
    }

    const computed = computeAnalysis({
      surveyRows: normalizedRows,
      boundaryGeoJson: project.boundary?.geojson || null,
      benchmarkProfileId: String(project.benchmarkProfile || "urban-slum-v1"),
      satellite: project.satellite?.mode === "summary" ? project.satellite : null,
    });

    const benchmarkProfile = String(
      computed?.benchmarkProfile || project.benchmarkProfile || "urban-slum-v1"
    );

    const benchmarkLabel = String(
      computed?.benchmarkLabel || "Urban Informal Settlement Benchmark v1"
    );

    const globalSummary =
      computed?.globalSummary || createFallbackGlobalSummary(benchmarkProfile, benchmarkLabel);

    const wardScores = Array.isArray(computed?.wardScores) ? computed.wardScores : [];
    const priorityInterventions = Array.isArray(computed?.priorityInterventions)
      ? computed.priorityInterventions
      : [];

    const insights = buildProjectInsightsFromAnalysis(
      {
        name: String(project.name || "Untitled Project"),
        city: String(project.city || ""),
        state: String(project.state || ""),
      },
      {
        globalSummary,
        wardScores,
        priorityInterventions,
      }
    );

    const analysisPayload = {
      projectId: project._id,
      projectName: String(project.name || "Untitled Project"),
      benchmarkProfile,
      benchmarkLabel,
      globalSummary,
      wardScores,
      priorityInterventions,
      insights,
    };

    const analysis = new Analysis(analysisPayload);
    await analysis.save();

    project.currentAnalysisId = analysis._id;
    project.status = "analyzed";
    await project.save();

    return NextResponse.json({
      success: true,
      message: "Analysis generated successfully",
      analysis: toPlainJson(analysis),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}