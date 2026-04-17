import { Suspense } from "react";
import WorkspaceDetailsPageClient from "@/components/workspace/details/WorkspaceDetailsPageClient";

function DetailsFallback() {
  return (
    <main className="min-h-screen w-full bg-slate-950">
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white backdrop-blur-xl">
          Loading workspace details...
        </div>
      </div>
    </main>
  );
}

export default function WorkspaceDetailsRoutePage() {
  return (
    <Suspense fallback={<DetailsFallback />}>
      <WorkspaceDetailsPageClient />
    </Suspense>
  );
}