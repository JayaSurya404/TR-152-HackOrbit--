import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { buildReportPayload } from "@/lib/analysis-engine";
import { getErrorMessage, toPlainJson } from "@/lib/utils";
import Project from "@/models/Project";
import Analysis from "@/models/Analysis";
import Report from "@/models/Report";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const projectId = request.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId query parameter is required" },
        { status: 400 }
      );
    }

    const report = await Report.findOne({ projectId }).sort({ createdAt: -1 }).lean();

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report: toPlainJson(report),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

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

    const payload = buildReportPayload(
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

    const report = await Report.findOneAndUpdate(
      {
        projectId: project._id,
        analysisId: analysis._id,
      },
      payload,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    project.latestReportId = report._id;
    project.status = "reported";
    await project.save();

    return NextResponse.json({
      success: true,
      report: toPlainJson(report),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}