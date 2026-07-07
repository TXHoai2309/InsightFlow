/**
 * US-13: Dashboard Store
 * Zustand store quản lý state dashboard với filter thật (workspace, time, platform)
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { normalizeBrandName, DashboardService } from "@/lib/services/dashboard";
import { canPerformAction, type UserRoleProfile } from "@/lib/rbac";
import { isSameBrandScope } from "@/lib/brandScope";
import type {
  DashboardStats,
  DashboardFilters,
  Mention,
  Alert,
  Lead,
  LabelChangeRequest,
  Workspace,
  TopSource,
  TopTopic,
  SentimentTrendPoint,
} from "@/types/dashboard";

interface DashboardState {
  // ── Raw data từ Firestore ─────────────────────────────────────────────────
  stats: DashboardStats;
  mentions: Mention[];
  alerts: Alert[];
  leads: Lead[];
  labelChangeRequests: LabelChangeRequest[];
  workspaces: Workspace[];
  topSources: TopSource[];
  topTopics: TopTopic[];
  trendData: SentimentTrendPoint[];

  // ── Filter state ──────────────────────────────────────────────────────────
  filters: DashboardFilters;

  // ── UI State ──────────────────────────────────────────────────────────────
  isLoading: boolean;
  error: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  setStats: (stats: DashboardStats) => void;
  setMentions: (mentions: Mention[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setLeads: (leads: Lead[]) => void;
  setLabelChangeRequests: (requests: LabelChangeRequest[]) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setTopSources: (sources: TopSource[]) => void;
  setTopTopics: (topics: TopTopic[]) => void;
  setTrendData: (trend: SentimentTrendPoint[]) => void;

  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  updateLeadStatus: (
    id: string,
    status: Lead["status"],
    profile: UserRoleProfile | null | undefined,
  ) => Promise<void>;
  updateLeadDetails: (
    id: string,
    data: Partial<Lead>,
    profile: UserRoleProfile | null | undefined,
  ) => Promise<void>;
  createLabelChangeRequest: (
    data: Omit<
      LabelChangeRequest,
      | "id"
      | "status"
      | "requested_by"
      | "requested_by_name"
      | "requested_by_role"
      | "requested_at"
    >,
    profile: UserRoleProfile | null | undefined,
  ) => Promise<LabelChangeRequest>;
  updateLabelChangeRequest: (
    requestId: string,
    data: Pick<
      LabelChangeRequest,
      | "requested_labels"
      | "changed_fields"
      | "requested_queue"
      | "reason_code"
      | "reason_note"
      | "evidence_checked"
    >,
    profile: UserRoleProfile | null | undefined,
  ) => Promise<LabelChangeRequest>;
  cancelLabelChangeRequest: (
    requestId: string,
    cancelReason: string,
    profile: UserRoleProfile | null | undefined,
  ) => Promise<LabelChangeRequest>;

  // ── Computed (client-side filtering) ─────────────────────────────────────
  getFilteredMentions: () => Mention[];
  getFilteredAlerts: () => Alert[];
  getFilteredLeads: () => Lead[];
  getFilteredLeadsWithoutUrgency: () => Lead[];
}

const defaultFilters: DashboardFilters = {
  workspace_id: "all",
  time_range: "all",
  platform: "all",
  sentiment: "all",
  topic: "all",
  urgency: "pending",
};

/** Tính timestamp cutoff từ time_range */
function getCutoffMs(timeRange: DashboardFilters["time_range"]): number | null {
  if (timeRange === "all") return null;
  const ms = { "24h": 1, "7d": 7, "30d": 30 };
  return Date.now() - ms[timeRange] * 24 * 60 * 60 * 1000;
}

