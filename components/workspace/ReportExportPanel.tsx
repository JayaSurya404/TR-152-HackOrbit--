"use client";

import { useMemo } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { ReportPayload } from "@/types/workspace";

type ReportExportPanelProps = {
  report: ReportPayload | null;
};

export default function ReportExportPanel({
  report,
}: ReportExportPanelProps) {
  const reportJson = useMemo(() => {
    if (!report) return "";
    return JSON.stringify(report, null, 2);
  }, [report]);

  const downloadReport = () => {
    if (!reportJson || !report) return;

    const blob = new Blob([reportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.title.replace(/\s+/g, "-").toLowerCase()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyReport = async () => {
    if (!reportJson) return;
    await navigator.clipboard.writeText(reportJson);
  };

  return (
    <GlassCard
      title="Report Export"
      subtitle="Structured output for demo, handoff, or next-step PDF generation."
    >
      {report ? (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <h3 className="text-base font-semibold text-white">{report.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {report.executiveSummary}
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={copyReport}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01]"
            >
              Copy JSON
            </button>
            <button
              onClick={downloadReport}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
            >
              Download JSON
            </button>
          </div>

          <div className="code-scroll rounded-[24px] border border-white/10 bg-slate-950/40 p-4">
            <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-200">
              {reportJson}
            </pre>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-slate-300">
          Report not generated yet. Run analysis, then click Build Report.
        </div>
      )}
    </GlassCard>
  );
}