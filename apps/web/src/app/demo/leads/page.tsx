"use client";

import dynamic from "next/dynamic";

const LeadsPage = dynamic(() => import("@/app/leads/page"), { ssr: false });

export default function DemoLeadsPage() {
  return <LeadsPage />;
}
