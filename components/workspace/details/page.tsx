"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import WorkspaceHeader from "@/components/workspace/WorkspaceHeader";
import ProjectSummaryBar from "@/components/workspace/ProjectSummaryBar";
import UploadDataPanel from "@/components/workspace/UploadDataPanel";
import DataReadinessPanel from "@/components/workspace/DataReadinessPanel";
import ScoreOverviewGrid from "@/components/workspace/ScoreOverviewGrid";
import WardDetailsPanel from "@/components/workspace/WardDetailsPanel";
import PriorityInterventionsPanel from "@/components/workspace/PriorityInterventionsPanel";
import InterventionSimulatorPanel from "@/components/workspace/InterventionSimulatorPanel";
import ReportExportPanel from "@/components/workspace/ReportExportPanel";
import {
  AnalysisPayload,
  ProjectDetail,
  ProjectSummary,
  ReportPayload,
  SimulationPayload,
  WardScore,
} from "@/types/workspace";

type ProjectsResponse = {
  success: boolean;
  projects: ProjectSummary[];
};

type ProjectDetailResponse = {
  success: boolean;
  project: ProjectDetail;
  currentAnalysis: AnalysisPayload | null;
  latestReport: ReportPayload | null;
};

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unexpected request error";
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
  });

  const data = await response.json();

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || "Request failed");
  }

  return data as T;
}

