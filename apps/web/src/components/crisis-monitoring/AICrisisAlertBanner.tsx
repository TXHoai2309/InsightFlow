"use client";

import React from "react";
import { AlertOctagon, CheckCircle2 } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard.store";

export function AICrisisAlertBanner() {
  const { getFilteredAlerts } = useDashboardStore();
  const alerts = getFilteredAlerts();
  const criticalAlerts = alerts.filter(a => a.severity === "critical" || a.severity === "high");
  const activeAlerts = alerts.filter(a => a.status === "new" || a.status === "acknowledged");
  const latestAlert = activeAlerts.length > 0 ? activeAlerts[0] : criticalAlerts.length > 0 ? criticalAlerts[0] : null;

  if (!latestAlert) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-[#E2DFFF]/50 backdrop-blur-md border border-[#C8C4D6] p-4 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0px_8px_30px_rgba(30,31,36,0.12)]">
        <div className="flex items-start">
          <div className="mr-4 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4234B6] text-white shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center space-x-2">
              <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#4234B6]">
                AI STATUS
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-[#1A1B20]">
              Hiện tại không có báo cáo rủi ro nghiêm trọng nào. Đội ngũ xử lý khủng hoảng đã tiếp nhận và giải quyết toàn bộ các vấn đề (nếu có).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#FFDAD6]/80 backdrop-blur-md border border-[#FFDAD6] p-4 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0px_8px_30px_rgba(30,31,36,0.12)]">
      <div className="flex items-start">
        <div className="mr-4 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#BA1A1A] text-white shadow-sm">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center space-x-2">
            <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#BA1A1A]">
              AI ALERT
            </span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#BA1A1A] opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#BA1A1A]"></span>
            </span>
          </div>
          <p className="text-[14px] leading-relaxed text-[#1A1B20]">
            <strong className="font-bold text-[#BA1A1A]">Cảnh báo rủi ro:</strong> {latestAlert.message}
          </p>
          <p className="text-[12px] text-[#474554] mt-2 italic">
            Tổng cộng đang có {activeAlerts.length} rủi ro cấp thiết đang chờ xử lý.
          </p>
        </div>
      </div>
    </div>
  );
}
