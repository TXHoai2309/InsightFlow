/**
 * useDashboard Hook
 * Fetch dữ liệu nghiệp vụ từ Supabase, tính aggregations, nạp vào Zustand store
 */

"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import {
  dummyAlerts,
  dummyLabelChangeRequests,
  dummyLeads,
  dummyMentions,
  dummyWorkspaces,
} from "@/lib/demoData";
import { DashboardService } from "@/lib/services/dashboard";
import { filterByBusinessPolicy, getScopedBrandKey } from "@/lib/brandScope";
import { useAuth } from "@/hooks/useAuth";
import { supabaseClient } from "@/lib/supabaseClient";
import { useAlertStore } from "@/stores/alert.store";
import { canLeadBeVisibleToUser } from "@/lib/lead-workbench";
import { canPerformAction } from "@/lib/rbac";
import type { Lead } from "@/types/dashboard";
import { setActiveLeadRealtimeChannel } from "@/lib/realtimeLeads";

interface UseDashboardOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

const DASHBOARD_CACHE_PREFIX = "insightflow_dashboard_cache_";
const DASHBOARD_CACHE_VERSION = "v6";
const DASHBOARD_CACHE_LIMITS = {
  mentions: 150,
  alerts: 150,
  leads: 500,
  labelChangeRequests: 100,
};

// A tab transition can leave the previous request in flight while the next
// page mounts. Keep a monotonically increasing generation per browser session
// so a slower, older response can never overwrite the newest snapshot.
const latestFetchGeneration = new Map<string, number>();
let fetchGenerationCounter = 0;
const activeDashboardFetches = new Set<string>();
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function getVietnamTodayRange(nowMs = Date.now()) {
  const vietnamTime = new Date(nowMs + VIETNAM_OFFSET_MS);
  const startMs = Date.UTC(
    vietnamTime.getUTCFullYear(),
    vietnamTime.getUTCMonth(),
    vietnamTime.getUTCDate(),
  ) - VIETNAM_OFFSET_MS;

  return {
    postedFrom: new Date(startMs).toISOString(),
    postedBefore: new Date(startMs + 24 * 60 * 60 * 1000).toISOString(),
  };
}

function mergeRealtimeLead(lead: Lead, updated: Partial<Lead>): Lead {
  return {
    ...lead,
    status: updated.status ?? lead.status,
    owner_id: updated.owner_id ?? undefined,
    owner_name: updated.owner_name ?? undefined,
    owner_email: updated.owner_email ?? undefined,
    assigned_at: updated.assigned_at ?? undefined,
    assigned_by: updated.assigned_by ?? undefined,
    claimed_at: updated.claimed_at ?? undefined,
    first_contacted_at: updated.first_contacted_at ?? undefined,
    contact_attempts: updated.contact_attempts ?? lead.contact_attempts,
    last_contact_at: updated.last_contact_at ?? undefined,
    pending_result: updated.pending_result ?? lead.pending_result,
    last_action_at: updated.last_action_at ?? undefined,
    last_action_type: updated.last_action_type ?? undefined,
    last_contact_channel: updated.last_contact_channel ?? undefined,
    result_type: updated.result_type ?? null,
    result_recorded_at: updated.result_recorded_at ?? null,
    follow_up_at: updated.follow_up_at ?? null,
    closed_at: updated.closed_at ?? null,
    updated_at: updated.updated_at ?? lead.updated_at,
    expiry_at: updated.expiry_at ?? lead.expiry_at,
    notes: updated.notes ?? lead.notes,
    sales_status: updated.sales_status ?? lead.sales_status,
    sales_owner_id: updated.sales_owner_id ?? lead.sales_owner_id,
    sales_owner_name: updated.sales_owner_name ?? lead.sales_owner_name,
    sales_transferred_at: updated.sales_transferred_at ?? lead.sales_transferred_at,
    crm_deal_id: updated.crm_deal_id ?? lead.crm_deal_id,
  };
}

function isStorageQuotaError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function clearDashboardCaches(exceptKey?: string) {
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(DASHBOARD_CACHE_PREFIX) && key !== exceptKey) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

