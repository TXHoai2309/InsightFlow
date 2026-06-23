"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import type { Mention, Workspace, DashboardStats } from "@/types/dashboard";
import { dbSecond } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
const now = () => new Date();

function normalizeBrandId(brand: string): string {
  if (!brand) return "other";
  let b = brand.toLowerCase().trim();
  if (b.includes("laha")) return "laha-cafe";
  if (b.includes("mixue")) return "mixue";
  if (b.includes("marou")) return "maison-marou";
  if (b.includes("highlands")) return "highlands-coffee";
  if (b.includes("phúc long") || b.includes("phuclong")) return "phuc-long";
  if (b.includes("katinat")) return "katinat";
  
  return b.replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function formatBrandName(brand: string): string {
  if (!brand) return "";
  const lower = brand.toLowerCase();
  if (lower === "mixue") return "Mixue";
  if (lower === "laha-cafe" || lower === "laha coffee" || lower === "laha_coffee" || lower.includes("laha")) return "Laha Coffee";
  if (lower === "maison-marou" || lower === "maison_marou" || lower.includes("marou")) return "Maison Marou";
  if (lower.includes("highlands")) return "Highlands Coffee";
  if (lower.includes("phúc long") || lower.includes("phuclong")) return "Phúc Long";
  if (lower.includes("katinat")) return "Katinat";
  
  return brand
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function parseDate(field: any): string {
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



const normalizeDate = (field: unknown, fallback = new Date().toISOString()) => {
  if (!field) return fallback;

  if (typeof (field as { toDate?: unknown }).toDate === "function") {
    const date = (field as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
  }

  if (field instanceof Date) {
    return Number.isNaN(field.getTime()) ? fallback : field.toISOString();
  }

  let raw = String(field).trim();
  if (!raw || raw === "[object Object]") return fallback;

  // Handle DD/MM/YYYY or DD/MM/YYYY HH:mm:ss format commonly used in the DB
  const vnDateMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (vnDateMatch) {
    const day = parseInt(vnDateMatch[1], 10);
    const month = parseInt(vnDateMatch[2], 10) - 1;
    const year = parseInt(vnDateMatch[3], 10);
    const hour = vnDateMatch[4] ? parseInt(vnDateMatch[4], 10) : 0;
    const minute = vnDateMatch[5] ? parseInt(vnDateMatch[5], 10) : 0;
    const second = vnDateMatch[6] ? parseInt(vnDateMatch[6], 10) : 0;
    
    const parsedDate = new Date(year, month, day, hour, minute, second);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const generateMockWorkspaces = (): Workspace[] => [
  {
    id: "ws-highlands-coffee",
    brand_name: "Highlands Coffee",
    scale: "large",
    keywords: ["highlands", "coffee", "café"],
    synonyms: ["highland", "cf", "highlands coffee"],
    priority: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "ws-phuc-long",
    brand_name: "Phúc Long",
    scale: "large",
    keywords: ["phúc long", "phuclong"],
    synonyms: ["phuc long tea", "trà phúc long"],
    priority: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "ws-katinat",
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
      workspace_id: "ws-highlands-coffee",
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
      posted_at: new Date(
        baseDate.getTime() - 2 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://facebook.com/post/1",
    },
    {
      id: "m-2",
      workspace_id: "ws-highlands-coffee",
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
      posted_at: new Date(
        baseDate.getTime() - 5 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://tiktok.com/video/2",
    },
    {
      id: "m-3",
      workspace_id: "ws-phuc-long",
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
      posted_at: new Date(
        baseDate.getTime() - 11 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://vnexpress.net/article-3",
    },
    {
      id: "m-4",
      workspace_id: "ws-katinat",
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
      posted_at: new Date(
        baseDate.getTime() - 22 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://youtube.com/watch?v=4",
    },
    {
      id: "m-5",
      workspace_id: "ws-highlands-coffee",
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
      posted_at: new Date(
        baseDate.getTime() - 32 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://facebook.com/post/5",
    },
    {
      id: "m-6",
      workspace_id: "ws-phuc-long",
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
      posted_at: new Date(
        baseDate.getTime() - 48 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://tiktok.com/video/6",
    },
    {
      id: "m-7",
      workspace_id: "ws-katinat",
      platform: "news",
      content:
        "Bài báo mới ghi nhận chiến dịch F&B của thương hiệu tăng độ nhận diện trong nhóm Gen Z.",
      author: "Cafebiz",
      sentiment: "positive",
      topic: "other",
      credibility_score: 0.82,
      created_at: new Date(
        baseDate.getTime() - 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      posted_at: new Date(
        baseDate.getTime() - 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      url: "https://cafebiz.vn/article-7",
    },
    {
      id: "m-8",
      workspace_id: "ws-highlands-coffee",
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
      posted_at: new Date(
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
      
      let fetchedWorkspaces: Workspace[] = [];
      let fetchedFromReal = false;
      // Fetch from Firebase
      let fetchedMentions: Mention[] = [];
      try {
        const mentionsRef = collection(dbSecond, "mentions_nlp_demo");
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
          const validTopics: Mention["topic"][] = ["quality", "price", "service", "staff", "delivery", "experience", "legal", "operation", "marketing", "competitor", "other"];
          const topic: Mention["topic"] = validTopics.find(t => rawTopic.includes(t)) || "other";

          const fallbackTime = normalizeDate(
            data.analyzed_at || data.crawled_at || data.created_at,
          );
          const postedAt = normalizeDate(
            data.post_date || data.posted_at || data.created_at,
            fallbackTime,
          );
          const createdAt = normalizeDate(data.crawled_at || data.analyzed_at, fallbackTime);

          return {
            id: doc.id,
            workspace_id: workspace_id,
            platform: platform,
            content: data.content || data.text || "(Không có nội dung)",
            author: data.author_name || data.author || "Khách hàng",
            sentiment,
            topic,
            credibility_score: parseFloat(data.baseline_confidence) || data.credibility_score || 0.8,
            created_at: createdAt,
            posted_at: postedAt,
            url: data.url || "",
          } as Mention;
        });
      } catch (err) {
        console.error("Error fetching from Firebase:", err);
      }

      // Use fetched data or fallback to mock if empty
      const mentions = fetchedMentions.length > 0 ? fetchedMentions : generateMockMentions();
      const workspaces = generateMockWorkspaces();

      if (dbSecond) {
        try {
          console.log("[useMentionsData] Fetching real mentions from mentions_nlp_demo...");
          const mentionsRef = collection(dbSecond, "mentions_nlp_demo");
          // Get the latest 300 mentions to ensure coverage
          const q = query(mentionsRef, orderBy("crawled_at", "desc"), limit(300));
          const snap = await getDocs(q);

          if (!snap.empty) {
            const rawMentions = snap.docs.map(doc => {
              const d = doc.data();
              const brand = String(d.brand || d.workspace_id || "other").trim();
              const brandLower = brand.toLowerCase();
              const sentiment = String(d.baseline_sentiment || d.sentiment || "neutral").toLowerCase();
              
              let platform = String(d.source || d.platform || "facebook").toLowerCase();
              if (platform === "fb") platform = "facebook";
              if (platform === "tt") platform = "tiktok";
              if (platform === "yt") platform = "youtube";
              if (platform !== "facebook" && platform !== "tiktok" && platform !== "news" && platform !== "youtube") {
                platform = "facebook";
              }

              let topic = String(d.baseline_topic || d.topic || "other").toLowerCase();
              const validTopics = [
                "quality", "price", "service", "staff", "delivery", 
                "experience", "legal", "operation", "competitor", "other"
              ];
              if (!validTopics.includes(topic)) {
                topic = "other";
              }

              return {
                id: doc.id,
                brand,
                brandLower,
                platform: platform as any,
                content: String(d.processed_text || d.text || d.content || ""),
                author: String(d.author || d.author_name || d.username || "Ẩn danh"),
                sentiment: (sentiment === "positive" || sentiment === "negative" || sentiment === "neutral" ? sentiment : "neutral") as any,
                topic: topic as any,
                credibility_score: Number(d.baseline_confidence || 0.8),
                created_at: parseDate(d.crawled_at || d.analyzed_at || d.created_at),
                posted_at: parseDate(d.post_date || d.posted_at || d.created_at || d.crawled_at),
                url: String(d.url || d.post_url || d.permalink || d.source_url || "")
              };
            });

            // Extract unique brand names and normalize brand IDs
            const brandMap = new Map<string, string>(); // normalizedId -> brandName
            rawMentions.forEach(m => {
              const normId = normalizeBrandId(m.brand);
              if (!brandMap.has(normId)) {
                brandMap.set(normId, m.brand);
              }
            });

            // Ensure baseline mock brands are also loaded for layout continuity
            const mockBrands = ["Highlands Coffee", "Phúc Long", "KATINAT"];
            mockBrands.forEach(b => {
              const normId = normalizeBrandId(b);
              if (!brandMap.has(normId)) {
                brandMap.set(normId, b);
              }
            });

            fetchedWorkspaces = Array.from(brandMap.entries()).map(([normId, originalName], idx) => ({
              id: `ws-${normId}`,
              brand_name: formatBrandName(originalName),
              scale: "medium" as any,
              keywords: [normId],
              synonyms: [normId],
              priority: idx < 3,
              created_at: new Date().toISOString()
            }));

            // Map mentions using the brandId
            fetchedMentions = rawMentions.map(m => {
              const normId = normalizeBrandId(m.brand);
              return {
                id: m.id,
                workspace_id: `ws-${normId}`,
                platform: m.platform,
                content: m.content,
                author: m.author,
                sentiment: m.sentiment,
                topic: m.topic,
                credibility_score: m.credibility_score,
                created_at: m.created_at,
                posted_at: m.posted_at,
                url: m.url
              };
            });

            fetchedFromReal = true;
          }
        } catch (err: any) {
          console.warn("[useMentionsData] Firestore query failed, falling back to mock:", err.message);
        }
      }

      if (!fetchedFromReal || fetchedMentions.length === 0) {
        fetchedMentions = generateMockMentions();
        fetchedWorkspaces = generateMockWorkspaces();
      }

      setMentions(fetchedMentions);
      setWorkspaces(fetchedWorkspaces);
      setStats(buildDashboardStats(fetchedMentions));
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
