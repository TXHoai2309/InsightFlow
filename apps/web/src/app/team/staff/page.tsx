"use client";

import { Suspense } from "react";
import { TeamManagementPage } from "@/components/team/TeamManagementPage";

function StaffListContent() {
  return <TeamManagementPage initialTab="list" />;
}

export default function StaffListPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6C5CE7] border-t-transparent" />
      </div>
    }>
      <StaffListContent />
    </Suspense>
  );
}
