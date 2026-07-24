"use client";

import dynamic from "next/dynamic";

const MentionDetailPage = dynamic(() => import("@/app/mentions/[id]/page"), {
  ssr: false,
});

export default function DemoMentionDetailPage() {
  return <MentionDetailPage />;
}
