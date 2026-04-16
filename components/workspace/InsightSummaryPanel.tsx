import GlassCard from "@/components/ui/GlassCard";
import { AnalysisPayload } from "@/types/workspace";

type InsightSummaryPanelProps = {
  analysis: AnalysisPayload | null;
};

export default function InsightSummaryPanel({
  analysis,
}: InsightSummaryPanelProps) {
  const narratives = analysis?.insights?.wardNarratives || [];

  return (
    <GlassCard
      title="AI Planning Summary"
      subtitle="Executive summary, ward narratives, and recommendation cues for demo storytelling."
    >
      {analysis ? (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">Executive Summary</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {analysis.insights?.executiveSummary ||
                "No executive summary available yet."}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">
              Recommendation Summary
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {analysis.insights?.recommendationSummary ||
                "No recommendation summary available yet."}
            </p>
          </div>

          <div className="space-y-3">
            {narratives.slice(0, 4).map((item) => (
              <div
                key={item.wardName}
                className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-sm font-semibold text-white">{item.wardName}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {item.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm leading-6 text-slate-300">
          Run analysis to generate AI planning summaries for the settlement.
        </div>
      )}
    </GlassCard>
  );
}