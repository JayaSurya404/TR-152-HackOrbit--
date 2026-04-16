type UploadDataPanelProps = {
  projectId?: string;
  busyKey: string | null;
  onSurveyUpload: (file: File) => void;
  onBoundaryUpload: (file: File) => void;
  onSatelliteUpload: (file: File) => void;
  onAnalyze: () => void;
  onGenerateReport: () => void;
  onRefreshCurrent: () => void;
};

function UploadBlock({
  label,
  accept,
  helper,
  onChange,
}: {
  label: string;
  accept: string;
  helper: string;
  onChange: (file: File) => void;
}) {
  return (
    <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-4 transition hover:border-cyan-300/30 hover:bg-white/[0.05]">
      <div className="text-sm font-medium text-white">{label}</div>
      <p className="mt-1 text-xs leading-5 text-slate-400">{helper}</p>
      <input
        type="file"
        accept={accept}
        className="mt-4 block w-full text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400/15 file:px-4 file:py-2 file:text-cyan-100"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange(file);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

export default function UploadDataPanel({
  projectId,
  busyKey,
  onSurveyUpload,
  onBoundaryUpload,
  onSatelliteUpload,
  onAnalyze,
  onGenerateReport,
  onRefreshCurrent,
}: UploadDataPanelProps) {
  const disabled = !projectId || busyKey !== null;

  return (
    <div className="space-y-4">
      <UploadBlock
        label="Upload Survey CSV"
        accept=".csv,text/csv"
        helper="Household-level or ward-level survey data. The backend auto-maps water, sanitation, electricity, roads, drainage, and waste columns."
        onChange={onSurveyUpload}
      />

      <UploadBlock
        label="Upload Boundary GeoJSON"
        accept=".json,.geojson,application/geo+json,application/json"
        helper="Use ward or cluster polygons. GeoJSON is the fastest hackathon-safe format for map overlays."
        onChange={onBoundaryUpload}
      />

      <UploadBlock
        label="Upload Satellite Summary JSON"
        accept=".json,application/json"
        helper='Upload JSON summary with global/byWard keys. This feeds built-up pressure, vegetation scarcity, water stress, and road visibility support signals.'
        onChange={onSatelliteUpload}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          onClick={onAnalyze}
          disabled={disabled}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Run Analysis
        </button>
        <button
          onClick={onGenerateReport}
          disabled={disabled}
          className="rounded-2xl border border-emerald-300/25 bg-emerald-400/12 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Build Report
        </button>
        <button
          onClick={onRefreshCurrent}
          disabled={disabled}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reload
        </button>
      </div>

      {!projectId ? (
        <p className="text-sm text-amber-100">
          Create or select a project first.
        </p>
      ) : null}
    </div>
  );
}