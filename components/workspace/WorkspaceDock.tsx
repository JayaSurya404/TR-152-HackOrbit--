"use client";

import { useMemo, useState } from "react";
import { ChevronUp, FileText, MapPinned, UploadCloud, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";

type WorkspaceDockProps = {
  projectId?: string;
};

export default function WorkspaceDock({ projectId }: WorkspaceDockProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const disabled = !projectId;

  const navItems = useMemo(
    () => [
      {
        label: "Upload",
        icon: UploadCloud,
        href: `/workspace/upload${projectId ? `?projectId=${projectId}` : ""}`,
      },
      {
        label: "Details",
        icon: FileText,
        href: `/workspace/details${projectId ? `?projectId=${projectId}` : ""}`,
      },
      {
        label: "Intervention",
        icon: Wrench,
        href: `/workspace/interventions${projectId ? `?projectId=${projectId}` : ""}`,
      },
      {
        label: "Open Map",
        icon: MapPinned,
        href: `/workspace${projectId ? `?projectId=${projectId}` : ""}`,
      },
    ],
    [projectId]
  );

  return (
    <div className="absolute bottom-4 right-4 z-[800] flex flex-col items-end gap-3">
      {open
        ? navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                disabled={disabled}
                onClick={() => router.push(item.href)}
                className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 text-sm font-medium text-white backdrop-blur-2xl transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon className="h-4 w-4 text-cyan-200" />
                {item.label}
              </button>
            );
          })
        : null}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-400/15 px-4 py-3 text-sm font-semibold text-cyan-100 backdrop-blur-2xl"
      >
        <ChevronUp className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        Menu
      </button>
    </div>
  );
}