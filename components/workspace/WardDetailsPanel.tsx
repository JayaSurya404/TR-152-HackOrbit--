import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { AnalysisPayload, WardScore } from "@/types/workspace";

type WardDetailsPanelProps = {
  ward: WardScore | null;
  analysis: AnalysisPayload | null;
};

function MetricRow({
  label,
  actual,
  target,
  gap,
}: {
  label: string;
  actual?: number | null;
  target?: number | null;
  gap?: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-1 text-xs text-slate-400">Actual / benchmark / gap</p>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-white">
          {actual ?? "--"} / {target ?? "--"}
        </div>
        <div className="mt-1 text-xs text-slate-300">Gap {gap ?? "--"}</div>
      </div>
    </div>
  );
}

export default function WardDetailsPanel({
  ward,
}: WardDetailsPanelProps) {
  return (
    <GlassCard
      title="Ward Details"
      subtitle="Selected ward-level diagnostics and benchmark-aligned service gaps."
    >
      {ward ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div>
              <h3 className="text-xl font-semibold text-white">{ward.wardName}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {ward.explanation}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge value={ward.severity} />
              <p className="mt-3 text-xs text-slate-400">Priority Score</p>
              <p className="text-2xl font-semibold text-white">{ward.priorityScore}</p>
              <p className="mt-1 text-xs text-slate-400">Confidence {ward.confidence}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MetricRow
              label="Water Access"
              actual={ward.actualScores?.water}
              target={ward.benchmarkTargets?.water}
              gap={ward.gaps?.water}
            />
            <MetricRow
              label="Sanitation"
              actual={ward.actualScores?.sanitation}
              target={ward.benchmarkTargets?.sanitation}
              gap={ward.gaps?.sanitation}
            />
            <MetricRow
              label="Electricity"
              actual={ward.actualScores?.electricity}
              target={ward.benchmarkTargets?.electricity}
              gap={ward.gaps?.electricity}
            />
            <MetricRow
              label="Road Connectivity"
              actual={ward.actualScores?.road}
              target={ward.benchmarkTargets?.road}
              gap={ward.gaps?.road}
            />
            <MetricRow
              label="Drainage"
              actual={ward.actualScores?.drainage}
              target={ward.benchmarkTargets?.drainage}
              gap={ward.gaps?.drainage}
            />
            <MetricRow
              label="Waste Management"
              actual={ward.actualScores?.waste}
              target={ward.benchmarkTargets?.waste}
              gap={ward.gaps?.waste}
            />
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">Supporting Signals</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Household Size
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {ward.supporting?.avgHouseholdSize ?? "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Built-up Pressure
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {ward.supporting?.builtUpPressure ?? "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Environmental Stress
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {ward.supporting?.environmentalStress ?? "--"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">Top Deficits</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ward.topDeficits?.length ? (
                ward.topDeficits.map((item) => (
                  <span
                    key={`${ward.wardName}-${item.metric}`}
                    className="rounded-full border border-orange-300/15 bg-orange-400/10 px-3 py-1.5 text-xs text-orange-100"
                  >
                    {item.metric}: {item.gap}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-300">No deficit data</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm leading-6 text-slate-300">
          No ward selected yet. Run analysis and click a polygon on the map to inspect
          the ward-level breakdown.
        </div>
      )}
    </GlassCard>
  );
}