export default function WorkspaceDetailsPage() {
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [selectedWardName, setSelectedWardName] = useState("");
  const [simulation, setSimulation] = useState<SimulationPayload | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("Ready");

  const selectedWard = useMemo<WardScore | null>(() => {
    if (!analysis?.wardScores?.length) return null;
    return (
      analysis.wardScores.find(
        (item) => item.wardName.toLowerCase() === selectedWardName.toLowerCase()
      ) || analysis.wardScores[0]
    );
  }, [analysis, selectedWardName]);

  const wardOptions = useMemo(() => {
    return analysis?.wardScores?.map((item) => item.wardName) || [];
  }, [analysis]);

  const loadProjects = async (preferredProjectId?: string) => {
    try {
      setBusyKey("load-projects");
      const data = await api<ProjectsResponse>("/api/project");
      const nextProjects = data.projects || [];
      setProjects(nextProjects);

      if (preferredProjectId) {
        setSelectedProjectId(preferredProjectId);
        return;
      }

      if (!selectedProjectId && nextProjects[0]?._id) {
        setSelectedProjectId(nextProjects[0]._id);
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const loadProject = async (projectId: string) => {
    if (!projectId) return;

    try {
      setBusyKey("load-project");
      setError("");

      const data = await api<ProjectDetailResponse>(`/api/project/${projectId}`);

      setProject(data.project || null);
      setAnalysis(data.currentAnalysis || null);
      setReport(data.latestReport || null);
      setSimulation(null);

      const firstWard = data.currentAnalysis?.wardScores?.[0]?.wardName || "";
      setSelectedWardName((prev) => prev || firstWard);

      setInfo("Project loaded");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  useEffect(() => {
    const preferredProjectId = searchParams.get("projectId") || undefined;
    loadProjects(preferredProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProject(selectedProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  useEffect(() => {
    if (!analysis?.wardScores?.length) {
      setSelectedWardName("");
      return;
    }

    const exists = analysis.wardScores.some(
      (item) => item.wardName.toLowerCase() === selectedWardName.toLowerCase()
    );

    if (!exists) {
      setSelectedWardName(analysis.wardScores[0].wardName);
    }
  }, [analysis, selectedWardName]);

  const createBlankProject = async () => {
    try {
      setError("");
      setBusyKey("create-project");

      const created = await api<{ success: boolean; project: ProjectSummary }>(
        "/api/project",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `InfraSight Project ${new Date().toLocaleTimeString()}`,
            city: "Tiruchirappalli",
            state: "Tamil Nadu",
            country: "India",
            track: "societal",
            benchmarkProfile: "urban-slum-v1",
          }),
        }
      );

      await loadProjects(created.project._id);
      await loadProject(created.project._id);
      setInfo("Blank project created");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const createDemoProject = async () => {
    try {
      setError("");
      setBusyKey("demo-seed");

      const seeded = await api<{
        success: boolean;
        projectId: string;
      }>("/api/demo/seed", {
        method: "POST",
      });

      await loadProjects(seeded.projectId);
      await loadProject(seeded.projectId);
      setSelectedProjectId(seeded.projectId);
      setInfo("Demo project seeded with map, analysis, and report");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const uploadSurvey = async (file: File) => {
    if (!selectedProjectId) return;

    try {
      setError("");
      setBusyKey("upload-survey");

      const formData = new FormData();
      formData.append("projectId", selectedProjectId);
      formData.append("file", file);

      await api("/api/upload/survey", {
        method: "POST",
        body: formData,
      });

      await loadProject(selectedProjectId);
      setInfo("Survey CSV uploaded");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const uploadBoundary = async (file: File) => {
    if (!selectedProjectId) return;

    try {
      setError("");
      setBusyKey("upload-boundary");

      const formData = new FormData();
      formData.append("projectId", selectedProjectId);
      formData.append("file", file);

      await api("/api/upload/boundary", {
        method: "POST",
        body: formData,
      });

      await loadProject(selectedProjectId);
      setInfo("Boundary GeoJSON uploaded");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const uploadSatellite = async (file: File) => {
    if (!selectedProjectId) return;

    try {
      setError("");
      setBusyKey("upload-satellite");

      if (file.name.toLowerCase().endsWith(".json")) {
        const text = await file.text();
        await api("/api/upload/satellite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: selectedProjectId,
            ...JSON.parse(text),
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("projectId", selectedProjectId);
        formData.append("file", file);

        await api("/api/upload/satellite", {
          method: "POST",
          body: formData,
        });
      }

      await loadProject(selectedProjectId);
      setInfo("Satellite payload uploaded");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const runAnalysis = async () => {
    if (!selectedProjectId) return;

    try {
      setError("");
      setBusyKey("analyze");

      const response = await api<{ success: boolean; analysis: AnalysisPayload }>(
        "/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectId: selectedProjectId }),
        }
      );

      setAnalysis(response.analysis);
      setSelectedWardName(response.analysis?.wardScores?.[0]?.wardName || "");
      await loadProject(selectedProjectId);
      setInfo("Analysis completed");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const buildReport = async () => {
    if (!selectedProjectId) return;

    try {
      setError("");
      setBusyKey("report");

      const response = await api<{ success: boolean; report: ReportPayload }>(
        "/api/report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: selectedProjectId,
          }),
        }
      );

      setReport(response.report);
      await loadProject(selectedProjectId);
      setInfo("Report generated");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const runSimulation = async (improvements: Record<string, number>) => {
    if (!selectedProjectId || !selectedWard?.wardName) return;

    try {
      setError("");
      setBusyKey("simulate");

      const response = await api<{ success: boolean; simulation: SimulationPayload }>(
        "/api/simulate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: selectedProjectId,
            wardName: selectedWard.wardName,
            improvements,
          }),
        }
      );

      setSimulation(response.simulation);
      setInfo("Simulation generated");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <main className="min-h-screen px-4 py-4 md:px-6 md:py-6 xl:px-8">
      <div className="mx-auto max-w-[1680px] space-y-5">
        <WorkspaceHeader
          projects={projects}
          selectedProjectId={selectedProjectId}
          busyKey={busyKey}
          onSelectProject={(projectId) => {
            setSelectedProjectId(projectId);
            setSimulation(null);
          }}
          onCreateBlankProject={createBlankProject}
          onCreateDemoProject={createDemoProject}
          onRefreshProjects={() => loadProjects(selectedProjectId)}
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <ProjectSummaryBar project={project} analysis={analysis} />
          <Link
            href={
              selectedProjectId
                ? `/workspace?projectId=${selectedProjectId}`
                : "/workspace"
            }
            className="inline-flex w-fit items-center justify-center rounded-[20px] border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 backdrop-blur-xl transition hover:bg-cyan-400/20"
          >
            Back to Map
          </Link>
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100"
          >
            {error}
          </motion.div>
        ) : null}

        <div className="rounded-[28px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
          <span className="font-semibold text-white">Workspace status:</span> {info}
          {busyKey ? (
            <span className="ml-2 text-cyan-200">· {busyKey.replace(/-/g, " ")}</span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="space-y-5 xl:col-span-3">
            <GlassCard
              title="Ingestion Controls"
              subtitle="Upload data, analyze results, and keep the workspace synced."
            >
              <UploadDataPanel
                projectId={selectedProjectId}
                busyKey={busyKey}
                onSurveyUpload={uploadSurvey}
                onBoundaryUpload={uploadBoundary}
                onSatelliteUpload={uploadSatellite}
                onAnalyze={runAnalysis}
                onGenerateReport={buildReport}
                onRefreshCurrent={() => selectedProjectId && loadProject(selectedProjectId)}
              />
            </GlassCard>

            <GlassCard
              title="Readiness Checks"
              subtitle="Judge-friendly proof that the pipeline is end-to-end."
            >
              <DataReadinessPanel project={project} analysis={analysis} />
            </GlassCard>

            <GlassCard
              title="Ward Selector"
              subtitle="Choose a ward here since map is separated into another page."
            >
              <div className="space-y-3">
                <select
                  value={selectedWardName}
                  onChange={(e) => {
                    setSelectedWardName(e.target.value);
                    setSimulation(null);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  {wardOptions.length ? (
                    wardOptions.map((wardName) => (
                      <option
                        key={wardName}
                        value={wardName}
                        className="bg-slate-900 text-white"
                      >
                        {wardName}
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-slate-900 text-white">
                      No wards available
                    </option>
                  )}
                </select>

                <p className="text-xs leading-6 text-slate-300">
                  All map data is separated to the map page. This page keeps the complete
                  insights, metrics, simulations, uploads, and report view.
                </p>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-5 xl:col-span-5">
            <ScoreOverviewGrid analysis={analysis} />
            <WardDetailsPanel ward={selectedWard} analysis={analysis} />
            <PriorityInterventionsPanel analysis={analysis} />
          </div>

          <div className="space-y-5 xl:col-span-4">
            <InterventionSimulatorPanel
              ward={selectedWard}
              busyKey={busyKey}
              simulation={simulation}
              onSimulate={runSimulation}
            />
<ReportExportPanel report={report} projectId={selectedProjectId} />            {selectedProjectId ? (
  <a
    href={`/api/report/pdf/${selectedProjectId}`}
    className="inline-flex w-full items-center justify-center rounded-[20px] border border-fuchsia-300/20 bg-fuchsia-500/10 px-4 py-3 text-sm font-semibold text-fuchsia-100 backdrop-blur-xl transition hover:bg-fuchsia-500/20"
  >
    Download AI PDF Report
  </a>
) : null}
          </div>
        </div>
      </div>
    </main>
  );
}