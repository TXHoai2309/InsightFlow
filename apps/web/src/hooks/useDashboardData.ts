/**
 * useDashboard Hook
 * Custom hook để fetch và manage dashboard data
 */

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import type {
  DashboardStats,
  Mention,
  Alert,
  Lead,
  Workspace,
  TopSource,
  TopTopic,
} from "@/types/dashboard";

// Mock data generator (có thể thay bằng API call)
const generateMockStats = (): DashboardStats => {
  const positive = Math.floor(Math.random() * 40) + 30;
  const negative = Math.floor(Math.random() * 30) + 10;
  const neutral = Math.floor(Math.random() * 40) + 20;
  const total = positive + negative + neutral;

  return {
    total_mentions: total,
    positive_count: positive,
    negative_count: negative,
    neutral_count: neutral,
    net_sentiment: Math.round(((positive - negative) / total) * 100),
    hot_leads_today: Math.floor(Math.random() * 10) + 1,
    alerts_today: Math.floor(Math.random() * 5) + 1,
    trending_spike: Math.random() * 3 + 1,
  };
};

const generateMockWorkspaces = (): Workspace[] => {
  return [
    {
      id: "ws-1",
      brand_name: "Highlands Coffee",
      scale: "large",
      keywords: ["highlands", "coffee", "café"],
      synonyms: ["highland", "cf", "highlands coffee"],
      priority: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "ws-2",
      brand_name: "Phúc Long",
      scale: "large",
      keywords: ["phúc long", "phuclong"],
      synonyms: ["phuc long tea", "trà phúc long"],
      priority: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "ws-3",
      brand_name: "KATINAT",
      scale: "medium",
      keywords: ["katinat", "katinat saigon"],
      synonyms: ["ly katinat", "katinat phan van tri"],
      priority: false,
      created_at: new Date().toISOString(),
    },
  ];
};

const generateMockTopSources = (): TopSource[] => {
  const total = Math.floor(Math.random() * 500) + 200;
  const facebook = Math.floor(total * 0.35);
  const tiktok = Math.floor(total * 0.25);
  const news = Math.floor(total * 0.25);
  const youtube = total - facebook - tiktok - news;

  return [
    {
      platform: "facebook",
      count: facebook,
      percentage: Math.round((facebook / total) * 100),
    },
    {
      platform: "tiktok",
      count: tiktok,
      percentage: Math.round((tiktok / total) * 100),
    },
    {
      platform: "news",
      count: news,
      percentage: Math.round((news / total) * 100),
    },
    {
      platform: "youtube",
      count: youtube,
      percentage: Math.round((youtube / total) * 100),
    },
  ];
};

const generateMockTopics = (): TopTopic[] => {
  const topics = ["quality", "price", "service", "staff", "delivery"];
  return topics.map((topic) => ({
    name: topic,
    count: Math.floor(Math.random() * 50) + 10,
    sentiment_breakdown: {
      positive: Math.floor(Math.random() * 20) + 5,
      negative: Math.floor(Math.random() * 15) + 2,
      neutral: Math.floor(Math.random() * 20) + 5,
    },
  }));
};

interface UseDashboardOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const { autoFetch = true, refetchInterval = 30000 } = options;

  const {
    setStats,
    setWorkspaces,
    setTopSources,
    setTopTopics,
    setLoading,
    setError,
  } = useDashboardStore();

  const [isInitialized, setIsInitialized] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API calls
      // const response = await fetch('/api/dashboard/stats');
      // const data = await response.json();

      // Mock data for now
      const stats = generateMockStats();
      const workspaces = generateMockWorkspaces();
      const topSources = generateMockTopSources();
      const topTopics = generateMockTopics();

      setStats(stats);
      setWorkspaces(workspaces);
      setTopSources(topSources);
      setTopTopics(topTopics);
      setError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard data";
      setError(message);
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoFetch) return;

    // Initial fetch
    fetchDashboardData();
    setIsInitialized(true);

    // Setup refetch interval
    const interval = setInterval(fetchDashboardData, refetchInterval);

    return () => clearInterval(interval);
  }, [autoFetch, refetchInterval]);

  return {
    isInitialized,
    refetch: fetchDashboardData,
  };
}
