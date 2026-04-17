"use client";

import type { ReportPayload } from "@/types/workspace";

type Props = {
  report: ReportPayload | null;
  projectId?: string;
};

function formatDate(value?: string) {
  if (!value) return "Not generated yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function ReportExportPanel({ report, projectId }: Props) {
  const title = report?.title || "Infrastructure Gap Assessment";
  const summary =
    report?.executiveSummary ||
    "The AI-generated PDF report will summarize infrastructure gaps, ward priorities, and recommended actions based on the latest project analysis.";

  const generatedAt =
    report?.generatedAt ||
    (report as any)?.createdAt ||
    (report as any)?.updatedAt ||
    "";

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-2xl">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Report Export</h3>
        <p className="mt-1 text-sm text-slate-300">
          AI-generated PDF report for demo, handoff, and final submission.
        </p>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <h4 className="text-xl font-semibold leading-9 text-white">{title}</h4>

        <p className="mt-4 text-base leading-9 text-slate-200">{summary}</p>

        <p className="mt-5 text-sm text-slate-400">
          Generated {formatDate(generatedAt)}
        </p>
      </div>

      {projectId ? (
        <a
          href={`/api/report/pdf/${projectId}`}
          className="mt-5 inline-flex w-full items-center justify-center rounded-[22px] border border-fuchsia-300/20 bg-fuchsia-500/10 px-5 py-4 text-base font-semibold text-fuchsia-100 backdrop-blur-xl transition hover:bg-fuchsia-500/20"
        >
          Download PDF
        </a>
      ) : (
        <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-sm text-slate-400">
          Select a project to download the PDF report.
        </div>
      )}
    </section>
  );
}