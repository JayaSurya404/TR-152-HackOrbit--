import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { simulateWardImprovement } from "@/lib/analysis-engine";
import { getErrorMessage, toPlainJson } from "@/lib/utils";
import Project from "@/models/Project";
import Analysis from "@/models/Analysis";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { projectId, wardName, improvements } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { success: false, error: "projectId is required" },
        { status: 400 }
      );
    }

    if (!wardName || typeof wardName !== "string") {
      return NextResponse.json(
        { success: false, error: "wardName is required" },
        { status: 400 }
      );
    }

    const project = await Project.findById(projectId);
    if (!project || !project.currentAnalysisId) {
      return NextResponse.json(
        { success: false, error: "Project or latest analysis not found" },
        { status: 404 }
      );
    }

    const analysis = await Analysis.findById(project.currentAnalysisId);
    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    const ward = (analysis.wardScores || []).find(
      (item: any) => item.wardName.toLowerCase() === wardName.toLowerCase()
    );

    if (!ward) {
      return NextResponse.json(
        { success: false, error: "Ward not found in analysis" },
        { status: 404 }
      );
    }

    const simulation = simulateWardImprovement({
      ward,
      benchmarkProfileId: project.benchmarkProfile,
      improvements: improvements || {},
    });

    return NextResponse.json({
      success: true,
      simulation: toPlainJson(simulation),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}