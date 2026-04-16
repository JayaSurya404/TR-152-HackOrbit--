import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { computeAnalysis, buildProjectInsightsFromAnalysis } from "@/lib/analysis-engine";
import { getErrorMessage, toPlainJson } from "@/lib/utils";
import Project from "@/models/Project";
import Analysis from "@/models/Analysis";

export const runtime = "nodejs";

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
      benchmarkProfileId: project.benchmarkProfile,
      satellite: project.satellite?.mode === "summary" ? project.satellite : null,
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