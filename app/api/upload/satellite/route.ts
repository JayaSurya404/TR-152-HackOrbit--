import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { normalizeSatelliteSummary } from "@/lib/satellite";
import { getErrorMessage, toPlainJson } from "@/lib/utils";
import Project from "@/models/Project";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectDB();

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const projectId = formData.get("projectId");

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

      const summaryJson = formData.get("summaryJson");
      if (typeof summaryJson === "string" && summaryJson.trim()) {
        const normalized = normalizeSatelliteSummary(JSON.parse(summaryJson));
        project.satellite = normalized;
        await project.save();

        return NextResponse.json({
          success: true,
          message: "Satellite summary uploaded successfully",
          satellite: toPlainJson(project.satellite),
        });
      }

      const file = formData.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json(
          { success: false, error: "Satellite file or summaryJson is required" },
          { status: 400 }
        );
      }

      project.satellite = {
        mode: "file",
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        note: "Raw raster/image storage metadata only. Analysis currently uses summary payloads.",
      };

      await project.save();

      return NextResponse.json({
        success: true,
        message: "Satellite file metadata stored successfully",
        satellite: toPlainJson(project.satellite),
      });
    }

    const body = await request.json();
    const { projectId, ...summaryBody } = body;

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

    const normalized = normalizeSatelliteSummary(summaryBody);
    project.satellite = normalized;
    await project.save();

    return NextResponse.json({
      success: true,
      message: "Satellite summary uploaded successfully",
      satellite: toPlainJson(project.satellite),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}