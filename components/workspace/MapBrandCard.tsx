type ProjectOption = {
  _id: string;
  name: string;
  city?: string;
};

type MapBrandCardProps = {
  projects: ProjectOption[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateBlankProject: () => void;
  onCreateDemoProject: () => void;
  projectName?: string;
  city?: string;
};

export default function MapBrandCard({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateBlankProject,
  onCreateDemoProject,
  projectName,
  city,
}: MapBrandCardProps) {
  return (
    <div className="absolute left-4 top-4 z-[700] w-[310px] rounded-[28px] liquid-glass p-4">
      <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/80">
          Tensor 26 Workspace
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          InfraSight AI
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-300">
          Full-screen settlement intelligence map with location search, ward filtering,
          and intervention-ready layers.
        </p>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          Active Project
        </p>
        <select
          value={selectedProjectId}
          onChange={(e) => onSelectProject(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">Select project</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name} {project.city ? `- ${project.city}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
        <p className="text-sm font-semibold text-white">
          {projectName || "No project selected"}
        </p>
        <p className="mt-1 text-xs text-slate-300">
          {city || "Create a project or use demo seed"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={onCreateBlankProject}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
        >
          New
        </button>
        <button
          onClick={onCreateDemoProject}
          className="rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:scale-[1.01]"
        >
          Demo Seed
        </button>
      </div>
    </div>
  );
}