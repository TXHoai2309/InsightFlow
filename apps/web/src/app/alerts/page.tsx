"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import {
  useAlertStore,
  type AlertData,
  type CustomerContactAttempt,
} from "@/stores/alert.store";
import { AlertWorkbench, type AlertStatusFilter } from "@/components/alerts/AlertWorkbench";
import type { AlertDetailPanelTab } from "@/components/alerts/AlertDetailPanel";
import type { AlertContactResultDraft } from "@/components/alerts/AlertContactWorkflow";
import { useDashboard } from "@/hooks/useDashboardData";
import { dbSecond } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { supabaseRequest } from "@/lib/supabase";
import {
  getScopedBrandKey,
  hasBusinessBrandScope,
  isRecordInBrandScope,
} from "@/lib/brandScope";
import { canPerformAction } from "@/lib/rbac";
import {
  getAlertWorkflowStatus,
  isResolvedAlert,
  isSkippedAlert,
  isTerminalAlert,
} from "@/lib/alertWorkflow";
import {
  canAccessAlertQueue,
  canAlertBeVisibleToUser,
  isAlertOwnedByUser,
} from "@/lib/alert-visibility";
import { findAlertByNavigationTarget } from "@/lib/alert-navigation";
import { readDashboardReturnNavigation } from "@/lib/dashboard-return-context";
import { usePinnedQueue } from "@/hooks/usePinnedQueue";
import { useAlertViewPresence } from "@/hooks/useAlertViewPresence";
import { getAlertSourceUrl } from "@/lib/alert-source-url";
import {
  getAlertCompletenessScore,
  getAlertDeduplicationKey,
} from "@/lib/operational-metrics";
import { isCrisisClassificationLabel } from "@/lib/label-change";
import { isDemoPath, toDemoHref } from "@/lib/demo-navigation";
import { copyTextToClipboard } from "@/lib/clipboard";

const ALERTS_PER_PAGE = 5;
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler as ChartFiller,
} from "chart.js";