export const useDashboardStore = create<DashboardState>()(
  subscribeWithSelector((set, get) => ({
    // ── Initial state ───────────────────────────────────────────────────────
    stats: {
      total_mentions: 0,
      positive_count: 0,
      negative_count: 0,
      neutral_count: 0,
      net_sentiment: 0,
      hot_leads_today: 0,
      alerts_today: 0,
      trending_spike: 0,
    },
    mentions: [],
    alerts: [],
    leads: [],
    labelChangeRequests: [],
    workspaces: [],
    topSources: [],
    topTopics: [],
    trendData: [],
    filters: defaultFilters,
    isLoading: false,
    error: null,

    // ── Setters ─────────────────────────────────────────────────────────────
    setStats: (stats) => set({ stats }),
    setMentions: (mentions) => set({ mentions }),
    setAlerts: (alerts) => set({ alerts }),
    setLeads: (leads) => set({ leads }),
    setLabelChangeRequests: (labelChangeRequests) =>
      set({ labelChangeRequests }),
    setWorkspaces: (workspaces) => set({ workspaces }),
    setTopSources: (sources) => set({ topSources: sources }),
    setTopTopics: (topics) => set({ topTopics: topics }),
    setTrendData: (trendData) => set({ trendData }),

    setFilters: (newFilters) =>
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
      })),

    resetFilters: () => set({ filters: defaultFilters }),

    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    updateLeadStatus: async (id, status, profile) => {
      try {
        const currentLead = get().leads.find((lead) => lead.id === id);
        if (!canPerformAction(profile, "update_lead_status")) {
          throw new Error("User is not allowed to update lead status.");
        }
        if (!currentLead || !isSameBrandScope(profile, currentLead)) {
          throw new Error("Lead is outside the user's brand scope.");
        }

        await DashboardService.updateLeadStatus(id, status, profile);
        set((state) => ({
          leads: state.leads.map((l) => (l.id === id ? { ...l, status } : l)),
        }));
      } catch (error) {
        console.error("[DashboardStore] updateLeadStatus error:", error);
        throw error;
      }
    },

    updateLeadDetails: async (id, data, profile) => {
      try {
        const currentLead = get().leads.find((lead) => lead.id === id);
        if (!canPerformAction(profile, "update_lead_details")) {
          throw new Error("User is not allowed to update lead details.");
        }
        if (data.status && !canPerformAction(profile, "update_lead_status")) {
          throw new Error("User is not allowed to update lead status.");
        }
        if (!currentLead || !isSameBrandScope(profile, currentLead)) {
          throw new Error("Lead is outside the user's brand scope.");
        }

        await DashboardService.updateLeadDetails(id, data, profile);
        set((state) => ({
          leads: state.leads.map((l) => (l.id === id ? { ...l, ...data } : l)),
        }));
      } catch (error) {
        console.error("[DashboardStore] updateLeadDetails error:", error);
        throw error;
      }
    },

    // ── Client-side filtered views ──────────────────────────────────────────────
    createLabelChangeRequest: async (data, profile) => {
      try {
        const currentLead = get().leads.find((lead) => lead.id === data.lead_id);
        if (!canPerformAction(profile, "create_label_request")) {
          throw new Error("User is not allowed to create label change requests.");
        }
        if (!currentLead || !isSameBrandScope(profile, currentLead)) {
          throw new Error("Lead is outside the user's brand scope.");
        }

        const hasPendingRequest = get().labelChangeRequests.some(
          (request) =>
            request.status === "pending" &&
            (request.lead_id === data.lead_id ||
              request.source_id === data.source_id ||
              request.mention_id === data.mention_id),
        );
        if (hasPendingRequest) {
          throw new Error("Lead already has a pending label change request.");
        }

        const request = await DashboardService.createLabelChangeRequest(
          data,
          profile,
        );

        set((state) => ({
          labelChangeRequests: [request, ...state.labelChangeRequests],
          leads: state.leads.map((lead) =>
            lead.id === data.lead_id
              ? {
                  ...lead,
                  label_correction_status: "pending",
                  pending_label_request_id: request.id,
                }
              : lead,
          ),
        }));

        return request;
      } catch (error) {
        console.error("[DashboardStore] createLabelChangeRequest error:", error);
        throw error;
      }
    },

    updateLabelChangeRequest: async (requestId, data, profile) => {
      try {
        const currentRequest = get().labelChangeRequests.find(
          (request) => request.id === requestId,
        );
        if (!canPerformAction(profile, "create_label_request")) {
          throw new Error("User is not allowed to update label change requests.");
        }
        if (!currentRequest || !isSameBrandScope(profile, currentRequest)) {
          throw new Error("Label request is outside the user's brand scope.");
        }
        if (currentRequest.status !== "pending") {
          throw new Error("Only pending label change requests can be updated.");
        }
        if (currentRequest.requested_by !== profile?.uid) {
          throw new Error("Only the requester can update this label change request.");
        }

        const updatedRequest = await DashboardService.updateLabelChangeRequest(
          currentRequest,
          data,
          profile,
        );

        set((state) => ({
          labelChangeRequests: state.labelChangeRequests.map((request) =>
            request.id === requestId ? updatedRequest : request,
          ),
        }));

        return updatedRequest;
      } catch (error) {
        console.error("[DashboardStore] updateLabelChangeRequest error:", error);
        throw error;
      }
    },

    cancelLabelChangeRequest: async (requestId, cancelReason, profile) => {
      try {
        const currentRequest = get().labelChangeRequests.find(
          (request) => request.id === requestId,
        );
        if (!canPerformAction(profile, "create_label_request")) {
          throw new Error("User is not allowed to cancel label change requests.");
        }
        if (!currentRequest || !isSameBrandScope(profile, currentRequest)) {
          throw new Error("Label request is outside the user's brand scope.");
        }
        if (currentRequest.status !== "pending") {
          throw new Error("Only pending label change requests can be cancelled.");
        }
        if (currentRequest.requested_by !== profile?.uid) {
          throw new Error("Only the requester can cancel this label change request.");
        }

        const cancelledRequest = await DashboardService.cancelLabelChangeRequest(
          currentRequest,
          cancelReason,
          profile,
        );

        set((state) => ({
          labelChangeRequests: state.labelChangeRequests.map((request) =>
            request.id === requestId ? cancelledRequest : request,
          ),
          leads: state.leads.map((lead) =>
            lead.id === currentRequest.lead_id ||
            lead.id === currentRequest.source_id ||
            lead.pending_label_request_id === currentRequest.id
              ? {
                  ...lead,
                  label_correction_status: "none",
                  pending_label_request_id: undefined,
                }
              : lead,
          ),
        }));

        return cancelledRequest;
      } catch (error) {
        console.error("[DashboardStore] cancelLabelChangeRequest error:", error);
        throw error;
      }
    },

    getFilteredMentions: () => {
      const { mentions, filters } = get();
      const cutoff = getCutoffMs(filters.time_range);
      
      // Normalize workspace filter for case-insensitive matching
      const normFilter =
        filters.workspace_id !== "all"
          ? normalizeBrandName(filters.workspace_id)
          : null;

      return mentions.filter((m) => {
        // 1. Filter by Brand (Workspace)
        if (normFilter && normalizeBrandName(m.workspace_id) !== normFilter)
          return false;
        
        // 2. Filter by Platform
        if (filters.platform !== "all" && m.platform !== filters.platform)
          return false;
          
        // 3. Filter by Sentiment
        if (filters.sentiment !== "all" && m.sentiment !== filters.sentiment)
          return false;
          
        // 4. Filter by Topic
        if (filters.topic && filters.topic !== "all" && m.topic !== filters.topic)
          return false;
          
        // 5. Filter by Time Range
        if (cutoff !== null) {
          const time = new Date(m.posted_at).getTime();
          // Invalid, old, and future timestamps do not belong in a bounded range.
          if (!Number.isFinite(time) || time < cutoff || time > Date.now()) return false;
        }

        return true;
      });
    },

    getFilteredAlerts: () => {
      const { alerts, filters } = get();
      const cutoff = getCutoffMs(filters.time_range);
      const normFilter =
        filters.workspace_id !== "all"
          ? normalizeBrandName(filters.workspace_id)
          : null;
      return alerts.filter((a) => {
        if (normFilter && normalizeBrandName(a.workspace_id) !== normFilter)
          return false;
        if (cutoff !== null) {
          const time = new Date(a.created_at).getTime();
          if (time < cutoff || time > Date.now()) return false;
        }
        return true;
      });
    },

    getFilteredLeadsWithoutUrgency: () => {
      const { leads, filters } = get();
      const normFilter =
        filters.workspace_id !== "all"
          ? normalizeBrandName(filters.workspace_id)
          : null;
      const cutoff = getCutoffMs(filters.time_range);

      return leads.filter((l) => {
        if (normFilter && normalizeBrandName(l.workspace_id) !== normFilter)
          return false;
        if (filters.platform !== "all" && l.platform !== filters.platform)
          return false;
        if (cutoff !== null) {
          const time = new Date(l.created_at).getTime();
          if (time < cutoff || time > Date.now()) return false;
        }
        return true;
      });
    },

    getFilteredLeads: () => {
      const { leads, filters } = get();
      const normFilter =
        filters.workspace_id !== "all"
          ? normalizeBrandName(filters.workspace_id)
          : null;

      // 1. Basic brand, platform and time range filters
      let result = leads.filter((l) => {
        if (normFilter && normalizeBrandName(l.workspace_id) !== normFilter)
          return false;
        if (filters.platform !== "all" && l.platform !== filters.platform)
          return false;

        const cutoff = getCutoffMs(filters.time_range);
        if (cutoff !== null) {
          const time = new Date(l.created_at).getTime();
          if (time < cutoff || time > Date.now()) return false;
        }

        return true;
      });

      // 2. Urgency and status filters
      const nowMs = Date.now();
      const getExpiryTime = (lead: Lead) => {
        if (lead.expiry_at) return new Date(lead.expiry_at).getTime();
        const durationMin =
          lead.intent === "hot"
            ? 30
            : lead.intent === "warm"
              ? 24 * 60
              : 7 * 24 * 60;
        return new Date(lead.created_at).getTime() + durationMin * 60 * 1000;
      };

      const urgency = filters.urgency || "pending";
      if (urgency !== "all") {
        result = result.filter((l) => {
          const isPending = l.status === "new" || l.status === "processing";
          const expiryTime = getExpiryTime(l);
          const isExpired = expiryTime <= nowMs;

          if (urgency === "pending") {
            return isPending;
          }
          if (urgency === "urgent") {
            if (!isPending || isExpired) return false;
            const remainingMs = expiryTime - nowMs;
            if (l.intent === "hot") {
              return remainingMs > 0 && remainingMs < 10 * 60 * 1000; // < 10 mins
            }
            if (l.intent === "warm") {
              return remainingMs > 0 && remainingMs < 2 * 60 * 60 * 1000; // < 2 hours
            }
            return false;
          }
          if (urgency === "overdue") {
            return isPending && isExpired;
          }
          if (urgency === "handled") {
            return l.status === "completed" || l.status === "skipped";
          }
          return true;
        });
      }

      // 3. Priority Sorting:
      // Group 1: Pending (new/processing) and not expired, sorted by remaining time ascending (closest to expiry first)
      // Group 2: Pending (new/processing) and expired, sorted by creation date descending (newest first)
      // Group 3: Handled (completed/skipped), sorted by creation date descending
      return [...result].sort((a, b) => {
        const aPending = a.status === "new" || a.status === "processing";
        const bPending = b.status === "new" || b.status === "processing";

        const aExpiry = getExpiryTime(a);
        const bExpiry = getExpiryTime(b);
        const aExpired = aExpiry <= nowMs;
        const bExpired = bExpiry <= nowMs;

        if (aPending && !aExpired && (!bPending || bExpired)) return -1;
        if (bPending && !bExpired && (!aPending || aExpired)) return 1;

        if (aPending && !aExpired && bPending && !bExpired) {
          return aExpiry - bExpiry; // closest expiry first
        }

        if (aPending && aExpired && bPending && bExpired) {
          return bExpiry - aExpiry; // expired newest first
        }

        if (aPending && aExpired && !bPending) return -1;
        if (bPending && bExpired && !aPending) return 1;

        // Both are handled, sort by creation date descending
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    },
  })),
);
