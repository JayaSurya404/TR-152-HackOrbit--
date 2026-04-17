import { Suspense } from "react";
import WorkspaceDetailsPage from "@/components/workspace/details/page";

function DetailsFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
      Loading workspace details...
    </div>
  );
}

export default function WorkspaceDetailsRoutePage() {
  return (
    <Suspense fallback={<DetailsFallback />}>
      <WorkspaceDetailsPage />
    </Suspense>
  );
}