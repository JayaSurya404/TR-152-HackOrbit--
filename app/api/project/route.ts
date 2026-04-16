import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getErrorMessage, toPlainJson } from "@/lib/utils";
import Project from "@/models/Project";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const projects = await Project.find(
      {},
      {
        name: 1,
        city: 1,
        state: 1,
        country: 1,
        track: 1,
        benchmarkProfile: 1,
        status: 1,
        currentAnalysisId: 1,
        latestReportId: 1,
        createdAt: 1,
        updatedAt: 1,
        "survey.rowCount": 1,
        "boundary.featureCount": 1,
      }
    )
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      projects: toPlainJson(projects),
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

    const project = await Project.create({
      name: body.name || "Untitled Project",
      city: body.city || "",
      state: body.state || "",
      country: body.country || "India",
      track: body.track || "societal",
      benchmarkProfile: body.benchmarkProfile || "urban-slum-v1",
      status: "draft",
    });

    return NextResponse.json({
      success: true,
      project: toPlainJson(project),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}