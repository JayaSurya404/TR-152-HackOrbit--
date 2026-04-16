import { CalendarDays, FileBarChart2, Files, MapPinned, Map } from "lucide-react";
import MetricTile from "@/components/ui/MetricTile";
import { AnalysisPayload, ProjectDetail } from "@/types/workspace";

type ProjectSummaryBarProps = {
  project: ProjectDetail | null;
  analysis: AnalysisPayload | null;
};

export default function ProjectSummaryBar({
  project,
  analysis,
}: ProjectSummaryBarProps) {
  const location = [project?.city, project?.state, project?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricTile
        label="Settlement"
        value={project?.name || "--"}
        helper={location || "Add city/state info for stronger demo storytelling"}
      />
      <MetricTile
        label="Survey Rows"
        value={project?.survey?.rowCount ?? 0}
        helper={project?.survey?.filename || "No survey CSV yet"}
      />
      <MetricTile
        label="Boundary Wards"
        value={project?.boundary?.featureCount ?? 0}
        helper={project?.boundary?.filename || "No GeoJSON yet"}
      />
      <MetricTile
        label="Priority Score"
        value={
          analysis?.globalSummary?.averagePriorityScore !== null &&
          analysis?.globalSummary?.averagePriorityScore !== undefined
            ? analysis.globalSummary.averagePriorityScore
            : "--"
        }
        helper="Average project-wide urgency"
      />
      <MetricTile
        label="Report State"
        value={project?.latestReportId ? "Ready" : "Pending"}
        helper={
          analysis?.globalSummary?.generatedAt
            ? `Analyzed ${new Date(
                analysis.globalSummary.generatedAt
              ).toLocaleString()}`
            : "Run analysis after uploads"
        }
      />
    </div>
  );
}