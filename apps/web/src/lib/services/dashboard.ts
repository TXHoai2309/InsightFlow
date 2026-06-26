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
  mentions: "insightflow_labels",
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
  const normalized = source
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-\s]/g, "_");
  return SOURCE_TO_PLATFORM[normalized] ?? "news";
}

/**
 * Chuẩn hoá tên thương hiệu → tên hiển thị đẹp cho 3 target brand.
 * Fallback: capitalize from raw string.
 */
export function normalizeBrandName(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[\s\-_.]/g, "") // bỏ dấu cách, gạch ngang, gạch dưới, dấu chấm
    .trim();

  if (normalized.includes("highland")) return "highlandcoffee";
  if (normalized.includes("starbuck")) return "starbucks";
  if (normalized.includes("mixue")) return "mixue";

  return normalized;
}

/** Map raw brand string → display name */
export function formatBrandDisplayName(raw: string): string {
  if (!raw) return "";
  const b = raw.toLowerCase().trim();
  if (b.includes("highland")) return "Highland Coffee";
  if (b.includes("starbuck")) return "Starbucks";
  if (b.includes("mixue")) return "Mixue";
  // fallback: capitalize words
  return raw
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ─── Platform display info (dùng cho TopSources và DashboardFilters) ─────────
export const PLATFORM_META: Record<Platform, { label: string; color: string }> =
  {
    facebook: { label: "Facebook", color: "var(--color-platform-facebook)" },
    tiktok: { label: "TikTok", color: "var(--color-platform-tiktok)" },
    youtube: { label: "YouTube", color: "var(--color-platform-youtube)" },
    thread: { label: "Threads", color: "var(--color-platform-thread)" },
    be: { label: "Be / BeFood", color: "var(--color-platform-be)" },
    google_maps: {
      label: "Google Maps",
      color: "var(--color-platform-google-maps)",
    },
    news: { label: "Báo điện tử", color: "var(--color-platform-news)" },
  };

// ─── Topic whitelist ─────────────────────────────────────────────────────────
type TopicType = Mention["topic"];
const VALID_TOPICS = new Set<string>([
  "quality",
  "price",
  "service",
  "staff",
  "delivery",
  "experience",
  "legal",
  "operation",
  "competitor",
  "other",
]);
function mapTopic(raw: unknown): TopicType {
  const firstTopic = Array.isArray(raw) ? raw[0] : raw;
  const topic = String(firstTopic || "")
    .toLowerCase()
    .trim();
  return VALID_TOPICS.has(topic) ? (topic as TopicType) : "other";
}

function mapSentiment(raw: unknown): Mention["sentiment"] {
  const sentiment = String(raw || "")
    .toLowerCase()
    .trim();
  return (
    ["positive", "negative", "neutral"].includes(sentiment)
      ? sentiment
      : "neutral"
  ) as Mention["sentiment"];
}

function mapIntent(raw: unknown): Lead["intent"] {
  const intent = String(raw || "")
    .toLowerCase()
    .trim();
  return (
    ["hot", "warm", "cold", "none"].includes(intent) ? intent : "none"
  ) as Lead["intent"];
}

function mapLeadStatus(raw: unknown): Lead["status"] {
  const status = String(raw || "")
    .toLowerCase()
    .trim();
  return (
    ["new", "processing", "completed", "skipped"].includes(status)
      ? status
      : "new"
  ) as Lead["status"];
}

function normalizeText(value: unknown): string {
  const text = String(value || "");
  return text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/\u2029/g, "\n");
}

function normalizeOptionalUrl(...values: unknown[]): string | undefined {
  for (const value of values) {
    const url = String(value || "").trim();
    if (url) return url;
  }
  return undefined;
}

