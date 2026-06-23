"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDashboard } from "@/hooks/useDashboardData";
import { useDashboardStore } from "@/stores/dashboard.store";
import { LeadFilters, LeadStats, LeadCard } from "@/components/leads";

import { normalizeBrandName } from "@/lib/services/dashboard";

/**
 * Lead Management Page
 * Theo dõi và chuyển đổi Lead từ các tín hiệu mạng xã hội sử dụng dữ liệu thật từ Firebase
 * Hỗ trợ mobile responsive và đếm ngược thời gian thực
 */
export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<"hot" | "warm" | "cold">("hot");
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // 1. Tự động tải dữ liệu và cập nhật định kỳ từ Firebase (Project 2: datainsight)
  useDashboard({ autoFetch: true, refetchInterval: 60000 });

  const { getFilteredLeads, workspaces, filters, leads, isLoading, error } = useDashboardStore();

  // 2. Chạy đồng hồ ticking giây để cập nhật countdown cho toàn bộ Hot Lead Card đồng thời
  useEffect(() => {
    setCurrentTime(Date.now());
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Lọc danh sách lead động theo bộ lọc của store và theo Tab ý định mua hàng hiện tại
  const allFilteredLeads = useMemo(() => {
    return getFilteredLeads();
  }, [getFilteredLeads, filters, leads]);

  // Lọc theo Brand và Platform (không lọc theo urgency) để làm đầu vào tính toán stats chính xác
  const brandPlatformFilteredLeads = useMemo(() => {
    const normFilter = filters.workspace_id !== "all" ? normalizeBrandName(filters.workspace_id) : null;
    return leads.filter((l) => {
      if (normFilter && normalizeBrandName(l.workspace_id) !== normFilter) return false;
      if (filters.platform !== "all" && l.platform !== filters.platform) return false;
      return true;
    });
  }, [leads, filters.workspace_id, filters.platform]);

  const currentTabLeads = useMemo(() => {
    return allFilteredLeads.filter((l) => l.intent === activeTab);
  }, [allFilteredLeads, activeTab]);

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl text-[var(--color-text-primary)] font-bold">
            Quản lý Khách hàng Tiềm năng
          </h2>
          <p className="text-body-md text-[var(--color-text-secondary)] mt-1">
            Theo dõi và chuyển đổi Lead trực tiếp từ dữ liệu cào mạng xã hội thời gian thực.
          </p>
        </div>
        
        {/* Tab switcher */}
        <div className="flex gap-1 bg-[var(--color-bg-surface-raised)] p-1 rounded-xl border border-[var(--color-border)] self-start lg:self-auto shadow-sm">
          {(["hot", "warm", "cold"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 md:px-8 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === tab
                  ? "bg-[var(--color-bg-surface)] text-[var(--color-brand)] shadow-sm ring-1 ring-[var(--color-border)] font-bold"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)]"
              }`}
            >
              <span>
                {tab === "hot" ? "🔥 Hot" : tab === "warm" ? "⚡ Warm" : "❄️ Cold"}
              </span>
              <span>
                ({allFilteredLeads.filter((l) => l.intent === tab).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <LeadStats leads={brandPlatformFilteredLeads} isLoading={isLoading} />

      {/* Lead Filters */}
      <LeadFilters workspaces={workspaces} />

      {/* Leads List */}
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-[var(--color-error-subtle)] text-[var(--color-error)] rounded-xl border border-[var(--color-error)]/20 text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            <span>Không thể tải dữ liệu: {error}. Vui lòng thử lại.</span>
          </div>
        )}

        {isLoading && currentTabLeads.length === 0 ? (
          // Shimmer loading skeleton
            [...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-xl animate-pulse flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 sm:w-56 flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-surface-raised)]"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[var(--color-bg-surface-raised)] rounded w-2/3"></div>
                  <div className="h-3 bg-[var(--color-bg-surface-high)] rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--color-bg-surface-raised)] rounded w-full"></div>
                <div className="h-3.5 bg-[var(--color-bg-surface-high)] rounded w-3/4"></div>
              </div>
              <div className="sm:w-48 flex items-center justify-between sm:justify-end gap-2">
                <div className="h-6 bg-[var(--color-bg-surface-raised)] rounded w-20"></div>
                <div className="h-8 bg-[var(--color-bg-surface-high)] rounded w-24"></div>
              </div>
            </div>
          ))
        ) : currentTabLeads.length === 0 ? (
          // Empty State
          <div className="glass-card p-12 text-center rounded-xl flex flex-col items-center justify-center gap-3 border border-dashed border-[var(--color-border)]">
            <div className="w-16 h-16 rounded-full bg-[var(--color-bg-surface-raised)] flex items-center justify-center text-[var(--color-text-muted)]">
              <span className="material-symbols-outlined text-3xl">inbox</span>
            </div>
            <div>
              <h4 className="font-bold text-[var(--color-text-primary)] text-lg">Chưa có lead nào</h4>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Không tìm thấy khách hàng tiềm năng nào phù hợp với bộ lọc hiện tại trong tab này.
              </p>
            </div>
          </div>
        ) : (
          // Lead Cards List
          currentTabLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} currentTime={currentTime} />
          ))
        )}
      </div>

    </div>
  );
}
