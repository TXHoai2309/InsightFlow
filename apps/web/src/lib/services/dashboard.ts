/**
 * DashboardService
 * Service layer cho tất cả Firestore queries và data aggregation.
 *
 * Thiết kế để dễ nâng cấp:
 *  - Thay collection name → chỉ sửa COLLECTION_NAMES
 *  - Thêm filter/pagination → sửa fetchRawData()
 *  - Thay Firestore bằng REST API → thay getDocs() bằng fetch() tại đây
 */

import { dbData } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  doc,
  updateDoc,
} from "firebase/firestore";
import type {
  Mention,
  Alert,
  Lead,
  Workspace,
  DashboardStats,
  TopSource,
  TopTopic,
  SentimentTrendPoint,
  Platform,
  DashboardFilters,
} from "@/types/dashboard";

// ─── Collection names ────────────────────────────────────────────────────────
export const COLLECTION_NAMES = {
  mentions: "mentions_nlp_demo",
  alerts: "alerts",
  leads: "leads",
} as const;

// ─── Platform mapping: source crawl → Platform type ──────────────────────────
const SOURCE_TO_PLATFORM: Record<string, Platform> = {
  // Social media
  facebook: "facebook",
  tiktok: "tiktok",
  youtube: "youtube",
  thread: "thread",
  threads: "thread",
  // Food / map review
  be: "be",
  befood: "be",
  google_maps: "google_maps",
  googlemap: "google_maps",
  // Báo điện tử / tin tức
  news: "news",
};

export function mapSourceToPlatform(source: string): Platform {
  return SOURCE_TO_PLATFORM[source?.toLowerCase().replace(/[-\s]/g, "_")] ?? "news";
}

/**
 * Chuẩn hoá tên thương hiệu để so sánh không phân biệt hoa thường / ký tự đặc biệt.
 * Ví dụ: "Laha Cafe" → "lahacafe", "laha-cafe" → "lahacafe"
 */
export function normalizeBrandName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\-_.]/g, "") // bỏ dấu cách, gạch ngang, gạch dưới, dấu chấm
    .trim();
}

// ─── Platform display info (dùng cho TopSources và DashboardFilters) ─────────
export const PLATFORM_META: Record<Platform, { label: string; color: string }> = {
  facebook: { label: "Facebook",      color: "#1877F2" },
  tiktok:   { label: "TikTok",        color: "#010101" },
  youtube:  { label: "YouTube",       color: "#FF0000" },
  thread:   { label: "Threads",       color: "#1C1C1E" },
  be:       { label: "Be / BeFood",   color: "#FFC107" },
  google_maps: { label: "Google Maps", color: "#34A853" },
  news:     { label: "Báo điện tử",   color: "#4648d4" },
};

// ─── Topic whitelist ─────────────────────────────────────────────────────────
type TopicType = Mention["topic"];
const VALID_TOPICS = new Set<string>([
  "quality", "price", "service", "staff", "delivery",
  "experience", "legal", "operation", "competitor", "other",
]);
function mapTopic(raw: string): TopicType {
  return VALID_TOPICS.has(raw) ? (raw as TopicType) : "other";
}

// ─── Date parser ─────────────────────────────────────────────────────────────
function parseDate(field: unknown): string {
  if (!field) return new Date().toISOString();
  if (typeof (field as any).toDate === "function") {
    return (field as any).toDate().toISOString();
  }
  if (field instanceof Date) return field.toISOString();
  const s = String(field).trim();
  if (!s) return new Date().toISOString();

  // Thử parse định dạng Việt Nam thông dụng như "HH:mm DD/MM/YYYY" hoặc "DD/MM/YYYY"
  // ví dụ: "22:21 18/05/2025"
  const dmyRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
  const match = s.match(dmyRegex);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const year = match[3];
    
    // Tìm phần giờ phút nếu có
    const timeRegex = /(\d{1,2}):(\d{2})/;
    const timeMatch = s.match(timeRegex);
    const hour = timeMatch ? timeMatch[1].padStart(2, "0") : "00";
    const minute = timeMatch ? timeMatch[2].padStart(2, "0") : "00";
    
    return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
  }

  // "2026-06-18T15:06:16.555779" — no timezone → assume UTC
  return s.includes("+") || s.endsWith("Z") ? s : s + "Z";
}

