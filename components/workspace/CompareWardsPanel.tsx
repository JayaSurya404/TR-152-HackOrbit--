"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { AnalysisPayload, WardScore } from "@/types/workspace";

type CompareWardsPanelProps = {
  analysis: AnalysisPayload | null;
};

const SERVICE_LABELS: Record<string, string> = {
  water: "Water",
  sanitation: "Sanitation",
  electricity: "Electricity",
  road: "Road",
  drainage: "Drainage",
  waste: "Waste",
};

function CompareRow({
  label,
  left,
  right,
}: {
  label: string;
  left: number | null | undefined;
  right: number | null | undefined;
}) {
  const leftSafe = left ?? 0;
  const rightSafe = right ?? 0;
  const winner =
    leftSafe === rightSafe ? "tie" : leftSafe > rightSafe ? "left" : "right";

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">{label}</p>
        <span className="text-xs text-slate-400">
          {winner === "tie"
            ? "Balanced"
            : winner === "left"
            ? "Left higher"
            : "Right higher"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/8 bg-slate-950/30 p-3 text-center">
          <p className="text-xs text-slate-400">Ward A</p>
          <p className="mt-2 text-base font-semibold text-white">{left ?? "--"}</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-slate-950/30 p-3 text-center">
          <p className="text-xs text-slate-400">Ward B</p>
          <p className="mt-2 text-base font-semibold text-white">{right ?? "--"}</p>
        </div>
      </div>
    </div>
  );
}

export default function CompareWardsPanel({
  analysis,
}: CompareWardsPanelProps) {
  const wards = analysis?.wardScores || [];

  const [leftWardName, setLeftWardName] = useState("");
  const [rightWardName, setRightWardName] = useState("");

  useEffect(() => {
    if (wards.length) {
      setLeftWardName((prev) => prev || wards[0].wardName);
      setRightWardName((prev) => prev || wards[Math.min(1, wards.length - 1)].wardName);
    }
  }, [wards]);

  const leftWard = useMemo<WardScore | null>(
    () =>
      wards.find((item) => item.wardName.toLowerCase() === leftWardName.toLowerCase()) ||
      null,
    [wards, leftWardName]
  );

  const rightWard = useMemo<WardScore | null>(
    () =>
      wards.find((item) => item.wardName.toLowerCase() === rightWardName.toLowerCase()) ||
      null,
    [wards, rightWardName]
  );

  return (
    <GlassCard
      title="Compare Wards"
      subtitle="Judge-friendly side-by-side comparison for prioritization and resource planning."
    >
      {wards.length ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select
              value={leftWardName}
              onChange={(e) => setLeftWardName(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none"
            >
              {wards.map((ward) => (
                <option key={ward.wardName} value={ward.wardName}>
                  {ward.wardName}
                </option>
              ))}
            </select>

            <select
              value={rightWardName}
              onChange={(e) => setRightWardName(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none"
            >
              {wards.map((ward) => (
                <option key={ward.wardName} value={ward.wardName}>
                  {ward.wardName}
                </option>
              ))}
            </select>
          </div>

          {leftWard && rightWard ? (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">
                        {leftWard.wardName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Priority {leftWard.priorityScore}
                      </p>
                    </div>
                    <StatusBadge value={leftWard.severity} />
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">
                        {rightWard.wardName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Priority {rightWard.priorityScore}
                      </p>
                    </div>
                    <StatusBadge value={rightWard.severity} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {Object.keys(SERVICE_LABELS).map((key) => (
                  <CompareRow
                    key={key}
                    label={`${SERVICE_LABELS[key]} Gap`}
                    left={leftWard.gaps?.[key]}
                    right={rightWard.gaps?.[key]}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-slate-300">
          Run analysis to enable ward comparison mode.
        </div>
      )}
    </GlassCard>
  );
}