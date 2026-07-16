"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDashboard } from "@/hooks/useDashboardData";
import { useDashboardStore } from "@/stores/dashboard.store";
import {
  LeadDetailPanel,
  LeadFilters,
  LeadStats,
  LeadWorkbenchRow,
} from "@/components/leads";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
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
import {
  LEAD_DETAIL_PANEL_SCROLL_ID,
  clearLeadReturnContext,
  loadLeadReturnContext,
  type LeadDetailPanelTab,
} from "@/lib/lead-return-context";
import { normalizeBrandName } from "@/lib/services/dashboard";
import { isIntentLead } from "@/lib/lead-intent";

const LEADS_PAGE_SIZE = 5;
const APP_SCROLL_ROOT_SELECTOR = '[data-app-scroll-root="true"]';

function getAppScrollRoot() {
  return document.querySelector<HTMLElement>(APP_SCROLL_ROOT_SELECTOR);
}

function getLeadListScrollTop() {
  if (typeof window === "undefined") return 0;
  return getAppScrollRoot()?.scrollTop || window.scrollY || 0;
}

export default function LeadsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const canLoadStaffList = canPerformAction(profile, "manage_staff");

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/staff", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setStaffList(data.data || []);
        } else if (res.status === 403) {
          setStaffList([]);
        } else {
          console.warn("Failed to fetch staff list in LeadsPage:", data?.error || res.statusText);
        }
      } catch (e) {
        console.warn("Failed to fetch staff list in LeadsPage:", e);
      }
    };
    if (profile && !authLoading && canLoadStaffList) {
      fetchStaff();
    } else if (profile && !authLoading) {
      setStaffList([]);
    }
  }, [profile, authLoading, canLoadStaffList]);

  const [activeView, setActiveView] = useState<LeadWorkbenchView>("priority");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [detailTab, setDetailTab] = useState<LeadDetailPanelTab>("action");
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState("");
  const [optimisticLeadsById, setOptimisticLeadsById] = useState<Record<string, Lead>>({});
  const hasRestoredReturnContext = useRef(false);
  const skipNextPageReset = useRef(false);
  const pendingRestoreLeadId = useRef<string | null>(null);
  const pendingRestoreScrollTop = useRef<number | null>(null);
  const pendingRestorePanelScrollTop = useRef<number | null>(null);
  const hasReconciledRestoreLead = useRef(false);
  const canViewLeads = canPerformAction(profile, "view_leads");
  const hasBrandScope = hasBusinessBrandScope(profile);

  const clearPendingRestore = useCallback((clearHighlight = false) => {
    pendingRestoreLeadId.current = null;
    pendingRestoreScrollTop.current = null;
    pendingRestorePanelScrollTop.current = null;
    if (clearHighlight) setHighlightedLeadId(null);
  }, []);

  const { refetch } = useDashboard({
    autoFetch: true,
    refetchInterval: 1800000,
  });

  const {
    workspaces,
    filters,
    leads,
    mentions,
    isLoading,
    error,
    setFilters,
  } = useDashboardStore();

  useEffect(() => {
    if (!profile || profile.role === "admin" || workspaces.length === 0) return;
    if (filters.workspace_id !== "all") return;
    const profileBrandKey = normalizeBrandName(profile.brandName || profile.brandId || "");
    const scopedWorkspace = workspaces.find(
      (workspace) =>
        normalizeBrandName(workspace.id) === profileBrandKey ||
        normalizeBrandName(workspace.brand_name) === profileBrandKey,
    );
    setFilters({
      workspace_id:
        scopedWorkspace?.id || profile.brandId || profile.brandName || "all",
    });
  }, [
    filters.workspace_id,
    profile,
    profile?.brandId,
    profile?.brandName,
    setFilters,
    workspaces,
  ]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const rememberOptimisticLead = useCallback((lead: Lead) => {
    setOptimisticLeadsById((current) => {
      const existing = current[lead.id];
      return {
        ...current,
        [lead.id]: existing ? { ...existing, ...lead } : lead,
      };
    });
  }, []);

  const baseLeads = useMemo(() => {
    const normFilter =
      filters.workspace_id !== "all" ? normalizeBrandName(filters.workspace_id) : null;
    const filteredLeads = leads.filter((lead) => {
      if (!isIntentLead(lead)) return false;
      if (normFilter && normalizeBrandName(lead.workspace_id) !== normFilter) return false;
      if (filters.platform !== "all" && lead.platform !== filters.platform) return false;
      return true;
    });
    if (Object.keys(optimisticLeadsById).length === 0) return filteredLeads;

    return filteredLeads.map((lead) => {
      const optimisticLead = optimisticLeadsById[lead.id];
      return optimisticLead ? { ...lead, ...optimisticLead } : lead;
    });
  }, [
    filters.workspace_id,
    filters.platform,
    leads,
    optimisticLeadsById,
  ]);

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

  useEffect(() => {
    if (hasRestoredReturnContext.current || workbenchViews.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const returnToken = params.get("returnToken");
    const returnContext = loadLeadReturnContext(returnToken);
    const requestedFilters = returnContext?.filters;
    const requestedPanelTab = returnContext?.panelTab as
      | LeadDetailPanelTab
      | "suggestion"
      | undefined;
    const requestedView = params.get("view") as LeadWorkbenchView | null;
    const requestedPage = Number(params.get("page") || "1");
    const requestedLeadId = params.get("leadId");
    const nextView = returnContext?.view || requestedView;
    const nextPage = returnContext?.page || requestedPage;
    const nextLeadId =
      returnContext?.selectedLeadId ||
      returnContext?.leadId ||
      requestedLeadId;

    if (requestedFilters && Object.keys(requestedFilters).length > 0) {
      skipNextPageReset.current = true;
      setFilters(requestedFilters);
    }

    if (requestedPanelTab) {
      setDetailTab(requestedPanelTab === "suggestion" ? "action" : requestedPanelTab);
    }

    if (nextView && workbenchViews.some((view) => view.id === nextView)) {
      skipNextPageReset.current = true;
      setActiveView(nextView);
    }

    if (Number.isFinite(nextPage) && nextPage > 0) {
      setCurrentPage(Math.floor(nextPage));
    }

    if (nextLeadId) {
      pendingRestoreLeadId.current = nextLeadId;
      pendingRestoreScrollTop.current = returnContext?.listScrollTop ?? null;
      pendingRestorePanelScrollTop.current = returnContext?.panelScrollTop ?? null;
      setSelectedLeadId(nextLeadId);
      setHighlightedLeadId(nextLeadId);
      setRestoreNotice("Đã quay lại đúng lead bạn vừa kiểm tra.");
    }

    hasRestoredReturnContext.current = true;
    clearLeadReturnContext(returnToken);
  }, [setFilters, workbenchViews]);

  const visibleBaseLeads = useMemo(
    () => baseLeads.filter((lead) => canLeadBeVisibleToUser(lead, profile)),
    [baseLeads, profile],
  );

  const sortedLeads = useMemo(
    () => sortLeadsForWorkbench(visibleBaseLeads, currentTime, profile),
    [visibleBaseLeads, currentTime, profile],
  );

  const viewCounts = useMemo(() => {
    const allViews: LeadWorkbenchView[] = ["unassigned", "priority", "active", "closed", "need_result"];
    return allViews.reduce(
      (acc, viewId) => {
        acc[viewId] = visibleBaseLeads.filter((lead) =>
          matchesLeadWorkbenchView(lead, viewId, currentTime, profile),
        ).length;
        return acc;
      },
      {} as Record<LeadWorkbenchView, number>,
    );
  }, [
    currentTime,
    profile,
    visibleBaseLeads,
  ]);

  const visibleLeads = useMemo(() => {
    return sortedLeads.filter((lead) =>
      matchesLeadWorkbenchView(lead, activeView, currentTime, profile),
    );
  }, [activeView, currentTime, profile, sortedLeads]);

  const totalPages = Math.max(1, Math.ceil(visibleLeads.length / LEADS_PAGE_SIZE));

  useEffect(() => {
    if (skipNextPageReset.current) {
      skipNextPageReset.current = false;
      return;
    }
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
    const restoredLeadId = pendingRestoreLeadId.current;
    if (restoredLeadId) {
      if (
        paginatedLeads.some((lead) => lead.id === restoredLeadId) &&
        selectedLeadId !== restoredLeadId
      ) {
        setSelectedLeadId(restoredLeadId);
      }
      return;
    }

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

  useEffect(() => {
    const restoredLeadId = pendingRestoreLeadId.current;
    if (!restoredLeadId || hasReconciledRestoreLead.current || isLoading) return;
    if (visibleBaseLeads.length === 0 && leads.length > 0) {
      setRestoreNotice(
        "Lead vừa kiểm tra không còn trong phạm vi hàng chờ tiềm năng hiện tại.",
      );
      clearPendingRestore(true);
      hasReconciledRestoreLead.current = true;
      return;
    }

    const restoredLead = visibleBaseLeads.find((lead) => lead.id === restoredLeadId);
    if (!restoredLead) return;

    if (!visibleLeads.some((lead) => lead.id === restoredLeadId)) {
      const nextView = workbenchViews.find((view) =>
        matchesLeadWorkbenchView(restoredLead, view.id, currentTime, profile),
      );

      if (nextView) {
        skipNextPageReset.current = true;
        setActiveView(nextView.id);
        setRestoreNotice(
          `Lead vừa kiểm tra đã đổi nhóm, hệ thống đã mở lại trong "${nextView.label}".`,
        );
        return;
      }

      setRestoreNotice(
        "Lead vừa kiểm tra không còn nằm trong hàng chờ xử lý tiềm năng.",
      );
      clearPendingRestore(true);
      hasReconciledRestoreLead.current = true;
      return;
    }

    const visibleIndex = visibleLeads.findIndex((lead) => lead.id === restoredLeadId);
    if (visibleIndex >= 0) {
      const pageForLead = Math.floor(visibleIndex / LEADS_PAGE_SIZE) + 1;
      if (pageForLead !== currentPage) {
        setCurrentPage(pageForLead);
        return;
      }
    }

    hasReconciledRestoreLead.current = true;
  }, [
    currentPage,
    currentTime,
    isLoading,
    leads.length,
    profile,
    clearPendingRestore,
    visibleBaseLeads,
    visibleLeads,
    workbenchViews,
  ]);

  useEffect(() => {
    const restoredLeadId = pendingRestoreLeadId.current;
    if (!restoredLeadId) return;
    if (!paginatedLeads.some((lead) => lead.id === restoredLeadId)) return;

    const scrollTimer = window.setTimeout(() => {
      if (pendingRestoreLeadId.current !== restoredLeadId) return;

      const row = document.getElementById(`lead-row-${restoredLeadId}`);
      if (row) {
        row.scrollIntoView({ block: "center", behavior: "smooth" });
      } else if (pendingRestoreScrollTop.current !== null) {
        const scrollTop = Math.max(0, pendingRestoreScrollTop.current);
        const scrollRoot = getAppScrollRoot();
        if (scrollRoot) scrollRoot.scrollTo({ top: scrollTop, behavior: "smooth" });
        else window.scrollTo({ top: scrollTop, behavior: "smooth" });
      }

      if (pendingRestorePanelScrollTop.current !== null) {
        const panel = document.getElementById(LEAD_DETAIL_PANEL_SCROLL_ID);
        if (panel) {
          panel.scrollTo({
            top: Math.max(0, pendingRestorePanelScrollTop.current),
            behavior: "auto",
          });
        }
      }

      clearPendingRestore(false);
    }, 120);

    const highlightTimer = window.setTimeout(() => {
      setHighlightedLeadId((current) =>
        current === restoredLeadId ? null : current,
      );
    }, 4000);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(highlightTimer);
    };
  }, [clearPendingRestore, paginatedLeads]);

  const firstLeadNumber =
    visibleLeads.length === 0 ? 0 : (currentPage - 1) * LEADS_PAGE_SIZE + 1;
  const lastLeadNumber = Math.min(currentPage * LEADS_PAGE_SIZE, visibleLeads.length);

  const brandPlatformFilteredLeads = visibleBaseLeads;
  const isDetailPanelOpen = Boolean(selectedLead && !isPanelCollapsed);

  const pendingResultLead = useMemo(() => {
    return sortedLeads.find((lead) =>
      matchesLeadWorkbenchView(lead, "need_result", currentTime, profile),
    );
  }, [sortedLeads, currentTime, profile]);

  const handleStartedAction = (lead: Lead, preventJump = false) => {
    rememberOptimisticLead(lead);
    if (preventJump) return;
    setSelectedLeadId(lead.id);
    setDetailTab("action");
    setIsPanelCollapsed(false);
    const meta = getLeadWorkbenchMeta(lead, currentTime);
    if (meta.needsResultCapture) {
      skipNextPageReset.current = true;
      window.setTimeout(() => {
        document
          .getElementById(LEAD_DETAIL_PANEL_SCROLL_ID)
          ?.scrollIntoView({ block: "start", behavior: "smooth" });
      }, 80);
    }
    setActiveView(
      meta.needsResultCapture ? "active" : getDefaultLeadWorkbenchView(profile),
    );
  };

  const handleAfterResult = () => {
    if (selectedLeadId) {
      setOptimisticLeadsById((current) => {
        if (!current[selectedLeadId]) return current;
        const next = { ...current };
        delete next[selectedLeadId];
        return next;
      });
    }

    const remainingNeedResult = sortedLeads.filter(
      (lead) =>
        lead.id !== selectedLeadId &&
        matchesLeadWorkbenchView(lead, "need_result", currentTime, profile),
    );

    if (remainingNeedResult.length > 0) {
      setActiveView("active");
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
    <div
      data-tour="leads-page"
      className="min-h-full max-w-full space-y-[clamp(6px,0.55vw,10px)] overflow-x-hidden p-[clamp(6px,0.6vw,12px)]"
    >
      <LeadStats
        leads={brandPlatformFilteredLeads}
        isLoading={isLoading}
        profile={profile}
        onSelectView={(view) => setActiveView(view)}
      />

        {restoreNotice && (
          <section className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <span>{restoreNotice}</span>
            <button
              type="button"
              onClick={() => setRestoreNotice("")}
              className="rounded-lg px-2 py-1 text-[var(--color-brand)] hover:bg-[var(--color-bg-surface)]"
            >
              Đóng
            </button>
          </section>
        )}

        {pendingResultLead && (
          <section className="flex flex-col gap-2 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] p-3 md:flex-row md:items-center md:justify-between">
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
            <div className="flex w-fit flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  skipNextPageReset.current = true;
                  setActiveView("active");
                  setSelectedLeadId(pendingResultLead.id);
                  setDetailTab("action");
                  setIsPanelCollapsed(false);
                }}
                className="rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-bg-surface)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)]"
              >
                Ghi nhận ngay
              </button>
            </div>
          </section>
        )}

        <section className="space-y-[clamp(6px,0.55vw,10px)]">
          <div className="flex flex-col gap-2 min-[1500px]:flex-row min-[1500px]:items-center min-[1500px]:justify-between">
            <div data-tour="lead-view-tabs" className="flex flex-wrap gap-2">
              {workbenchViews.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView(view.id)}
                  className={`inline-flex items-center rounded-xl border px-3.5 py-2 text-sm font-bold tracking-tight transition-all duration-200 ${activeView === view.id
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand)]/10"
                      : "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] dark:bg-slate-900/40"
                    }`}
                >
                  <span>{view.label}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-extrabold transition-all duration-200 ${activeView === view.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                    {viewCounts[view.id]}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex w-fit flex-wrap items-center gap-2">
            <button
              type="button"
              data-tour="lead-refresh-button"
              onClick={() => refetch(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Làm mới
            </button>
            <button
              type="button"
              data-tour="lead-filter-button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              Bộ lọc
            </button>
            {selectedLead && isPanelCollapsed && (
              <button
                type="button"
                onClick={() => setIsPanelCollapsed(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]/80"
              >
                <span className="material-symbols-outlined text-base">dock_to_left</span>
                Xem chi tiết
              </button>
            )}
            </div>
          </div>

          {showFilters && (
            <LeadFilters
              workspaces={workspaces}
              brandLocked={profile?.role !== "admin"}
            />
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-subtle)] p-3 text-sm font-medium text-[var(--color-error)]">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          <div
            className={`grid w-full items-start gap-y-[1vh] ${isDetailPanelOpen
                ? "min-[1100px]:grid-cols-[32%_minmax(0,1fr)] min-[1100px]:gap-x-[0.75%]"
                : "grid-cols-1"
              }`}
          >
            <main className="flex min-w-0 flex-col self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm min-[1100px]:sticky min-[1100px]:top-4 min-[1100px]:max-h-[calc(100vh-100px)]">
              <header className="flex shrink-0 items-center justify-between gap-[4%] border-b border-[var(--color-border)] px-[4%] py-[3%]">
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-[var(--color-text-primary)]">
                    Danh sách khách hàng
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
                    {workbenchViews.find((view) => view.id === activeView)?.label || "Hàng chờ hiện tại"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--color-bg-surface-raised)] px-2.5 py-1 text-xs font-black text-[var(--color-text-primary)]">
                  {visibleLeads.length}
                </span>
              </header>

              <div className="flex-1 space-y-[2.5%] overflow-y-auto p-[3%] min-h-0">
                {isLoading && visibleLeads.length === 0 ? (
                  [0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-[18vh] animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]"
                    />
                  ))
                ) : visibleLeads.length === 0 ? (
                  <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] p-[8%] text-center">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-text-muted)]">
                      inbox
                    </span>
                    <h3 className="mt-3 text-base font-bold text-[var(--color-text-primary)]">
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
                      highlighted={highlightedLeadId === lead.id}
                      staffList={staffList}
                      detailPanelOpen={isDetailPanelOpen}
                      compact={isDetailPanelOpen}
                      onSelect={(nextLead: Lead) => {
                        clearPendingRestore(true);
                        rememberOptimisticLead(nextLead);
                        setSelectedLeadId(nextLead.id);
                        setDetailTab("action");
                        setRestoreNotice("");
                        setIsPanelCollapsed(false);
                      }}
                      onStartedAction={handleStartedAction}
                    />
                  ))
                )}
              </div>

              {visibleLeads.length > 0 && (
                <footer className="flex shrink-0 flex-col gap-2 border-t border-[var(--color-border)] px-[4%] py-[3%] text-xs text-[var(--color-text-secondary)] sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    {firstLeadNumber}-{lastLeadNumber} / {visibleLeads.length} lead
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Trang trước"
                      title="Trang trước"
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>
                    <span className="min-w-10 text-center font-bold text-[var(--color-text-primary)]">
                      {currentPage}/{totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Trang sau"
                      title="Trang sau"
                    >
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>
                </footer>
              )}
            </main>

            {selectedLead && !isPanelCollapsed && (
              <LeadDetailPanel
                lead={selectedLead}
                mentions={mentions}
                nowMs={currentTime}
                workbenchView={activeView}
                onClose={() => setIsPanelCollapsed(true)}
                onAfterResult={handleAfterResult}
                onStartedAction={handleStartedAction}
                returnContext={{
                  view: activeView,
                  page: currentPage,
                  selectedLeadId,
                  filters,
                  listScrollTop: getLeadListScrollTop(),
                }}
                activeTab={detailTab}
                onTabChange={setDetailTab}
                isCollapsed={isPanelCollapsed}
                onCollapseToggle={() => setIsPanelCollapsed(true)}
              />
            )}
          </div>
        </section>
    </div>
  );
}
