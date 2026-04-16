import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { parseBoundaryGeoJson } from "@/lib/geo";
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
        { success: false, error: "GeoJSON file is required" },
        { status: 400 }
      );
    }

    const geoText = await file.text();
    const parsed = parseBoundaryGeoJson(geoText);

    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    existingProject.boundary = {
      filename: file.name,
      ...parsed,
      uploadedAt: new Date().toISOString(),
    };

    existingProject.status = existingProject.survey ? "data_ready" : "boundary_uploaded";

    await existingProject.save();

    return NextResponse.json({
      success: true,
      message: "Boundary uploaded successfully",
      boundary: toPlainJson(existingProject.boundary),
      status: existingProject.status,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}