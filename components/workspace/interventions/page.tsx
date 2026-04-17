"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import PriorityInterventionsPanel from "@/components/workspace/PriorityInterventionsPanel";
import InterventionSimulatorPanel from "@/components/workspace/InterventionSimulatorPanel";
import { AnalysisPayload, ProjectDetail, SimulationPayload, WardScore } from "@/types/workspace";

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

export default function InterventionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null);
  const [simulation, setSimulation] = useState<SimulationPayload | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      const data = await api<{
        success: boolean;
        project: ProjectDetail;
        currentAnalysis: AnalysisPayload | null;
      }>(`/api/project/${projectId}`);

      setProject(data.project);
      setAnalysis(data.currentAnalysis);
    };

    load().catch(console.error);
  }, [projectId]);

  const ward = useMemo<WardScore | null>(
    () => analysis?.wardScores?.[0] || null,
    [analysis]
  );

  const runSimulation = async (improvements: Record<string, number>) => {
    if (!projectId || !ward?.wardName) return;

    try {
      setBusyKey("simulate");

      const response = await api<{ success: boolean; simulation: SimulationPayload }>(
        "/api/simulate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            wardName: ward.wardName,
            improvements,
          }),
        }
      );

      setSimulation(response.simulation);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <GlassCard
          title="Intervention Planner"
          subtitle="Priority interventions and what-if simulation workspace."
          action={
            <button
              onClick={() => router.push(`/workspace?projectId=${projectId}`)}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Back to Map
            </button>
          }
        >
          <p className="text-sm text-slate-300">
            {project?.name || "Project"} · {project?.city || "Unknown city"}
          </p>
        </GlassCard>

        <PriorityInterventionsPanel analysis={analysis} />

        <InterventionSimulatorPanel
          ward={ward}
          busyKey={busyKey}
          simulation={simulation}
          onSimulate={runSimulation}
        />
      </div>
    </main>
  );
}