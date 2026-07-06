"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/hooks/useDashboardData";
import { useDashboardStore } from "@/stores/dashboard.store";
import {
  LeadDetailPanel,
  LeadFilters,
  LeadStats,
  LeadWorkbenchRow,
} from "@/components/leads";
import { useAuth } from "@/hooks/useAuth";
import { canPerformAction } from "@/lib/rbac";
import { hasBusinessBrandScope } from "@/lib/brandScope";
import type { Lead } from "@/types/dashboard";
import {
  canLeadBeVisibleToUser,
  getDefaultLeadWorkbenchView,
  getLeadWorkbenchMeta,
  getLeadWorkbenchViews,
  matchesLeadWorkbenchView,
  sortLeadsForWorkbench,
  type LeadWorkbenchView,
} from "@/lib/lead-workbench";
import { normalizeBrandName } from "@/lib/services/dashboard";

const LEADS_PAGE_SIZE = 5;

export default function LeadsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState<LeadWorkbenchView>("priority");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const canViewLeads = canPerformAction(profile, "view_leads");
  const hasBrandScope = hasBusinessBrandScope(profile);

  useDashboard({ autoFetch: true, refetchInterval: 60000 });

  const {
    getFilteredLeadsWithoutUrgency,
    workspaces,
    filters,
    leads,
    isLoading,
    error,
    setFilters,
  } = useDashboardStore();

  useEffect(() => {
    if (!profile || profile.role === "admin" || workspaces.length === 0) return;
    if (filters.workspace_id !== "all") return;
    setFilters({ workspace_id: workspaces[0].id });
  }, [filters.workspace_id, profile, setFilters, workspaces]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const baseLeads = useMemo(
    () => getFilteredLeadsWithoutUrgency(),
    [getFilteredLeadsWithoutUrgency, filters, leads],
  );

  const workbenchViews = useMemo(
    () => getLeadWorkbenchViews(profile),
    [profile],
  );

  useEffect(() => {
    const defaultView = getDefaultLeadWorkbenchView(profile);
    setActiveView((currentView) =>
      workbenchViews.some((view) => view.id === currentView)
        ? currentView
        : defaultView,
    );
  }, [profile, workbenchViews]);

  const visibleBaseLeads = useMemo(
    () => baseLeads.filter((lead) => canLeadBeVisibleToUser(lead, profile)),
    [baseLeads, profile],
  );

  const sortedLeads = useMemo(
    () => sortLeadsForWorkbench(visibleBaseLeads, currentTime),
    [visibleBaseLeads, currentTime],
  );

  const viewCounts = useMemo(() => {
    return workbenchViews.reduce(
      (acc, view) => {
        acc[view.id] = visibleBaseLeads.filter((lead) =>
          matchesLeadWorkbenchView(lead, view.id, currentTime, profile),
        ).length;
        return acc;
      },
      {} as Record<LeadWorkbenchView, number>,
    );
  }, [currentTime, profile, visibleBaseLeads, workbenchViews]);

  const visibleLeads = useMemo(() => {
    return sortedLeads.filter((lead) =>
      matchesLeadWorkbenchView(lead, activeView, currentTime, profile),
    );
  }, [activeView, sortedLeads, currentTime, profile]);

  const totalPages = Math.max(1, Math.ceil(visibleLeads.length / LEADS_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeView, filters.workspace_id, filters.platform]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(1, page), totalPages));
  }, [totalPages]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * LEADS_PAGE_SIZE;
    return visibleLeads.slice(start, start + LEADS_PAGE_SIZE);
  }, [currentPage, visibleLeads]);

  useEffect(() => {
    if (paginatedLeads.length === 0) {
      setSelectedLeadId(null);
      return;
    }
    if (!selectedLeadId || !paginatedLeads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(paginatedLeads[0].id);
    }
  }, [paginatedLeads, selectedLeadId]);

  const selectedLead =
    paginatedLeads.find((lead) => lead.id === selectedLeadId) ||
    visibleLeads.find((lead) => lead.id === selectedLeadId) ||
    visibleBaseLeads.find((lead) => lead.id === selectedLeadId) ||
    null;

  const firstLeadNumber =
    visibleLeads.length === 0 ? 0 : (currentPage - 1) * LEADS_PAGE_SIZE + 1;
  const lastLeadNumber = Math.min(currentPage * LEADS_PAGE_SIZE, visibleLeads.length);

  const brandPlatformFilteredLeads = useMemo(() => {
    const normFilter =
      filters.workspace_id !== "all" ? normalizeBrandName(filters.workspace_id) : null;
    return leads.filter((lead) => {
      if (normFilter && normalizeBrandName(lead.workspace_id) !== normFilter) return false;
      if (filters.platform !== "all" && lead.platform !== filters.platform) return false;
      if (!canLeadBeVisibleToUser(lead, profile)) return false;
      return true;
    });
  }, [leads, filters.workspace_id, filters.platform, profile]);

  const pendingResultLead = useMemo(() => {
    return sortedLeads.find((lead) =>
      matchesLeadWorkbenchView(lead, "need_result", currentTime, profile),
    );
  }, [sortedLeads, currentTime, profile]);

  const handleStartedAction = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    const meta = getLeadWorkbenchMeta(lead, currentTime);
    setActiveView(
      meta.needsResultCapture ? "need_result" : getDefaultLeadWorkbenchView(profile),
    );
  };

  const handleAfterResult = () => {
    const remainingNeedResult = sortedLeads.filter(
      (lead) =>
        lead.id !== selectedLeadId &&
        matchesLeadWorkbenchView(lead, "need_result", currentTime, profile),
    );

    if (remainingNeedResult.length > 0) {
      setActiveView("need_result");
      setSelectedLeadId(remainingNeedResult[0].id);
      return;
    }

    const currentIndex = visibleLeads.findIndex((lead) => lead.id === selectedLeadId);
    const nextLead = visibleLeads[currentIndex + 1] || visibleLeads[0] || null;
    setActiveView(getDefaultLeadWorkbenchView(profile));
    setSelectedLeadId(nextLead?.id || null);
  };

  if (!authLoading && !canViewLeads) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-8">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Không có quyền truy cập
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Vai trò hiện tại không được phép truy cập module quản lý lead.
          </p>
        </div>
      </div>
    );
  }

  if (!authLoading && !hasBrandScope) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-8">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Chưa được gán thương hiệu
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Tài khoản cần được gán brandId hoặc brandName trước khi xử lý lead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-full gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:gap-4">
      <main className="min-w-0 space-y-3">
        <LeadStats
          leads={brandPlatformFilteredLeads}
          isLoading={isLoading}
          profile={profile}
          onSelectView={(view) => setActiveView(view)}
        />

        {pendingResultLead && (
          <section className="flex flex-col gap-3 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="material-symbols-outlined text-[var(--color-warning)]">
                pending_actions
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Có {viewCounts.need_result || 0} lead đang chờ ghi nhận kết quả
                </p>
                <p className="truncate text-sm text-[var(--color-text-secondary)]">
                  Gần nhất: {pendingResultLead.author || "khách hàng"} · sau khi mở liên hệ, hãy ghi nhận kết quả để không mất dấu.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveView("need_result");
                setSelectedLeadId(pendingResultLead.id);
              }}
              className="rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-bg-surface)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)]"
            >
              Ghi nhận ngay
            </button>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {workbenchViews.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView(view.id)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    activeView === view.id
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-sm"
                      : "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)]"
                  }`}
                >
                  {view.label}
                  <span className="ml-2 opacity-80">{viewCounts[view.id]}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              Bộ lọc
            </button>
          </div>

          {showFilters && (
            <LeadFilters
              workspaces={workspaces}
              brandLocked={profile?.role !== "admin"}
            />
          )}

          <div className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-subtle)] p-4 text-sm font-medium text-[var(--color-error)]">
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
            )}

            {isLoading && visibleLeads.length === 0 ? (
              [0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[104px] animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]"
                />
              ))
            ) : visibleLeads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-[var(--color-text-muted)]">
                  inbox
                </span>
                <h3 className="mt-3 text-lg font-bold text-[var(--color-text-primary)]">
                  Không có lead trong nhóm này
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Chuyển quick view hoặc mở bộ lọc để xem nhóm lead khác.
                </p>
              </div>
            ) : (
              paginatedLeads.map((lead, index) => (
                <LeadWorkbenchRow
                  key={lead.id}
                  lead={lead}
                  rank={(currentPage - 1) * LEADS_PAGE_SIZE + index + 1}
                  nowMs={currentTime}
                  selected={selectedLeadId === lead.id}
                  onSelect={(nextLead: Lead) => setSelectedLeadId(nextLead.id)}
                  onStartedAction={handleStartedAction}
                />
              ))
            )}

            {visibleLeads.length > 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-sm text-[var(--color-text-secondary)] md:flex-row md:items-center md:justify-between">
                <span>
                  Hiển thị {firstLeadNumber}-{lastLeadNumber} trong {visibleLeads.length} lead
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 font-semibold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span className="min-w-12 text-center font-bold text-[var(--color-text-primary)]">
                    {currentPage}/{totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 font-semibold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <LeadDetailPanel
        lead={selectedLead}
        nowMs={currentTime}
        onClose={() => setSelectedLeadId(null)}
        onAfterResult={handleAfterResult}
        onStartedAction={handleStartedAction}
      />
    </div>
  );
}
