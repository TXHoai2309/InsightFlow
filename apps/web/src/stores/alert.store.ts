import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { dbSecond } from "@/lib/firebase";
import { collection, doc, getDocs, limit, query, updateDoc } from "firebase/firestore";
import { isRecordInBrandScope } from "@/lib/brandScope";
import { normalizeBrandName } from "@/lib/services/dashboard";

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
  updateAlertStatus: (id: string, newStatus: string) => Promise<void>;
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
        if (!dbSecond) {
          throw new Error("Firebase data project is not configured.");
        }

        const snapshot = await getDocs(
          query(collection(dbSecond, "insightflow_labels"), limit(500)),
        );

        const fetchedAlerts: AlertData[] = [];
        snapshot.docs.forEach((document) => {
          const data = document.data();
          const labels = data.labels || {};
          const sentiment = String(
            labels.sentiment || data.sentiment || "neutral",
          ).toLowerCase();

          if (sentiment !== "negative") return;

          const text = String(
            data.clean_text ||
              data.original_text ||
              data.text ||
              data.content ||
              "",
          );

          const alert = {
            id: String(data.id || document.id),
            brand: formatBrandName(String(data.brand || "")),
            source: normalizeSource(String(data.source || "")),
            text,
            sentiment,
            topic: normalizeTopic(labels.topic || data.topic),
            severity: calculateSeverity(data),
            created_at: parseDate(
              data.labeled_at ||
                data.uploaded_at ||
                data.posted_at ||
                data.created_at,
            ),
            status: String(data.status || "new"),
            resolved_at: data.resolved_at ? parseDate(data.resolved_at) : undefined,
            collectionName: "insightflow_labels",
            url: String(data.url || ""),
            reach: Number(data.reach || data.views || 0),
            likes: Number(data.likes || data.like_count || 0),
            comments: Number(data.comments || data.comment_count || 0),
            shares: Number(data.shares || data.share_count || 0),
            author: String(data.author || data.author_name || "Ẩn danh"),
            title: text.slice(0, 120),
          };

          if (!isRecordInBrandScope({ brand: alert.brand }, scopedBrandKey)) return;
          fetchedAlerts.push(alert);
        });

        const scopedBrands = Array.from(new Set(fetchedAlerts.map((alert) => alert.brand))).sort();
        const fallbackBrands = ["Highland Coffee", "Starbucks", "Mixue"].filter((brand) => {
          return !scopedBrandKey || normalizeBrandName(brand) === scopedBrandKey;
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

    updateAlertStatus: async (id, newStatus) => {
      const resolvedAt =
        newStatus === "resolved" ? new Date().toISOString() : undefined;

      set((state) => {
        const nextRawAlerts = state.rawAlerts.map((alert) =>
          alert.id === id
            ? {
                ...alert,
                status: newStatus,
                ...(resolvedAt ? { resolved_at: resolvedAt } : {}),
              }
            : alert,
        );

        return {
          rawAlerts: nextRawAlerts,
          alerts: applyFilters(nextRawAlerts, state.filters),
        };
      });

      if (!dbSecond) return;

      try {
        const documentRef = doc(dbSecond, "insightflow_labels", id);
        await updateDoc(documentRef, {
          status: newStatus,
          ...(resolvedAt ? { resolved_at: resolvedAt } : {}),
        });
      } catch (error) {
        console.error("[AlertStore] Failed to persist alert status:", error);
      }
    },
  })),
);
