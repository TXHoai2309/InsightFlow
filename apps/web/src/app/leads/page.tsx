"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  getLeadOwnershipMeta,
  getLeadWorkbenchMeta,
  getLeadWorkbenchViews,
  matchesLeadWorkbenchView,
  sortFollowUpLeads,
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
import {
  findLeadByNavigationTarget,
  getLeadPrimaryMentionId,
} from "@/lib/mention-navigation";
import {
  DEFAULT_LEAD_WORKBENCH_FILTERS,
  countActiveLeadFilters,
  filterLeadWorkbenchItems,
  getLeadDateFilterBasis,
  readLeadWorkbenchFilters,
  writeLeadWorkbenchFilters,
  type LeadWorkbenchFilters,
} from "@/lib/lead-filters";
import {
  getDefaultLeadDateFilterState,
  getLeadDateFilterState,
  readLeadDateFilterSession,
  writeLeadDateFilterSession,
  type LeadDateFilterState,
  type LeadFilterSessionIdentity,
} from "@/lib/lead-filter-session";
import {
  readDashboardReturnNavigation,
  type DashboardReturnNavigation,
} from "@/lib/dashboard-return-context";
import { usePinnedQueue } from "@/hooks/usePinnedQueue";
import { useLeadViewPresence } from "@/hooks/useAlertViewPresence";
import { isDemoPath, toDemoHref } from "@/lib/demo-navigation";
import { dummyStaff } from "@/lib/demoData";

const LEADS_PAGE_SIZE = 5;
const APP_SCROLL_ROOT_SELECTOR = '[data-app-scroll-root="true"]';
type LeadSortMode = "recommended" | "overdue" | "sla" | "newest";

function isLeadSortMode(value: string | null): value is LeadSortMode {
  return value === "recommended" || value === "overdue" || value === "sla" || value === "newest";
}

function getAppScrollRoot() {
  return document.querySelector<HTMLElement>(APP_SCROLL_ROOT_SELECTOR);
}

function getLeadListScrollTop() {
  if (typeof window === "undefined") return 0;
  return getAppScrollRoot()?.scrollTop || window.scrollY || 0;
}

