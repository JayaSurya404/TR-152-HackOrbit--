import dynamic from "next/dynamic";
import GlassCard from "@/components/ui/GlassCard";
import { AnalysisPayload, GeoFeatureCollection } from "@/types/workspace";

const InteractiveMapClient = dynamic(
  () => import("./InteractiveMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center rounded-[24px] border border-white/10 bg-slate-950/30 text-sm text-slate-300">
        Loading interactive map...
      </div>
    ),
  }
);

type InteractiveMapPanelProps = {
  boundaryGeoJson?: GeoFeatureCollection | null;
  analysis: AnalysisPayload | null;
  selectedWardName: string;
  onSelectWard: (wardName: string) => void;
};

export default function InteractiveMapPanel({
  boundaryGeoJson,
  analysis,
  selectedWardName,
  onSelectWard,
}: InteractiveMapPanelProps) {
  return (
    <GlassCard
      title="Gap Intelligence Map"
      subtitle="Annotated settlement map with gap overlays, 5 service layers, and base-map switching."
    >
      <div className="h-[560px]">
        <InteractiveMapClient
          boundaryGeoJson={boundaryGeoJson || null}
          analysis={analysis}
          selectedWardName={selectedWardName}
          onSelectWard={onSelectWard}
        />
      </div>
    </GlassCard>
  );
}