// ─── Fetch options ────────────────────────────────────────────────────────────
export interface FetchOptions {
  /** Pagination cursor */
  after?: QueryDocumentSnapshot<DocumentData>;
  /** Set a max limit (default: no limit — fetches ALL records) */
  maxMentions?: number;
}

// ─── Main service ─────────────────────────────────────────────────────────────
export class DashboardService {
  /**
   * Fetch raw data from Firestore.
   * Mapping field names Firestore → internal types happens here.
   */
  static async fetchRawData(opts: FetchOptions = {}): Promise<{
    workspaces: Workspace[];
    mentions: Mention[];
    alerts: Alert[];
    leads: Lead[];
    lastMentionDoc?: QueryDocumentSnapshot<DocumentData>;
  }> {
    try {
      // ── Mentions ──────────────────────────────────────────────────────────
      const constraints: Parameters<typeof query>[1][] = [
        orderBy("crawled_at", "desc"),
      ];
      if (opts.maxMentions) constraints.push(limit(opts.maxMentions));
      if (opts.after) constraints.push(startAfter(opts.after));

      const mentionsSnap = await getDocs(
        query(collection(dbData, COLLECTION_NAMES.mentions), ...constraints)
      );

      const mentions: Mention[] = mentionsSnap.docs.map((doc) => {
        const d = doc.data();
        // posted_at = ngày đăng bài thật (post_date → created_at nguồn → fallback crawled_at)
        const postedAtRaw = d.post_date ?? d.posted_at ?? d.created_at ?? d.crawled_at;
        return {
          id: doc.id,
          workspace_id: String(d.brand || ""),
          platform: mapSourceToPlatform(d.source || ""),
          content: String(d.processed_text || d.text || ""),
          author: String(d.author_name || "N/A"),
          sentiment: (["positive", "negative", "neutral"].includes(d.baseline_sentiment)
            ? d.baseline_sentiment
            : "neutral") as Mention["sentiment"],
          topic: mapTopic(String(d.baseline_topic || "")),
          credibility_score: typeof d.baseline_confidence === "number"
            ? Math.round(d.baseline_confidence * 100)
            : 50,
          created_at: parseDate(d.crawled_at),
          posted_at: parseDate(postedAtRaw),
          url: String(d.url || ""),
        };
      });

      const lastMentionDoc = mentionsSnap.docs.at(-1);

      // ── Workspaces (derived từ brands trong mentions) ─────────────────────
      // Nhóm brands có cùng normalized name (không phân biệt hoa thường/ký tự đặc biệt)
      // Ví dụ: "Laha Cafe" và "laha-cafe" → cùng một workspace
      const brandMap = new Map<string, Workspace>();
      mentions.forEach((m) => {
        if (!m.workspace_id) return;
        const key = normalizeBrandName(m.workspace_id);
        if (!brandMap.has(key)) {
          // Lấy tên đẹp nhất: ưu tiên tên có chữ hoa (nhiều ký tự hơn là original)
          brandMap.set(key, {
            id: m.workspace_id,          // giữ nguyên id gốc đầu tiên gặp
            brand_name: m.workspace_id,
            scale: "medium",
            keywords: [],
            synonyms: [],
            priority: false,
            created_at: m.created_at,
          });
        }
      });
      const workspaces = Array.from(brandMap.values()).sort((a, b) =>
        a.brand_name.localeCompare(b.brand_name)
      );

      // ── Alerts ────────────────────────────────────────────────────────────
      let alerts: Alert[] = [];
      try {
        const alertsSnap = await getDocs(
          query(collection(dbData, COLLECTION_NAMES.alerts), orderBy("created_at", "desc"), limit(200))
        );
        alerts = alertsSnap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            workspace_id: String(d.workspace_id || d.brand || ""),
            severity: d.severity || "medium",
            signal_type: d.signal_type || "mention_spike",
            message: String(d.message || ""),
            spike_multiplier: d.spike_multiplier,
            affected_mentions_count: d.affected_mentions_count,
            created_at: parseDate(d.created_at),
            status: d.status || "new",
          };
        });
      } catch {
        // Collection chưa tồn tại — bỏ qua
      }

      // ── Leads ─────────────────────────────────────────────────────────────
      let leads: Lead[] = [];
      try {
        const leadsSnap = await getDocs(
          query(collection(dbData, COLLECTION_NAMES.leads), orderBy("created_at", "desc"), limit(200))
        );
        leads = leadsSnap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            workspace_id: String(d.workspace_id || d.brand || ""),
            platform: mapSourceToPlatform(d.source || d.platform || ""),
            author: String(d.author || "Khách hàng"),
            content: String(d.content || d.text || ""),
            intent: d.intent || "none",
            intent_signals: d.intent_signals || [],
            status: d.status || "new",
            created_at: parseDate(d.created_at),
            expiry_at: d.expiry_at ? parseDate(d.expiry_at) : undefined,
            url: String(d.url || ""),
            // Extended Contact Info
            phone: d.phone ? String(d.phone) : undefined,
            email: d.email ? String(d.email) : undefined,
            zalo_id: d.zalo_id ? String(d.zalo_id) : undefined,
            messenger_id: d.messenger_id ? String(d.messenger_id) : undefined,
            social_profile_url: d.social_profile_url ? String(d.social_profile_url) : undefined,
            // Extended CRM Tracking
            contact_attempts: typeof d.contact_attempts === "number" ? d.contact_attempts : 0,
            last_contact_at: d.last_contact_at ? parseDate(d.last_contact_at) : undefined,
            notes: d.notes ? String(d.notes) : undefined,
            posted_at: d.posted_at ? parseDate(d.posted_at) : undefined,
          };
        });
      } catch {
        // Collection chưa tồn tại — bỏ qua
      }

      return { workspaces, mentions, alerts, leads, lastMentionDoc };
    } catch (error) {
      console.error("[DashboardService] fetchRawData error:", error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái của lead trên Firestore
   */
  static async updateLeadStatus(id: string, status: Lead["status"]): Promise<void> {
    try {
      const leadRef = doc(dbData, COLLECTION_NAMES.leads, id);
      await updateDoc(leadRef, { status });
    } catch (error) {
      console.error("[DashboardService] updateLeadStatus error:", error);
      throw error;
    }
  }

  /**
   * Cập nhật các thông tin chi tiết nhật ký chăm sóc của lead trên Firestore
   */
  static async updateLeadDetails(id: string, data: Partial<Lead>): Promise<void> {
    try {
      const leadRef = doc(dbData, COLLECTION_NAMES.leads, id);
      const cleanData = { ...data };
      delete cleanData.id;
      await updateDoc(leadRef, cleanData);
    } catch (error) {
      console.error("[DashboardService] updateLeadDetails error:", error);
      throw error;
    }
  }

  // ── Stats aggregation ─────────────────────────────────────────────────────

  static calculateStats(
    mentions: Mention[],
    alerts: Alert[],
    leads: Lead[]
  ): DashboardStats {
    const total = mentions.length;
    let positive = 0, negative = 0, neutral = 0;
    mentions.forEach((m) => {
      if (m.sentiment === "positive") positive++;
      else if (m.sentiment === "negative") negative++;
      else neutral++;
    });

    const netSentiment = total > 0
      ? Math.round(((positive - negative) / total) * 100)
      : 0;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneDayAgo = now - oneDayMs;
    const twoDaysAgo = now - 2 * oneDayMs;

    const hotLeadsToday = leads.filter((l) => l.intent === "hot").length;

    const alertsToday = alerts.length;

    const last24h = mentions.filter((m) => new Date(m.posted_at).getTime() >= oneDayAgo).length;
    const prev24h = mentions.filter((m) => {
      const t = new Date(m.posted_at).getTime();
      return t >= twoDaysAgo && t < oneDayAgo;
    }).length;

    const trendingSpike = prev24h > 0
      ? parseFloat((last24h / prev24h).toFixed(1))
      : last24h;

    return {
      total_mentions: total,
      positive_count: positive,
      negative_count: negative,
      neutral_count: neutral,
      net_sentiment: netSentiment,
      hot_leads_today: hotLeadsToday,
      alerts_today: alertsToday,
      trending_spike: trendingSpike,
    };
  }

  // ── Top sources (group by platform) ──────────────────────────────────────

  static calculateTopSources(mentions: Mention[]): TopSource[] {
    const total = mentions.length || 1;
    const counts: Partial<Record<Platform, number>> = {};

    mentions.forEach((m) => {
      counts[m.platform] = (counts[m.platform] ?? 0) + 1;
    });

    return (Object.entries(counts) as [Platform, number][])
      .map(([platform, count]) => ({
        platform,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ── Top topics (group by topic → sentiment breakdown) ─────────────────────

  static calculateTopTopics(mentions: Mention[]): TopTopic[] {
    const groups: Record<string, { count: number; positive: number; negative: number; neutral: number }> = {};

    mentions.forEach((m) => {
      const t = m.topic || "other";
      if (!groups[t]) groups[t] = { count: 0, positive: 0, negative: 0, neutral: 0 };
      groups[t].count++;
      groups[t][m.sentiment]++;
    });

    return Object.entries(groups)
      .map(([name, g]) => ({
        name,
        count: g.count,
        sentiment_breakdown: {
          positive: g.positive,
          negative: g.negative,
          neutral: g.neutral,
        },
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ── Sentiment trend (time-bucketed) ──────────────────────────────────────

  /**
   * Tính toán dữ liệu xu hướng cảm xúc theo ngày/giờ từ mentions thật.
   * - "24h": 24 điểm theo giờ
   * - "7d": 7 điểm theo ngày
   * - "30d": 30 điểm theo ngày
   */
  static calculateSentimentTrend(
    mentions: Mention[],
    timeRange: DashboardFilters["time_range"]
  ): SentimentTrendPoint[] {
    const now = Date.now();

    if (timeRange === "24h") {
      const result: SentimentTrendPoint[] = [];
      for (let i = 23; i >= 0; i--) {
        const slotEnd = now - i * 60 * 60 * 1000;
        const slotStart = slotEnd - 60 * 60 * 1000;
        const slot = mentions.filter((m) => {
          // Dùng posted_at (ngày đăng bài) để vẽ biểu đồ
          const t = new Date(m.posted_at).getTime();
          return t >= slotStart && t < slotEnd;
        });
        const d = new Date(slotEnd);
        result.push({
          date: `${String(d.getHours()).padStart(2, "0")}:00`,
          positive: slot.filter((m) => m.sentiment === "positive").length,
          negative: slot.filter((m) => m.sentiment === "negative").length,
          neutral: slot.filter((m) => m.sentiment === "neutral").length,
        });
      }
      return result;
    }

    // Group theo ngày đăng bài (posted_at)
    let days = timeRange === "7d" ? 7 : 30;
    if (timeRange === "all") {
      if (mentions.length === 0) {
        return [];
      }
      const timestamps = mentions.map((m) => new Date(m.posted_at).getTime());
      const minTimestamp = Math.min(...timestamps);
      const diffMs = now - minTimestamp;
      const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      // Giới hạn tối thiểu 1 ngày, tối đa 90 ngày để tránh render quá tải
      days = Math.max(1, Math.min(90, diffDays));
    }

    const result: SentimentTrendPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const slot = mentions.filter((m) => {
        // Dùng posted_at (ngày đăng bài thật) thay vì created_at (ngày cào)
        const t = new Date(m.posted_at).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });

      result.push({
        date: dayStart.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        positive: slot.filter((m) => m.sentiment === "positive").length,
        negative: slot.filter((m) => m.sentiment === "negative").length,
        neutral: slot.filter((m) => m.sentiment === "neutral").length,
      });
    }
    return result;
  }
}