function saveDashboardCache(cacheKey: string, primaryValue: unknown, fallbackValue: unknown) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(primaryValue));
  } catch (error) {
    if (!isStorageQuotaError(error)) {
      console.warn("[useDashboard] Save cache error:", error);
      return;
    }

    // Cache is only a rendering optimization. Remove older dashboard scopes and
    // retry with a minimal snapshot instead of allowing quota failures to affect
    // the live Supabase data or Lead operations.
    clearDashboardCaches(cacheKey);
    localStorage.removeItem(cacheKey);
    try {
      localStorage.setItem(cacheKey, JSON.stringify(fallbackValue));
    } catch (retryError) {
      console.warn("[useDashboard] Minimal cache save skipped:", retryError);
    }
  }
}


export function useDashboard(options: UseDashboardOptions = {}) {
  const { autoFetch = true, refetchInterval = 1800000 } = options;
  const { profile, loading: authLoading } = useAuth();

  const {
    setStats,
    setWorkspaces,
    setTopSources,
    setTopTopics,
    setMentions,
    setAlerts,
    setLeads,
    setLabelChangeRequests,
    setTrendData,
    setLoading,
    setError,
    filters,
    lastFetchedAtMap,
    setLastFetchedAt,
  } = useDashboardStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const realtimePermissionKey = [...(profile?.permissions || [])].sort().join(",");

  const fetchDashboardData = async (force: boolean = false) => {
    const isDemoMode =
      typeof window !== "undefined" && window.location.pathname.startsWith("/demo");
    const brandKey = getScopedBrandKey(profile) || "global";
    // Scope browser cache by user as well as brand. Brand-only cache keys can
    // otherwise render another employee's assigned work after account changes
    // in the same browser.
    const profileKey = profile?.uid || profile?.role || "anonymous";
    const fetchScopeKey = `${DASHBOARD_CACHE_VERSION}:${brandKey}:${profileKey}`;
    // All dashboard pages share one Zustand store. Do not start another full
    // raw-data scan while the same scope is already loading (including when a
    // user clicks through menu items quickly).
    if (activeDashboardFetches.has(fetchScopeKey)) return;
    activeDashboardFetches.add(fetchScopeKey);
    const generation = ++fetchGenerationCounter;
    latestFetchGeneration.set(fetchScopeKey, generation);
    const cacheKey = `${DASHBOARD_CACHE_PREFIX}${DASHBOARD_CACHE_VERSION}_${brandKey}_${profileKey}`;
    try {
      let hasRenderedCache = false;

      // Check client-side localStorage cache if not forcing refresh
      if (!force && !isDemoMode && typeof window !== "undefined") {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { timestamp, data, partial } = JSON.parse(cached);
            const currentState = useDashboardStore.getState();
            const hasAuthoritativeStore =
              currentState.mentions.length > (data.mentions?.length || 0) ||
              currentState.alerts.length > (data.alerts?.length || 0) ||
              currentState.leads.length > (data.leads?.length || 0);
            setWorkspaces(data.workspaces || []);
            // A compact cache is only a preview, never an authoritative input
            // for operational counters. Keep a complete in-memory snapshot if
            // one exists; otherwise wait for the full fetch behind the loader.
            if (!partial) {
              setMentions(data.mentions || []);
              setAlerts(data.alerts || []);
              setLeads(data.leads || []);
              setLabelChangeRequests(data.labelChangeRequests || []);
            }
            setStats(data.stats);
            setTopSources(data.topSources || []);
            setTopTopics(data.topTopics || []);
            setTrendData(data.trendData || []);
            setError(null);
            hasRenderedCache = !partial || hasAuthoritativeStore;

            const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes fresh cache window
            const hasCachedMentions = data.mentions && data.mentions.length > 0;
            if (!partial && hasCachedMentions && Date.now() - timestamp < CACHE_DURATION) {
              setLastFetchedAt(fetchScopeKey, timestamp);
              setLoading(false);
              return;
            }
          } catch (cacheError) {
            console.warn("[useDashboard] Parse cache error:", cacheError);
          }
        }
      }

      // If we don't have cached data to show immediately, display the blocking loader
      if (!hasRenderedCache) {
        setLoading(true);
      }

      // 1. Fetch raw data từ Supabase (lọc theo brand nếu có)
      const rawBrandKey = brandKey === "global" ? undefined : brandKey;
      const isLeadPage =
        typeof window !== "undefined" && /^\/(?:demo\/)?leads(?:\/|$)/.test(window.location.pathname);
      const todayRange = getVietnamTodayRange();
      const previewStartMs = new Date(todayRange.postedFrom).getTime();
      const previewEndMs = new Date(todayRange.postedBefore).getTime();
      const hasTodayLeadInStore = useDashboardStore.getState().leads.some((lead) => {
        const postedAt = new Date(lead.posted_at || lead.created_at).getTime();
        return postedAt >= previewStartMs && postedAt < previewEndMs;
      });
      const needsLeadPreview =
        !isDemoMode &&
        isLeadPage &&
        !hasTodayLeadInStore;

      if (needsLeadPreview) {
        try {
          const preview = await DashboardService.fetchTodayLeadPreview({
            brandKey: rawBrandKey,
            ...todayRange,
          });
          if (latestFetchGeneration.get(fetchScopeKey) !== generation) return;

          const visiblePreview = filterByBusinessPolicy(
            preview,
            profile,
            "view_leads",
          ).filter((lead) => canLeadBeVisibleToUser(lead, profile));
          const cachedLeads = useDashboardStore.getState().leads;
          const mergedPreview = new Map(
            cachedLeads.map((lead) => [lead.id, lead] as const),
          );
          visiblePreview.forEach((lead) => mergedPreview.set(lead.id, lead));
          setLeads(Array.from(mergedPreview.values()));
          setLoading(false);
        } catch (previewError) {
          // Preview is an optimization only; the full snapshot remains the
          // authoritative fallback for older or partially migrated schemas.
          console.warn("[useDashboard] Today Lead preview skipped:", previewError);
        }
      }

      // Give the small Lead query priority so the full mentions/dashboard scan
      // cannot compete with the first useful result on a cold page visit.
      const rawDataPromise = isDemoMode
        ? {
          workspaces: dummyWorkspaces,
          mentions: dummyMentions,
          alerts: dummyAlerts,
          leads: dummyLeads,
          labelChangeRequests: dummyLabelChangeRequests,
        }
        : DashboardService.fetchRawData({ brandKey: rawBrandKey }, profile);

      const rawData = await rawDataPromise;
      // Ignore stale responses from a previous navigation/refresh.
      if (latestFetchGeneration.get(fetchScopeKey) !== generation) return;
      const workspaces = filterByBusinessPolicy(
        rawData.workspaces.map((workspace) => ({
          ...workspace,
          brand: workspace.brand_name,
        })),
        profile,
        "view_dashboard",
      );
      const mentions = filterByBusinessPolicy(rawData.mentions, profile, "view_mentions");
      const alerts = filterByBusinessPolicy(rawData.alerts, profile, "view_crisis_queue");
      const scopedLeads = filterByBusinessPolicy(rawData.leads, profile, "view_leads");
      const leads = scopedLeads.filter((lead) => canLeadBeVisibleToUser(lead, profile));

      // 2. Aggregations từ toàn bộ dữ liệu
      const stats = DashboardService.calculateStats(mentions, alerts, leads);
      const topSources = DashboardService.calculateTopSources(mentions);
      const topTopics = DashboardService.calculateTopTopics(mentions);
      const trendData = DashboardService.calculateSentimentTrend(mentions, filters.time_range);

      const labelChangeRequests = filterByBusinessPolicy(
        rawData.labelChangeRequests,
        profile,
        "view_leads",
      );

      // 3. Nạp vào Zustand store
      setWorkspaces(workspaces);
      setMentions(mentions);
      setAlerts(alerts);
      setLeads(leads);
      setLabelChangeRequests(labelChangeRequests);
      setStats(stats);
      setTopSources(topSources);
      setTopTopics(topTopics);
      setTrendData(trendData);

      // Save to localStorage cache
      if (!isDemoMode && typeof window !== "undefined") {
        const timestamp = Date.now();
        const compactData = {
          workspaces,
          mentions: mentions.slice(0, DASHBOARD_CACHE_LIMITS.mentions),
          alerts: alerts.slice(0, DASHBOARD_CACHE_LIMITS.alerts),
          leads: leads.slice(0, DASHBOARD_CACHE_LIMITS.leads),
          labelChangeRequests: labelChangeRequests.slice(0, DASHBOARD_CACHE_LIMITS.labelChangeRequests),
          stats,
          topSources,
          topTopics,
          trendData,
        };
        const partial =
          mentions.length > compactData.mentions.length ||
          alerts.length > compactData.alerts.length ||
          leads.length > compactData.leads.length ||
          labelChangeRequests.length > compactData.labelChangeRequests.length;
        saveDashboardCache(
          cacheKey,
          { timestamp, partial, data: compactData },
          {
            timestamp,
            partial: true,
            data: {
              ...compactData,
              mentions: [],
              alerts: [],
              leads: compactData.leads.slice(0, 100),
              labelChangeRequests: [],
            },
          },
        );
      }

      setLastFetchedAt(fetchScopeKey, Date.now());
      setError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể kết nối Supabase";

      console.error("[useDashboard] fetch error:", error);

      // Fallback: If DB errors, keep old data in store or load from localStorage cache
      let loadedFromCache = false;
      if (typeof window !== "undefined") {
        try {
          const currentMentions = useDashboardStore.getState().mentions;
          const hasDataInStore = currentMentions && currentMentions.length > 0;

          if (!hasDataInStore) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const { data, partial } = JSON.parse(cached);
              if (!partial) {
                setWorkspaces(data.workspaces || []);
                setMentions(data.mentions || []);
                setAlerts(data.alerts || []);
                setLeads(data.leads || []);
                setLabelChangeRequests(data.labelChangeRequests || []);
                setStats(data.stats);
                setTopSources(data.topSources || []);
                setTopTopics(data.topTopics || []);
                setTrendData(data.trendData || []);
                loadedFromCache = true;
              }
            }
          } else {
            loadedFromCache = true;
          }
        } catch (cacheError) {
          console.warn("[useDashboard] Lỗi tải cache fallback khi DB lỗi:", cacheError);
        }
      }

      if (loadedFromCache) {
        setError("Lỗi kết nối cơ sở dữ liệu. Đang hiển thị dữ liệu lưu trữ cũ.");
      } else {
        setError(message);
      }
    } finally {
      activeDashboardFetches.delete(fetchScopeKey);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoFetch || authLoading) return;

    const brandKey = getScopedBrandKey(profile) || "global";
    const profileKey = profile?.uid || profile?.role || "anonymous";
    const fetchScopeKey = `${DASHBOARD_CACHE_VERSION}:${brandKey}:${profileKey}`;
    const lastFetched = lastFetchedAtMap[fetchScopeKey] || 0;
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache window
    const isDemoMode = window.location.pathname.startsWith("/demo");

    // Only fetch if we don't have data in the Zustand store or it is older than 30 minutes
    const hasData = useDashboardStore.getState().mentions.length > 0;
    if (isDemoMode || !hasData || Date.now() - lastFetched >= CACHE_DURATION) {
      fetchDashboardData(isDemoMode);
    }

    setIsInitialized(true);

    // Prefetch alerts page data in the background when the dashboard is idle
    const prefetchTimer = setTimeout(() => {
      if (!canPerformAction(profile, "view_crisis_queue")) return;
      const alertStore = useAlertStore.getState();
      const hasAlerts = alertStore.rawAlerts.length > 0;
      const isAlertsFresh = Date.now() - alertStore.lastFetchedAt < 30 * 60 * 1000;
      if (!hasAlerts || !isAlertsFresh) {
        alertStore.fetchAlerts(brandKey === "global" ? null : brandKey, false, profile);
        const isDemoMode = window.location.pathname.startsWith("/demo");
        if (!isDemoMode) {
          alertStore.fetchCorrectionRequests(brandKey === "global" ? null : brandKey, false, profile);
        }
      }
    }, 1500);

    const interval = setInterval(() => fetchDashboardData(), refetchInterval);
    return () => {
      clearInterval(interval);
      clearTimeout(prefetchTimer);
    };
  }, [autoFetch, refetchInterval, authLoading, profile?.uid, profile?.brandId, profile?.brandName, profile?.role]);

  // Realtime subscription on leads table to sync assignee and status instantly
  useEffect(() => {
    if (!profile || authLoading || !canPerformAction(profile, "view_leads")) return;
    if (window.location.pathname.startsWith("/demo")) return;

    if (supabaseClient) {
      // Realtime can emit many UPDATE events within the same few milliseconds.
      // Applying every event separately causes a full Lead list render for each
      // row. Buffer them briefly and commit one Zustand update per burst.
      const pendingUpdates = new Map<string, Partial<Lead>>();
      let updateTimer: ReturnType<typeof setTimeout> | null = null;
      let structuralRefreshTimer: ReturnType<typeof setTimeout> | null = null;

      const flushUpdates = () => {
        updateTimer = null;
        if (pendingUpdates.size === 0) return;
        const updates = new Map(pendingUpdates);
        pendingUpdates.clear();
        const currentLeads = useDashboardStore.getState().leads;
        let changed = false;
        const nextLeads = currentLeads.map((lead) => {
          const updated = updates.get(lead.id);
          if (!updated) return lead;
          changed = true;
          return mergeRealtimeLead(lead, updated);
        });
        if (changed) setLeads(nextLeads);
      };

      const channelId = `realtime-leads-dashboard-${Math.random().toString(36).substring(2, 10)}`;
      const channel = supabaseClient
        .channel(channelId)
        .on(
          "broadcast",
          { event: "lead_assigned" },
          (event: any) => {
            const payload = event?.payload;
            if (payload?.leadId) {
              const { leadId, ...updatedFields } = payload;
              pendingUpdates.set(leadId, updatedFields);
              if (!updateTimer) updateTimer = setTimeout(flushUpdates, 50);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "leads" },
          (payload: any) => {
            if (payload.eventType === "UPDATE") {
              const updated = payload.new as Partial<Lead>;
              if (!updated.id) return;
              pendingUpdates.set(updated.id, updated);
              if (!updateTimer) updateTimer = setTimeout(flushUpdates, 50);
            } else if (payload.eventType === "INSERT") {
              const inserted = payload.new as Partial<Lead>;
              const currentLeads = useDashboardStore.getState().leads;
              const alreadyExists = Boolean(
                inserted.id && currentLeads.some((lead) => lead.id === inserted.id),
              );

              if (alreadyExists && inserted.id) {
                // Upsert operation on an existing lead - update in-place without triggering full re-fetch
                pendingUpdates.set(inserted.id, inserted);
                if (!updateTimer) updateTimer = setTimeout(flushUpdates, 50);
              } else {
                // Truly new lead - collapse structural change into one full refresh
                if (structuralRefreshTimer) clearTimeout(structuralRefreshTimer);
                structuralRefreshTimer = setTimeout(() => fetchDashboardData(true), 250);
              }
            } else if (payload.eventType === "DELETE") {
              if (structuralRefreshTimer) clearTimeout(structuralRefreshTimer);
              structuralRefreshTimer = setTimeout(() => fetchDashboardData(true), 250);
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setActiveLeadRealtimeChannel(channel);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[useDashboard] Realtime leads unavailable:", status);
            setActiveLeadRealtimeChannel(null);
          }
        });

      return () => {
        setActiveLeadRealtimeChannel(null);
        if (updateTimer) clearTimeout(updateTimer);
        if (structuralRefreshTimer) clearTimeout(structuralRefreshTimer);
        flushUpdates();
        supabaseClient?.removeChannel(channel);
      };
    }
  }, [
    authLoading,
    profile?.uid,
    profile?.role,
    profile?.brandId,
    profile?.brandName,
    realtimePermissionKey,
    setLeads,
  ]);

  // Re-tính trend data khi time_range filter thay đổi
  useEffect(() => {
    const mentions = useDashboardStore.getState().mentions;
    if (mentions.length === 0) return;
    const trend = DashboardService.calculateSentimentTrend(mentions, filters.time_range);
    setTrendData(trend);
  }, [filters.time_range]);

  return {
    isInitialized,
    refetch: (force?: boolean) => fetchDashboardData(force),
  };
}
