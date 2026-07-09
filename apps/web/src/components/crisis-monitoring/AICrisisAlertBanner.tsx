"use client";

import React from "react";
import { AlertOctagon, CheckCircle2, ShieldAlert } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard.store";
import { motion } from "framer-motion";

export function AICrisisAlertBanner() {
  const { getFilteredAlerts } = useDashboardStore();
  const alerts = getFilteredAlerts();
  const criticalAlerts = alerts.filter(a => a.severity === "critical" || a.severity === "high");
  const activeAlerts = alerts.filter(a => a.status === "new" || a.status === "acknowledged");
  const latestAlert = activeAlerts.length > 0 ? activeAlerts[0] : criticalAlerts.length > 0 ? criticalAlerts[0] : null;

  if (!latestAlert) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-[#C8C4D6]/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(66,52,182,0.08)]">
        <div className="flex items-start md:items-center">
          <div className="relative mr-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="h-5.5 w-5.5 z-10" />
            <motion.div
              className="absolute inset-0 bg-emerald-400 rounded-xl"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="mb-0.5 flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">
                  Hệ thống AI an toàn
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[13.5px] leading-relaxed text-[#474554] font-medium">
                Không phát hiện mối đe dọa nào. Sức khỏe thương hiệu đang ở trạng thái tối ưu.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-[11px] font-extrabold text-emerald-600 border border-emerald-100/60 self-start md:self-auto">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>AN TOÀN</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-[#FFDAD6]/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(186,26,26,0.08)]">
      <div className="flex items-start md:items-center">
        <div className="relative mr-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#BA1A1A] text-white shadow-md shadow-[#BA1A1A]/20">
          <ShieldAlert className="h-5.5 w-5.5 z-10" />
          <motion.div
            className="absolute inset-0 bg-[#BA1A1A] rounded-xl"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="mb-0.5 flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#BA1A1A]">
                Cảnh báo AI bảo vệ thương hiệu
              </span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#BA1A1A] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#BA1A1A]"></span>
              </span>
            </div>
            <p className="text-[13.5px] leading-relaxed text-[#1A1B20] font-medium">
              <strong className="font-bold text-[#BA1A1A]">Khủng hoảng tiêu cực:</strong> {latestAlert.message}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-50 text-[11px] font-extrabold text-[#BA1A1A] border border-red-100/60 self-start md:self-auto">
            <span className="material-symbols-outlined text-[14px] animate-pulse">report</span>
            <span>{activeAlerts.length} SỰ VỤ CHỜ XỬ LÝ</span>
          </div>
        </div>
      </div>
    </div>
  );
}

