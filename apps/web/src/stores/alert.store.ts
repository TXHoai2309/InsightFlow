import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { dbSecond } from "@/lib/firebase";
import { collection, doc, getDocs, limit, query, updateDoc } from "firebase/firestore";
import { isRecordInBrandScope, isSameBrandScope } from "@/lib/brandScope";
import { normalizeBrandName } from "@/lib/services/dashboard";
import { canPerformAction, type UserRoleProfile } from "@/lib/rbac";

export interface ResolutionAttempt {
  attempt_number: number;
  timestamp: string;
  note: string;
  image_url?: string;
}

export interface AlertData {
  id: string;
  brand: string;
  source: string;
  text: string;
  sentiment: string;
  topic: string;
  severity: string;
  created_at: string;
  status: string;
  resolved_at?: string;
  collectionName?: string;
  url?: string;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  author?: string;
  title?: string;
  social_profile_url?: string;
  resolution_history?: ResolutionAttempt[];
}

export interface AlertFilters {
  brand: string;
  status: string;
  severity: string;
}

interface AlertState {
  rawAlerts: AlertData[];
  alerts: AlertData[];
  brands: string[];
  isLoading: boolean;
  error: string | null;
  filters: AlertFilters;
  setFilters: (filters: Partial<AlertFilters>) => void;
  fetchAlerts: (scopedBrandKey?: string | null) => Promise<void>;
  updateAlertStatus: (
    id: string,
    newStatus: string,
    profile: UserRoleProfile | null | undefined,
    attempt?: { note: string; image_url?: string }
  ) => Promise<void>;
}

