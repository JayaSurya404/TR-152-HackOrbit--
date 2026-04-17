import { Suspense } from "react";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

function WorkspaceFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
      Loading workspace...
    </div>
  );
}

export default function WorkspaceRoutePage() {
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <WorkspaceShell />
    </Suspense>
  );
}