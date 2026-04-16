import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getErrorMessage, toPlainJson } from "@/lib/utils";
import Project from "@/models/Project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const rawProjects = await Project.find({}).sort({ updatedAt: -1 }).lean();

    const projects = (rawProjects || []).map((project: any) => ({
      _id: String(project._id),
      name: project.name || "Untitled Project",
      city: project.city || "",
      state: project.state || "",
      country: project.country || "India",
      track: project.track || "societal",
      benchmarkProfile: project.benchmarkProfile || "urban-slum-v1",
      status: project.status || "draft",
      survey: project.survey
        ? {
            rowCount: project.survey?.rowCount || 0,
          }
        : null,
      boundary: project.boundary
        ? {
            featureCount: project.boundary?.featureCount || 0,
          }
        : null,
      currentAnalysisId: project.currentAnalysisId
        ? String(project.currentAnalysisId)
        : null,
      latestReportId: project.latestReportId ? String(project.latestReportId) : null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      projects: toPlainJson(projects),
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

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const project = await Project.create({
      name: body?.name || "Untitled Project",
      city: body?.city || "",
      state: body?.state || "",
      country: body?.country || "India",
      track: body?.track || "societal",
      benchmarkProfile: body?.benchmarkProfile || "urban-slum-v1",
      status: "draft",
    });

    return NextResponse.json({
      success: true,
      project: {
        _id: String(project._id),
        name: project.name,
        city: project.city,
        state: project.state,
        country: project.country,
        track: project.track,
        benchmarkProfile: project.benchmarkProfile,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
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