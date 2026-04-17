import { Suspense } from "react";
import WorkspacePage from "../../components/workspace/page";

function WorkspaceFallback() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white backdrop-blur-xl">
          Loading workspace...
        </div>
      </div>
    </main>
  );
}

export default function WorkspaceRoutePage() {
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <WorkspacePage />
    </Suspense>
  );
}