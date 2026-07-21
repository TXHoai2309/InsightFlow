"use client";

import { Suspense } from "react";
import { TeamManagementPage } from "@/components/team/TeamManagementPage";

function CreateStaffContent() {
  return <TeamManagementPage initialTab="create" />;
}

export default function CreateStaffPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6C5CE7] dark:border-[#9B8CFF] border-t-transparent dark:border-t-transparent" />
      </div>
    }>
      <CreateStaffContent />
    </Suspense>
  );
}