export default function LeadsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading: authLoading } = useAuth();
  const leadFilterSessionIdentity = useMemo<LeadFilterSessionIdentity | null>(() => {
    if (!profile?.uid) return null;
    if (isDemoPath(pathname)) {
      return { userId: profile.uid, loginSessionId: "demo-session" };
    }

    return {
      userId: profile.uid,
      loginSessionId:
        user?.metadata?.lastSignInTime ||
        user?.metadata?.creationTime ||
        "current-login-session",
    };
  }, [pathname, profile?.uid, user?.metadata?.creationTime, user?.metadata?.lastSignInTime]);
  const leadPinStorageKey = `insightflow:pinned-leads:${profile?.uid || "anonymous"}:${normalizeBrandName(profile?.brandName || profile?.brandId || "global")}`;
  const {
    pinnedIds: pinnedLeadIds,
    maxItems: maxPinnedLeads,
    togglePinned: togglePinnedLead,
    prunePinned: prunePinnedLeads,
  } = usePinnedQueue(leadPinStorageKey);
  const [staffList, setStaffList] = useState<any[]>([]);
  const canLoadStaffList = canPerformAction(profile, "manage_staff");

  useEffect(() => {
    const fetchStaff = async () => {
      if (isDemoPath(pathname)) {
        setStaffList(dummyStaff.map((staff) => ({ ...staff })));
        return;
      }
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
  }, [profile, authLoading, canLoadStaffList, pathname]);

  const [activeView, setActiveView] = useState<LeadWorkbenchView>("priority");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [leadFilters, setLeadFilters] = useState<LeadWorkbenchFilters>(
    DEFAULT_LEAD_WORKBENCH_FILTERS,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [sortMode, setSortMode] = useState<LeadSortMode>("recommended");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [detailTab, setDetailTab] = useState<LeadDetailPanelTab>("action");
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState("");
  const [optimisticLeadsById, setOptimisticLeadsById] = useState<Record<string, Lead>>({});
  const [dashboardReturnNavigation, setDashboardReturnNavigation] = useState<DashboardReturnNavigation | null>(null);
  const initializedLeadFilterSessionKey = useRef<string | null>(null);
  const skipDateFilterPersistenceForSession = useRef<string | null>(null);
  const skipNextPageReset = useRef(false);
  const pendingRestoreLeadId = useRef<string | null>(null);
  const pendingRestoreMentionId = useRef<string | null>(null);
  const pendingRestoreScrollTop = useRef<number | null>(null);
  const pendingRestorePanelScrollTop = useRef<number | null>(null);
  const hasReconciledRestoreLead = useRef(false);
  const [hasInitializedLeadFilters, setHasInitializedLeadFilters] = useState(false);
  const temporaryDateFilterSnapshot = useRef<LeadDateFilterState | null>(null);
  const suspendDateFilterPersistence = useRef(false);
  const canViewLeads = canPerformAction(profile, "view_leads");
  const hasBrandScope = hasBusinessBrandScope(profile);

  useEffect(() => {
    setDashboardReturnNavigation(
      readDashboardReturnNavigation(new URLSearchParams(window.location.search)),
    );
  }, []);

  const clearPendingRestore = useCallback((clearHighlight = false) => {
    pendingRestoreLeadId.current = null;
    pendingRestoreMentionId.current = null;
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
    leads,
    mentions,
    isLoading,
    error,
  } = useDashboardStore();

  useEffect(() => {
    if (!profile || profile.role === "admin" || workspaces.length === 0) return;
    const profileBrandKey = normalizeBrandName(profile.brandName || profile.brandId || "");
    const scopedWorkspace = workspaces.find(
      (workspace) =>
        normalizeBrandName(workspace.id) === profileBrandKey ||
        normalizeBrandName(workspace.brand_name) === profileBrandKey,
    );
    const workspaceId =
      scopedWorkspace?.id || profile.brandId || profile.brandName || "all";
    setLeadFilters((current) =>
      current.workspaceId === workspaceId
        ? current
        : { ...current, workspaceId },
    );
  }, [
    leadFilters.workspaceId,
    profile,
    profile?.brandId,
    profile?.brandName,
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
      leadFilters.workspaceId !== "all"
        ? normalizeBrandName(leadFilters.workspaceId)
        : null;
    const filteredLeads = leads.filter((lead) => {
      if (!isIntentLead(lead)) return false;
      if (normFilter && normalizeBrandName(lead.workspace_id) !== normFilter) return false;
      return true;
    });
    if (Object.keys(optimisticLeadsById).length === 0) return filteredLeads;

    return filteredLeads.map((lead) => {
      const optimisticLead = optimisticLeadsById[lead.id];
      return optimisticLead ? { ...lead, ...optimisticLead } : lead;
    });
  }, [
    leadFilters.workspaceId,
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
    const sessionKey = leadFilterSessionIdentity
      ? `${leadFilterSessionIdentity.userId}:${leadFilterSessionIdentity.loginSessionId}`
      : null;
    if (
      !sessionKey ||
      initializedLeadFilterSessionKey.current === sessionKey ||
      workbenchViews.length === 0 ||
      !leadFilterSessionIdentity
    ) return;

    initializedLeadFilterSessionKey.current = sessionKey;
    skipDateFilterPersistenceForSession.current = sessionKey;
    hasReconciledRestoreLead.current = false;
    temporaryDateFilterSnapshot.current = null;
    suspendDateFilterPersistence.current = false;

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
    const requestedMentionId = params.get("mentionId");
    const requestedSort = params.get("sort");
    const nextView = returnContext?.view || requestedView;
    const nextPage = returnContext?.page || requestedPage;
    const nextLeadId =
      returnContext?.selectedLeadId ||
      returnContext?.leadId ||
      requestedLeadId;

    const sessionDateFilter =
      readLeadDateFilterSession(window.localStorage, leadFilterSessionIdentity) ||
      getDefaultLeadDateFilterState();
    const urlFilters = readLeadWorkbenchFilters(params, {
      ...DEFAULT_LEAD_WORKBENCH_FILTERS,
      ...sessionDateFilter,
    });
    const restoredFiltersFromNavigation: LeadWorkbenchFilters = requestedFilters
      ? {
        ...urlFilters,
        workspaceId:
          requestedFilters.workspace_id || urlFilters.workspaceId,
        platform: requestedFilters.platform || urlFilters.platform,
      }
      : urlFilters;
    const restoredFilters: LeadWorkbenchFilters = {
      ...restoredFiltersFromNavigation,
      ...sessionDateFilter,
    };
    writeLeadDateFilterSession(
      window.localStorage,
      leadFilterSessionIdentity,
      sessionDateFilter,
    );
    skipNextPageReset.current = true;
    setLeadFilters(restoredFilters);
    if (isLeadSortMode(requestedSort)) setSortMode(requestedSort);

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

    if (nextLeadId || requestedMentionId) {
      suspendDateFilterPersistence.current = true;
      const pendingLeadId = nextLeadId || requestedMentionId;
      pendingRestoreLeadId.current = pendingLeadId;
      pendingRestoreMentionId.current = requestedMentionId;
      pendingRestoreScrollTop.current = returnContext?.listScrollTop ?? null;
      pendingRestorePanelScrollTop.current = returnContext?.panelScrollTop ?? null;
      setSelectedLeadId(pendingLeadId);
      setHighlightedLeadId(pendingLeadId);
      setRestoreNotice(
        requestedMentionId
          ? "Đang mở đúng mention từ Lead Monitoring."
          : "Đã quay lại đúng lead bạn vừa kiểm tra.",
      );
    }

    setHasInitializedLeadFilters(true);
    clearLeadReturnContext(returnToken);
  }, [leadFilterSessionIdentity, workbenchViews]);

  useEffect(() => {
    const sessionKey = leadFilterSessionIdentity
      ? `${leadFilterSessionIdentity.userId}:${leadFilterSessionIdentity.loginSessionId}`
      : null;
    if (
      !hasInitializedLeadFilters ||
      !leadFilterSessionIdentity ||
      suspendDateFilterPersistence.current
    ) return;
    if (skipDateFilterPersistenceForSession.current === sessionKey) {
      skipDateFilterPersistenceForSession.current = null;
      return;
    }

    writeLeadDateFilterSession(
      window.localStorage,
      leadFilterSessionIdentity,
      leadFilters,
    );
  }, [
    hasInitializedLeadFilters,
    leadFilterSessionIdentity,
    leadFilters,
  ]);

  useEffect(() => {
    if (!hasInitializedLeadFilters) return;

    const params = new URLSearchParams(window.location.search);
    writeLeadWorkbenchFilters(params, leadFilters);
    params.set("view", activeView);
    if (currentPage > 1) params.set("page", String(currentPage));
    else params.delete("page");
    if (selectedLeadId) {
      params.set("leadId", selectedLeadId);
      const selectedLead = findLeadByNavigationTarget(
        leads,
        selectedLeadId,
        pendingRestoreMentionId.current,
      );
      const mentionId = selectedLead
        ? getLeadPrimaryMentionId(selectedLead)
        : pendingRestoreMentionId.current;
      if (mentionId) params.set("mentionId", mentionId);
      else params.delete("mentionId");
    } else {
      params.delete("leadId");
      params.delete("mentionId");
    }
    if (sortMode !== "recommended") params.set("sort", sortMode);
    else params.delete("sort");
    params.delete("returnToken");

    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }, [activeView, currentPage, hasInitializedLeadFilters, leadFilters, leads, selectedLeadId, sortMode]);

  const visibleBaseLeads = useMemo(
    () => baseLeads.filter((lead) => canLeadBeVisibleToUser(lead, profile)),
    [baseLeads, profile],
  );

  useEffect(() => {
    if (isLoading || leads.length === 0) return;
    prunePinnedLeads(
      visibleBaseLeads
        .filter((lead) => matchesLeadWorkbenchView(lead, "active", currentTime, profile))
        .map((lead) => lead.id),
    );
  }, [currentTime, isLoading, leads.length, profile, prunePinnedLeads, visibleBaseLeads]);

  const sortedLeads = useMemo(
    () => sortLeadsForWorkbench(visibleBaseLeads, currentTime, profile),
    [visibleBaseLeads, currentTime, profile],
  );

  const nonDateFilteredLeads = useMemo(
    () => filterLeadWorkbenchItems(
      visibleBaseLeads,
      { ...leadFilters, workspaceId: "all", updatedRange: "all" },
      currentTime,
      profile?.uid,
      "none",
    ),
    [currentTime, leadFilters, profile?.uid, visibleBaseLeads],
  );

  const activeDateBasis = getLeadDateFilterBasis(activeView);
  const activeDefaultDateRange = DEFAULT_LEAD_WORKBENCH_FILTERS.updatedRange;

  const postedFilteredLeads = useMemo(
    () => filterLeadWorkbenchItems(
      nonDateFilteredLeads,
      { ...leadFilters, workspaceId: "all" },
      currentTime,
      profile?.uid,
      "posted",
    ),
    [currentTime, leadFilters, nonDateFilteredLeads, profile?.uid],
  );

  const followUpFilteredLeads = useMemo(
    () => filterLeadWorkbenchItems(
      nonDateFilteredLeads,
      { ...leadFilters, workspaceId: "all" },
      currentTime,
      profile?.uid,
      "follow_up",
    ),
    [currentTime, leadFilters, nonDateFilteredLeads, profile?.uid],
  );

  const viewCounts = useMemo(() => {
    const allViews: LeadWorkbenchView[] = ["unassigned", "priority", "active", "follow_up", "closed", "skipped", "need_result"];
    return allViews.reduce(
      (acc, viewId) => {
        const dateBasis = getLeadDateFilterBasis(viewId);
        const scopedLeads = filterLeadWorkbenchItems(
          nonDateFilteredLeads,
          { ...leadFilters, workspaceId: "all" },
          currentTime,
          profile?.uid,
          dateBasis,
        );
        acc[viewId] = scopedLeads.filter((lead) =>
          matchesLeadWorkbenchView(lead, viewId, currentTime, profile),
        ).length;
        return acc;
      },
      {} as Record<LeadWorkbenchView, number>,
    );
  }, [
    currentTime,
    leadFilters,
    nonDateFilteredLeads,
    profile,
  ]);

  const leadsInActiveView = useMemo(() => {
    return sortedLeads.filter((lead) =>
      matchesLeadWorkbenchView(lead, activeView, currentTime, profile),
    );
  }, [activeView, currentTime, profile, sortedLeads]);

  const visibleLeads = useMemo(() => {
    const filtered = filterLeadWorkbenchItems(
      leadsInActiveView,
      { ...leadFilters, workspaceId: "all" },
      currentTime,
      profile?.uid,
      activeDateBasis,
    );
    let result = activeView === "follow_up"
      ? sortFollowUpLeads(filtered, currentTime, profile)
      : sortMode === "recommended"
        ? filtered
        : [...filtered].sort((left, right) => {
          if (sortMode === "newest") {
            const leftTime = new Date(left.posted_at || left.created_at || 0).getTime();
            const rightTime = new Date(right.posted_at || right.created_at || 0).getTime();
            return rightTime - leftTime;
          }

          const leftMeta = getLeadWorkbenchMeta(left, currentTime);
          const rightMeta = getLeadWorkbenchMeta(right, currentTime);
          if (sortMode === "overdue" && leftMeta.isOverdue !== rightMeta.isOverdue) {
            return leftMeta.isOverdue ? -1 : 1;
          }
          return leftMeta.remainingMs - rightMeta.remainingMs;
        });

    if (activeView === "active") {
      result = [...result].sort(
        (left, right) =>
          Number(pinnedLeadIds.includes(right.id)) - Number(pinnedLeadIds.includes(left.id)),
      );
    }
    return result;
  }, [activeDateBasis, activeView, currentTime, leadFilters, leadsInActiveView, pinnedLeadIds, profile, sortMode]);

  const followUpQueue = useMemo(
    () => sortFollowUpLeads(
      followUpFilteredLeads.filter((lead) =>
        matchesLeadWorkbenchView(lead, "follow_up", currentTime, profile),
      ),
      currentTime,
      profile,
    ),
    [currentTime, followUpFilteredLeads, profile],
  );

  const activeFilterCount = countActiveLeadFilters(
    leadFilters,
    profile?.role === "admin",
    activeDefaultDateRange,
  );

  const totalPages = Math.max(1, Math.ceil(visibleLeads.length / LEADS_PAGE_SIZE));

  useEffect(() => {
    if (skipNextPageReset.current) {
      skipNextPageReset.current = false;
      return;
    }
    setCurrentPage(1);
  }, [activeView, leadFilters, sortMode]);

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
  const leadViewers = useLeadViewPresence({
    leadId: selectedLead?.id || null,
    enabled: Boolean(
      selectedLead &&
      !isPanelCollapsed &&
      getLeadOwnershipMeta(selectedLead, profile).status === "unassigned",
    ),
  });

  useEffect(() => {
    const restoredLeadId = pendingRestoreLeadId.current;
    const restoredMentionId = pendingRestoreMentionId.current;
    if (!restoredLeadId || hasReconciledRestoreLead.current || isLoading) return;
    if (visibleBaseLeads.length === 0 && leads.length > 0) {
      suspendDateFilterPersistence.current = false;
      setRestoreNotice(
        "Lead vừa kiểm tra không còn trong phạm vi hàng chờ tiềm năng hiện tại.",
      );
      clearPendingRestore(true);
      hasReconciledRestoreLead.current = true;
      return;
    }

    const restoredLead = findLeadByNavigationTarget(
      visibleBaseLeads,
      restoredLeadId,
      restoredMentionId,
    );
    if (!restoredLead) return;
    const resolvedLeadId = restoredLead.id;

    if (resolvedLeadId !== restoredLeadId) {
      pendingRestoreLeadId.current = resolvedLeadId;
      setSelectedLeadId(resolvedLeadId);
      setHighlightedLeadId(resolvedLeadId);
    }

    if (!visibleLeads.some((lead) => lead.id === resolvedLeadId)) {
      const nextView = workbenchViews.find((view) =>
        matchesLeadWorkbenchView(restoredLead, view.id, currentTime, profile),
      );

      if (nextView) {
        skipNextPageReset.current = true;
        setActiveView(nextView.id);
        suspendDateFilterPersistence.current = true;
        setLeadFilters((current) => {
          temporaryDateFilterSnapshot.current ||= getLeadDateFilterState(current);
          return {
            ...current,
            updatedRange: "all",
            customStartDate: undefined,
            customEndDate: undefined,
          };
        });
        setRestoreNotice(
          `Lead nằm ngoài phạm vi thời gian đang chọn. Hệ thống tạm mở "${nextView.label}" trong Tất cả thời gian để hiển thị đúng mục.`,
        );
        return;
      }

      suspendDateFilterPersistence.current = false;
      setRestoreNotice(
        "Lead vừa kiểm tra không còn nằm trong hàng chờ xử lý tiềm năng.",
      );
      clearPendingRestore(true);
      hasReconciledRestoreLead.current = true;
      return;
    }

    const visibleIndex = visibleLeads.findIndex((lead) => lead.id === resolvedLeadId);
    if (visibleIndex >= 0) {
      const pageForLead = Math.floor(visibleIndex / LEADS_PAGE_SIZE) + 1;
      if (pageForLead !== currentPage) {
        setCurrentPage(pageForLead);
        return;
      }
    }

    if (!temporaryDateFilterSnapshot.current) {
      suspendDateFilterPersistence.current = false;
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

  const isDetailPanelOpen = Boolean(selectedLead && !isPanelCollapsed);
  const brandLocked = profile?.role !== "admin";
  const selectedWorkspace = workspaces.find(
    (workspace) =>
      normalizeBrandName(workspace.id) ===
      normalizeBrandName(leadFilters.workspaceId) ||
      normalizeBrandName(workspace.brand_name) ===
      normalizeBrandName(leadFilters.workspaceId),
  );
  const activeViewLabel =
    workbenchViews.find((view) => view.id === activeView)?.label ||
    "Hàng chờ hiện tại";
  const activeDatePrefix = activeDateBasis === "terminal"
    ? "Hoàn tất"
    : activeDateBasis === "follow_up"
      ? "Hẹn"
      : "Đăng";
  const activeDateScopeLabel = activeDateBasis === "none"
    ? "Tất cả công việc đang mở"
    : leadFilters.updatedRange === "today"
      ? `${activeDatePrefix} hôm nay`
      : leadFilters.updatedRange === "7d"
        ? `${activeDatePrefix} trong 7 ngày`
        : leadFilters.updatedRange === "30d"
          ? `${activeDatePrefix} trong 30 ngày`
          : leadFilters.updatedRange === "custom"
            ? "Khoảng ngày đã chọn"
            : "Tất cả thời gian";

  const finishTemporaryDateScope = useCallback(() => {
    const snapshot = temporaryDateFilterSnapshot.current;
    temporaryDateFilterSnapshot.current = null;
    suspendDateFilterPersistence.current = false;
    setRestoreNotice("");
    if (snapshot) {
      setLeadFilters((current) => ({ ...current, ...snapshot }));
    }
  }, []);

  const handleLeadFiltersChange = (next: LeadWorkbenchFilters) => {
    temporaryDateFilterSnapshot.current = null;
    suspendDateFilterPersistence.current = false;
    setRestoreNotice("");
    setLeadFilters(next);
  };

  const resetLeadFilters = () => {
    temporaryDateFilterSnapshot.current = null;
    suspendDateFilterPersistence.current = false;
    setRestoreNotice("");
    setLeadFilters({
      ...DEFAULT_LEAD_WORKBENCH_FILTERS,
      workspaceId: brandLocked ? leadFilters.workspaceId : "all",
    });
  };

  const pendingResultLead = useMemo(() => {
    return postedFilteredLeads.find((lead) =>
      matchesLeadWorkbenchView(lead, "need_result", currentTime, profile),
    );
  }, [postedFilteredLeads, currentTime, profile]);

  const handleSelectSummaryView = (view: LeadWorkbenchView) => {
    finishTemporaryDateScope();
    setActiveView(view);
    setCurrentPage(1);

    if (view !== "follow_up") return;

    setLeadFilters((current) => ({
      ...DEFAULT_LEAD_WORKBENCH_FILTERS,
      workspaceId: current.workspaceId,
      ...getLeadDateFilterState(current),
    }));
    setSortMode("recommended");
    const firstFollowUp = followUpQueue[0] || null;
    setSelectedLeadId(firstFollowUp?.id || null);
    setHighlightedLeadId(firstFollowUp?.id || null);
    setDetailTab("action");
    setIsPanelCollapsed(!firstFollowUp);
    setRestoreNotice("");

    window.setTimeout(() => {
      document.getElementById("lead-follow-up-queue")?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    }, 80);
    if (firstFollowUp) {
      window.setTimeout(() => {
        setHighlightedLeadId((current) => current === firstFollowUp.id ? null : current);
      }, 4000);
    }
  };

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
    const nextView = meta.needsResultCapture ? "active" : getDefaultLeadWorkbenchView(profile);
    setActiveView(nextView);
  };

  const handleAfterResult = (updatedLead: Lead, resultType?: Lead["result_type"]) => {
    if (updatedLead.id) {
      setOptimisticLeadsById((current) => {
        if (!current[updatedLead.id]) return current;
        const next = { ...current };
        delete next[updatedLead.id];
        return next;
      });
    }

    if (resultType === "follow_up") {
      skipNextPageReset.current = true;
      rememberOptimisticLead(updatedLead);
      setActiveView("follow_up");
      setCurrentPage(1);
      setSelectedLeadId(updatedLead.id);
      setHighlightedLeadId(updatedLead.id);
      setDetailTab("action");
      setIsPanelCollapsed(false);
      window.setTimeout(() => {
        setHighlightedLeadId((current) => current === updatedLead.id ? null : current);
      }, 4000);
      return;
    }

    if (activeView === "follow_up") {
      const nextFollowUp = visibleLeads.find((lead) => lead.id !== updatedLead.id) || null;
      setCurrentPage(1);
      setSelectedLeadId(nextFollowUp?.id || null);
      setHighlightedLeadId(nextFollowUp?.id || null);
      if (!nextFollowUp) setIsPanelCollapsed(true);
      return;
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

    const currentIndex = visibleLeads.findIndex((lead) => lead.id === updatedLead.id);
    const nextLead = visibleLeads[currentIndex + 1] || visibleLeads[0] || null;
    const nextView = getDefaultLeadWorkbenchView(profile);
    setActiveView(nextView);
    setSelectedLeadId(nextLead?.id || null);
  };

  const handleAfterSkip = (skippedLead: Lead) => {
    rememberOptimisticLead(skippedLead);
    const currentIndex = paginatedLeads.findIndex((lead) => lead.id === skippedLead.id);
    const nextLead = currentIndex >= 0
      ? paginatedLeads[currentIndex + 1] || paginatedLeads[currentIndex - 1] || null
      : paginatedLeads[0] || null;
    setSelectedLeadId(nextLead?.id || null);
    setHighlightedLeadId(nextLead?.id || null);
    setIsPanelCollapsed(!nextLead);
  };

  const handleAfterRestore = (restoredLead: Lead) => {
    rememberOptimisticLead(restoredLead);
    skipNextPageReset.current = true;
    setLeadFilters((current) => ({
      ...DEFAULT_LEAD_WORKBENCH_FILTERS,
      workspaceId: current.workspaceId,
      ...getLeadDateFilterState(current),
    }));
    setSortMode("recommended");
    setActiveView("active");
    setCurrentPage(1);
    setSelectedLeadId(restoredLead.id);
    setHighlightedLeadId(restoredLead.id);
    setDetailTab("action");
    setIsPanelCollapsed(false);
    setRestoreNotice("Item đã được khôi phục và chuyển về Đang xử lý.");

    window.setTimeout(() => {
      document.getElementById(`lead-row-${restoredLead.id}`)?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }, 120);
    window.setTimeout(() => {
      setHighlightedLeadId((current) => current === restoredLead.id ? null : current);
    }, 4000);
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
      className="lead-workbench-theme mx-auto min-h-full w-full max-w-[1920px] space-y-[clamp(8px,0.8vw,14px)] overflow-x-hidden bg-[var(--color-bg-base)] p-[clamp(12px,2vw,32px)] text-[var(--color-text-primary)]"
    >
      {dashboardReturnNavigation && (
        <button
          type="button"
          onClick={() => router.push(
            isDemoPath(pathname)
              ? toDemoHref(dashboardReturnNavigation.href) || "/demo"
              : dashboardReturnNavigation.href,
          )}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3.5 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-bg-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {dashboardReturnNavigation.label}
        </button>
      )}
      <header className="flex flex-col gap-3 min-[1320px]:flex-row min-[1320px]:items-center min-[1320px]:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black text-[var(--color-text-primary)] md:text-2xl">
            Khách hàng tiềm năng
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Chọn khách hàng bên trái và xử lý nghiệp vụ trực tiếp trong panel.
          </p>
        </div>
        <label
          className="relative w-full min-[1320px]:w-[clamp(18rem,24%,22rem)]"
          htmlFor="lead-header-search"
        >
          <span className="sr-only">Tìm kiếm khách hàng hoặc nội dung</span>
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-[var(--color-text-muted)]">
            search
          </span>
          <input
            id="lead-header-search"
            type="search"
            value={leadFilters.query}
            onChange={(event) =>
              setLeadFilters((current) => ({ ...current, query: event.target.value }))
            }
            placeholder="Tìm tên hoặc nội dung..."
            className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
          />
        </label>
      </header>

      <LeadStats
        leads={postedFilteredLeads}
        followUpLeads={followUpFilteredLeads}
        isLoading={isLoading}
        profile={profile}
        onSelectView={handleSelectSummaryView}
      />

      {restoreNotice && (
        <section className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)]">
          <span>{restoreNotice}</span>
          <button
            type="button"
            onClick={finishTemporaryDateScope}
            className="rounded-lg px-2 py-1 text-[var(--color-brand)] hover:bg-[var(--color-bg-surface)]"
          >
            Đóng
          </button>
        </section>
      )}

      {pendingResultLead && (
        <section className="flex flex-col gap-2 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] px-3 py-2.5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="material-symbols-outlined text-[var(--color-warning)]">
              pending_actions
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Có {viewCounts.need_result || 0} lead đang chờ ghi nhận kết quả
              </p>
              <p className="truncate text-xs text-[var(--color-text-secondary)]">
                Gần nhất: {pendingResultLead.author || "khách hàng"} · sau khi mở liên hệ, hãy ghi nhận kết quả để không mất dấu.
              </p>
            </div>
          </div>
          <div className="flex w-fit flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                finishTemporaryDateScope();
                skipNextPageReset.current = true;
                setActiveView("active");
                setSelectedLeadId(pendingResultLead.id);
                setDetailTab("action");
                setIsPanelCollapsed(false);
              }}
              className="rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-bg-surface)] px-3 py-1.5 text-sm font-bold text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warning)]"
            >
              Ghi nhận ngay
            </button>
          </div>
        </section>
      )}

      <section id="lead-follow-up-queue" className="scroll-mt-20 space-y-[clamp(6px,0.55vw,10px)]">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div data-tour="lead-view-tabs" className="flex min-w-max shrink-0 items-center gap-2">
            {workbenchViews.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => {
                  finishTemporaryDateScope();
                  setActiveView(view.id);
                }}
                className={`inline-flex min-h-10 shrink-0 items-center rounded-xl border px-3.5 py-2 text-sm font-bold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-1 ${activeView === view.id
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand)]/10"
                  : "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-surface-raised)] hover:text-[var(--color-text-primary)]"
                  }`}
              >
                <span>{view.label}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-extrabold transition-all duration-200 ${activeView === view.id
                  ? "bg-white/20 text-white"
                  : "bg-[var(--color-bg-surface-high)] text-[var(--color-text-secondary)]"
                  }`}>
                  {viewCounts[view.id]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label className="relative" htmlFor="lead-sort-mode">
              <span className="sr-only">Sắp xếp danh sách</span>
              <select
                id="lead-sort-mode"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as LeadSortMode)}
                className="h-10 appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] py-0 pl-3 pr-8 text-sm font-bold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
              >
                <option value="recommended">Ưu tiên hệ thống</option>
                <option value="overdue">Quá hạn lâu nhất</option>
                <option value="sla">SLA gần nhất</option>
                <option value="newest">Mới nhất</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-base text-[var(--color-text-muted)]">expand_more</span>
            </label>
            <button
              type="button"
              data-tour="lead-refresh-button"
              onClick={() => refetch(true)}
              disabled={isLoading}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Làm mới danh sách"
              title="Làm mới"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              data-tour="lead-filter-button"
              onClick={() => setShowFilters((value) => !value)}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${showFilters || activeFilterCount > 0 ? "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]" : "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"}`}
            >
              <span className="material-symbols-outlined text-base">tune</span>
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[var(--color-brand)] px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
                  {activeFilterCount}
                </span>
              )}
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
            value={leadFilters}
            activeViewLabel={activeViewLabel}
            resultCount={visibleLeads.length}
            brandLocked={brandLocked}
            brandLabel={
              selectedWorkspace?.brand_name ||
              profile?.brandName ||
              profile?.brandId
            }
            staffList={staffList}
            canSelectStaff={canLoadStaffList}
            dateBasis={activeDateBasis}
            defaultDateRange={activeDefaultDateRange}
            onChange={handleLeadFiltersChange}
            onReset={resetLeadFilters}
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
            ? "min-[1100px]:grid-cols-[clamp(340px,24vw,390px)_minmax(0,1fr)] min-[1100px]:gap-x-2.5 min-[1500px]:grid-cols-[clamp(360px,24vw,410px)_minmax(0,1fr)]"
            : "grid-cols-1"
            }`}
        >
          <main className="flex min-w-0 flex-col self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm min-[1100px]:sticky min-[1100px]:top-3 min-[1100px]:max-h-[calc(100vh-88px)]">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">
                  Danh sách khách hàng
                </h2>
                <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
                  {activeViewLabel} · {activeDateScopeLabel}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {activeView === "active" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300">
                    <span className="material-symbols-outlined text-xs">push_pin</span>
                    {pinnedLeadIds.length}/{maxPinnedLeads}
                  </span>
                )}
                <span className="rounded-full bg-[var(--color-bg-surface-raised)] px-2.5 py-1 text-xs font-black text-[var(--color-text-primary)]">
                  {visibleLeads.length}
                </span>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 [scrollbar-gutter:stable]">
              {isLoading && visibleLeads.length === 0 ? (
                [0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-32 animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]"
                  />
                ))
              ) : visibleLeads.length === 0 ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] p-[8%] text-center">
                  <span className="material-symbols-outlined text-4xl text-[var(--color-text-muted)]">
                    inbox
                  </span>
                  <h3 className="mt-3 text-base font-bold text-[var(--color-text-primary)]">
                    {activeView === "follow_up"
                      ? "Chưa có lịch follow-up đang mở"
                      : activeFilterCount > 0
                        ? "Không có khách hàng phù hợp"
                        : "Không có lead trong nhóm này"}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {activeView === "follow_up"
                      ? "Hãy chọn phạm vi khác hoặc đặt lịch hẹn mới; lịch đã hoàn tất được tự động loại khỏi hàng đợi."
                      : activeFilterCount > 0
                        ? "Hãy điều chỉnh hoặc xóa các điều kiện lọc đang áp dụng."
                        : "Chuyển hàng chờ để xem nhóm lead khác."}
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetLeadFilters}
                      className="mt-4 inline-flex items-center gap-1 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-2 text-sm font-bold text-[var(--color-brand)]"
                    >
                      <span className="material-symbols-outlined text-base">filter_alt_off</span>
                      Xóa bộ lọc
                    </button>
                  )}
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
                    pinned={pinnedLeadIds.includes(lead.id)}
                    canPin={activeView === "active"}
                    pinDisabled={pinnedLeadIds.length >= maxPinnedLeads}
                    viewers={selectedLeadId === lead.id ? leadViewers : []}
                    currentViewerId={profile?.uid}
                    onTogglePin={(nextLead) => {
                      togglePinnedLead(nextLead.id);
                    }}
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
              <footer className="flex shrink-0 flex-col gap-2 border-t border-[var(--color-border)] px-4 py-2.5 text-xs text-[var(--color-text-secondary)] sm:flex-row sm:items-center sm:justify-between">
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
              onAfterSkip={handleAfterSkip}
              onAfterRestore={handleAfterRestore}
              onStartedAction={handleStartedAction}
              returnContext={{
                view: activeView,
                page: currentPage,
                selectedLeadId,
                filters: {
                  workspace_id: leadFilters.workspaceId,
                  platform: leadFilters.platform,
                },
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
