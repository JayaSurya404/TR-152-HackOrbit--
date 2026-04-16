import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { AnalysisPayload } from "@/types/workspace";

type PriorityInterventionsPanelProps = {
  analysis: AnalysisPayload | null;
};

export default function PriorityInterventionsPanel({
  analysis,
}: PriorityInterventionsPanelProps) {
  const actions = analysis?.priorityInterventions?.slice(0, 6) || [];

  return (
    <GlassCard
      title="Priority Interventions"
      subtitle="Top cross-ward actions ranked by estimated reduction in priority severity."
    >
      <div className="space-y-3">
        {actions.length ? (
          actions.map((action) => (
            <div
              key={`${action.rank}-${action.wardName}-${action.metric}`}
              className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-200">
                    #{action.rank} · {action.wardName}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-white md:text-base">
                    {action.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {action.description}
                  </p>
                </div>
                <StatusBadge value={action.urgency} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Metric
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {action.metricLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Cost Tier
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {action.costTier}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Est. Drop
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {action.estimatedPriorityDrop}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-slate-300">
            Run analysis to populate the intervention queue.
          </div>
        )}
      </div>
    </GlassCard>
  );
}