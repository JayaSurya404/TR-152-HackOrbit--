import { Suspense } from "react";
import DetailsPage from "@/components/workspace/details/page";

function DetailsFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm">
        Loading workspace details...
      </div>
    </div>
  );
}

export default function WorkspaceDetailsRoutePage() {
  return (
    <Suspense fallback={<DetailsFallback />}>
      <DetailsPage />
    </Suspense>
  );
}