import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Analysis from "@/models/Analysis";
import Report from "@/models/Report";
import { buildAiPdf, sanitizeFilename, toPlainSafe } from "@/lib/ai-report-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext =
  | {
      params?: Promise<{ projectId?: string }> | { projectId?: string };
    }
  | undefined;

async function resolveProjectId(context?: RouteContext) {
  const params = await context?.params;
  const projectId = params?.projectId;

  if (!projectId || typeof projectId !== "string") {
    return null;
  }

  return projectId;
}

export async function GET(_request: Request, context?: RouteContext) {
  try {
    await connectDB();

    const projectId = await resolveProjectId(context);

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project id is required" },
        { status: 400 }
      );
    }

    const project = await Project.findById(projectId).lean();

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    let analysis = null;
    let report = null;

    if ((project as any).currentAnalysisId) {
      analysis = await Analysis.findById((project as any).currentAnalysisId).lean();
    }

    if (!analysis) {
      analysis = await Analysis.findOne({ projectId })
        .sort({ createdAt: -1 })
        .lean();
    }

    if ((project as any).latestReportId) {
      report = await Report.findById((project as any).latestReportId).lean();
    }

    if (!report) {
      report = await Report.findOne({ projectId })
        .sort({ createdAt: -1 })
        .lean();
    }

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found for this project" },
        { status: 404 }
      );
    }

    const pdfBuffer = await buildAiPdf({
      project: toPlainSafe(project),
      analysis: toPlainSafe(analysis),
      report: report ? toPlainSafe(report) : null,
    });

    const filename = `${sanitizeFilename(
      (project as any).city || (project as any).name || "project"
    )}-ai-report.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate AI PDF report",
      },
      { status: 500 }
    );
  }
}