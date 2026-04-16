import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { AnalysisPayload, ProjectDetail } from "@/types/workspace";
import { SERVICE_LABELS } from "@/lib/constants";

type BenchmarkPanelProps = {
  project: ProjectDetail | null;
  analysis: AnalysisPayload | null;
};

function getGapSeverity(actual: number | null | undefined, target = 0) {
  if (actual === null || actual === undefined) return "high";

  const gap = Math.max(target - actual, 0);

  if (gap >= 25) return "critical";
  if (gap >= 15) return "high";
  if (gap >= 7) return "moderate";
  return "stable";
}

export default function BenchmarkPanel({
  project,
  analysis,
}: BenchmarkPanelProps) {
  const topWard = analysis?.wardScores?.[0] || null;
  const averages = analysis?.globalSummary?.averageServiceScores || {};

  return (
    <GlassCard
      title="Benchmark Intelligence"
      subtitle="Compare project-wide service adequacy with benchmark targets."
    >
      {analysis ? (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  {analysis.benchmarkLabel}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Benchmark profile used for overall deprivation scoring.
                </p>
              </div>
              <StatusBadge value={project?.status || "draft"} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {topWard
              ? Object.entries(topWard.benchmarkTargets || {}).map(([key, target]) => {
                  const actual =
                    averages && typeof averages === "object"
                      ? (averages as Record<string, number | null>)[key]
                      : null;

                  const gap =
                    actual === null || actual === undefined
                      ? null
                      : Math.max(Number(target) - actual, 0);

                  return (
                    <div
                      key={key}
                      className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">
                          {SERVICE_LABELS[key] || key}
                        </p>
                        <StatusBadge
                          value={getGapSeverity(actual, Number(target))}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                            Actual
                          </p>
                          <p className="mt-2 text-base font-semibold text-white">
                            {actual ?? "--"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                            Target
                          </p>
                          <p className="mt-2 text-base font-semibold text-white">
                            {Number(target)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                            Gap
                          </p>
                          <p className="mt-2 text-base font-semibold text-white">
                            {gap ?? "--"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              : null}
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">Benchmark Insight</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {analysis.insights?.executiveSummary ||
                "Run analysis to compare actual service coverage against benchmark targets."}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm leading-6 text-slate-300">
          Run analysis to populate benchmark comparisons.
        </div>
      )}
    </GlassCard>
  );
}