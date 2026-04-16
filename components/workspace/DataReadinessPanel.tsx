import StatusBadge from "@/components/ui/StatusBadge";
import { AnalysisPayload, ProjectDetail } from "@/types/workspace";

type DataReadinessPanelProps = {
  project: ProjectDetail | null;
  analysis: AnalysisPayload | null;
};

function Row({
  title,
  ready,
  helper,
}: {
  title: string;
  ready: boolean;
  helper: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{helper}</p>
      </div>
      <StatusBadge value={ready ? "stable" : "draft"} />
    </div>
  );
}

export default function DataReadinessPanel({
  project,
  analysis,
}: DataReadinessPanelProps) {
  return (
    <div className="space-y-3">
      <Row
        title="Survey Coverage"
        ready={Boolean(project?.survey?.rowCount)}
        helper={
          project?.survey?.rowCount
            ? `${project.survey.rowCount} rows ready for ward aggregation`
            : "Upload a CSV with ward/cluster and service fields"
        }
      />
      <Row
        title="Boundary Mapping"
        ready={Boolean(project?.boundary?.featureCount)}
        helper={
          project?.boundary?.featureCount
            ? `${project.boundary.featureCount} polygons available for choropleth rendering`
            : "Upload a GeoJSON boundary file"
        }
      />
      <Row
        title="Satellite Context"
        ready={Boolean(project?.satellite)}
        helper={
          project?.satellite
            ? `Satellite mode: ${project.satellite.mode || "summary"}`
            : "Optional support layer for built-up and environmental context"
        }
      />
      <Row
        title="Analysis Output"
        ready={Boolean(analysis?._id)}
        helper={
          analysis?._id
            ? `Generated benchmark: ${analysis.benchmarkLabel}`
            : "Run analysis after uploads"
        }
      />
      <Row
        title="Planner Report"
        ready={Boolean(project?.latestReportId)}
        helper={
          project?.latestReportId
            ? "Latest report is ready for export or presentation"
            : "Generate report after analysis"
        }
      />
    </div>
  );
}