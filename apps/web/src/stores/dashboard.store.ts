/**
 * US-13: Dashboard Store
 * Zustand store để quản lý state dashboard
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  DashboardStats,
  DashboardFilters,
  Mention,
  Alert,
  Lead,
  Workspace,
  TopSource,
  TopTopic,
} from "@/types/dashboard";

interface DashboardState {
  // Data
  stats: DashboardStats;
  mentions: Mention[];
  alerts: Alert[];
  leads: Lead[];
  workspaces: Workspace[];
  topSources: TopSource[];
  topTopics: TopTopic[];

  // Filters
  filters: DashboardFilters;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  setStats: (stats: DashboardStats) => void;
  setMentions: (mentions: Mention[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setLeads: (leads: Lead[]) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setTopSources: (sources: TopSource[]) => void;
  setTopTopics: (topics: TopTopic[]) => void;

  // Filter actions
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;

  // Loading & Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getFilteredMentions: () => Mention[];
  getFilteredAlerts: () => Alert[];
  getFilteredLeads: () => Lead[];
}

const defaultFilters: DashboardFilters = {
  workspace_id: "all",
  time_range: "7d",
  platform: "all",
  sentiment: "all",
};

export const useDashboardStore = create<DashboardState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
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
    filters: defaultFilters,
    isLoading: false,
    error: null,

    // Setters
    setStats: (stats) => set({ stats }),
    setMentions: (mentions) => set({ mentions }),
    setAlerts: (alerts) => set({ alerts }),
    setLeads: (leads) => set({ leads }),
    setWorkspaces: (workspaces) => set({ workspaces }),
    setTopSources: (sources) => set({ topSources: sources }),
    setTopTopics: (topics) => set({ topTopics: topics }),

    setFilters: (newFilters) =>
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
      })),

    resetFilters: () => set({ filters: defaultFilters }),

    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    // Computed
    getFilteredMentions: () => {
      const state = get();
      let filtered = state.mentions;

      // Filter by workspace
      if (state.filters.workspace_id !== "all") {
        filtered = filtered.filter(
          (m) => m.workspace_id === state.filters.workspace_id,
        );
      }

      // Filter by platform
      if (state.filters.platform !== "all") {
        filtered = filtered.filter(
          (m) => m.platform === state.filters.platform,
        );
      }

      // Filter by sentiment
      if (state.filters.sentiment !== "all") {
        filtered = filtered.filter(
          (m) => m.sentiment === state.filters.sentiment,
        );
      }

      return filtered;
    },

    getFilteredAlerts: () => {
      const state = get();
      let filtered = state.alerts;

      if (state.filters.workspace_id !== "all") {
        filtered = filtered.filter(
          (a) => a.workspace_id === state.filters.workspace_id,
        );
      }

      return filtered;
    },

    getFilteredLeads: () => {
      const state = get();
      let filtered = state.leads;

      if (state.filters.workspace_id !== "all") {
        filtered = filtered.filter(
          (l) => l.workspace_id === state.filters.workspace_id,
        );
      }

      return filtered;
    },
  })),
);
