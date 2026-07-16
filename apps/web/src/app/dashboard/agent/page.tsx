import React from "react";
import { Metadata } from "next";
import { AgentDashboard } from "@/components/lead-processing-agent";

export const metadata: Metadata = {
  title: "Tổng quan Công việc | InsightFlow",
  description: "Không gian làm việc dành riêng cho Nhân viên xử lý khách hàng tiềm năng",
};

export default function AgentDashboardPage() {
  return (
    <div className="w-full h-full p-6">
      <AgentDashboard />
    </div>
  );
}
