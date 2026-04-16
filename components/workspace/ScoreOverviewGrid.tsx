import MetricTile from "@/components/ui/MetricTile";
import StatusBadge from "@/components/ui/StatusBadge";
import { AnalysisPayload } from "@/types/workspace";

type ScoreOverviewGridProps = {
  analysis: AnalysisPayload | null;
};

export default function ScoreOverviewGrid({
  analysis,
}: ScoreOverviewGridProps) {
  const topWard = analysis?.wardScores?.[0];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricTile
        label="Total Wards"
        value={analysis?.globalSummary?.totalWards ?? 0}
        helper="Ward or cluster polygons included in the current analysis"
      />
      <MetricTile
        label="Critical Wards"
        value={analysis?.globalSummary?.criticalWards ?? 0}
        helper="Highest intervention urgency"
      />
      <MetricTile
        label="Average Confidence"
        value={
          analysis?.globalSummary?.averageConfidence !== null &&
          analysis?.globalSummary?.averageConfidence !== undefined
            ? analysis.globalSummary.averageConfidence
            : "--"
        }
        helper="Derived from metric coverage, row count, and satellite support"
      />
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
          Top Risk Ward
        </p>
        {topWard ? (
          <>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-white">{topWard.wardName}</p>
                <p className="mt-1 text-sm text-slate-300">
                  Score {topWard.priorityScore} · Confidence {topWard.confidence}
                </p>
              </div>
              <StatusBadge value={topWard.severity} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {topWard.explanation}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            Run analysis to populate top-risk ranking.
          </p>
        )}
      </div>
    </div>
  );
}