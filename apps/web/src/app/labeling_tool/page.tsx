"use client";

import dynamic from "next/dynamic";

const LabelingTool = dynamic(() => import("./tool/App"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-app-text-muted">
      Dang tai cong cu gan nhan...
    </div>
  ),
});

export default function LabelingToolPage() {
  return <LabelingTool />;
}

