/**
 * US-13: Dashboard Store
 * Zustand store quản lý state dashboard với filter thật (workspace, time, platform)
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { normalizeBrandName } from "@/lib/services/dashboard";
import type {
  DashboardStats,
  DashboardFilters,
  Mention,
  Alert,
  Lead,
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
  setWorkspaces: (workspaces: Workspace[]) => void;
  setTopSources: (sources: TopSource[]) => void;
  setTopTopics: (topics: TopTopic[]) => void;
  setTrendData: (trend: SentimentTrendPoint[]) => void;

  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // ── Computed (client-side filtering) ─────────────────────────────────────
  getFilteredMentions: () => Mention[];
  getFilteredAlerts: () => Alert[];
  getFilteredLeads: () => Lead[];
}

const defaultFilters: DashboardFilters = {
  workspace_id: "all",
  time_range: "7d",
  platform: "all",
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

    // ── Client-side filtered views ──────────────────────────────────────────────
    getFilteredMentions: () => {
      const { mentions, filters } = get();
      const cutoff = getCutoffMs(filters.time_range);
      // Chuẩn hoá workspace filter để so sánh không phân biệt hoa thường và ký tự đặc biệt
      const normFilter = filters.workspace_id !== "all"
        ? normalizeBrandName(filters.workspace_id)
        : null;
      return mentions.filter((m) => {
        if (normFilter && normalizeBrandName(m.workspace_id) !== normFilter) return false;
        if (filters.platform !== "all" && m.platform !== filters.platform) return false;
        if (cutoff !== null && new Date(m.posted_at).getTime() < cutoff) return false;
        return true;
      });
    },

    getFilteredAlerts: () => {
      const { alerts, filters } = get();
      const cutoff = getCutoffMs(filters.time_range);
      const normFilter = filters.workspace_id !== "all"
        ? normalizeBrandName(filters.workspace_id)
        : null;
      return alerts.filter((a) => {
        if (normFilter && normalizeBrandName(a.workspace_id) !== normFilter) return false;
        if (cutoff !== null && new Date(a.created_at).getTime() < cutoff) return false;
        return true;
      });
    },

    getFilteredLeads: () => {
      const { leads, filters } = get();
      const cutoff = getCutoffMs(filters.time_range);
      const normFilter = filters.workspace_id !== "all"
        ? normalizeBrandName(filters.workspace_id)
        : null;
      return leads.filter((l) => {
        if (normFilter && normalizeBrandName(l.workspace_id) !== normFilter) return false;
        if (filters.platform !== "all" && l.platform !== filters.platform) return false;
        if (cutoff !== null && new Date(l.created_at).getTime() < cutoff) return false;
        return true;
      });
    },
  })),
);
