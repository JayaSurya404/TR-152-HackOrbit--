import dynamic from "next/dynamic";
import { AnalysisPayload, GeoFeatureCollection } from "@/types/workspace";

const InteractiveMapClient = dynamic(
  () => import("./InteractiveMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-slate-950/30 text-sm text-slate-300">
        Loading full map workspace...
      </div>
    ),
  }
);

type InteractiveMapPanelProps = {
  boundaryGeoJson?: GeoFeatureCollection | null;
  analysis: AnalysisPayload | null;
  selectedWardName: string;
  onSelectWard: (wardName: string) => void;
  searchHighlightGeoJson?: GeoFeatureCollection | null;
  selectedUnitName?: string;
  adminScope?: "overall" | "ward" | "cluster";
};

export default function InteractiveMapPanel({
  boundaryGeoJson,
  analysis,
  selectedWardName,
  onSelectWard,
  searchHighlightGeoJson,
  selectedUnitName,
  adminScope = "overall",
}: InteractiveMapPanelProps) {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <InteractiveMapClient
        boundaryGeoJson={boundaryGeoJson || null}
        analysis={analysis}
        selectedWardName={selectedWardName}
        onSelectWard={onSelectWard}
        searchHighlightGeoJson={searchHighlightGeoJson || null}
        selectedUnitName={selectedUnitName || ""}
        adminScope={adminScope}
      />
    </div>
  );
}