// Helper function to calculate relative time
function getRelativeTime(isoString: string, t: any): string {
  try {
    if (!isoString) return t("mentions.table.unknownTimeDesc") || "Không rõ";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return t("mentions.table.unknownTimeDesc") || "Không rõ";

    // Format: dd/mm/yyyy for fallback display
    const formatted = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return formatted; // future date → show actual date

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t("mentions.table.justNow");
    if (diffMins < 60) return t("mentions.table.minutesAgo", { count: diffMins });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t("mentions.table.hoursAgo", { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return t("mentions.table.daysAgo", { count: diffDays });
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return t("mentions.table.monthsAgo", { count: diffMonths });

    // Older than 1 year → show actual date instead of "X năm trước"
    return formatted;
  } catch (e) {
    return t("mentions.table.unknownTimeDesc") || "Không rõ";
  }
}


function normalizeBrandId(brand: string): string {
  if (!brand) return "other";
  let b = brand.toLowerCase().trim();
  if (b.includes("mixue")) return "mixue";
  if (b.includes("starbuck")) return "starbucks";
  if (b.includes("highland")) return "highland-coffee";

  return b.replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// Helper function to format brand display names
function formatBrandName(brand: string): string {
  if (!brand) return "";
  const lower = brand.toLowerCase();
  if (lower === "mixue") return "Mixue";
  if (lower.includes("starbuck")) return "Starbucks";
  if (lower.includes("highland")) return "Highlands Coffee";

  // Otherwise, clean up and capitalize each word
  return brand
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

interface MonitoringCountdownProps {
  alert: any;
}
function MonitoringCountdown({ alert }: MonitoringCountdownProps) {
  const [text, setText] = useState("");
  const [hasActivity, setHasActivity] = useState(false);

  useEffect(() => {
    const update = () => {
      const startedAt = alert.monitoring_started_at ? new Date(alert.monitoring_started_at).getTime() : new Date(alert.created_at).getTime();
      const durationMs = (alert.monitoring_duration_hours ?? 72) * 60 * 60 * 1000;
      const now = Date.now();
      const diff = startedAt + durationMs - now;

      const initialComments = alert.monitoring_initial_comments ?? 0;
      const initialLikes = alert.monitoring_initial_likes ?? 0;
      const currentComments = alert.comments ?? 0;
      const currentLikes = alert.likes ?? 0;

      const act = currentComments > initialComments || currentLikes > (initialLikes + 5);
      setHasActivity(act);

      if (act) {
        setText("⚠️ Có tương tác mới");
      } else if (diff <= 0) {
        setText("Hết giờ theo dõi");
      } else {
        const hours = Math.floor(diff / (3600 * 1000));
        const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
        setText(`Theo dõi: ${hours}h ${mins}m còn lại`);
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [alert]);

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${hasActivity
      ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 animate-pulse font-black"
      : "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/30"
      }`}>
      <span className="material-symbols-outlined text-[12px]">{hasActivity ? "warning" : "visibility"}</span>
      {text}
    </span>
  );
}

/**
 * Alerts Page — Fully Mobile Responsive


 * Quản lý cảnh báo khủng hoảng thương hiệu real-time
 */
export default function AlertsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, loading: authLoading } = useAuth();
  const isManager = profile?.role === "brand_manager";
  const scopedBrandKey = getScopedBrandKey(profile);
  const alertPinStorageKey = `insightflow:pinned-alerts:${profile?.uid || "anonymous"}:${scopedBrandKey || "global"}`;
  const {
    pinnedIds: pinnedAlertIds,
    maxItems: maxPinnedAlerts,
    togglePinned: togglePinnedAlert,
    prunePinned: prunePinnedAlerts,
  } = usePinnedQueue(alertPinStorageKey);
  const canViewCrisisQueue = canAccessAlertQueue(profile);
  const canUpdateCrisisStatus =
    hasBusinessBrandScope(profile) &&
    canPerformAction(profile, "update_crisis_status");
  const brandFilterLocked = Boolean(profile && canViewCrisisQueue);
  const { t, i18n } = useTranslation();
  const [spikeValue, setSpikeValue] = useState(40);
  const [reachValue, setReachValue] = useState(105000);
  const [signalFilter, setSignalFilter] = useState("all");
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [parentText, setParentText] = useState<string | null>(null);
  const [loadingParent, setLoadingParent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [trendAlert, setTrendAlert] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"priority" | "new" | "resolving" | "resolved">("priority");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [correctionModalItem, setCorrectionModalItem] = useState<any>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [pendingClaimSelectionId, setPendingClaimSelectionId] = useState<string | null>(null);
  const [contactSessionAlertId, setContactSessionAlertId] = useState<string | null>(null);
  const contactSessionAlertRef = useRef<AlertData | null>(null);
  const [isDetailPanelCollapsed, setIsDetailPanelCollapsed] = useState(false);
  const [detailPanelTab, setDetailPanelTab] = useState<AlertDetailPanelTab>("action");

  const hasLoadedRef = useRef(false);
  // New states for the redesigned Priority Process List
  const [searchText, setSearchText] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<"all" | "overdue" | "due_soon">("all");
  const [statusFilter, setStatusFilter] = useState<AlertStatusFilter>("all");
  const [includeClosed, setIncludeClosed] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("include") === "all";
  });
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"risk" | "newest" | "reach">("risk");
  const [alertPage, setAlertPage] = useState(1);
  const [isResolvedExpanded, setIsResolvedExpanded] = useState(false);
  const [isRequestsExpanded, setIsRequestsExpanded] = useState(false);
  const [timeFilter, setTimeFilter] = useState<string>("30d");
  const [singleDate, setSingleDate] = useState<string>("");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showDatePopover, setShowDatePopover] = useState(false);
  const [activeTrending, setActiveTrending] = useState<{ name: string; matchIds: string[] } | null>(null);

  useEffect(() => {
    if (!isManager) setShowMineOnly(false);
  }, [isManager]);

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const alertIdParam = searchParams.get("alertId");
  const mentionIdParam = searchParams.get("mentionId");
  const alertScope = searchParams.get("scope") === "crisis" ? "crisis" : "negative";
  const dashboardReturnNavigation = useMemo(
    () => readDashboardReturnNavigation(searchParams),
    [searchParams],
  );
  const handledAlertIdParamRef = useRef<string | null>(null);




  // Active configs for thesis presentation
  const [keywords, setKeywords] = useState(['Ngộ độc', 'Biểu tình', 'Tẩy chay', 'Chất lượng']);
  const [showAddKeywordInput, setShowAddKeywordInput] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setToastMessage("");
    }, 3000);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
      setShowAddKeywordInput(false);
    }
  };

  const handleSaveConfig = () => {
    triggerToast(t("alerts.toast.saved"));
  };

  const handleAccessSource = async (alert: Parameters<typeof getAlertSourceUrl>[0]) => {
    const text = alert.comment_content || alert.text || "";
    // Open synchronously from the click event so browsers do not block the new tab.
    const targetUrl = getAlertSourceUrl(alert);
    if (targetUrl) window.open(targetUrl, "_blank", "noopener,noreferrer");

    // Copy full text to clipboard for manual Ctrl+F fallback.
    const didCopy = await copyTextToClipboard(text);
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }

  };

  const {
    rawAlerts,
    alerts,
    brands,
    isLoading,
    error,
    filters,
    setFilters,
    fetchAlerts,
    updateAlertStatus,
    skipAlert,
    restoreAlert,
    fetchCorrectionRequests,
    createCorrectionRequest,
    resolveCorrectionRequest,
    correctionRequests,
    isLoadingRequests,
  } = useAlertStore();
  // Filter alerts by currently selected brand filter for dashboard overview calculations
  const brandFilteredAlerts = useMemo(() => {
    // Alerts is the complete negative-content queue. The shared store also
    // carries urgent non-negative records so Crisis Monitoring can honour its
    // broader urgency rule without triggering another data scan.
    let result = rawAlerts.filter((alert) => {
      if (alertScope === "negative") return alert.sentiment === "negative";
      return isCrisisClassificationLabel({
        sentiment: alert.sentiment as any,
        relevance: alert.relevance,
        urgency: alert.urgency as any,
        intent: alert.intent as any,
      });
    });

    if (filters.brand && filters.brand !== "all") {
      const normalize = (b: string) => String(b || "").toLowerCase().replace(/[\s\-_.]/g, "").trim();
      const targetKey = normalize(filters.brand);
      result = result.filter(a => {
        let aKey = normalize(a.brand);
        if (aKey.includes("highland")) aKey = "highlandcoffee";
        if (aKey.includes("starbuck")) aKey = "starbucks";
        if (aKey.includes("mixue")) aKey = "mixue";

        let tKey = targetKey;
        if (tKey.includes("highland")) tKey = "highlandcoffee";
        if (tKey.includes("starbuck")) tKey = "starbucks";
        if (tKey.includes("mixue")) tKey = "mixue";

        return aKey === tKey;
      });
    }

    if (timeFilter !== "all") {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTodayMs = startOfToday.getTime();

      if (timeFilter === "24h") {
        startDate = new Date(startOfTodayMs);
      } else if (timeFilter === "2d") {
        startDate = new Date(startOfTodayMs - 1 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === "3d") {
        startDate = new Date(startOfTodayMs - 2 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === "5d") {
        startDate = new Date(startOfTodayMs - 4 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === "7d") {
        startDate = new Date(startOfTodayMs - 6 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === "30d") {
        startDate = new Date(startOfTodayMs - 29 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === "this_month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (timeFilter === "last_month") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (timeFilter === "single") {
        if (singleDate) {
          startDate = new Date(singleDate + "T00:00:00");
          endDate = new Date(singleDate + "T23:59:59");
        }
      } else if (timeFilter === "custom") {
        if (customStartDate) startDate = new Date(customStartDate + "T00:00:00");
        if (customEndDate) endDate = new Date(customEndDate + "T23:59:59");
      } else if (/^\d{4}-\d{2}$/.test(timeFilter)) {
        const [year, month] = timeFilter.split("-").map(Number);
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 1);
      }

      if (startDate || endDate) {
        result = result.filter(a => {
          // The time selector consistently refers to the publication date of
          // the post/comment that generated the alert, regardless of status.
          const eventDate = new Date(a.created_at);
          if (isNaN(eventDate.getTime())) return false;
          if (startDate && eventDate < startDate) return false;
          if (endDate && eventDate > endDate) return false;
          return true;
        });
      }
    }

    return result;
  }, [alertScope, rawAlerts, filters.brand, timeFilter, singleDate, customStartDate, customEndDate]);

  useEffect(() => {
    const requestedTime = searchParams.get("time");
    const requestedStatus = searchParams.get("status");
    const requestedSource = searchParams.get("source");
    const requestedSeverity = searchParams.get("severity");
    const requestedSla = searchParams.get("sla");
    const requestedInclude = searchParams.get("include");
    const requestedBrand = searchParams.get("brand");

    if (requestedTime) setTimeFilter(requestedTime);
    if (requestedStatus) setStatusFilter(requestedStatus as AlertStatusFilter);
    if (requestedSource) setSourceFilter(requestedSource);
    if (requestedSeverity) setSeverityFilter(requestedSeverity);
    if (requestedSla === "overdue" || requestedSla === "due_soon") setSlaFilter(requestedSla);
    setIncludeClosed(requestedInclude === "all");
    if (requestedBrand) setFilters({ brand: requestedBrand });
    setSingleDate(searchParams.get("date") || "");
    setCustomStartDate(searchParams.get("start") || "");
    setCustomEndDate(searchParams.get("end") || "");
  }, [searchParams, setFilters]);

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    rawAlerts.forEach(a => {
      try {
        const d = new Date(a.created_at);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthSet.add(key);
        }
      } catch { }
    });
    return Array.from(monthSet).sort().reverse();
  }, [rawAlerts]);

  const getRiskScore = (alert: any) => {
    return alert.negativity_score ?? 0;
  };

  const visibleBaseAlerts = useMemo(() => {
    const deduplicated = new Map<string, AlertData>();
    brandFilteredAlerts
      .filter((alert) => canAlertBeVisibleToUser(alert, profile))
      .forEach((alert) => {
        const key = getAlertDeduplicationKey(alert);
        const existing = deduplicated.get(key);
        if (!existing || getAlertCompletenessScore(alert) > getAlertCompletenessScore(existing)) {
          deduplicated.set(key, alert);
        }
      });
    return Array.from(deduplicated.values());
  }, [brandFilteredAlerts, profile]);

  useEffect(() => {
    if (isLoading || rawAlerts.length === 0) return;
    prunePinnedAlerts(
      visibleBaseAlerts
        .filter((alert) => getAlertWorkflowStatus(alert) === "processing")
        .map((alert) => alert.id),
    );
  }, [isLoading, prunePinnedAlerts, rawAlerts.length, visibleBaseAlerts]);

  const activeAlerts = useMemo(() => {
    return visibleBaseAlerts.filter((alert) => !isTerminalAlert(alert));
  }, [visibleBaseAlerts]);

  const resolvedAlerts = useMemo(() => {
    return visibleBaseAlerts.filter(isResolvedAlert);
  }, [visibleBaseAlerts]);

  const skippedAlerts = useMemo(() => {
    return visibleBaseAlerts.filter(isSkippedAlert);
  }, [visibleBaseAlerts]);

  useEffect(() => {
    const navigationKey = [alertIdParam, mentionIdParam].filter(Boolean).join("::");
    if (!navigationKey) {
      handledAlertIdParamRef.current = null;
      return;
    }
    if (handledAlertIdParamRef.current === navigationKey) return;

    const targetAlert = findAlertByNavigationTarget(
      visibleBaseAlerts,
      alertIdParam,
      mentionIdParam,
    );
    if (!targetAlert) return;

    handledAlertIdParamRef.current = navigationKey;
    const workflowStatus = getAlertWorkflowStatus(targetAlert);

    // A deep link must reveal the requested record even if the user left
    // restrictive queue filters active during the previous visit.
    setSearchText("");
    setSeverityFilter("all");
    setSourceFilter("all");
    setContentTypeFilter("all");
    setSlaFilter("all");
    setShowMineOnly(false);
    setStatusFilter(
      workflowStatus === "resolved"
        ? "resolved"
        : workflowStatus === "skipped"
          ? "skipped"
          : workflowStatus === "processing"
            ? "processing"
            : workflowStatus === "contact_failed"
              ? "contact_failed"
              : "all",
    );
    setAlertPage(1);
    setDetailPanelTab("action");
    setIsDetailPanelCollapsed(false);
    setPendingClaimSelectionId(targetAlert.id);
  }, [alertIdParam, mentionIdParam, visibleBaseAlerts]);

  const processedActiveAlerts = useMemo(() => {
    let result = includeClosed && statusFilter === "all" ? [...visibleBaseAlerts] : statusFilter === "resolved"
      ? [...resolvedAlerts]
      : statusFilter === "skipped"
        ? [...skippedAlerts]
        : [...activeAlerts];

    // Lọc theo trạng thái nghiệp vụ.
    // "all" includes every non-resolved workflow state. The status tabs are
    // mutually exclusive, so their counts always add up to the open total.
    if (statusFilter === "all") {
      result = result.filter((alert) => getAlertWorkflowStatus(alert) !== "resolved");
    } else if (statusFilter === "pending") {
      result = result.filter((alert) => {
        return getAlertWorkflowStatus(alert) === "pending";
      });
    } else if (statusFilter === "processing") {
      result = result.filter((alert) => getAlertWorkflowStatus(alert) === "processing");
    } else if (statusFilter === "contact_failed") {
      result = result.filter((alert) => getAlertWorkflowStatus(alert) === "contact_failed");
    } else if (statusFilter === "resolved") {
      result = result.filter(isResolvedAlert);
    } else if (statusFilter === "skipped") {
      result = result.filter(isSkippedAlert);
    }

    // 1. Search text filter
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(a =>
        String(a.text || "").toLowerCase().includes(q) ||
        String(a.author || "").toLowerCase().includes(q)
      );
    }

    // 2. Severity filter
    if (severityFilter !== "all") {
      result = result.filter(a => severityFilter === "high_priority"
        ? ["critical", "high"].includes(String(a.severity || "").toLowerCase())
        : String(a.severity || "").toLowerCase() === severityFilter.toLowerCase());
    }

    // 3. Source filter
    if (sourceFilter !== "all") {
      result = result.filter(a => a.source.toLowerCase() === sourceFilter.toLowerCase());
    }

    // New: Content Type filter (comment/post)
    if (contentTypeFilter !== "all") {
      result = result.filter(a => String(a.content_type || "").toLowerCase() === contentTypeFilter.toLowerCase());
    }

    // 4. SLA filter: same priority windows used by Crisis Monitoring.
    if (slaFilter !== "all") {
      const nowMs = Date.now();
      result = result.filter((alert) => {
        if (isTerminalAlert(alert)) return false;
        const severity = String(alert.severity || alert.urgency || "").toLowerCase();
        const slaHours = severity === "critical" || severity === "urgent" ? 1 : severity === "high" ? 2 : severity === "medium" || severity === "normal" ? 4 : 8;
        const startedAt = new Date(alert.detected_at || alert.created_at).getTime();
        if (!Number.isFinite(startedAt)) return false;
        const durationMs = slaHours * 60 * 60 * 1000;
        const remainingMs = startedAt + durationMs - nowMs;
        if (slaFilter === "overdue") return remainingMs <= 0;
        const dueSoonWindowMs = Math.max(30 * 60 * 1000, durationMs * 0.2);
        return remainingMs > 0 && remainingMs <= dueSoonWindowMs;
      });
    }

    // 5. Mine only filter
    if (showMineOnly) {
      result = result.filter(a => isAlertOwnedByUser(a, profile));
    }

    // 5. Sorting. Risk priority is severity first, then the detailed risk
    // score, then recency so urgent mentions are always at the top.
    result.sort((a, b) => {
      if (statusFilter === "processing") {
        const pinnedDelta = Number(pinnedAlertIds.includes(b.id)) - Number(pinnedAlertIds.includes(a.id));
        if (pinnedDelta !== 0) return pinnedDelta;
      }
      if (sortBy === "risk") {
        const severityRank: Record<string, number> = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        const severityDelta =
          (severityRank[String(b.severity || "").toLowerCase()] || 0) -
          (severityRank[String(a.severity || "").toLowerCase()] || 0);
        if (severityDelta !== 0) return severityDelta;

        const riskDelta = getRiskScore(b) - getRiskScore(a);
        if (riskDelta !== 0) return riskDelta;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "reach") {
        return (b.reach || 0) - (a.reach || 0);
      }
      // default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [activeAlerts, resolvedAlerts, skippedAlerts, visibleBaseAlerts, includeClosed, statusFilter, searchText, severityFilter, sourceFilter, contentTypeFilter, slaFilter, showMineOnly, sortBy, profile, pinnedAlertIds]);

  const totalAlertPages = Math.max(1, Math.ceil(processedActiveAlerts.length / ALERTS_PER_PAGE));
  const paginatedActiveAlerts = useMemo(() => {
    const startIndex = (alertPage - 1) * ALERTS_PER_PAGE;
    return processedActiveAlerts.slice(startIndex, startIndex + ALERTS_PER_PAGE);
  }, [processedActiveAlerts, alertPage]);

  const selectedAlert = useMemo(() => {
    if (!selectedAlertId) return null;
    return processedActiveAlerts.find((alert) => alert.id === selectedAlertId) ||
      (contactSessionAlertId === selectedAlertId ? contactSessionAlertRef.current : null);
  }, [contactSessionAlertId, processedActiveAlerts, selectedAlertId]);
  const alertViewers = useAlertViewPresence({
    alertId: selectedAlert?.id || null,
    enabled: Boolean(
      selectedAlert &&
      !isDetailPanelCollapsed &&
      getAlertWorkflowStatus(selectedAlert) === "pending",
    ),
  });

  useEffect(() => {
    if (!pendingClaimSelectionId) return;
    const claimedAlertIndex = processedActiveAlerts.findIndex((alert) => alert.id === pendingClaimSelectionId);
    if (claimedAlertIndex < 0) return;

    const claimedAlertPage = Math.floor(claimedAlertIndex / ALERTS_PER_PAGE) + 1;
    setSelectedAlertId(pendingClaimSelectionId);
    if (alertPage !== claimedAlertPage) {
      setAlertPage(claimedAlertPage);
      return;
    }

    setPendingClaimSelectionId(null);
    window.requestAnimationFrame(() => {
      document.querySelector('[data-tour="alert-detail-panel"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [alertPage, pendingClaimSelectionId, processedActiveAlerts]);

  useEffect(() => {
    if (pendingClaimSelectionId) return;
    if (contactSessionAlertId) {
      const contactAlertIndex = processedActiveAlerts.findIndex((alert) => alert.id === contactSessionAlertId);
      if (selectedAlertId !== contactSessionAlertId) setSelectedAlertId(contactSessionAlertId);
      if (contactAlertIndex >= 0) {
        const contactAlertPage = Math.floor(contactAlertIndex / ALERTS_PER_PAGE) + 1;
        if (contactAlertPage !== alertPage) setAlertPage(contactAlertPage);
      }
      return;
    }
    // Keep the current detail panel stable while a status/contact update is
    // reloading the queue. Clearing the selection here makes the UI jump to
    // another alert before the evidence form can be completed.
    if (isLoading) return;

    if (selectedAlertId) {
      const selectedIndex = processedActiveAlerts.findIndex((alert) => alert.id === selectedAlertId);
      if (selectedIndex >= 0) {
        const selectedPage = Math.floor(selectedIndex / ALERTS_PER_PAGE) + 1;
        if (selectedPage !== alertPage) setAlertPage(selectedPage);
        return;
      }
    }

    if (paginatedActiveAlerts.length === 0) {
      setSelectedAlertId(null);
      return;
    }

    setSelectedAlertId(paginatedActiveAlerts[0].id);
    setDetailPanelTab("action");
  }, [alertPage, contactSessionAlertId, isLoading, paginatedActiveAlerts, pendingClaimSelectionId, processedActiveAlerts, selectedAlertId]);

  const visibleAlertPages = useMemo(() => {
    const startPage = Math.max(1, Math.min(alertPage - 2, totalAlertPages - 4));
    const endPage = Math.min(totalAlertPages, startPage + 4);
    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }, [alertPage, totalAlertPages]);

  useEffect(() => {
    setAlertPage(1);
  }, [statusFilter, searchText, severityFilter, sourceFilter, contentTypeFilter, slaFilter, showMineOnly, sortBy, filters.brand]);

  useEffect(() => {
    setAlertPage((current) => Math.min(current, totalAlertPages));
  }, [totalAlertPages]);

  const goToAlertPage = (pageNumber: number) => {
    const nextPage = Math.max(1, Math.min(totalAlertPages, pageNumber));
    if (nextPage === alertPage) return;

    // Pagination is an explicit navigation action. Move the selection with the
    // page so the selection-preservation effect cannot immediately pull the
    // user back to the page containing the previously selected alert.
    const firstAlertOnNextPage = processedActiveAlerts[(nextPage - 1) * ALERTS_PER_PAGE] || null;
    setPendingClaimSelectionId(null);
    setContactSessionAlertId(null);
    contactSessionAlertRef.current = null;
    setAlertPage(nextPage);
    setSelectedAlertId(firstAlertOnNextPage?.id || null);
    setDetailPanelTab("action");

    window.requestAnimationFrame(() => {
      document.querySelector('[data-tour="alerts-queue-list"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Helper: map email/uid to display name for resolvers
  const getResolverName = (emailOrId: string | null | undefined): string => {
    if (!emailOrId) return "";
    if (!emailOrId.includes("@")) return emailOrId;
    const e = emailOrId.toLowerCase();
    if (e.includes("crisis")) return "Nguyen Van Crisis";
    if (e.includes("lead")) return "Tran Thi Lead";
    if (e.includes("admin")) return "InsightFlow Admin";
    if (e.includes("manager")) {
      if (e.includes("highland")) return "Highlands Brand Manager";
      if (e.includes("starbuck")) return "Starbucks Brand Manager";
      if (e.includes("mixue")) return "Mixue Brand Manager";
      return "Brand Manager";
    }
    const local = emailOrId.split("@")[0];
    return local.split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  // Harvest resolution log logs from actual alert histories
  const teamActivities = useMemo(() => {
    const list: any[] = [];
    visibleBaseAlerts.forEach(a => {
      if (a.resolution_history) {
        a.resolution_history.forEach((h: any) => {
          // Priority: stored name > stored email (mapped) > current lock holder > fallback
          const authorName = h.resolved_by_name
            || getResolverName(h.resolved_by_email)
            || getResolverName(a.being_resolved_by)
            || t("alerts.page.dutyStaff");
          list.push({
            author: authorName,
            action: h.action_type === "skip"
              ? `đã bỏ qua cảnh báo #${a.id.slice(-4)}`
              : h.action_type === "restore"
                ? `đã khôi phục cảnh báo #${a.id.slice(-4)}`
                : t("alerts.page.loggedResolution", { id: a.id.slice(-4) }),
            timestamp: h.timestamp,
            id: a.id
          });
        });
      }
      if (a.status === "resolved" && a.resolved_at) {
        const resolverName = a.resolved_by_name
          || getResolverName(a.resolved_by_email)
          || getResolverName(a.being_resolved_by)
          || t("alerts.page.member");
        list.push({
          author: resolverName,
          action: t("alerts.page.completedResolution", { id: a.id.slice(-4) }),
          timestamp: a.resolved_at,
          id: a.id
        });
      }
    });

    if (list.length === 0) {
      list.push({ author: "Nguyen Van Crisis", action: "đã xử lý vụ việc #9283", timestamp: new Date(Date.now() - 120000).toISOString() });
      list.push({ author: "Tran Thi Lead", action: "đang escalate vụ việc #9122", timestamp: new Date(Date.now() - 300000).toISOString() });
    }

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  }, [visibleBaseAlerts, t]);

  // Shift Performance resolved ratio calculation
  const shiftPerformanceStats = useMemo(() => {
    const resolved = visibleBaseAlerts.filter(isResolvedAlert).length;
    const total = visibleBaseAlerts.filter((alert) => !isSkippedAlert(alert)).length;
    // We default to 100% KPI completion if there are no alerts to handle
    const percentage = total === 0 ? 100 : Math.round((resolved / total) * 100);
    return { percentage, resolved, total };
  }, [visibleBaseAlerts]);

  const shiftPerformance = shiftPerformanceStats.percentage;


  // Trending now — 3-source approach for meaningful insight:
  // 1. Predefined crisis keyword matching (highest signal)
  // 2. Bigrams (2-word phrases) from alert text
  // 3. Topic field aggregation as fallback labels
  const trendingTags = useMemo(() => {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    // --- Source 1: Crisis keyword dictionary ---
    const CRISIS_KEYWORDS: { term: string; variants: string[] }[] = [
      { term: "Ngộ độc", variants: ["ngộ độc", "ngo doc", "food poison"] },
      { term: "Tẩy chay", variants: ["tẩy chay", "tay chay", "boycott", "không mua"] },
      { term: "Hoàn tiền", variants: ["hoàn tiền", "hoan tien", "refund", "trả tiền"] },
      { term: "Chất lượng", variants: ["chất lượng", "chat luong", "quality", "tệ", "kém"] },
      { term: "Vệ sinh", variants: ["vệ sinh", "ve sinh", "mất vệ sinh", "bẩn"] },
      { term: "Phục vụ", variants: ["phục vụ", "phuc vu", "thái độ", "nhân viên"] },
      { term: "Giá cả", variants: ["giá cả", "gia ca", "đắt", "mắc", "giá cao"] },
      { term: "Giao hàng", variants: ["giao hàng", "giao hang", "ship", "thiếu hàng"] },
      { term: "Sai/Thiếu món", variants: ["sai món", "thiếu món", "thieu mon", "sai mon", "không có"] },
      { term: "Scandal", variants: ["scandal", "bê bối", "be boi", "lùm xùm"] },
      { term: "Khiếu nại", variants: ["khiếu nại", "khieu nai", "phàn nàn", "than phiền"] },
      { term: "An toàn", variants: ["an toàn", "an toan", "mất an toàn", "nguy hiểm"] },
    ];

    // Normalize text for matching
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

    const keywordRecent: Record<string, number> = {};
    const keywordPrev: Record<string, number> = {};
    const keywordAll: Record<string, number> = {};

    // --- Source 2: Bigram extraction ---
    const STOP_WORDS = new Set(["và", "là", "của", "có", "không", "được", "trong", "với", "cho", "này", "đó", "thì", "mà", "hay", "hoặc", "bị", "khi", "đã", "sẽ", "tôi", "bạn", "anh", "chị", "họ", "các", "những", "rất", "vẫn", "cũng", "nên", "vì", "như", "đến", "từ", "về", "theo", "nhưng", "nếu", "một", "lại", "vào", "ra", "lên", "xuống", "sao", "thế"]);
    const bigramRecent: Record<string, number> = {};
    const bigramPrev: Record<string, number> = {};
    const bigramAll: Record<string, number> = {};

    // --- Source 3: Topic labels ---
    const TOPIC_LABELS: Record<string, string> = {
      quality: t("alerts.page.topicQuality"),
      service: t("alerts.page.topicService"),
      price: t("alerts.page.topicPrice"),
      staff: t("alerts.page.topicStaff"),
      delivery: t("alerts.page.topicDelivery"),
      experience: t("alerts.page.topicExperience"),
      legal: t("alerts.page.topicLegal"),
      operation: t("alerts.page.topicOperation"),
      competitor: t("alerts.page.topicCompetitor"),
      other: t("alerts.page.topicOther"),
    };
    const topicRecent: Record<string, number> = {};
    const topicPrev: Record<string, number> = {};
    const topicAll: Record<string, number> = {};

    rawAlerts.forEach(a => {
      const text = (a.text || "") + " " + (a.comment_content || "") + " " + (a.post_content || "");
      const alertTime = a.created_at ? new Date(a.created_at).getTime() : NaN;
      const diffMs = isNaN(alertTime) ? Infinity : now - alertTime;

      const inRecent = diffMs <= ONE_HOUR;
      const inPrev = diffMs > ONE_HOUR && diffMs <= 2 * ONE_HOUR;

      const bump = (rec: Record<string, number>, k: string) => { rec[k] = (rec[k] || 0) + 1; };

      // Source 1: crisis keyword matching
      const normText = norm(text);
      CRISIS_KEYWORDS.forEach(({ term, variants }) => {
        if (variants.some(v => normText.includes(norm(v)))) {
          bump(keywordAll, term);
          if (inRecent) bump(keywordRecent, term);
          else if (inPrev) bump(keywordPrev, term);
        }
      });

      // Source 2: bigrams
      const words = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
      for (let i = 0; i < words.length - 1; i++) {
        const bg = `${words[i]} ${words[i + 1]}`;
        if (bg.length >= 6) {
          bump(bigramAll, bg);
          if (inRecent) bump(bigramRecent, bg);
          else if (inPrev) bump(bigramPrev, bg);
        }
      }

      // Source 3: topic
      if (a.topic && a.topic !== "other") {
        const label = TOPIC_LABELS[a.topic] || a.topic;
        bump(topicAll, label);
        if (inRecent) bump(topicRecent, label);
        else if (inPrev) bump(topicPrev, label);
      }
    });

    // Score function: % spike relative to prev period
    const score = (cnt: number, prev: number) =>
      prev === 0 ? cnt * 100 : Math.round(((cnt - prev) / prev) * 100);

    const TAG_COLORS = [
      "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30",
      "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30",
      "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30",
      "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30",
      "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30",
    ];

    const hasRecentData = Object.keys(keywordRecent).length > 0 || Object.keys(topicRecent).length > 0;

    // Build matchIds map: term → list of alert IDs that matched
    const keywordMatchIds: Record<string, string[]> = {};
    const topicMatchIds: Record<string, string[]> = {};

    rawAlerts.forEach(a => {
      const text = (a.text || "") + " " + (a.comment_content || "") + " " + (a.post_content || "");
      const normText = norm(text);
      CRISIS_KEYWORDS.forEach(({ term, variants }) => {
        if (variants.some(v => normText.includes(norm(v)))) {
          if (!keywordMatchIds[term]) keywordMatchIds[term] = [];
          keywordMatchIds[term].push(a.id);
        }
      });
      if (a.topic && a.topic !== "other") {
        const label = TOPIC_LABELS[a.topic] || a.topic;
        if (!topicMatchIds[label]) topicMatchIds[label] = [];
        topicMatchIds[label].push(a.id);
      }
    });

    if (hasRecentData) {
      const candidates: { label: string; cnt: number; pct: number; matchIds: string[] }[] = [];

      Object.entries(keywordRecent).forEach(([term, cnt]) => {
        candidates.push({
          label: `#${term.replace(/\s/g, "")}`,
          cnt,
          pct: score(cnt, keywordPrev[term] || 0),
          matchIds: keywordMatchIds[term] || [],
        });
      });
      Object.entries(topicRecent).forEach(([label, cnt]) => {
        if (!candidates.find(c => c.label.includes(label))) {
          candidates.push({
            label: `#${label.replace(/\s/g, "")}`,
            cnt,
            pct: score(cnt, topicPrev[label] || 0),
            matchIds: topicMatchIds[label] || [],
          });
        }
      });

      return candidates
        .sort((a, b) => b.pct - a.pct || b.cnt - a.cnt)
        .slice(0, 5)
        .map(({ label, cnt, pct, matchIds }, i) => ({
          name: label,
          pct: pct > 0 ? `+${pct}% ${t("alerts.page.mentionsIn1h")}` : t("alerts.page.timesIn1h", { count: cnt }),
          bg: TAG_COLORS[i % TAG_COLORS.length],
          matchIds,
        }));
    }

    // Fallback: no recent data → rank by topic + crisis keyword overall frequency
    const fallback: { label: string; cnt: number; matchIds: string[] }[] = [];
    Object.entries(keywordAll).forEach(([term, cnt]) =>
      fallback.push({ label: `#${term.replace(/\s/g, "")}`, cnt, matchIds: keywordMatchIds[term] || [] })
    );
    Object.entries(topicAll).forEach(([label, cnt]) => {
      if (!fallback.find(f => f.label.includes(label))) {
        fallback.push({ label: `#${label.replace(/\s/g, "")}`, cnt, matchIds: topicMatchIds[label] || [] });
      }
    });

    return fallback
      .sort((a, b) => b.cnt - a.cnt)
      .slice(0, 5)
      .map(({ label, cnt, matchIds }, i) => ({
        name: label,
        pct: t("alerts.page.timesMentioned", { count: cnt }),
        bg: TAG_COLORS[i % TAG_COLORS.length],
        matchIds,
      }));
  }, [rawAlerts, t]);



  // NOTE: No auto-unlock on unmount — tasks stay claimed by the assigned officer
  // Ownership remains locked until the alert reaches a terminal status.

  // Resolve parent post/comment text for Evidence Detail Modal
  useEffect(() => {
    if (!selectedEvidence) {
      setParentText(null);
      return;
    }

    // 1. If evidence has post_content and comment_content, and they are different, use them
    if (
      selectedEvidence.post_content &&
      selectedEvidence.comment_content &&
      selectedEvidence.post_content.trim() !== selectedEvidence.comment_content.trim()
    ) {
      setParentText(selectedEvidence.post_content);
      return;
    }

    // 2. If it has parent_id, try to find the parent comment/post text in alerts/rawAlerts or Firestore
    if (selectedEvidence.parent_id) {
      const parent =
        alerts.find((a) => a.id === selectedEvidence.parent_id) ||
        rawAlerts.find((a) => a.id === selectedEvidence.parent_id);
      if (parent) {
        setParentText(parent.text);
        return;
      }

      setLoadingParent(true);
      const fetchParent = async () => {
        try {
          const postResult = await supabaseRequest<any[]>(
            "posts",
            `post_id=eq.${encodeURIComponent(selectedEvidence.parent_id)}&limit=1`
          );
          const parentPost = postResult?.[0];
          if (parentPost) {
            const text = String(parentPost.payload_json?.text || parentPost.text || "");
            setParentText(text);
          }
        } catch (err) {
          console.error("Failed to fetch parent post from Supabase:", err);
        } finally {
          setLoadingParent(false);
        }
      };
      fetchParent();
    } else {
      setParentText(null);
    }
  }, [selectedEvidence, alerts, rawAlerts]);

  const dashboardStore = useDashboardStore();
  useDashboard({
    autoFetch: true,
    refetchInterval: 1800000,
  });

  // Compute lists of high-risk items for the Crisis Priority Center (unified Sự vụ & Bài viết & Thông tin liên hệ)
  const highRiskIncidents = useMemo(() => {
    // 1. Get unresolved critical/high alerts
    const activeAlerts = visibleBaseAlerts.filter(
      a => (a.severity.toLowerCase() === "critical" || a.severity.toLowerCase() === "high") && !isTerminalAlert(a)
    );

    // 2. Enrich with lead contact details if author or content matches
    return activeAlerts.map(a => {
      const matchingLead = (dashboardStore.leads || []).find(
        l => l.author === a.author || (l.content && a.text && l.content.toLowerCase().includes(a.text.toLowerCase()))
      );

      return {
        id: a.id,
        brand: a.brand,
        platform: a.source || matchingLead?.platform || "tiktok",
        author: a.author || matchingLead?.author || t("alerts.page.anonymous"),
        content: a.text || matchingLead?.content || "",
        severity: a.severity,
        created_at: a.created_at,
        status: a.status,
        url: a.url || matchingLead?.url || "",
        social_profile_url: a.social_profile_url || matchingLead?.social_profile_url || "",
        phone: matchingLead?.phone || "",
        email: matchingLead?.email || "",
        zalo_id: matchingLead?.zalo_id || "",
        messenger_id: matchingLead?.messenger_id || "",
        rawAlert: a,
        rawLead: matchingLead
      };
    });
  }, [visibleBaseAlerts, dashboardStore.leads, t]);

  // Count cases, posts, and contacts from highRiskIncidents
  const { casesCount, postsCount, contactsCount } = useMemo(() => {
    let cases = 0;
    let posts = 0;
    let contacts = 0;

    highRiskIncidents.forEach((incident) => {
      if (incident.severity.toLowerCase() === "critical") {
        cases++;
      } else if (incident.severity.toLowerCase() === "high") {
        posts++;
      }
      if (incident.phone || incident.email) {
        contacts++;
      }
    });

    return { casesCount: cases, postsCount: posts, contactsCount: contacts };
  }, [highRiskIncidents]);

  // Find the selected incident details object
  const selectedIncident = useMemo(() => {
    if (!selectedIncidentId) return null;
    return highRiskIncidents.find(i => i.id === selectedIncidentId) || null;
  }, [highRiskIncidents, selectedIncidentId]);

  // Auto-select the first high-risk incident in Split-Pane view
  useEffect(() => {
    if (activeTab === "priority" && highRiskIncidents.length > 0) {
      const activeIds = new Set(highRiskIncidents.map(i => i.id));
      if (!selectedIncidentId || !activeIds.has(selectedIncidentId)) {
        setSelectedIncidentId(highRiskIncidents[0].id);
      }
    } else if (highRiskIncidents.length === 0) {
      setSelectedIncidentId(null);
    }
  }, [activeTab, highRiskIncidents, selectedIncidentId]);

  // Load from the shared 30-minute cache on mount. Realtime updates existing
  // workflow records and the polling safety net refreshes every 30 minutes.
  useEffect(() => {
    if (authLoading || !canViewCrisisQueue) return;
    setFilters({ status: "all" });
    fetchAlerts(scopedBrandKey, false);
    fetchCorrectionRequests(scopedBrandKey);
  }, [authLoading, canViewCrisisQueue, scopedBrandKey, fetchAlerts, fetchCorrectionRequests, setFilters]);

  // Auto-switch view Mode once based on high-risk counts
  useEffect(() => {
    if (!isLoading && rawAlerts.length > 0 && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      if (highRiskIncidents.length === 0) {
        setActiveTab("new");
      }
    }
  }, [isLoading, rawAlerts, highRiskIncidents.length]);

  useEffect(() => {
    if (!brandFilterLocked || brands.length === 0) return;
    if (filters.brand !== "all") return;
    const matchedBrand = brands.find(b => isRecordInBrandScope({ brand: b }, scopedBrandKey)) || brands[0];
    setFilters({ brand: matchedBrand });
  }, [brandFilterLocked, brands, filters.brand, scopedBrandKey, setFilters]);

  if (!authLoading && !canViewCrisisQueue) {
    return (
      <div className="p-4 md:p-8">
        <div className="glass-card p-8 rounded-xl border border-[var(--color-border)]">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t("alerts.page.noAccess")}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            {t("alerts.page.noAccessDesc")}
          </p>
        </div>
      </div>
    );
  }

  if (!authLoading && !hasBusinessBrandScope(profile)) {
    return (
      <div className="p-4 md:p-8">
        <div className="glass-card p-8 rounded-xl border border-[var(--color-border)]">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t("alerts.page.noBrand")}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            {t("alerts.page.noBrandDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-tour="alerts-page" className="space-y-6 bg-[var(--color-bg-base)] p-[clamp(12px,2vw,32px)] text-[var(--color-text-primary)] animate-fade-in">

      {dashboardReturnNavigation && (
        <button
          type="button"
          onClick={() => router.push(
            isDemoPath(pathname)
              ? toDemoHref(dashboardReturnNavigation.href) || "/demo/insights"
              : dashboardReturnNavigation.href,
          )}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3.5 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-bg-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {dashboardReturnNavigation.label}
        </button>
      )}

      {/* Redesigned Grid Section */}
      <AlertWorkbench
        alerts={visibleBaseAlerts}
        pageAlerts={paginatedActiveAlerts}
        selectedAlert={selectedAlert}
        selectedAlertId={selectedAlertId}
        panelCollapsed={isDetailPanelCollapsed}
        detailTab={detailPanelTab}
        isLoading={isLoading}
        isRefreshing={isLoading || isLoadingRequests}
        error={error}
        statusFilter={statusFilter}
        searchText={searchText}
        severityFilter={severityFilter}
        sourceFilter={sourceFilter}
        contentTypeFilter={contentTypeFilter}
        slaFilter={slaFilter}
        includeClosed={includeClosed}
        showMineOnly={showMineOnly}
        sortBy={sortBy}
        timeFilter={timeFilter}
        singleDate={singleDate}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        brandFilterLocked={brandFilterLocked}
        canViewAllAssignments={isManager}
        brands={brands}
        filters={filters}
        currentPage={alertPage}
        totalPages={totalAlertPages}
        totalFiltered={processedActiveAlerts.length}
        pinnedAlertIds={pinnedAlertIds}
        maxPinnedAlerts={maxPinnedAlerts}
        profileEmail={profile?.email}
        currentViewerId={profile?.uid}
        alertViewers={alertViewers}
        canUpdate={canUpdateCrisisStatus}
        getResolverName={getResolverName}
        onRefresh={async () => {
          try {
            await fetchAlerts(scopedBrandKey, true);
            await fetchCorrectionRequests(scopedBrandKey, true);
            triggerToast("Đã làm mới dữ liệu.");
          } catch (refreshError) {
            triggerToast("Không thể làm mới dữ liệu.");
          }
        }}
        onSelectAlert={(alert) => {
          if (contactSessionAlertId && contactSessionAlertId !== alert.id) {
            setContactSessionAlertId(null);
            contactSessionAlertRef.current = null;
          }
          setSelectedAlertId(alert.id);
          setDetailPanelTab("action");
          setIsDetailPanelCollapsed(false);
        }}
        onTogglePin={(alert) => {
          const wasPinned = pinnedAlertIds.includes(alert.id);
          const changed = togglePinnedAlert(alert.id);
          triggerToast(
            changed
              ? wasPinned
                ? "Đã bỏ ghim cảnh báo."
                : "Đã ghim cảnh báo lên đầu danh sách."
              : `Chỉ được ghim tối đa ${maxPinnedAlerts} cảnh báo.`,
          );
        }}
        onCollapsePanel={() => setIsDetailPanelCollapsed(true)}
        onOpenPanel={() => setIsDetailPanelCollapsed(false)}
        onDetailTabChange={setDetailPanelTab}
        onClaim={async (alert) => {
          const previousStatusFilter = statusFilter;
          try {
            setPendingClaimSelectionId(alert.id);
            const claimRequest = updateAlertStatus(alert.id, "resolving", profile, { note: "Đã tiếp nhận xử lý" }, alert.brand);
            setStatusFilter("processing");
            setSelectedAlertId(alert.id);
            setDetailPanelTab("action");
            setIsDetailPanelCollapsed(false);
            await claimRequest;
            triggerToast("Đã nhận xử lý cảnh báo.");
          } catch (claimError) {
            setPendingClaimSelectionId(null);
            setStatusFilter(previousStatusFilter);
            triggerToast(claimError instanceof Error ? claimError.message : "Không thể nhận xử lý cảnh báo.");
            throw claimError;
          }
        }}
        onRecordResult={async (alert, draft: AlertContactResultDraft) => {
          if (
            !alert.customer_contact_opened_at ||
            !draft.note.trim() ||
            !draft.evidenceImage ||
            !draft.responseResult
          ) {
            const missingEvidenceError = new Error("Cần có minh chứng liên hệ và kết quả phản hồi của khách hàng.");
            triggerToast(missingEvidenceError.message);
            throw missingEvidenceError;
          }

          const outcomeStatus: CustomerContactAttempt["outcome_status"] = draft.responseResult === "no_response"
            ? "contact_waiting"
            : draft.responseResult === "still_upset"
              ? "contact_failed"
              : "resolved";
          const nextContactHistory: CustomerContactAttempt[] = [
            ...(alert.customer_contact_history || []),
            {
              opened_at: alert.customer_contact_opened_at,
              opened_by: alert.customer_contact_opened_by,
              template: alert.customer_contact_template,
              note: draft.note,
              evidence_image: draft.evidenceImage,
              response_result: draft.responseResult,
              completed_at: new Date().toISOString(),
              outcome_status: outcomeStatus,
            },
          ];
          const targetStatus = outcomeStatus === "contact_waiting"
            ? "contact_waiting"
            : outcomeStatus === "contact_failed"
              ? "contact_failed"
              : "resolved";
          const resultLabel = draft.responseResult === "positive"
            ? "Khách hàng phản hồi tích cực"
            : draft.responseResult === "no_response"
              ? "Chưa phản hồi"
              : draft.responseResult === "still_upset"
                ? "Khách hàng vẫn bức xúc"
                : "Không phù hợp";

          try {
            await updateAlertStatus(alert.id, targetStatus, profile, {
              note: `Hoàn tất ghi nhận kết quả liên hệ: ${resultLabel}.`,
              customer_contact_opened_at: alert.customer_contact_opened_at,
              customer_contact_opened_by: alert.customer_contact_opened_by,
              customer_contact_template: alert.customer_contact_template,
              customer_contact_note: draft.note,
              customer_contact_evidence_image: draft.evidenceImage,
              customer_response_result: draft.responseResult,
              customer_contact_history: nextContactHistory,
              reset_customer_contact: outcomeStatus !== "resolved",
            }, alert.brand);
            triggerToast(
              outcomeStatus === "resolved"
                ? "Đã ghi nhận và hoàn tất xử lý cảnh báo."
                : outcomeStatus === "contact_failed"
                  ? "Đã chuyển cảnh báo sang luồng Giải quyết thất bại."
                  : "Đã ghi nhận liên hệ và chuyển sang chờ phản hồi."
            );
            setContactSessionAlertId(null);
            contactSessionAlertRef.current = null;
          } catch (recordError) {
            triggerToast(recordError instanceof Error ? recordError.message : "Không thể ghi nhận kết quả cảnh báo.");
            throw recordError;
          }
        }}
        onSkip={async (alert) => {
          const currentIndex = paginatedActiveAlerts.findIndex((item) => item.id === alert.id);
          const nextAlert = paginatedActiveAlerts[currentIndex + 1] || paginatedActiveAlerts[currentIndex - 1] || null;
          await skipAlert(alert.id, profile, alert.brand);
          setContactSessionAlertId(null);
          contactSessionAlertRef.current = null;
          setSelectedAlertId(nextAlert?.id || null);
          setDetailPanelTab("action");
          setIsDetailPanelCollapsed(false);
        }}
        onRestore={async (alert) => {
          await restoreAlert(alert.id, profile, alert.brand);
          setContactSessionAlertId(null);
          contactSessionAlertRef.current = null;
          setSearchText("");
          setSeverityFilter("all");
          setSourceFilter("all");
          setContentTypeFilter("all");
          setSlaFilter("all");
          setShowMineOnly(false);
          setStatusFilter("processing");
          setAlertPage(1);
          setPendingClaimSelectionId(alert.id);
          setSelectedAlertId(alert.id);
          setDetailPanelTab("action");
          setIsDetailPanelCollapsed(false);
        }}
        onOpenSource={(alert) => {
          contactSessionAlertRef.current = alert;
          setContactSessionAlertId(alert.id);
          setSelectedAlertId(alert.id);
          setDetailPanelTab("action");
          setIsDetailPanelCollapsed(false);
          void handleAccessSource(alert);
        }}
        onStatusFilterChange={setStatusFilter}
        onSearchTextChange={setSearchText}
        onSeverityFilterChange={setSeverityFilter}
        onSourceFilterChange={setSourceFilter}
        onContentTypeFilterChange={setContentTypeFilter}
        onSlaFilterChange={setSlaFilter}
        onMineOnlyChange={setShowMineOnly}
        onSortChange={setSortBy}
        onTimeFilterChange={setTimeFilter}
        onSingleDateChange={setSingleDate}
        onCustomStartDateChange={setCustomStartDate}
        onCustomEndDateChange={setCustomEndDate}
        onFiltersChange={setFilters}
        onPageChange={goToAlertPage}
      />

      {/* Modals rendering at root level */}
      {selectedEvidence && (
        <TrendModal
          alert={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}

      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-green-500">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span className="text-xs font-bold">{toastMessage || t("alerts.toast.saved")}</span>
        </div>
      )}
    </div>
  );

}

// Helper to parse Firestore/general dates into Date object
function parseDateToISOString(field: any): string {
  if (!field) return new Date().toISOString();
  if (typeof field.toDate === "function") {
    return field.toDate().toISOString();
  }
  if (field instanceof Date) return field.toISOString();
  if (field && typeof field.seconds === "number") {
    return new Date(field.seconds * 1000).toISOString();
  }
  const s = String(field).trim();
  if (!s) return new Date().toISOString();
  return s.includes("+") || s.endsWith("Z") ? s : s + "Z";
}

// Helper to guarantee absolute URLs for external links
function getAbsoluteUrl(urlStr: string): string {
  if (!urlStr || urlStr === "#" || urlStr.trim() === "") return "#";
  const trimmed = urlStr.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

// Helper to construct profile URL search or direct link
function getContactProfileUrl(contact: any): string {
  let url = contact.social_profile_url || "";

  if (url && url !== "#" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//"))) {
    return url;
  }

  const authorName = contact.author || contact.name || url || "";
  if (!authorName) return "#";

  const platform = contact.platform?.toLowerCase() || "";
  if (platform === "facebook" || platform === "fb") {
    return `https://www.facebook.com/search/top/?q=${encodeURIComponent(authorName.replace(/^@/, ""))}`;
  }
  if (platform === "tiktok" || platform === "tt") {
    return `https://www.tiktok.com/search?q=${encodeURIComponent(authorName)}`;
  }
  if (platform === "youtube" || platform === "yt") {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(authorName)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(authorName)}`;
}

// ── Trend Modal Component ──
interface TrendModalProps {
  alert: any;
  onClose: () => void;
}

function TrendModal({ alert, onClose }: TrendModalProps) {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const scopedBrandKey = getScopedBrandKey(profile);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { setFilters: setDashboardFilters, workspaces } = useDashboardStore();

  const brandName = formatBrandName(alert.brand);
  const topicName = t(`dashboard.topics.${alert.topic.toLowerCase()}`, { defaultValue: alert.topic });
  const [loading, setLoading] = useState(true);

  // Generate mock fallback trend data showing a crisis spike on the last day
  const generateTrendData = () => {
    const dates = [];
    const values = [];
    const endDate = new Date();

    // We generate 7 days of data
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      dates.push(
        d.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
          day: "2-digit",
          month: "2-digit",
        })
      );

      if (i === 0) {
        // Today - Crisis Spike!
        const multiplier = alert.severity === "critical" ? 8 : alert.severity === "high" ? 5 : 3;
        values.push(Math.floor(Math.random() * 10) + 15 * multiplier);
      } else if (i === 1) {
        // Yesterday - rising
        values.push(Math.floor(Math.random() * 8) + 12);
      } else {
        // Normal days
        values.push(Math.floor(Math.random() * 5) + 3);
      }
    }

    return { dates, values };
  };

  useEffect(() => {
    let active = true;

    async function loadTrendAndDraw() {
      let dates: string[] = [];
      let values: number[] = [];

      try {
        // 1. Fetch from Supabase.
        const fetched = useAlertStore.getState().rawAlerts;

        if (active) {
          // 2. Parse and filter docs in-memory
          const rawDocs = fetched.map(alertItem => {
            return {
              brand: alertItem.brand,
              sentiment: alertItem.sentiment,
              topic: alertItem.topic,
              date: new Date(alertItem.created_at)
            };
          }).filter((doc) => isRecordInBrandScope({ brand: doc.brand }, scopedBrandKey));

          const targetBrand = alert.brand.toLowerCase().trim();
          const targetTopic = alert.topic.toLowerCase().trim();
          const normalizeBrandForTrend = (brand: string) => {
            const normalized = brand.toLowerCase().replace(/[\s\-_.]/g, "").trim();
            if (normalized.includes("highland")) return "highlandcoffee";
            if (normalized.includes("starbuck")) return "starbucks";
            if (normalized.includes("mixue")) return "mixue";
            return normalized;
          };
          const targetBrandKey = normalizeBrandForTrend(targetBrand);

          const matches = rawDocs.filter(d => {
            const brandMatch = normalizeBrandForTrend(d.brand) === targetBrandKey;
            const topicMatch = d.topic.toLowerCase() === targetTopic;
            const sentimentMatch = d.sentiment.toLowerCase() === "negative";
            return brandMatch && topicMatch && sentimentMatch;
          });

          // 3. Aggregate by day for last 7 days
          const endDate = new Date();
          for (let i = 6; i >= 0; i--) {
            const dayDate = new Date(endDate);
            dayDate.setDate(dayDate.getDate() - i);
            const dateStr = dayDate.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
              day: "2-digit",
              month: "2-digit",
            });
            dates.push(dateStr);

            const countOnDay = matches.filter(d => {
              return d.date.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
                day: "2-digit",
                month: "2-digit",
              }) === dateStr;
            }).length;

            values.push(countOnDay);
          }
        }
      } catch (err) {
        console.error("Supabase aggregation failed, falling back:", err);
        const mock = generateTrendData();
        dates = mock.dates;
        values = mock.values;
      }

      if (!active) return;
      setLoading(false);

      // Draw Chart
      ChartJS.register(
        CategoryScale,
        LinearScale,
        LineController,
        PointElement,
        LineElement,
        ChartTitle,
        ChartTooltip,
        ChartLegend,
        ChartFiller
      );
      ChartJS.defaults.font.family = 'Inter, "Segoe UI", Arial, sans-serif';

      if (!canvasRef.current) return;

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      let lineColor = "#4648d4";
      let bgColor = "rgba(70, 72, 212, 0.1)";
      if (alert.severity === "critical" || alert.severity === "high") {
        lineColor = "#ba1a1a";
        bgColor = "rgba(186, 26, 26, 0.1)";
      }

      chartRef.current = new ChartJS(ctx, {
        type: "line",
        data: {
          labels: dates,
          datasets: [
            {
              label: t("alerts.modal.chartLabel"),
              data: values,
              borderColor: lineColor,
              backgroundColor: bgColor,
              tension: 0.35,
              fill: true,
              borderWidth: 3,
              pointBackgroundColor: lineColor,
              pointHoverRadius: 6,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              padding: 10,
              cornerRadius: 8,
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(0, 0, 0, 0.05)",
              },
              ticks: {
                stepSize: 5,
              }
            },
            x: {
              grid: {
                display: false,
              }
            }
          }
        }
      });
    }

    loadTrendAndDraw();

    return () => {
      active = false;
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [alert]);

  const handleNavigateToMentions = () => {
    const brandId = normalizeBrandId(alert.brand);
    setDashboardFilters({
      workspace_id: brandId,
      topic: alert.topic as any,
      sentiment: "negative"
    });

    onClose();
    router.push(isDemoPath(pathname) ? toDemoHref("/mentions") || "/demo/mentions" : "/mentions");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="glass-card w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative z-10 border border-app/30 flex flex-col max-h-[90vh] bg-app-surface">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-app/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-app-brand text-xl">trending_up</span>
            <h3 className="font-bold text-app text-base md:text-lg">{t("alerts.modal.trendTitle")}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-text-secondary hover:bg-app-surface-raised transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-app-surface-raised text-app px-2.5 py-1 rounded-lg font-bold">
              {t("alerts.modal.brand")}: {brandName}
            </span>
            <span className="bg-app-surface-raised text-app px-2.5 py-1 rounded-lg font-bold">
              {t("alerts.modal.topic")}: {topicName}
            </span>
            <span className="bg-app-surface-raised text-app px-2.5 py-1 rounded-lg font-bold uppercase">
              {t("alerts.modal.source")}: {t(`dashboard.filters.${alert.source.toLowerCase()}`, { defaultValue: alert.source })}
            </span>
          </div>

          <p className="text-xs md:text-sm text-app-text-secondary font-medium">
            {t("alerts.modal.desc")}
          </p>

          {/* Chart Container */}
          <div className="h-64 md:h-72 w-full relative flex items-center justify-center">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-app-surface/50 z-10">
                <svg className="animate-spin h-8 w-8 text-app-brand" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            )}
            <canvas ref={canvasRef}></canvas>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-app/30 flex justify-end gap-2 bg-app-surface-raised/20">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-app-text-secondary bg-app-surface-raised hover:bg-app-surface-high transition-all active:scale-95 cursor-pointer"
          >
            {t("alerts.modal.close")}
          </button>
          <button
            onClick={handleNavigateToMentions}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-app-brand text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">search</span>
            {t("alerts.modal.discover")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Incident Report Modal Component ──
interface IncidentReportModalProps {
  item: any;
  onClose: () => void;
  triggerToast: (msg: string) => void;
}

function IncidentReportModal({ item, onClose, triggerToast }: IncidentReportModalProps) {
  const { t } = useTranslation();
  const [impactAssessment, setImpactAssessment] = useState(
    t("alerts.report.impactPlaceholder", {
      defaultValue: `Sự việc liên quan đến ${formatBrandName(item.brand)} trên nguồn ${item.source || item.platform} đang thu hút phản hồi tiêu cực từ dư luận. Nguy cơ gây tổn hại uy tín thương hiệu trung/dài hạn nếu không được giải quyết ngay.`
    })
  );

  const [sopActions, setSopActions] = useState(
    t("alerts.report.sopPlaceholder", {
      defaultValue: `1. Tiếp cận trực tiếp chủ sở hữu bài đăng để đối thoại giải quyết mâu thuẫn.\n2. Báo cáo Ban Giám đốc tình hình diễn biến và kịch bản ứng phó.\n3. Rà soát chất lượng vận hành nội bộ tại điểm chạm phát sinh sự cố.`
    })
  );

  const [status, setStatus] = useState("pending");

  const brandName = formatBrandName(item.brand);
  const sourceName = (item.source || item.platform || "unknown").toUpperCase();
  const severityText = (item.severity || "high").toUpperCase();
  const dateStr = new Date(item.created_at || Date.now()).toLocaleString("vi-VN");

  const handleExport = () => {
    const reportData = {
      title: `Báo cáo Sự cố Khẩn cấp - ${brandName} - ${sourceName}`,
      brand: brandName,
      source: sourceName,
      severity: severityText,
      created_at: dateStr,
      reporter: item.author || t("alerts.page.anonymous"),
      description: item.text || item.content || "",
      impact_assessment: impactAssessment,
      recommended_sop_actions: sopActions,
      status: status,
      generated_at: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Incident_Report_${brandName.replace(/\s+/g, "_")}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSend = () => {
    triggerToast(t("alerts.report.saveSuccess"));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="glass-card w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative z-10 border border-app/30 flex flex-col max-h-[90vh] bg-app-surface">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-app/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-error)] text-xl">description</span>
            <h3 className="font-bold text-app text-base md:text-lg">
              {t("alerts.report.modalTitle")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-text-secondary hover:bg-app-surface-raised transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4 overflow-y-auto">

          {/* Metadata Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[var(--color-bg-surface-raised)]/30 p-4 rounded-xl border border-[var(--color-border)]">
            <div>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">{t("alerts.report.brand")}</p>
              <p className="text-xs font-black text-[var(--color-text-primary)]">{brandName}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">{t("alerts.report.source")}</p>
              <p className="text-xs font-black text-[var(--color-text-primary)]">{sourceName}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">{t("alerts.report.severity")}</p>
              <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${severityText === "CRITICAL" ? "bg-[var(--color-error)] text-white" : "bg-[var(--color-warning)] text-white"
                }`}>
                {severityText}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">{t("alerts.report.author")}</p>
              <p className="text-xs font-bold text-[var(--color-text-primary)]">@{item.author || t("alerts.page.anonymous")}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">{t("alerts.report.time")}</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)]">{dateStr}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text-primary)]">{t("alerts.report.desc")}</label>
            <div className="p-3 bg-[var(--color-bg-surface-raised)] rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] italic">
              “{item.text || item.content}”
            </div>
          </div>

          {/* Impact Assessment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[var(--color-error)]">insights</span>
              {t("alerts.report.impactLabel")}
            </label>
            <textarea
              rows={3}
              value={impactAssessment}
              onChange={(e) => setImpactAssessment(e.target.value)}
              className="w-full bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 text-[var(--color-text-primary)]"
            />
          </div>

          {/* Recommended SOP Actions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[var(--color-brand)]">task_alt</span>
              {t("alerts.report.sopLabel")}
            </label>
            <textarea
              rows={3}
              value={sopActions}
              onChange={(e) => setSopActions(e.target.value)}
              className="w-full bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 text-[var(--color-text-primary)]"
            />
          </div>

          {/* Status Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-primary)]">{t("alerts.report.statusLabel")}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full select-app border border-[var(--color-border)] rounded-xl text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 font-medium"
            >
              <option value="draft" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                {t("alerts.report.statusDraft")}
              </option>
              <option value="pending" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                {t("alerts.report.statusPending")}
              </option>
              <option value="sent" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                {t("alerts.report.statusSent")}
              </option>
            </select>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-app/30 flex justify-between items-center bg-app-surface-raised/20">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--color-brand)]/30 text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] active:scale-95 transition-all flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            {t("alerts.report.exportBtn")}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-app-text-secondary bg-app-surface-raised hover:bg-app-surface-high transition-all cursor-pointer"
            >
              {t("alerts.report.close")}
            </button>
            <button
              onClick={handleSend}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] active:scale-95 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">send</span>
              {t("alerts.report.sendBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

