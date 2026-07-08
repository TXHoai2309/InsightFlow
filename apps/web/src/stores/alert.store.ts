import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { dbSecond } from "@/lib/firebase";
import { collection, doc, limit, query, updateDoc, onSnapshot, addDoc } from "firebase/firestore";
import { isRecordInBrandScope, isSameBrandScope } from "@/lib/brandScope";
import { normalizeBrandName } from "@/lib/services/dashboard";
import { canPerformAction, type UserRoleProfile } from "@/lib/rbac";
import { fetchSupabaseAlerts, updateSupabaseAlertLabel } from "@/lib/supabase";

function getResolverName(emailOrId: string | null | undefined): string {
  if (!emailOrId) return "";
  if (!emailOrId.includes("@")) return emailOrId;
  const e = emailOrId.toLowerCase();
  if (e.includes("crisis")) return "Nguyen Van Crisis";
  if (e.includes("lead")) return "Tran Thi Lead";
  if (e.includes("admin")) return "InsightFlow Admin";
  if (e.includes("manager")) {
    if (e.includes("highland")) return "Highlands Brand Manager";
    if (e.includes("starbuck")) return "Starbucks Brand Manager";
    if (e.includes("mixue")) return "Mixue Brand Manager";
    return "Brand Manager";
  }
  const local = emailOrId.split("@")[0];
  return local.split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function normalizeBrandId(brand: string): string {
  if (!brand) return "other";
  let b = brand.toLowerCase().trim();
  if (b.includes("mixue")) return "mixue";
  if (b.includes("starbuck")) return "starbucks";
  if (b.includes("highland")) return "highland-coffee";

  return b.replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export interface ResolutionAttempt {
  attempt_number: number;
  timestamp: string;
  note: string;
  image_url?: string;
  resolved_by_email?: string;
  resolved_by_name?: string;
}

export interface InternalNote {
  note: string;
  author: string;
  timestamp: string;
}

export interface AlertData {
  id: string;
  brand: string;
  source: string;
  text: string;
  sentiment: string;
  topic: string;
  severity: string;
  negativity_score: number;
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
  being_resolved_by?: string | null;
  being_resolved_at?: string | null;
  resolution_history?: ResolutionAttempt[];
  resolved_by_email?: string | null;
  resolved_by_name?: string | null;
  post_content?: string;
  comment_content?: string;
  parent_id?: string | null;
  content_type?: string;
  internal_notes?: InternalNote[];
  post_id?: string;
  post_url?: string;
  post_like_count?: number;
  post_comment_count?: number;
  post_share_count?: number;
  relevance?: boolean | null;
  urgency?: string | null;
  intent?: string | null;
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
  original_relevance: boolean | null;
  new_relevance: boolean | null;
  original_urgency: string | null;
  new_urgency: string | null;
  original_intent: string | null;
  new_intent: string | null;
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
    attempt?: { note: string; image_url?: string }
  ) => Promise<void>;
  fetchCorrectionRequests: (scopedBrandKey?: string | null) => Promise<void>;
  createCorrectionRequest: (requestData: Omit<CorrectionRequest, "id" | "created_at" | "status">) => Promise<void>;
  resolveCorrectionRequest: (
    requestId: string,
    alertId: string,
    decision: "approved" | "rejected",
    profile: UserRoleProfile | null | undefined
  ) => Promise<void>;
  lockAlertForResolution: (id: string, profile: UserRoleProfile | null | undefined) => Promise<void>;
  unlockAlertForResolution: (id: string) => Promise<void>;
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
  if (normalized.includes("thread")) return "thread";
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

function calculateSeverity(_data: any): string {
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
        const loadAlerts = async () => {
          try {
            const fetched = await fetchSupabaseAlerts();
            const filtered = fetched.filter((alert) =>
              isRecordInBrandScope({ brand: alert.brand }, scopedBrandKey)
            );

            const scopedBrands = Array.from(new Set(filtered.map((alert) => alert.brand))).sort();
            const fallbackBrands = ["Highland Coffee", "Starbucks", "Mixue"].filter((brand) => {
              return !scopedBrandKey || normalizeBrandName(brand) === scopedBrandKey;
            });

            set({
              rawAlerts: filtered,
              alerts: applyFilters(filtered, get().filters),
              brands: scopedBrands.length ? scopedBrands : fallbackBrands,
              error: null,
              isLoading: false,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Lỗi đồng bộ Supabase";
            set({ error: message, isLoading: false });
            console.error("[AlertStore] poll error:", message, error);
          }
        };

        await loadAlerts();

        const intervalId = setInterval(loadAlerts, 60000);
        activeUnsubscribe = () => clearInterval(intervalId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể khởi tạo đồng bộ";
        set({ error: message, isLoading: false });
        console.error("[AlertStore] fetchAlerts error:", message, error);
      }
    },

    updateAlertStatus: async (id, newStatus, profile, attempt) => {
      console.log("[AlertStore] updateAlertStatus called:", { id, newStatus, profileEmail: profile?.email, profileRole: profile?.role });
      const currentAlert = get().rawAlerts.find((alert) => alert.id === id);
      console.log("[AlertStore] currentAlert found:", currentAlert);

      if (!profile || !canPerformAction(profile, "update_crisis_status")) {
        console.error("[AlertStore] Permission check failed:", { profileExists: !!profile, hasPermission: profile ? canPerformAction(profile, "update_crisis_status") : false });
        throw new Error("User is not allowed to update crisis status.");
      }
      if (!currentAlert || !isSameBrandScope(profile, { brand: currentAlert.brand })) {
        console.error("[AlertStore] Brand scope check failed:", { alertExists: !!currentAlert, sameScope: currentAlert ? isSameBrandScope(profile, { brand: currentAlert.brand }) : false });
        throw new Error("Alert is outside the user's brand scope.");
      }

      const resolvedAt =
        newStatus === "resolved" ? new Date().toISOString() : null;
      const auditFields = {
        updated_by: profile.uid,
        updated_by_role: profile.role,
        updated_at: new Date().toISOString(),
      };

      set((state) => {
        const nextRawAlerts = state.rawAlerts.map((alert) => {
          if (alert.id === id) {
            // When restoring to 'new' (Khôi phục), clear history so the alert starts fresh
            if (newStatus === "new") {
              return {
                ...alert,
                status: newStatus,
                resolution_history: undefined,
                resolved_at: undefined,
                resolved_by_email: null,
                resolved_by_name: null,
              };
            }

            let nextHistory = alert.resolution_history ? [...alert.resolution_history] : [];
            if (attempt) {
              const newAttemptItem: ResolutionAttempt = {
                attempt_number: nextHistory.length + 1,
                timestamp: new Date().toISOString(),
                note: attempt.note,
                resolved_by_email: profile.email ?? undefined,
                resolved_by_name: profile.displayName ?? undefined,
                ...(attempt.image_url ? { image_url: attempt.image_url } : {}),
              };
              nextHistory.push(newAttemptItem);
            }
            return {
              ...alert,
              status: newStatus,
              resolution_history: nextHistory,
              resolved_at: resolvedAt || undefined,
              resolved_by_email: resolvedAt ? profile.email : null,
              resolved_by_name: resolvedAt ? profile.displayName : null,
            };
          }
          return alert;
        });

        return {
          rawAlerts: nextRawAlerts,
          alerts: applyFilters(nextRawAlerts, state.filters),
        };
      });

      try {
        await updateSupabaseAlertLabel(id, (existingLabel) => {
          let nextHistory = existingLabel.resolution_history ? [...existingLabel.resolution_history] : [];
          if (attempt) {
            nextHistory.push({
              attempt_number: nextHistory.length + 1,
              timestamp: new Date().toISOString(),
              note: attempt.note,
              resolved_by_email: profile.email ?? undefined,
              resolved_by_name: profile.displayName ?? undefined,
              ...(attempt.image_url ? { image_url: attempt.image_url } : {}),
            });
          }

          if (newStatus === "new") {
            return {
              ...existingLabel,
              resolution_status: newStatus,
              resolution_history: [],
              resolved_at: null,
              resolved_by_email: null,
              resolved_by_name: null,
              updated_by: profile.uid,
              updated_by_role: profile.role,
              updated_at: new Date().toISOString(),
            };
          }

          return {
            ...existingLabel,
            resolution_status: newStatus,
            resolution_history: nextHistory,
            resolved_at: resolvedAt,
            resolved_by: resolvedAt ? profile.uid : null,
            resolved_by_email: resolvedAt ? profile.email : null,
            resolved_by_name: resolvedAt ? profile.displayName : null,
            updated_by: profile.uid,
            updated_by_role: profile.role,
            updated_at: new Date().toISOString(),
          };
        });
      } catch (error) {
        console.error("[AlertStore] Failed to persist alert status:", error);
        // Revert local state update
        set((state) => {
          const nextRawAlerts = state.rawAlerts.map((alert) => {
            if (alert.id === id) {
              return currentAlert;
            }
            return alert;
          });
          return {
            rawAlerts: nextRawAlerts,
            alerts: applyFilters(nextRawAlerts, state.filters),
          };
        });
        throw error;
      }
    },

    fetchCorrectionRequests: async (scopedBrandKey = null) => {
      set({ isLoadingRequests: true });
      try {
        if (!dbSecond) throw new Error("Firebase data project is not configured.");

        const q = query(collection(dbSecond, "label_change_requests"), limit(500));

        onSnapshot(q, (snapshot) => {
          const requests: CorrectionRequest[] = [];
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            let recordBrand = data.brand_name || data.brand;
            if (!recordBrand) {
              const email = String(data.requested_by_email || data.requester_email || "").toLowerCase();
              if (email.includes("highland")) recordBrand = "Highland Coffee";
              else if (email.includes("starbuck")) recordBrand = "Starbucks";
              else if (email.includes("mixue")) recordBrand = "Mixue";
            }

            const req = {
              id: docSnap.id,
              alert_id: data.mention_id || data.alert_id,
              brand: recordBrand || "",
              requester_uid: data.requested_by_uid || data.requester_uid || "",
              requester_email: data.requested_by_email || data.requester_email || "",
              created_at: data.created_at,
              status: data.status,
              original_sentiment: data.old_label?.sentiment || data.original_sentiment || "neutral",
              new_sentiment: data.proposed_label?.sentiment || data.new_sentiment || "neutral",
              original_severity: data.old_label?.urgency || data.original_severity || "medium",
              new_severity: data.proposed_label?.urgency || data.new_severity || "medium",
              original_topic: data.old_label?.topic || data.original_topic || "other",
              new_topic: data.proposed_label?.topic || data.new_topic || "other",
              original_relevance: data.old_label?.relevance !== undefined ? data.old_label.relevance : (data.original_relevance !== undefined ? data.original_relevance : null),
              new_relevance: data.proposed_label?.relevance !== undefined ? data.proposed_label.relevance : (data.new_relevance !== undefined ? data.new_relevance : null),
              original_urgency: data.old_label?.urgency || data.original_urgency || "medium",
              new_urgency: data.proposed_label?.urgency || data.new_urgency || "medium",
              original_intent: data.old_label?.intent || data.original_intent || "none",
              new_intent: data.proposed_label?.intent || data.new_intent || "none",
              reason: data.reason,
              resolved_by: data.reviewed_by_uid || data.resolved_by || "",
              resolved_at: data.reviewed_at || data.resolved_at || "",
              alert_text: data.mention?.content || data.alert_text || "",
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

    createCorrectionRequest: async (requestData: any) => {
      if (!dbSecond) throw new Error("Firebase data project is not configured.");

      const alert = requestData.alert_full;
      const cleanBrandId = normalizeBrandId(requestData.brand || "");

      const newDoc = {
        status: "pending" as const,
        brand_id: cleanBrandId,
        brand_name: requestData.brand || "",
        mention_id: requestData.alert_id,
        requested_by_name: getResolverName(requestData.requester_email || ""),
        requested_by_email: requestData.requester_email || "",
        requested_by_role: "crisis_employee",
        reason: requestData.reason || "",
        old_label: {
          sentiment: requestData.original_sentiment || "neutral",
          topic: requestData.original_topic || "other",
          relevance: requestData.original_relevance,
          urgency: requestData.original_urgency || "normal",
          intent: requestData.original_intent || "none",
        },
        proposed_label: {
          sentiment: requestData.new_sentiment || "neutral",
          topic: requestData.new_topic || "other",
          relevance: requestData.new_relevance,
          urgency: requestData.new_urgency || "normal",
          intent: requestData.new_intent || "none",
        },
        mention: {
          id: requestData.alert_id,
          parent_id: alert?.parent_id || null,
          platform: alert?.source || "unknown",
          content_type: alert?.content_type || "post",
          content: alert?.text || "",
          post_content: alert?.post_content || "",
          comment_content: alert?.comment_content || "",
          author: alert?.author || "Không rõ tác giả",
          posted_at: alert?.created_at || new Date().toISOString(),
          url: alert?.url || "",
        },
        history: [
          {
            action: "created",
            by_name: getResolverName(requestData.requester_email || ""),
            at: new Date().toISOString(),
            from: {
              sentiment: requestData.original_sentiment || "neutral",
              topic: requestData.original_topic || "other",
              relevance: requestData.original_relevance,
              urgency: requestData.original_urgency || "normal",
              intent: requestData.original_intent || "none",
            },
            to: {
              sentiment: requestData.new_sentiment || "neutral",
              topic: requestData.new_topic || "other",
              relevance: requestData.new_relevance,
              urgency: requestData.new_urgency || "normal",
              intent: requestData.new_intent || "none",
            },
            note: requestData.reason || "",
          }
        ],
        created_at: new Date().toISOString(),
      };

      await addDoc(collection(dbSecond, "label_change_requests"), newDoc);
    },

    resolveCorrectionRequest: async (requestId, alertId, decision, profile) => {
      if (!dbSecond) throw new Error("Firebase data project is not configured.");
      if (!profile) throw new Error("User is not authenticated.");

      // Read correction data synchronously BEFORE any await.
      const req = get().correctionRequests.find((r) => r.id === requestId);

      const requestRef = doc(dbSecond, "label_change_requests", requestId);

      const changedAt = new Date().toISOString();
      const nextHistory = [
        {
          action: decision,
          by_name: profile.displayName || profile.email || "Brand Manager",
          by_email: profile.email,
          at: changedAt,
          from: {
            sentiment: req?.original_sentiment,
            topic: req?.original_topic,
            relevance: req?.original_relevance,
            urgency: req?.original_urgency,
            intent: req?.original_intent,
          },
          to: {
            sentiment: req?.new_sentiment,
            topic: req?.new_topic,
            relevance: req?.new_relevance,
            urgency: req?.new_urgency,
            intent: req?.new_intent,
          },
        }
      ];

      await updateDoc(requestRef, {
        status: decision,
        reviewed_by_uid: profile.uid,
        reviewed_by_name: profile.displayName || profile.email || "",
        reviewed_by_email: profile.email || "",
        reviewed_at: changedAt,
        history: nextHistory,
        updated_at: changedAt,
      });

      // Also create history audit entry
      await addDoc(collection(dbSecond, "label_change_history"), {
        request_id: requestId,
        brand_id: normalizeBrandId(req?.brand || ""),
        brand_name: req?.brand || "",
        mention_id: alertId,
        mention_content: req?.alert_text || "",
        action: decision,
        status: decision,
        old_label: {
          sentiment: req?.original_sentiment,
          topic: req?.original_topic,
          relevance: req?.original_relevance,
          urgency: req?.original_urgency,
          intent: req?.original_intent,
        },
        new_label: {
          sentiment: req?.new_sentiment,
          topic: req?.new_topic,
          relevance: req?.new_relevance,
          urgency: req?.new_urgency,
          intent: req?.new_intent,
        },
        requested_by_name: getResolverName(req?.requester_email || ""),
        requested_by_email: req?.requester_email || "",
        requested_by_role: "crisis_employee",
        reviewed_by_uid: profile.uid,
        reviewed_by_name: profile.displayName || profile.email || "",
        reviewed_by_email: profile.email || "",
        note: req?.reason || "",
        source: "brand_manager_review",
        changed_at: changedAt,
        created_at: changedAt,
      });

      if (decision === "approved" && req) {
        await updateSupabaseAlertLabel(alertId, (existingLabel) => ({
          ...existingLabel,
          sentiment: req.new_sentiment,
          severity: req.new_severity,
          urgency: req.new_urgency ?? req.new_severity,
          topic: [req.new_topic],
          relevance: req.new_relevance,
          intent: req.new_intent,
        }));
      }
    },

    lockAlertForResolution: async (id, profile) => {
      if (!profile) return;
      try {
        await updateSupabaseAlertLabel(id, (existingLabel) => ({
          ...existingLabel,
          being_resolved_by: profile.email,
          being_resolved_at: new Date().toISOString(),
        }));
      } catch (error) {
        console.error("[AlertStore] Failed to lock alert:", error);
      }
    },

    unlockAlertForResolution: async (id) => {
      try {
        await updateSupabaseAlertLabel(id, (existingLabel) => ({
          ...existingLabel,
          being_resolved_by: null,
          being_resolved_at: null,
        }));
      } catch (error) {
        console.error("[AlertStore] Failed to unlock alert:", error);
      }
    },
  })),
);
