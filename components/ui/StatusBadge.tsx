type StatusBadgeProps = {
  value?: string | null;
};

function getClasses(value?: string | null) {
  const key = (value || "").toLowerCase();

  if (["critical", "reported", "immediate"].includes(key)) {
    return "bg-rose-500/18 text-rose-200 ring-1 ring-rose-400/25";
  }

  if (["high", "analyzed", "priority"].includes(key)) {
    return "bg-orange-500/18 text-orange-200 ring-1 ring-orange-400/25";
  }

  if (["moderate", "data_ready", "survey_uploaded", "boundary_uploaded"].includes(key)) {
    return "bg-amber-500/18 text-amber-100 ring-1 ring-amber-400/25";
  }

  if (["stable", "draft", "planned"].includes(key)) {
    return "bg-emerald-500/18 text-emerald-100 ring-1 ring-emerald-400/25";
  }

  return "bg-slate-500/18 text-slate-100 ring-1 ring-white/10";
}

export default function StatusBadge({ value }: StatusBadgeProps) {
  const text = value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "Unknown";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getClasses(
        value
      )}`}
    >
      {text}
    </span>
  );
}