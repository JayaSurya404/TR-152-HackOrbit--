import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { buildProjectInsightsFromAnalysis } from "@/lib/analysis-engine";
import { getErrorMessage, toPlainJson } from "@/lib/utils";
import Project from "@/models/Project";
import Analysis from "@/models/Analysis";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { projectId, analysisId } = body;

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

    const analysis = analysisId
      ? await Analysis.findById(analysisId)
      : project.currentAnalysisId
      ? await Analysis.findById(project.currentAnalysisId)
      : null;

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    const insights = buildProjectInsightsFromAnalysis(
      {
        name: project.name,
        city: project.city,
        state: project.state,
      },
      {
        globalSummary: analysis.globalSummary,
        wardScores: analysis.wardScores,
        priorityInterventions: analysis.priorityInterventions,
      }
    );

    analysis.insights = insights;
    await analysis.save();

    return NextResponse.json({
      success: true,
      insights: toPlainJson(insights),
      analysis: toPlainJson(analysis),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}