function parseDate(field: unknown): string {
  if (!field) return new Date().toISOString();
  if (typeof (field as any).toDate === "function") {
    return (field as any).toDate().toISOString();
  }
  if (field instanceof Date) return field.toISOString();
  if (typeof (field as any).seconds === "number") {
    return new Date((field as any).seconds * 1000).toISOString();
  }

  const value = String(field).trim();
  if (!value) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00Z`;
  return value.includes("+") || value.endsWith("Z") ? value : `${value}Z`;
}

function normalizeBrandKey(brand: string): string {
  const normalized = String(brand || "")
    .toLowerCase()
    .replace(/[\s\-_.]/g, "")
    .trim();

  if (normalized.includes("highland")) return "highlandcoffee";
  if (normalized.includes("starbuck")) return "starbucks";
  if (normalized.includes("mixue")) return "mixue";
  return normalized;
}

function formatBrandName(brand: string): string {
  const key = normalizeBrandKey(brand);
  if (key === "highlandcoffee") return "Highland Coffee";
  if (key === "starbucks") return "Starbucks";
  if (key === "mixue") return "Mixue";
  return brand || "Unknown";
}

function normalizeSource(source: string): string {
  const normalized = String(source || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (normalized.includes("facebook")) return "facebook";
  if (normalized.includes("tiktok")) return "tiktok";
  if (normalized.includes("youtube")) return "youtube";
  if (normalized.includes("google")) return "google_maps";
  if (normalized.includes("bao") || normalized.includes("news")) return "news";
  return normalized || "news";
}

function normalizeTopic(topic: unknown): string {
  const firstTopic = Array.isArray(topic) ? topic[0] : topic;
  const normalized = String(firstTopic || "other").toLowerCase().trim();
  const validTopics = new Set([
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

  return validTopics.has(normalized) ? normalized : "other";
}

function calculateSeverity(data: any): string {
  const labels = data.labels || {};
  const urgency = String(labels.urgency || data.urgency || "").toLowerCase();
  const topic = normalizeTopic(labels.topic || data.topic);
  const content = String(data.clean_text || data.original_text || "").toLowerCase();

  if (
    urgency === "critical" ||
    topic === "legal" ||
    content.includes("ngộ độc") ||
    content.includes("tẩy chay") ||
    content.includes("khủng hoảng")
  ) {
    return "critical";
  }

  if (urgency === "high" || topic === "service" || topic === "quality") {
    return "high";
  }

  return "medium";
}

function applyFilters(rawAlerts: AlertData[], filters: AlertFilters): AlertData[] {
  let result = [...rawAlerts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (filters.brand !== "all") {
    const brandKey = normalizeBrandKey(filters.brand);
    result = result.filter((alert) => normalizeBrandKey(alert.brand) === brandKey);
  }

  if (filters.status !== "all") {
    result = result.filter(
      (alert) => alert.status.toLowerCase() === filters.status.toLowerCase(),
    );
  }

  if (filters.severity !== "all") {
    result = result.filter(
      (alert) => alert.severity.toLowerCase() === filters.severity.toLowerCase(),
    );
  }

  return result;
}

export const useAlertStore = create<AlertState>()(
  subscribeWithSelector((set, get) => ({
    rawAlerts: [],
    alerts: [],
    brands: ["Highland Coffee", "Starbucks", "Mixue"],
    isLoading: false,
    error: null,
    filters: {
      brand: "all",
      status: "all",
      severity: "all",
    },

    setFilters: (newFilters) => {
      set((state) => {
        const nextFilters = { ...state.filters, ...newFilters };
        return {
          filters: nextFilters,
          alerts: applyFilters(state.rawAlerts, nextFilters),
        };
      });
    },

    fetchAlerts: async (scopedBrandKey = null) => {
      set({ isLoading: true, error: null });

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sftfkwswszkugnjqfafm.supabase.co";
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_YvABq5BgqJmfJXcf-SvYjA_B-UbiTV_";

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Missing Supabase configuration");
        }

        const fetchSupa = async (endpoint: string) => {
          const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Profile": "public",
            },
          });
          if (!res.ok) throw new Error(`Supabase fetch error: ${res.statusText}`);
          return res.json();
        };

        // Fetch annotations
        const annotations = await fetchSupa("annotations?select=*&limit=1000");
        
        // Extract IDs
        const postIds = new Set<string>();
        const commentIds = new Set<string>();
        annotations.forEach((a: any) => {
          if (a.entity_type === "post") postIds.add(a.post_id);
          else if (a.entity_type === "comment") commentIds.add(a.comment_id);
        });

        // Fetch posts & comments in chunks to avoid URL too long
        const fetchInChunks = async (ids: string[], table: string, idField: string) => {
          const results: any[] = [];
          const chunkSize = 50;
          for (let i = 0; i < ids.length; i += chunkSize) {
            const chunk = ids.slice(i, i + chunkSize);
            const inQuery = `in.(${chunk.join(",")})`;
            const data = await fetchSupa(`${table}?select=*&${idField}=${inQuery}`);
            results.push(...data);
          }
          return results;
        };

        const [posts, comments] = await Promise.all([
          fetchInChunks(Array.from(postIds), "posts", "post_id"),
          fetchInChunks(Array.from(commentIds), "comments", "comment_id"),
        ]);

        const postsMap = new Map(posts.map((p: any) => [p.post_id, p]));
        const commentsMap = new Map(comments.map((c: any) => [c.comment_id, c]));

        const fetchedAlerts: AlertData[] = [];

        annotations.forEach((a: any) => {
          const isPost = a.entity_type === "post";
          const row = isPost ? postsMap.get(a.post_id) : commentsMap.get(a.comment_id);
          if (!row) return;

          let labelObj: any = {};
          if (a.label) {
            try {
              labelObj = typeof a.label === "string" ? JSON.parse(a.label) : a.label;
            } catch (e) {}
          }

          const sentiment = String(labelObj.sentiment || "neutral").toLowerCase();
          if (sentiment !== "negative") return; // Only negative mentions become alerts

          const payload = row.payload_json || {};
          let rawBrand = row.brand || row.brand_slug || payload.brand || "";
          
          let brandId = normalizeBrandKey(String(rawBrand));

          const text = String(
            payload.text || row.text || row.content || ""
          );

          const alertData = {
            brand: formatBrandName(String(rawBrand)),
            source: normalizeSource(String(row.platform || payload.platform || "")),
            text,
            sentiment,
            topic: normalizeTopic(labelObj.topic),
            // Map labels and content to calculate severity
            labels: labelObj,
            clean_text: text,
            urgency: labelObj.urgency
          };

          const alert = {
            id: String(isPost ? row.post_id : row.comment_id),
            brand: formatBrandName(brandId),
            source: alertData.source,
            text,
            sentiment,
            topic: alertData.topic,
            severity: calculateSeverity(alertData),
            created_at: parseDate(row.posted_at || payload.posted_at || row.created_at),
            status: String(a.status || "new"),
            resolved_at: a.resolved_at ? parseDate(a.resolved_at) : undefined,
            url: String(row.url || payload.url || ""),
            reach: Number(row.view_count || payload.view_count || 0),
            likes: Number(row.like_count || payload.like_count || 0),
            comments: Number(row.reply_count || payload.reply_count || row.comment_count || 0),
            shares: Number(row.share_count || payload.share_count || 0),
            author: String(row.author || payload.author || row.username || payload.username || "Ẩn danh"),
            title: text.slice(0, 120),
            social_profile_url: String(row.contact || payload.contact || ""),
            resolution_history: [],
          };

          if (!isRecordInBrandScope({ brand: alert.brand }, scopedBrandKey)) return;
          fetchedAlerts.push(alert);
        });

        const scopedBrands = Array.from(new Set(fetchedAlerts.map((alert) => alert.brand))).sort();
        const fallbackBrands = ["Highland Coffee", "Starbucks", "Mixue"].filter((brand) => {
          return !scopedBrandKey || normalizeBrandKey(brand) === scopedBrandKey;
        });

        set({
          rawAlerts: fetchedAlerts,
          alerts: applyFilters(fetchedAlerts, get().filters),
          brands: scopedBrands.length ? scopedBrands : fallbackBrands,
          error: null,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể tải dữ liệu cảnh báo";
        set({ error: message });
        console.error("[AlertStore] fetchAlerts error:", message, error);
      } finally {
        set({ isLoading: false });
      }
    },

    updateAlertStatus: async (id, newStatus, profile, attempt) => {
      const currentAlert = get().rawAlerts.find((alert) => alert.id === id);
      if (!profile || !canPerformAction(profile, "update_crisis_status")) {
        throw new Error("User is not allowed to update crisis status.");
      }
      if (!currentAlert || !isSameBrandScope(profile, { brand: currentAlert.brand })) {
        throw new Error("Alert is outside the user's brand scope.");
      }

      const resolvedAt =
        newStatus === "resolved" ? new Date().toISOString() : null;

      const auditFields = {
        updated_by: profile.uid,
        updated_by_role: profile.role,
        updated_at: new Date().toISOString(),
        ...(resolvedAt ? { resolved_by: profile.uid } : {}),
      };

      set((state) => {
        const nextRawAlerts = state.rawAlerts.map((alert) => {
          if (alert.id === id) {
            let nextHistory = alert.resolution_history ? [...alert.resolution_history] : [];
            if (attempt) {
              const newAttemptItem: ResolutionAttempt = {
                attempt_number: nextHistory.length + 1,
                timestamp: new Date().toISOString(),
                note: attempt.note,
                image_url: attempt.image_url,
              };
              nextHistory.push(newAttemptItem);
            }
            return {
              ...alert,
              status: newStatus,
              resolution_history: nextHistory,
              resolved_at: resolvedAt || undefined,
            };
          }
          return alert;
        });

        return {
          rawAlerts: nextRawAlerts,
          alerts: applyFilters(nextRawAlerts, state.filters),
        };
      });

      if (!dbSecond) return;

      try {
        const documentRef = doc(dbSecond, "insightflow_labels", id);
        
        const updateData: Record<string, any> = {
          status: newStatus,
          resolved_at: resolvedAt,
          ...auditFields,
        };

        const targetAlert = get().rawAlerts.find(a => a.id === id);
        if (targetAlert && targetAlert.resolution_history && targetAlert.resolution_history.length > 0) {
          updateData.resolution_history = targetAlert.resolution_history;
        }

        await updateDoc(documentRef, updateData);
      } catch (error) {
        console.error("[AlertStore] Failed to persist alert status:", error);
      }
    },
  })),
);
