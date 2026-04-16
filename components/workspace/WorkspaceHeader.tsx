import { DatabaseZap, Layers3, Plus, RefreshCcw, Sparkles } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { ProjectSummary } from "@/types/workspace";

type WorkspaceHeaderProps = {
  projects: ProjectSummary[];
  selectedProjectId: string;
  busyKey: string | null;
  onSelectProject: (id: string) => void;
  onCreateBlankProject: () => void;
  onCreateDemoProject: () => void;
  onRefreshProjects: () => void;
};

export default function WorkspaceHeader({
  projects,
  selectedProjectId,
  busyKey,
  onSelectProject,
  onCreateBlankProject,
  onCreateDemoProject,
  onRefreshProjects,
}: WorkspaceHeaderProps) {
  const activeProject = projects.find((item) => item._id === selectedProjectId);

  return (
    <div className="glass-panel grid-noise rounded-[30px] p-5 md:p-6">
      <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-3 py-1 text-xs font-medium text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Tensor'26 Hackathon Workspace
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            InfraSight AI
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            AI-assisted slum infrastructure gap mapping dashboard with survey ingestion,
            ward-level analysis, intervention planning, and report-ready outputs.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-200">
              <DatabaseZap className="h-4 w-4" />
              Survey + GeoJSON + Satellite Summary
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-200">
              <Layers3 className="h-4 w-4" />
              Map-first judge demo flow
            </div>
            {activeProject?.status ? <StatusBadge value={activeProject.status} /> : null}
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 xl:max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              Active Project
            </p>
            <select
              value={selectedProjectId}
              onChange={(event) => onSelectProject(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none ring-0"
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name} {project.city ? `- ${project.city}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={onCreateBlankProject}
              disabled={busyKey !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              New
            </button>

            <button
              onClick={onCreateDemoProject}
              disabled={busyKey !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/12 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              Demo Seed
            </button>

            <button
              onClick={onRefreshProjects}
              disabled={busyKey !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}