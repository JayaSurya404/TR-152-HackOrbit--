type EmptyWorkspaceStateProps = {
  onCreateBlankProject: () => void;
  onCreateDemoProject: () => void;
};

export default function EmptyWorkspaceState({
  onCreateBlankProject,
  onCreateDemoProject,
}: EmptyWorkspaceStateProps) {
  return (
    <div className="glass-panel rounded-[30px] p-8 md:p-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="inline-flex items-center rounded-full border border-cyan-300/15 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-100">
          InfraSight AI Workspace
        </p>

        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Start with a fresh project or seed the demo workspace
        </h2>

        <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
          Upload survey CSV, boundary GeoJSON, and optional satellite summary to compute
          ward-level infrastructure gaps, intervention priorities, and export-ready reports.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={onCreateBlankProject}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
          >
            Create New Project
          </button>

          <button
            onClick={onCreateDemoProject}
            className="rounded-2xl border border-cyan-300/20 bg-cyan-400/12 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:scale-[1.01]"
          >
            Load Demo Project
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-left">
            <p className="text-sm font-semibold text-white">1. Ingest</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Add survey CSV, GeoJSON boundaries, and optional satellite summary.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-left">
            <p className="text-sm font-semibold text-white">2. Analyze</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Compute service gaps, deprivation score, and priority interventions.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-left">
            <p className="text-sm font-semibold text-white">3. Export</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Review AI-generated findings and build planner-ready reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}