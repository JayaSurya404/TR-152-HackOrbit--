import { MetricKey } from "@/lib/benchmarks";
import { GapScores } from "@/lib/scoring";
import { roundNumber } from "@/lib/utils";
import { METRIC_LABELS } from "@/lib/constants";

export function buildWardActions(
  wardName: string,
  gaps: GapScores,
  weights: Record<MetricKey, number>
) {
  const actionTemplates: Record<
    MetricKey,
    { title: string; description: string; costTier: "low" | "medium" | "high" }
  > = {
    water: {
      title: "Improve reliable water access",
      description:
        "Expand piped supply, repair intermittent lines, and strengthen shared standpost access where coverage is weak.",
      costTier: "medium",
    },
    sanitation: {
      title: "Upgrade sanitation coverage",
      description:
        "Prioritize toilets, septic upgrades, and safe sanitation points in underserved clusters.",
      costTier: "high",
    },
    electricity: {
      title: "Close electricity access gap",
      description:
        "Formalize household connections, improve street-light coverage, and reduce unsafe wiring exposure.",
      costTier: "medium",
    },
    road: {
      title: "Strengthen last-mile road connectivity",
      description:
        "Improve paving, service-vehicle access, and internal street connectivity in blocked or weak corridors.",
      costTier: "high",
    },
    drainage: {
      title: "Improve drainage resilience",
      description:
        "Address stagnant water and runoff bottlenecks through drains, desilting, and flood-path clearance.",
      costTier: "medium",
    },
    waste: {
      title: "Improve waste collection coverage",
      description:
        "Increase collection points, collection frequency, and community waste handling support.",
      costTier: "low",
    },
  };

  const ranked = Object.entries(gaps)
    .map(([metric, gap]) => ({
      metric: metric as MetricKey,
      gap,
    }))
    .sort((a, b) => b.gap - a.gap)
    .filter((item) => item.gap > 5)
    .slice(0, 3);

  return ranked.map((item) => {
    const template = actionTemplates[item.metric];
    const estimatedPriorityDrop = roundNumber(item.gap * (weights[item.metric] + 0.18), 2);

    return {
      wardName,
      metric: item.metric,
      metricLabel: METRIC_LABELS[item.metric],
      title: template.title,
      description: template.description,
      gapValue: item.gap,
      urgency:
        item.gap >= 35 ? "immediate" : item.gap >= 20 ? "priority" : "planned",
      costTier: template.costTier,
      estimatedPriorityDrop,
    };
  });
}