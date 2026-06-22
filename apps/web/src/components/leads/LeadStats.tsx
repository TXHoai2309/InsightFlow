"use client";

import React, { useMemo } from "react";
import type { Lead } from "@/types/dashboard";

interface LeadStatsProps {
  leads: Lead[];
  isLoading: boolean;
}

export function LeadStats({ leads, isLoading }: LeadStatsProps) {
  const stats = useMemo(() => {
    if (leads.length === 0) {
      return {
        totalNew: 0,
        completed: 0,
        urgentCount: 0,
        conversionRate: 0,
      };
    }

    const totalNew = leads.filter((l) => l.status === "new").length;
    const completed = leads.filter((l) => l.status === "completed").length;
    
    // Conversion/Response Rate: Completed / Total leads
    const conversionRate = leads.length > 0 
      ? Math.round((completed / leads.length) * 100) 
      : 0;

    // Urgent leads: pending leads (new/processing) that are close to expiring:
    // - Hot leads with remaining time < 10 minutes (600 seconds)
    // - Warm leads with remaining time < 2 hours (7200 seconds)
    const nowMs = Date.now();
    const urgentCount = leads.filter((l) => {
      if (l.status !== "new" && l.status !== "processing") return false;
      
      const expiryTime = l.expiry_at 
        ? new Date(l.expiry_at).getTime()
        : new Date(l.created_at).getTime() + (l.intent === "hot" ? 30 : l.intent === "warm" ? 24 * 60 : 7 * 24 * 60) * 60 * 1000;
      
      const remainingMs = expiryTime - nowMs;
      if (remainingMs <= 0) return false; // already expired
      
      if (l.intent === "hot") {
        return remainingMs < 10 * 60 * 1000; // < 10 mins
      }
      if (l.intent === "warm") {
        return remainingMs < 2 * 60 * 60 * 1000; // < 2 hours
      }
      return false;
    }).length;

    return {
      totalNew,
      completed,
      urgentCount,
      conversionRate,
    };
  }, [leads]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-4 md:p-6 rounded-xl animate-pulse flex flex-col gap-2">
            <div className="h-4 bg-outline-variant/30 rounded w-2/3"></div>
            <div className="h-8 bg-outline-variant/40 rounded w-1/2 mt-1"></div>
            <div className="h-3 bg-outline-variant/20 rounded w-3/4 mt-2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {/* Total New Leads */}
      <div className="glass-card p-4 md:p-6 rounded-xl flex flex-col gap-1 hover:shadow-sm transition-all duration-300">
        <span className="text-on-surface-variant text-xs md:text-sm font-medium">Tổng Lead mới</span>
        <span className="text-2xl md:text-3xl font-bold text-on-surface">
          {stats.totalNew}
        </span>
        <span className="text-primary text-[10px] md:text-xs font-bold flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-sm">hourglass_empty</span> Cần tiếp cận ngay
        </span>
      </div>

      {/* Response/Conversion Rate */}
      <div className="glass-card p-4 md:p-6 rounded-xl flex flex-col gap-1 hover:shadow-sm transition-all duration-300">
        <span className="text-on-surface-variant text-xs md:text-sm font-medium">Tỉ lệ chuyển đổi</span>
        <span className="text-2xl md:text-3xl font-bold text-on-surface">
          {stats.conversionRate}%
        </span>
        <span className="text-secondary text-[10px] md:text-xs font-bold flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-sm">check_circle</span> Phản hồi thành công
        </span>
      </div>

      {/* Urgent Leads Count */}
      <div className="glass-card p-4 md:p-6 rounded-xl flex flex-col gap-1 border-l-4 border-error hover:shadow-sm transition-all duration-300">
        <span className="text-on-surface-variant text-xs md:text-sm font-medium">Sắp hết hạn</span>
        <span className="text-2xl md:text-3xl font-bold text-error">
          {String(stats.urgentCount).padStart(2, "0")}
        </span>
        <span className="text-error text-[10px] md:text-xs font-bold flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-sm animate-pulse">timer</span> Cần ưu tiên xử lý
        </span>
      </div>

      {/* Processed Leads */}
      <div className="glass-card p-4 md:p-6 rounded-xl flex flex-col gap-1 hover:shadow-sm transition-all duration-300">
        <span className="text-on-surface-variant text-xs md:text-sm font-medium">Đã xử lý (chốt)</span>
        <span className="text-2xl md:text-3xl font-bold text-on-surface">
          {stats.completed}
        </span>
        <span className="text-on-surface-variant text-[10px] md:text-xs font-medium mt-1">
          Mục tiêu: chốt 100% lead
        </span>
      </div>
    </div>
  );
}
