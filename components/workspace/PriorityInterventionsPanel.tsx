"use client";

import type { AnalysisPayload } from "@/types/workspace";

type Props = {
  analysis: AnalysisPayload | null;
};

type NormalizedAction = {
  id: string;
  rank: number;
  title: string;
  subtitle: string;
  urgency: string;
  estimatedScoreReduction: number | null;
  gap: number | null;
  target: number | null;
  current: number | null;
  description: string;
};

function toTitleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeUrgency(value: unknown) {
  const text = String(value || "moderate").toLowerCase();

  if (["critical", "high", "moderate", "stable"].includes(text)) {
    return text;
  }

  return "moderate";
}

function normalizeActions(rawActions: any[] = []): NormalizedAction[] {
  return rawActions.map((action: any, index: number) => {
    const metricKey =
      action?.metric ||
      action?.service ||
      action?.key ||
      action?.label ||
      `metric-${index + 1}`;

    const title =
      action?.label ||
      action?.title ||
      action?.metricLabel ||
      toTitleCase(String(metricKey));

    const wardName =
      action?.wardName ||
      action?.ward ||
      action?.zone ||
      action?.area ||
      "";

    const subtitle = wardName
      ? wardName
      : action?.service
      ? "City-level priority"
      : "Priority intervention";

    const urgency = normalizeUrgency(action?.urgency || action?.severity);

    const estimatedScoreReduction =
      typeof action?.estimatedScoreReduction === "number"
        ? action.estimatedScoreReduction
        : typeof action?.scoreReduction === "number"
        ? action.scoreReduction
        : typeof action?.improvement === "number"
        ? action.improvement
        : null;

    const gap =
      typeof action?.gap === "number"
        ? action.gap
        : typeof action?.deficit === "number"
        ? action.deficit
        : null;

    const target =
      typeof action?.target === "number"
        ? action.target
        : typeof action?.benchmark === "number"
        ? action.benchmark
        : null;

    const current =
      typeof action?.currentAverage === "number"
        ? action.currentAverage
        : typeof action?.current === "number"
        ? action.current
        : typeof action?.actual === "number"
        ? action.actual
        : null;

    const description =
      action?.intervention ||
      action?.recommendation ||
      action?.description ||
      action?.summary ||
      "Prioritize this service area for improvement based on current gap analysis.";

    return {
      id: `${metricKey}-${wardName || "city"}-${index}`,
      rank:
        typeof action?.rank === "number" && Number.isFinite(action.rank)
          ? action.rank
          : index + 1,
      title,
      subtitle,
      urgency,
      estimatedScoreReduction,
      gap,
      target,
      current,
      description,
    };
  });
}

function urgencyClasses(urgency: string) {
  switch (urgency) {
    case "critical":
      return "border-rose-300/20 bg-rose-500/10 text-rose-100";
    case "high":
      return "border-orange-300/20 bg-orange-500/10 text-orange-100";
    case "stable":
      return "border-emerald-300/20 bg-emerald-500/10 text-emerald-100";
    default:
      return "border-cyan-300/20 bg-cyan-500/10 text-cyan-100";
  }
}

export default function PriorityInterventionsPanel({ analysis }: Props) {
  const actions = normalizeActions(analysis?.priorityInterventions || []);

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-2xl">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Priority Interventions</h3>
        <p className="mt-1 text-sm text-slate-300">
          Top intervention areas generated from the current project analysis.
        </p>
      </div>

      {actions.length ? (
        <div className="space-y-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                      Rank {action.rank}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${urgencyClasses(
                        action.urgency
                      )}`}
                    >
                      {action.urgency}
                    </span>
                  </div>

                  <h4 className="mt-3 text-base font-semibold text-white">
                    {action.title}
                  </h4>

                  <p className="mt-1 text-sm text-slate-400">{action.subtitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 md:min-w-[220px]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      Gap
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">
                      {action.gap ?? "--"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      Score Gain
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">
                      {action.estimatedScoreReduction ?? "--"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      Current
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">
                      {action.current ?? "--"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      Target
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">
                      {action.target ?? "--"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-sm leading-6 text-slate-200">{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
          No priority interventions available for this project yet.
        </div>
      )}
    </section>
  );
}