import { ReactNode } from "react";

type MetricTileProps = {
  label: string;
  value: ReactNode;
  helper?: string;
  className?: string;
};

export default function MetricTile({
  label,
  value,
  helper,
  className = "",
}: MetricTileProps) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.04] p-4 ${className}`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      {helper ? <p className="mt-2 text-sm text-slate-300">{helper}</p> : null}
    </div>
  );
}