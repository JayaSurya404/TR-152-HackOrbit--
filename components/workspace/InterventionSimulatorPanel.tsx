"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { SimulationPayload, WardScore } from "@/types/workspace";

type InterventionSimulatorPanelProps = {
  ward: WardScore | null;
  busyKey: string | null;
  simulation: SimulationPayload | null;
  onSimulate: (payload: Record<string, number>) => void;
};

type ImprovementState = Record<string, number>;

const DEFAULT_IMPROVEMENTS: ImprovementState = {
  water: 12,
  sanitation: 14,
  electricity: 8,
  road: 10,
  drainage: 9,
  waste: 7,
};

export default function InterventionSimulatorPanel({
  ward,
  busyKey,
  simulation,
  onSimulate,
}: InterventionSimulatorPanelProps) {
  const [improvements, setImprovements] =
    useState<ImprovementState>(DEFAULT_IMPROVEMENTS);

  useEffect(() => {
    setImprovements(DEFAULT_IMPROVEMENTS);
  }, [ward?.wardName]);

  const improvementCount = useMemo(
    () => Object.values(improvements).reduce((sum, value) => sum + value, 0),
    [improvements]
  );

  return (
    <GlassCard
      title="Intervention Simulator"
      subtitle="Rule-based what-if planner for judge demo: tweak service improvements and estimate severity reduction."
    >
      {ward ? (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{ward.wardName}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Total uplift configured: {improvementCount}
                </p>
              </div>
              <StatusBadge value={ward.severity} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Object.entries(improvements).map(([key, value]) => (
              <label
                key={key}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium capitalize text-white">
                    {key}
                  </span>
                  <span className="text-sm text-cyan-200">+{value}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={1}
                  value={value}
                  onChange={(event) =>
                    setImprovements((prev) => ({
                      ...prev,
                      [key]: Number(event.target.value),
                    }))
                  }
                  className="mt-4 w-full accent-cyan-300"
                />
              </label>
            ))}
          </div>

          <button
            onClick={() => onSimulate(improvements)}
            disabled={busyKey !== null}
            className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Run Scenario
          </button>

          {simulation ? (
            <div className="rounded-[24px] border border-emerald-300/15 bg-emerald-400/[0.06] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Simulated outcome for {simulation.wardName}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Estimated score reduction after proposed upgrades
                  </p>
                </div>
                <StatusBadge value={simulation.after.severity} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Before
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {simulation.before.priorityScore}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    After
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {simulation.after.priorityScore}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Improvement
                  </p>
                  <p className="mt-2 text-xl font-semibold text-emerald-300">
                    {simulation.improvementDelta}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-slate-300">
          Select a ward from the map to run a scenario simulation.
        </div>
      )}
    </GlassCard>
  );
}