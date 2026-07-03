import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { dbSecond } from "@/lib/firebase";
import { collection, doc, limit, query, updateDoc, onSnapshot, addDoc } from "firebase/firestore";
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

export interface CorrectionRequest {
  id: string;
  alert_id: string;
  brand: string;
  requester_uid: string;
  requester_email: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  original_sentiment: string;
  new_sentiment: string;
  original_severity: string;
  new_severity: string;
  original_topic: string;
  new_topic: string;
  reason: string;
  resolved_by?: string;
  resolved_at?: string;
  alert_text?: string;
}

interface AlertState {
  rawAlerts: AlertData[];
  alerts: AlertData[];
  brands: string[];
  isLoading: boolean;
  error: string | null;
  filters: AlertFilters;
  correctionRequests: CorrectionRequest[];
  isLoadingRequests: boolean;
  setFilters: (filters: Partial<AlertFilters>) => void;
  fetchAlerts: (scopedBrandKey?: string | null) => Promise<void>;
  updateAlertStatus: (
    id: string,
    newStatus: string,
    profile: UserRoleProfile | null | undefined,
    attempt?: { note: string; image_url?: string },
  ) => Promise<void>;
  fetchCorrectionRequests: (scopedBrandKey?: string | null) => Promise<void>;
  createCorrectionRequest: (requestData: Omit<CorrectionRequest, "id" | "created_at" | "status">) => Promise<void>;
  resolveCorrectionRequest: (
    requestId: string,
    alertId: string,
    decision: "approved" | "rejected",
    profile: UserRoleProfile | null | undefined
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

let activeUnsubscribe: (() => void) | null = null;

export const useAlertStore = create<AlertState>()(
  subscribeWithSelector((set, get) => ({
    rawAlerts: [],
    alerts: [],
    brands: ["Highland Coffee", "Starbucks", "Mixue"],
    isLoading: false,
    error: null,
    correctionRequests: [],
    isLoadingRequests: false,
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
      if (activeUnsubscribe) {
        activeUnsubscribe();
        activeUnsubscribe = null;
      }

      set({ isLoading: true, error: null });

      try {
        if (!dbSecond) {
          throw new Error("Firebase data project is not configured.");
        }

        const q = query(collection(dbSecond, "insightflow_labels"), limit(500));

        activeUnsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedAlerts: AlertData[] = [];
          snapshot.docs.forEach((document) => {
            const data = document.data();
            const labels = data.labels || {};
            const sentiment = String(
              labels.sentiment || data.baseline_sentiment || data.sentiment || "neutral",
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
            isLoading: false,
          });
        }, (error) => {
          const message = error instanceof Error ? error.message : "Lỗi đồng bộ realtime";
          set({ error: message, isLoading: false });
          console.error("[AlertStore] onSnapshot error:", message, error);
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể khởi tạo đồng bộ";
        set({ error: message, isLoading: false });
        console.error("[AlertStore] fetchAlerts error:", message, error);
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
        newStatus === "resolved" ? new Date().toISOString() : undefined;
      const auditFields = {
        updated_by: profile.uid,
        updated_by_role: profile.role,
        updated_at: new Date().toISOString(),
        ...(resolvedAt ? { resolved_by: profile.uid } : {}),
      };

      let newAttemptItem: ResolutionAttempt | undefined = undefined;

      set((state) => {
        const nextRawAlerts = state.rawAlerts.map((alert) => {
          if (alert.id === id) {
            let nextHistory = alert.resolution_history ? [...alert.resolution_history] : [];
            if (attempt) {
              newAttemptItem = {
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
          ...(resolvedAt ? { resolved_at: resolvedAt } : {}),
          ...auditFields,
        };

        const targetAlert = get().rawAlerts.find((a) => a.id === id);
        if (targetAlert && targetAlert.resolution_history && targetAlert.resolution_history.length > 0) {
          updateData.resolution_history = targetAlert.resolution_history;
        }

        await updateDoc(documentRef, updateData);
      } catch (error) {
        console.error("[AlertStore] Failed to persist alert status:", error);
      }
    },

    fetchCorrectionRequests: async (scopedBrandKey = null) => {
      set({ isLoadingRequests: true });
      try {
        if (!dbSecond) throw new Error("Firebase data project is not configured.");

        const q = query(collection(dbSecond, "insightflow_correction_requests"), limit(500));
        
        onSnapshot(q, (snapshot) => {
          const requests: CorrectionRequest[] = [];
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const req = {
              id: docSnap.id,
              alert_id: data.alert_id,
              brand: data.brand,
              requester_uid: data.requester_uid,
              requester_email: data.requester_email,
              created_at: data.created_at,
              status: data.status,
              original_sentiment: data.original_sentiment,
              new_sentiment: data.new_sentiment,
              original_severity: data.original_severity,
              new_severity: data.new_severity,
              original_topic: data.original_topic,
              new_topic: data.new_topic,
              reason: data.reason,
              resolved_by: data.resolved_by,
              resolved_at: data.resolved_at,
              alert_text: data.alert_text,
            } as CorrectionRequest;

            if (!isRecordInBrandScope({ brand: req.brand }, scopedBrandKey)) return;
            requests.push(req);
          });

          requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          set({ correctionRequests: requests, isLoadingRequests: false });
        }, (error) => {
          console.error("[AlertStore] fetchCorrectionRequests error:", error);
          set({ isLoadingRequests: false });
        });
      } catch (error) {
        console.error("[AlertStore] fetchCorrectionRequests error:", error);
        set({ isLoadingRequests: false });
      }
    },

    createCorrectionRequest: async (requestData) => {
      if (!dbSecond) throw new Error("Firebase data project is not configured.");
      
      const newDoc = {
        ...requestData,
        created_at: new Date().toISOString(),
        status: "pending" as const,
      };

      await addDoc(collection(dbSecond, "insightflow_correction_requests"), newDoc);
    },

    resolveCorrectionRequest: async (requestId, alertId, decision, profile) => {
      if (!dbSecond) throw new Error("Firebase data project is not configured.");
      if (!profile) throw new Error("User is not authenticated.");

      const requestRef = doc(dbSecond, "insightflow_correction_requests", requestId);
      
      await updateDoc(requestRef, {
        status: decision,
        resolved_by: profile.uid,
        resolved_at: new Date().toISOString(),
      });

      if (decision === "approved") {
        const req = get().correctionRequests.find((r) => r.id === requestId);
        if (!req) return;

        const alertRef = doc(dbSecond, "insightflow_labels", alertId);
        
        await updateDoc(alertRef, {
          sentiment: req.new_sentiment,
          "labels.sentiment": req.new_sentiment,
          severity: req.new_severity,
          "labels.urgency": req.new_severity,
          topic: req.new_topic,
          "labels.topic": req.new_topic,
        });
      }
    },
  })),
);
