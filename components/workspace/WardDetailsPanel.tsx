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
  gap,
}: {
  label: string;
  actual?: number | null;
  gap?: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-1 text-xs text-slate-400">Actual vs target deficit</p>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-white">{actual ?? "--"}</div>
        <div className="mt-1 text-xs text-slate-300">Gap {gap ?? "--"}</div>
      </div>
    </div>
  );
}

export default function WardDetailsPanel({
  ward,
  analysis,
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
              gap={ward.gaps?.water}
            />
            <MetricRow
              label="Sanitation"
              actual={ward.actualScores?.sanitation}
              gap={ward.gaps?.sanitation}
            />
            <MetricRow
              label="Electricity"
              actual={ward.actualScores?.electricity}
              gap={ward.gaps?.electricity}
            />
            <MetricRow
              label="Road Connectivity"
              actual={ward.actualScores?.road}
              gap={ward.gaps?.road}
            />
            <MetricRow
              label="Drainage"
              actual={ward.actualScores?.drainage}
              gap={ward.gaps?.drainage}
            />
            <MetricRow
              label="Waste Management"
              actual={ward.actualScores?.waste}
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