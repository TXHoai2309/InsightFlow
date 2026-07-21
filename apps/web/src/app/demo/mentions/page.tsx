"use client";

import dynamic from "next/dynamic";

const MentionsPage = dynamic(() => import("@/app/mentions/page"), { ssr: false });

export default function DemoMentionsPage() {
  return <MentionsPage />;
}
