type MapLegendProps = {
  metricLabel: string;
  baseMode: "satellite" | "street";
};

export default function MapLegend({ metricLabel, baseMode }: MapLegendProps) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-[500] max-w-xs rounded-2xl border border-white/10 bg-slate-950/75 p-4 backdrop-blur-xl">
      <p className="text-sm font-semibold text-white">Map Legend</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-200">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          Stable
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          Moderate
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-orange-500" />
          High
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          Critical
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
          Active Overlay
        </p>
        <p className="mt-1 text-sm font-medium text-white">{metricLabel}</p>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
          Base Map
        </p>
        <p className="mt-1 text-sm font-medium text-white">
          {baseMode === "satellite" ? "Satellite View" : "Street View"}
        </p>
      </div>
    </div>
  );
}