"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import type { Mention, Workspace, DashboardStats } from "@/types/dashboard";
import { collection, getDocs } from "firebase/firestore";
import { secondDb } from "@/lib/firebase";

const now = () => new Date();

const generateMockWorkspaces = (): Workspace[] => [
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

const generateMockMentions = (): Mention[] => {
  const baseDate = now();
  return [
    {
      id: "m-1",
      workspace_id: "ws-1",
      platform: "facebook",
      content:
        "InsightFlow giúp tôi nắm được tình hình chiến dịch quảng cáo ngay lập tức, rất nhanh và trực quan.",
      author: "Nguyễn Thị Mai",
      sentiment: "positive",
      topic: "quality",
      credibility_score: 0.92,
      created_at: new Date(
        baseDate.getTime() - 2 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://facebook.com/post/1",
    },
    {
      id: "m-2",
      workspace_id: "ws-1",
      platform: "tiktok",
      content:
        "Video review sản phẩm tươi ngon, phục vụ nhanh chóng và chất lượng " +
        "đáng khen nhiều hơn so với dự đoán.",
      author: "TranVanA",
      sentiment: "positive",
      topic: "service",
      credibility_score: 0.85,
      created_at: new Date(
        baseDate.getTime() - 5 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://tiktok.com/video/2",
    },
    {
      id: "m-3",
      workspace_id: "ws-2",
      platform: "news",
      content:
        "Tin tức ghi nhận phản ánh khách hàng mong muốn giá cả hợp lý hơn tại chi nhánh mới.",
      author: "VnExpress",
      sentiment: "negative",
      topic: "price",
      credibility_score: 0.76,
      created_at: new Date(
        baseDate.getTime() - 11 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://vnexpress.net/article-3",
    },
    {
      id: "m-4",
      workspace_id: "ws-3",
      platform: "youtube",
      content:
        "Review dài về quán rất chi tiết, chỉ ra điểm mạnh và điểm cần cải thiện của trải nghiệm khách hàng.",
      author: "KOL Tech",
      sentiment: "neutral",
      topic: "experience",
      credibility_score: 0.88,
      created_at: new Date(
        baseDate.getTime() - 22 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://youtube.com/watch?v=4",
    },
    {
      id: "m-5",
      workspace_id: "ws-1",
      platform: "facebook",
      content:
        "Phản hồi về tình trạng giao hàng chậm, cần tối ưu thông tin đơn hàng rõ ràng hơn.",
      author: "Pham Van B",
      sentiment: "negative",
      topic: "delivery",
      credibility_score: 0.71,
      created_at: new Date(
        baseDate.getTime() - 32 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://facebook.com/post/5",
    },
    {
      id: "m-6",
      workspace_id: "ws-2",
      platform: "tiktok",
      content:
        "Bài đăng chia sẻ cảm nhận khá tốt về thái độ nhân viên, nhưng chưa rõ ràng về chương trình khuyến mãi.",
      author: "Linh Nguyen",
      sentiment: "neutral",
      topic: "staff",
      credibility_score: 0.69,
      created_at: new Date(
        baseDate.getTime() - 48 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://tiktok.com/video/6",
    },
    {
      id: "m-7",
      workspace_id: "ws-3",
      platform: "news",
      content:
        "Bài báo mới ghi nhận chiến dịch F&B của thương hiệu tăng độ nhận diện trong nhóm Gen Z.",
      author: "Cafebiz",
      sentiment: "positive",
      topic: "marketing",
      credibility_score: 0.82,
      created_at: new Date(
        baseDate.getTime() - 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://cafebiz.vn/article-7",
    },
    {
      id: "m-8",
      workspace_id: "ws-1",
      platform: "news",
      content:
        "Talkshow ghi nhận nhà hàng cần chú ý về quy trình phục vụ để giữ vững thương hiệu.",
      author: "24h",
      sentiment: "negative",
      topic: "operation",
      credibility_score: 0.79,
      created_at: new Date(
        baseDate.getTime() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://24h.com.vn/article-8",
    },
  ];
};

const buildDashboardStats = (mentions: Mention[]): DashboardStats => {
  const total = mentions.length;
  const positive = mentions.filter((m) => m.sentiment === "positive").length;
  const negative = mentions.filter((m) => m.sentiment === "negative").length;
  const neutral = mentions.filter((m) => m.sentiment === "neutral").length;

  return {
    total_mentions: total,
    positive_count: positive,
    negative_count: negative,
    neutral_count: neutral,
    net_sentiment: total
      ? Math.round(((positive - negative) / total) * 100)
      : 0,
    hot_leads_today: Math.floor(Math.random() * 6) + 1,
    alerts_today: Math.floor(Math.random() * 4) + 1,
    trending_spike: parseFloat((Math.random() * 2 + 1).toFixed(1)),
  };
};

interface UseMentionsOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

export function useMentionsData(options: UseMentionsOptions = {}) {
  const { autoFetch = true, refetchInterval = 60000 } = options;
  const { setMentions, setWorkspaces, setStats, setLoading, setError } =
    useDashboardStore();

  const [isInitialized, setIsInitialized] = useState(false);

  const fetchMentions = async () => {
    try {
      setLoading(true);
      
      // Fetch from Firebase
      let fetchedMentions: Mention[] = [];
      try {
        const mentionsRef = collection(secondDb, "mentions_nlp_demo");
        const snapshot = await getDocs(mentionsRef);

        fetchedMentions = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Map platform from source
          let platform = data.source || "unknown";
          
          // Map workspace from brand
          let workspace_id = "ws-1";
          const brandStr = String(data.brand || "").toLowerCase();
          if (brandStr.includes("highland")) workspace_id = "ws-1";
          else if (brandStr.includes("phúc long") || brandStr.includes("phuclong")) workspace_id = "ws-2";
          else if (brandStr.includes("katinat")) workspace_id = "ws-3";
          else workspace_id = data.brand || "ws-1";

          // Normalize sentiment to valid enum values
          const rawSentiment = String(data.baseline_sentiment || data.sentiment || "").toLowerCase();
          let sentiment: Mention["sentiment"] = "neutral";
          if (rawSentiment.includes("positive") || rawSentiment.includes("pos")) sentiment = "positive";
          else if (rawSentiment.includes("negative") || rawSentiment.includes("neg")) sentiment = "negative";

          // Normalize topic to valid enum values
          const rawTopic = String(data.baseline_topic || data.topic || "").toLowerCase();
          const validTopics: Mention["topic"][] = ["quality", "price", "service", "staff", "delivery", "experience", "legal", "operation", "competitor", "other"];
          const topic: Mention["topic"] = validTopics.find(t => rawTopic.includes(t)) || "other";

          // Use posted_at if available, fallback to analyzed_at or crawled_at
          let timeStr = data.posted_at;
          if (!timeStr || timeStr === "") {
            timeStr = data.analyzed_at || data.crawled_at || data.created_at || new Date().toISOString();
          }

          return {
            id: doc.id,
            workspace_id: workspace_id,
            platform: platform,
            content: data.content || data.text || "(Không có nội dung)",
            author: data.author_name || data.author || "Khách hàng",
            sentiment,
            topic,
            credibility_score: parseFloat(data.baseline_confidence) || data.credibility_score || 0.8,
            created_at: timeStr,
            url: data.url || "",
          } as Mention;
        });
      } catch (err) {
        console.error("Error fetching from Firebase:", err);
      }

      // Use fetched data or fallback to mock if empty
      const mentions = fetchedMentions.length > 0 ? fetchedMentions : generateMockMentions();
      const workspaces = generateMockWorkspaces();

      setMentions(mentions);
      setWorkspaces(workspaces);
      setStats(buildDashboardStats(mentions));
      setError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu mentions";
      setError(message);
      console.error("Mentions fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoFetch) return;

    fetchMentions();
    setIsInitialized(true);
    const interval = setInterval(fetchMentions, refetchInterval);

    return () => clearInterval(interval);
  }, [autoFetch, refetchInterval]);

  return {
    isInitialized,
    refetch: fetchMentions,
  };
}
