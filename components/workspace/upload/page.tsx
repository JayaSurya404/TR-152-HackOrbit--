"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import { AnalysisPayload, ProjectDetail, ReportPayload } from "@/types/workspace";

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

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);

  const [form, setForm] = useState({
    name: "",
    city: "",
    state: "",
    country: "India",
    track: "societal",
  });

  const [message, setMessage] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadProject = async () => {
    if (!projectId) return;

    const data = await api<{
      success: boolean;
      project: ProjectDetail;
      currentAnalysis: AnalysisPayload | null;
      latestReport: ReportPayload | null;
    }>(`/api/project/${projectId}`);

    setProject(data.project);
    setAnalysis(data.currentAnalysis);
    setReport(data.latestReport);

    setForm({
      name: data.project.name || "",
      city: data.project.city || "",
      state: data.project.state || "",
      country: data.project.country || "India",
      track: data.project.track || "societal",
    });
  };

  useEffect(() => {
    loadProject().catch((err) => setMessage(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const saveMetadata = async () => {
    if (!projectId) return;

    try {
      setBusyKey("save-details");

      await api(`/api/project/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      await loadProject();
      setMessage("Project details saved");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusyKey(null);
    }
  };

  const uploadFile = async (route: string, file: File) => {
    if (!projectId) return;

    try {
      setBusyKey(route);

      if (route === "/api/upload/satellite" && file.name.toLowerCase().endsWith(".json")) {
        const text = await file.text();

        await api(route, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            ...JSON.parse(text),
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("projectId", projectId);
        formData.append("file", file);

        await api(route, {
          method: "POST",
          body: formData,
        });
      }

      await loadProject();
      setMessage(`${file.name} uploaded successfully`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusyKey(null);
    }
  };

  const runAnalysis = async () => {
    if (!projectId) return;

    try {
      setBusyKey("analyze");

      const response = await api<{ success: boolean; analysis: AnalysisPayload }>(
        "/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectId }),
        }
      );

      setAnalysis(response.analysis);
      await loadProject();
      setMessage("Analysis completed");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setBusyKey(null);
    }
  };

  const buildReport = async () => {
    if (!projectId) return;

    try {
      setBusyKey("report");

      const response = await api<{ success: boolean; report: ReportPayload }>(
        "/api/report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectId }),
        }
      );

      setReport(response.report);
      await loadProject();
      setMessage("Report generated");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Report failed");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <GlassCard
          title="Upload & Data Setup"
          subtitle="Fill settlement details, upload source files, run analysis, and open the map."
          action={
            <button
              onClick={() => router.push(`/workspace?projectId=${projectId}`)}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Open Map
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Project name"
              className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none"
            />
            <input
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="City"
              className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none"
            />
            <input
              value={form.state}
              onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
              placeholder="State"
              className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none"
            />
            <input
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="Country"
              className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={saveMetadata}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Save Details
            </button>

            <button
              onClick={runAnalysis}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-400/12 px-4 py-3 text-sm font-semibold text-cyan-100"
            >
              Run Analysis
            </button>

            <button
              onClick={buildReport}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-400/12 px-4 py-3 text-sm font-semibold text-emerald-100"
            >
              Build Report
            </button>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <GlassCard title="Survey CSV" subtitle="Upload ward or household survey rows">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile("/api/upload/survey", file);
              }}
              className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400/15 file:px-4 file:py-2 file:text-cyan-100"
            />
          </GlassCard>

          <GlassCard title="Boundary GeoJSON" subtitle="Upload ward geometry">
            <input
              type="file"
              accept=".json,.geojson,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile("/api/upload/boundary", file);
              }}
              className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400/15 file:px-4 file:py-2 file:text-cyan-100"
            />
          </GlassCard>

          <GlassCard title="Satellite Summary JSON" subtitle="Upload contextual summary">
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile("/api/upload/satellite", file);
              }}
              className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400/15 file:px-4 file:py-2 file:text-cyan-100"
            />
          </GlassCard>
        </div>

        <GlassCard title="Current State">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-slate-400">Project</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {project?.name || "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-slate-400">Survey Rows</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {project?.survey?.rowCount ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-slate-400">Boundary Wards</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {project?.boundary?.featureCount ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-slate-400">Average Priority</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {analysis?.globalSummary?.averagePriorityScore ?? "--"}
              </p>
            </div>
          </div>
        </GlassCard>

        {message ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
            {message}
            {busyKey ? ` · ${busyKey}` : ""}
          </div>
        ) : null}

        {report ? (
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-100">
            Report ready. Open Details page to review and download.
          </div>
        ) : null}
      </div>
    </main>
  );
}