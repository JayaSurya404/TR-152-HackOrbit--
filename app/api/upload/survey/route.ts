import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { parseSurveyCsv } from "@/lib/csv";
import { getErrorMessage, toPlainJson } from "@/lib/utils";
import Project from "@/models/Project";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const projectId = formData.get("projectId");
    const file = formData.get("file");

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { success: false, error: "projectId is required" },
        { status: 400 }
      );
    }

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "CSV file is required" },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const parsed = parseSurveyCsv(csvText);

    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    existingProject.survey = {
      filename: file.name,
      rawText: csvText,
      headers: parsed.headers,
      aliasMap: parsed.aliasMap,
      rowCount: parsed.rowCount,
      rows: parsed.rows,
      normalizedRows: parsed.normalizedRows,
      warnings: parsed.warnings,
      preview: parsed.preview,
      uploadedAt: new Date().toISOString(),
    };

    existingProject.status = existingProject.boundary ? "data_ready" : "survey_uploaded";

    await existingProject.save();

    return NextResponse.json({
      success: true,
      message: "Survey CSV uploaded successfully",
      survey: toPlainJson(existingProject.survey),
      status: existingProject.status,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}