function normalizeOptionalText(value: unknown): string | undefined {
  const text = String(value || "").trim();
  return text || undefined;
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00Z`;

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
      // NOTE: No orderBy — avoids Firestore index requirement.
      // We sort in-memory after fetching.
      const constraints: Parameters<typeof query>[1][] = [];
      if (opts.maxMentions) constraints.push(limit(opts.maxMentions));
      if (opts.after) constraints.push(startAfter(opts.after));

      const mentionsSnap = await getDocs(
        query(collection(dbData, COLLECTION_NAMES.mentions), ...constraints),
      );

      const mentions: Mention[] = mentionsSnap.docs.map((doc) => {
        const d = doc.data();
        const labels = d.labels || {};
        // posted_at = ngày đăng bài thật (post_date → created_at nguồn → fallback crawled_at)
        const postedAtRaw =
          d.post_date ??
          d.posted_at ??
          d.created_at ??
          d.crawled_at ??
          d.uploaded_at;
        const rawBrand = String(d.brand || d.workspace_id || "");
        return {
          id: String(d.id || doc.id),
          parent_id: d.parent_id ? String(d.parent_id) : null,
          workspace_id: rawBrand,
          platform: mapSourceToPlatform(d.source || ""),
          content: normalizeText(
            d.clean_text ||
              d.processed_text ||
              d.text ||
              d.content ||
              d.original_text ||
              "",
          ),
          original_content: normalizeText(
            d.original_text ||
              d.clean_text ||
              d.processed_text ||
              d.text ||
              d.content ||
              "",
          ),
          author: String(d.author || d.author_name || "N/A"),
          sentiment: mapSentiment(
            labels.sentiment ?? d.baseline_sentiment ?? d.sentiment,
          ),
          topic: mapTopic(labels.topic ?? d.baseline_topic ?? d.topic),
          credibility_score:
            typeof d.baseline_confidence === "number"
              ? Math.round(d.baseline_confidence * 100)
              : 100,
          created_at: parseDate(
            d.uploaded_at ||
              d.labeled_at ||
              d.crawled_at ||
              d.analyzed_at ||
              d.created_at,
          ),
          posted_at: parseDate(postedAtRaw),
          url: String(d.url || d.post_url || d.source_url || ""),
        };
      });

      // Sort in-memory: newest posted_at first
      mentions.sort(
        (a, b) =>
          new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime(),
      );

      const lastMentionDoc = mentionsSnap.docs.at(-1);

      // ── Workspaces (derived từ brands trong mentions) ─────────────────────
      // Seed với 3 target brands để đảm bảo luôn hiển thị
      const TARGET_BRAND_MAP: Record<string, string> = {
        "highland-coffee": "Highland Coffee",
        starbucks: "Starbucks",
        mixue: "Mixue",
      };
      const brandMap = new Map<string, Workspace>();

      // Pre-seed 3 target brands
      Object.entries(TARGET_BRAND_MAP).forEach(([id, name]) => {
        brandMap.set(normalizeBrandName(name), {
          id,
          brand_name: name,
          scale: "medium",
          keywords: [id],
          synonyms: [],
          priority: true,
          created_at: new Date().toISOString(),
        });
      });

      // Add brands found in data
      mentions.forEach((m) => {
        if (!m.workspace_id) return;
        const displayName = formatBrandDisplayName(m.workspace_id);
        const key = normalizeBrandName(displayName);
        if (!brandMap.has(key)) {
          brandMap.set(key, {
            id: m.workspace_id,
            brand_name: displayName,
            scale: "medium",
            keywords: [],
            synonyms: [],
            priority: false,
            created_at: m.created_at,
          });
        }
      });
      const workspaces = Array.from(brandMap.values()).sort((a, b) =>
        a.brand_name.localeCompare(b.brand_name),
      );

      // ── Alerts ────────────────────────────────────────────────────────────
      let alerts: Alert[] = [];
      try {
        const alertsSnap = await getDocs(
          query(collection(dbData, COLLECTION_NAMES.alerts), limit(200)),
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
        alerts.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      } catch {
        // Collection chưa tồn tại — bỏ qua
      }

      // ── Leads ─────────────────────────────────────────────────────────────
      let leads: Lead[] = [];
      try {
        const leadsSnap = await getDocs(
          query(collection(dbData, COLLECTION_NAMES.leads), limit(200)),
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
            url: normalizeOptionalUrl(d.url, d.post_url, d.source_url),
            phone: normalizeOptionalText(d.phone),
            email: normalizeOptionalText(d.email),
            zalo_id: normalizeOptionalText(d.zalo_id),
            messenger_id: normalizeOptionalText(d.messenger_id),
            social_profile_url: normalizeOptionalUrl(
              d.social_profile_url,
              d.contact,
              d.profile_url,
            ),
            contact_attempts:
              typeof d.contact_attempts === "number" ? d.contact_attempts : 0,
            last_contact_at: d.last_contact_at
              ? parseDate(d.last_contact_at)
              : undefined,
            notes: d.notes ? String(d.notes) : undefined,
            posted_at: d.posted_at ? parseDate(d.posted_at) : undefined,
          };
        });
        leads.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      } catch {
        // Collection chưa tồn tại — bỏ qua
      }

      if (leads.length === 0) {
        const derivedLeads: Lead[] = [];
        mentionsSnap.docs.forEach((doc) => {
          const d = doc.data();
          const labels = d.labels || {};
          const intent = mapIntent(labels.intent);
          if (intent === "none") return;

          derivedLeads.push({
            id: String(d.id || doc.id),
            workspace_id: String(d.brand || d.workspace_id || ""),
            platform: mapSourceToPlatform(d.source || d.platform || ""),
            author: String(d.author || "Khách hàng"),
            content: String(d.clean_text || d.content || d.original_text || ""),
            intent,
            intent_signals: Array.isArray(labels.topic) ? labels.topic : [],
            status: mapLeadStatus(d.status),
            created_at: parseDate(
              d.labeled_at || d.uploaded_at || d.created_at || d.posted_at,
            ),
            url: normalizeOptionalUrl(d.url, d.post_url, d.source_url),
            phone: normalizeOptionalText(d.phone),
            email: normalizeOptionalText(d.email),
            zalo_id: normalizeOptionalText(d.zalo_id),
            messenger_id: normalizeOptionalText(d.messenger_id),
            social_profile_url: normalizeOptionalUrl(
              d.social_profile_url,
              d.contact,
              d.profile_url,
            ),
            contact_attempts:
              typeof d.contact_attempts === "number" ? d.contact_attempts : 0,
            last_contact_at: d.last_contact_at
              ? parseDate(d.last_contact_at)
              : undefined,
            notes: d.notes ? String(d.notes) : undefined,
            posted_at: d.posted_at ? parseDate(d.posted_at) : undefined,
          });
        });
        leads = derivedLeads;
        leads.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
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
  static async updateLeadStatus(
    id: string,
    status: Lead["status"],
  ): Promise<void> {
    try {
      const leadRef = doc(dbData, COLLECTION_NAMES.leads, id);
      await updateDoc(leadRef, { status });
    } catch (error) {
      try {
        const labelRef = doc(dbData, COLLECTION_NAMES.mentions, id);
        await updateDoc(labelRef, { status });
      } catch (fallbackError) {
        console.error("[DashboardService] updateLeadStatus error:", error);
        throw fallbackError;
      }
    }
  }

  /**
   * Cập nhật các thông tin chi tiết nhật ký chăm sóc của lead trên Firestore
   */
  static async updateLeadDetails(
    id: string,
    data: Partial<Lead>,
  ): Promise<void> {
    try {
      const leadRef = doc(dbData, COLLECTION_NAMES.leads, id);
      const cleanData = { ...data };
      delete cleanData.id;
      await updateDoc(leadRef, cleanData);
    } catch (error) {
      try {
        const labelRef = doc(dbData, COLLECTION_NAMES.mentions, id);
        const cleanData = { ...data };
        delete cleanData.id;
        await updateDoc(labelRef, cleanData);
      } catch (fallbackError) {
        console.error("[DashboardService] updateLeadDetails error:", error);
        throw fallbackError;
      }
    }
  }

  // ── Stats aggregation ─────────────────────────────────────────────────────

  static calculateStats(
    mentions: Mention[],
    alerts: Alert[],
    leads: Lead[],
  ): DashboardStats {
    const total = mentions.length;
    let positive = 0,
      negative = 0,
      neutral = 0;
    mentions.forEach((m) => {
      if (m.sentiment === "positive") positive++;
      else if (m.sentiment === "negative") negative++;
      else neutral++;
    });

    const netSentiment =
      total > 0 ? Math.round(((positive - negative) / total) * 100) : 0;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneDayAgo = now - oneDayMs;
    const twoDaysAgo = now - 2 * oneDayMs;

    const hotLeadsToday = leads.filter((l) => l.intent === "hot").length;

    const alertsToday = alerts.length;

    const last24h = mentions.filter(
      (m) => new Date(m.posted_at).getTime() >= oneDayAgo,
    ).length;
    const prev24h = mentions.filter((m) => {
      const t = new Date(m.posted_at).getTime();
      return t >= twoDaysAgo && t < oneDayAgo;
    }).length;

    const trendingSpike =
      prev24h > 0 ? parseFloat((last24h / prev24h).toFixed(1)) : last24h;

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
    const groups: Record<
      string,
      { count: number; positive: number; negative: number; neutral: number }
    > = {};

    mentions.forEach((m) => {
      const t = m.topic || "other";
      if (!groups[t])
        groups[t] = { count: 0, positive: 0, negative: 0, neutral: 0 };
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
    timeRange: DashboardFilters["time_range"],
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
        date: dayStart.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        positive: slot.filter((m) => m.sentiment === "positive").length,
        negative: slot.filter((m) => m.sentiment === "negative").length,
        neutral: slot.filter((m) => m.sentiment === "neutral").length,
      });
    }
    return result;
  }
}
