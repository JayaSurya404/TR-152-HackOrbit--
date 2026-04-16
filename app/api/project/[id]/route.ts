import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getErrorMessage, toPlainJson } from "@/lib/utils";
import Project from "@/models/Project";
import Analysis from "@/models/Analysis";
import Report from "@/models/Report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext =
  | {
      params?: Promise<{ id?: string }> | { id?: string };
    }
  | undefined;

async function resolveProjectId(context?: RouteContext) {
  const params = await context?.params;
  const id = params?.id;

  if (!id || typeof id !== "string") {
    return null;
  }

  return id;
}

export async function GET(_request: Request, context?: RouteContext) {
  try {
    await connectDB();

    const id = await resolveProjectId(context);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project id is required" },
        { status: 400 }
      );
    }

    const project = await Project.findById(id).lean();

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const currentAnalysis = project.currentAnalysisId
      ? await Analysis.findById(project.currentAnalysisId).lean()
      : null;

    const latestReport = project.latestReportId
      ? await Report.findById(project.latestReportId).lean()
      : null;

    return NextResponse.json({
      success: true,
      project: {
        ...toPlainJson(project),
        _id: String(project._id),
        currentAnalysisId: project.currentAnalysisId
          ? String(project.currentAnalysisId)
          : null,
        latestReportId: project.latestReportId ? String(project.latestReportId) : null,
        survey: project.survey || null,
        boundary: project.boundary || null,
        satellite: project.satellite || null,
      },
      currentAnalysis: currentAnalysis ? toPlainJson(currentAnalysis) : null,
      latestReport: latestReport ? toPlainJson(latestReport) : null,
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

export async function PATCH(request: Request, context?: RouteContext) {
  try {
    await connectDB();

    const id = await resolveProjectId(context);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project id is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updates: Record<string, unknown> = {};

    if (typeof body?.name === "string") updates.name = body.name;
    if (typeof body?.city === "string") updates.city = body.city;
    if (typeof body?.state === "string") updates.state = body.state;
    if (typeof body?.country === "string") updates.country = body.country;
    if (typeof body?.track === "string") updates.track = body.track;
    if (typeof body?.benchmarkProfile === "string") {
      updates.benchmarkProfile = body.benchmarkProfile;
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: toPlainJson({
        ...project,
        _id: String(project._id),
      }),
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