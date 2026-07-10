import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { dbSecond } from "@/lib/firebase";
import { collection, doc, updateDoc, addDoc } from "firebase/firestore";
import { isRecordInBrandScope, isSameBrandScope, getScopedBrandKey } from "@/lib/brandScope";
import { normalizeBrandName } from "@/lib/services/dashboard";
import { canPerformAction, type UserRoleProfile } from "@/lib/rbac";
import { fetchSupabaseAlerts, updateSupabaseAlertLabel, supabaseRequest } from "@/lib/supabase";
import { supabaseClient } from "@/lib/supabaseClient";
import { normalizeClassificationLabel } from "@/lib/label-change";

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

export interface EscalationData {
  draft_response: string;
  compensation: string;
  submitted_by_email: string;
  submitted_by_name: string;
  submitted_at: string;
  status: "pending" | "approved" | "rejected";
  approved_by_email?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  approved_response?: string | null;
  compensation_approved?: string | null;
  approval_note?: string;
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
  escalation?: EscalationData | null;
  monitoring_started_at?: string;
  monitoring_duration_hours?: number;
  monitoring_initial_comments?: number;
  monitoring_initial_likes?: number;
  monitoring_initial_shares?: number;
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
    attempt?: {
      note: string;
      image_url?: string;
      escalation?: EscalationData | null;
      monitoring_duration_hours?: number;
    },
    brandFallback?: string
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
  recentLocks: Record<string, { email: string | null; timestamp: number }>;
}

function parseDate(field: unknown): string {
  if (!field) return "1970-01-01T00:00:00Z";
  if (typeof (field as any).toDate === "function") {
    return (field as any).toDate().toISOString();
  }
  if (field instanceof Date) return field.toISOString();
  if (typeof (field as any).seconds === "number") {
    return new Date((field as any).seconds * 1000).toISOString();
  }

  const value = String(field).trim();
  if (!value) return "1970-01-01T00:00:00Z";
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
  if (key === "highlandcoffee") return "Highlands Coffee";
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
const ALERT_REVIEW_WINDOW_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ALERT_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export function getAlertReviewSinceIso(days = ALERT_REVIEW_WINDOW_DAYS): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString();
}

function isWithinAlertReviewWindow(value: unknown, days = ALERT_REVIEW_WINDOW_DAYS): boolean {
  const time = new Date(parseDate(value)).getTime();
  return Number.isFinite(time) && time >= Date.now() - days * MS_PER_DAY;
}

export const useAlertStore = create<AlertState>()(
  subscribeWithSelector((set, get) => ({
    rawAlerts: [],
    alerts: [],
    brands: ["Highlands Coffee", "Starbucks", "Mixue"],
    isLoading: false,
    error: null,
    correctionRequests: [],
    isLoadingRequests: false,
    recentLocks: {},
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
      // Clean up any existing subscription/interval
      if (activeUnsubscribe) {
        activeUnsubscribe();
        activeUnsubscribe = null;
      }

      set({ isLoading: true, error: null });

      const loadAlerts = async () => {
        try {
          const fetched = await fetchSupabaseAlerts({ since: getAlertReviewSinceIso() });
          const filtered = fetched.filter((alert) =>
            isWithinAlertReviewWindow(alert.created_at) &&
            isRecordInBrandScope({ brand: alert.brand }, scopedBrandKey)
          );

          const scopedBrands = Array.from(new Set(filtered.map((alert) => alert.brand))).sort();
          const fallbackBrands = ["Highlands Coffee", "Starbucks", "Mixue"].filter((brand) => {
            return !scopedBrandKey || normalizeBrandName(brand) === scopedBrandKey;
          });

          // Merge with recent lock cache to avoid race condition overwrites
          const recentLocks = get().recentLocks || {};
          const merged = filtered.map((fetchedAlert) => {
            const recent = recentLocks[fetchedAlert.id];
            if (recent && Date.now() - recent.timestamp < 15000) {
              return {
                ...fetchedAlert,
                being_resolved_by: recent.email,
                being_resolved_at: recent.email
                  ? fetchedAlert.being_resolved_at || new Date(recent.timestamp).toISOString()
                  : null,
              };
            }
            return fetchedAlert;
          });

          // Auto-closure check
          const monitoringAlerts = merged.filter(a => a.status === "monitoring");
          if (monitoringAlerts.length > 0) {
            monitoringAlerts.forEach((alert) => {
              const startedAt = alert.monitoring_started_at ? new Date(alert.monitoring_started_at).getTime() : new Date(alert.created_at).getTime();
              const durationMs = (alert.monitoring_duration_hours ?? 72) * 60 * 60 * 1000;
              const now = Date.now();
              if (now - startedAt >= durationMs) {
                const initialComments = alert.monitoring_initial_comments ?? 0;
                const initialLikes = alert.monitoring_initial_likes ?? 0;
                const initialShares = alert.monitoring_initial_shares ?? 0;

                const currentComments = alert.comments ?? 0;
                const currentLikes = alert.likes ?? 0;
                const currentShares = alert.shares ?? 0;

                const hasNewActivity = currentComments > initialComments || currentLikes > (initialLikes + 5) || currentShares > initialShares;

                if (!hasNewActivity) {
                  console.log(`[AlertStore] Auto-closing alert ${alert.id}`);
                  updateSupabaseAlertLabel(alert.id, (existingLabel) => {
                    return {
                      ...existingLabel,
                      resolution_status: "resolved",
                      resolved_at: new Date().toISOString(),
                      resolved_by_email: "system@insightflow.ai",
                      resolved_by_name: "Hệ thống tự động",
                      resolution_history: [
                        ...(existingLabel.resolution_history || []),
                        {
                          attempt_number: (existingLabel.resolution_history?.length || 0) + 1,
                          timestamp: new Date().toISOString(),
                          note: "Hệ thống tự động đóng vụ việc sau thời gian theo dõi không phát sinh hoạt động bất thường.",
                          resolved_by_email: "system@insightflow.ai",
                          resolved_by_name: "Hệ thống tự động"
                        }
                      ],
                      updated_at: new Date().toISOString()
                    };
                  }).catch(err => console.error("[AlertStore] Auto-close failed:", err));
                }
              }
            });
          }

          set({
            rawAlerts: merged,
            alerts: applyFilters(merged, get().filters),
            brands: scopedBrands.length ? scopedBrands : fallbackBrands,
            error: null,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Lỗi đồng bộ Supabase";
          set({ error: message, isLoading: false });
          console.error("[AlertStore] loadAlerts error:", message, error);
        }
      };

      try {
        // Initial load
        await loadAlerts();

        const cleanupFns: (() => void)[] = [];

        // ===== STRATEGY 1: Supabase Realtime subscription =====
        // Listens for ANY UPDATE on the annotations table and triggers a full reload.
        // This gives sub-second updates to ALL connected clients simultaneously.
        if (supabaseClient) {
          try {
            const channel = supabaseClient
              .channel("alert-annotations-global")
              .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "annotations" },
                () => {
                  // Push notification received — reload full list
                  loadAlerts();
                }
              )
              .subscribe((status: any) => {
                console.log("[AlertStore] Realtime subscription status:", status);
              });

            cleanupFns.push(() => { if (supabaseClient) supabaseClient.removeChannel(channel); });

            console.log("[AlertStore] ✅ Supabase Realtime active — instant cross-client sync enabled");
          } catch (realtimeErr) {
            console.warn("[AlertStore] Realtime init failed, falling back to polling:", realtimeErr);
          }
        }

        // ===== STRATEGY 2: Fallback polling (30 min) =====
        const intervalId = setInterval(loadAlerts, ALERT_REFRESH_INTERVAL_MS);
        cleanupFns.push(() => clearInterval(intervalId));

        activeUnsubscribe = () => cleanupFns.forEach((fn) => fn());
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể khởi tạo đồng bộ";
        set({ error: message, isLoading: false });
        console.error("[AlertStore] fetchAlerts error:", message, error);
      }
    },

    updateAlertStatus: async (id, newStatus, profile, attempt, brandFallback) => {
      console.log("[AlertStore] updateAlertStatus called:", { id, newStatus, profileEmail: profile?.email, profileRole: profile?.role });
      const currentAlert = get().rawAlerts.find((alert) => alert.id === id);
      console.log("[AlertStore] currentAlert found:", currentAlert);

      if (!profile || !canPerformAction(profile, "update_crisis_status")) {
        console.error("[AlertStore] Permission check failed:", { profileExists: !!profile, hasPermission: profile ? canPerformAction(profile, "update_crisis_status") : false });
        throw new Error("User is not allowed to update crisis status.");
      }

      const resolvedBrand = currentAlert?.brand || brandFallback;

      console.log("[AlertStore] Brand scope check diagnostic:", {
        profileEmail: profile?.email,
        profileRole: profile?.role,
        profileBrandName: profile?.brandName,
        profileBrandId: profile?.brandId,
        scopedBrandKey: getScopedBrandKey(profile),
        currentAlertBrand: currentAlert?.brand,
        brandFallback,
        resolvedBrand,
        currentAlertNormalized: resolvedBrand ? normalizeBrandName(resolvedBrand) : null,
      });

      if (!resolvedBrand || !isSameBrandScope(profile, { brand: resolvedBrand })) {
        console.error("[AlertStore] Brand scope check failed:", { resolvedBrand, sameScope: resolvedBrand ? isSameBrandScope(profile, { brand: resolvedBrand }) : false });
        throw new Error(`Alert is outside the user's brand scope. Profile: [Name: ${profile?.brandName}, ID: ${profile?.brandId}], Alert Brand: [${resolvedBrand}]`);
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
                escalation: null,
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
              escalation: attempt?.escalation !== undefined ? attempt.escalation : alert.escalation,
              // When claiming a task, set being_resolved_by immediately in local state
              // so the filter hides it from other officers instantly
              ...(newStatus === "resolving" ? {
                being_resolved_by: profile.email,
                being_resolved_at: new Date().toISOString(),
              } : {}),
              // When resolved, clear the lock
              ...(newStatus === "resolved" ? {
                being_resolved_by: null,
                being_resolved_at: null,
              } : {}),
              ...(newStatus === "monitoring" ? {
                monitoring_started_at: new Date().toISOString(),
                monitoring_duration_hours: attempt?.monitoring_duration_hours ?? 72,
                monitoring_initial_comments: alert.comments || 0,
                monitoring_initial_likes: alert.likes || 0,
                monitoring_initial_shares: alert.shares || 0,
              } : {}),
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
              escalation: null,
            };
          }

          const updateObj: any = {
            ...existingLabel,
            resolution_status: newStatus,
            resolution_history: nextHistory,
            resolved_at: resolvedAt,
            resolved_by: resolvedAt ? profile.uid : null,
            resolved_by_email: resolvedAt ? profile.email : null,
            resolved_by_name: resolvedAt ? profile.displayName : null,
            escalation: attempt?.escalation !== undefined ? attempt.escalation : existingLabel.escalation ?? null,
            updated_by: profile.uid,
            updated_by_role: profile.role,
            updated_at: new Date().toISOString(),
          };

          if (newStatus === "monitoring") {
            updateObj.monitoring_started_at = new Date().toISOString();
            updateObj.monitoring_duration_hours = attempt?.monitoring_duration_hours ?? 72;
            updateObj.monitoring_initial_comments = currentAlert?.comments || 0;
            updateObj.monitoring_initial_likes = currentAlert?.likes || 0;
            updateObj.monitoring_initial_shares = currentAlert?.shares || 0;
          }

          return updateObj;
        });
      } catch (error) {
        console.error("[AlertStore] Failed to persist alert status:", error);
        // Revert local state update
        set((state) => {
          const nextRawAlerts = state.rawAlerts.map((alert) => {
            if (alert.id === id && currentAlert) {
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
        const loadFromSupabase = async () => {
          const rows = await supabaseRequest<Record<string, any>[]>(
            "label_change_requests",
            "order=created_at.desc&limit=500",
          );
          const requests: CorrectionRequest[] = [];
          rows.forEach((data) => {
            let recordBrand = data.brand_name || data.brand || data.workspace_id || data.brand_id;
            if (!recordBrand) {
              const email = String(data.requested_by_email || data.requester_email || "").toLowerCase();
              if (email.includes("highland")) recordBrand = "Highlands Coffee";
              else if (email.includes("starbuck")) recordBrand = "Starbucks";
              else if (email.includes("mixue")) recordBrand = "Mixue";
            }
            const currentLabel = normalizeClassificationLabel(data.current_labels || data.old_label);
            const requestedLabel = normalizeClassificationLabel(data.requested_labels || data.proposed_label, currentLabel);
            const firstCurrentTopic = currentLabel.topic[0] || "other";
            const firstRequestedTopic = requestedLabel.topic[0] || firstCurrentTopic;

            const req = {
              id: String(data.id || ""),
              alert_id: String(data.mention_id || data.source_id || data.alert_id || ""),
              brand: recordBrand || "",
              requester_uid: data.requested_by_uid || data.requester_uid || "",
              requester_email: data.requested_by_email || data.requester_email || "",
              created_at: parseDate(data.requested_at || data.created_at),
              status: data.status || "pending",
              original_sentiment: currentLabel.sentiment || "neutral",
              new_sentiment: requestedLabel.sentiment || currentLabel.sentiment || "neutral",
              original_severity: currentLabel.urgency || "medium",
              new_severity: requestedLabel.urgency || currentLabel.urgency || "medium",
              original_topic: firstCurrentTopic,
              new_topic: firstRequestedTopic,
              original_relevance: currentLabel.relevance,
              new_relevance: requestedLabel.relevance,
              original_urgency: currentLabel.urgency || "medium",
              new_urgency: requestedLabel.urgency || currentLabel.urgency || "medium",
              original_intent: currentLabel.intent || "none",
              new_intent: requestedLabel.intent || currentLabel.intent || "none",
              reason: data.reason_note || data.reason || data.reason_code || "",
              resolved_by: data.reviewed_by_uid || data.resolved_by || "",
              resolved_at: data.reviewed_at || data.resolved_at || "",
              alert_text: data.content_preview || data.mention_content || data.alert_text || "",
            } as CorrectionRequest;

            if (!isRecordInBrandScope({ brand: req.brand }, scopedBrandKey)) return;
            if (!isWithinAlertReviewWindow(req.created_at)) return;
            requests.push(req);
          });

          requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          set({ correctionRequests: requests, isLoadingRequests: false });
        };

        await loadFromSupabase();

        if (supabaseClient) {
          const channel = supabaseClient
            .channel(`alert-label-change-requests-${scopedBrandKey || "all"}`)
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "label_change_requests" },
              () => {
                loadFromSupabase().catch((error) => {
                  console.error("[AlertStore] fetchCorrectionRequests realtime error:", error);
                });
              },
            )
            .subscribe();
          setTimeout(() => {
            // Keep the channel active while the store is alive; duplicate fetches replace state.
            void channel;
          }, 0);
        }
      } catch (error) {
        console.error("[AlertStore] fetchCorrectionRequests error:", error);
        set({ isLoadingRequests: false });
      }
    },

    createCorrectionRequest: async (requestData: any) => {
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
          entity_key: requestData.alert_id,
          parent_id: alert?.parent_id || null,
          post_id: alert?.post_id || null,
          comment_id: alert?.content_type === "comment" || alert?.content_type === "reply" ? requestData.alert_id : null,
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

      // Supabase is the source of truth for manager review.
      const supabasePayload = {
        source_type: alert?.content_type || "post",
        source_id: requestData.alert_id,
        mention_id: requestData.alert_id,
        lead_id: requestData.alert_id,
        workspace_id: cleanBrandId,
        platform: alert?.source || "unknown",
        author: alert?.author || "Không rõ tác giả",
        content_preview: (alert?.text || "").slice(0, 300),
        source_url: alert?.url || "",
        current_labels: newDoc.old_label,
        requested_labels: newDoc.proposed_label,
        changed_fields: ["sentiment", "topic", "relevance", "urgency", "intent"],
        current_queue: "review",
        requested_queue: requestData.new_urgency === "urgent" || requestData.new_severity === "urgent" ? "crisis" : "review",
        reason_code: "alert_label_correction",
        reason_note: requestData.reason || "",
        evidence_checked: true,
        status: "pending",
        brand_id: cleanBrandId,
        brand_name: requestData.brand || "",
        requested_by: requestData.requester_uid || "",
        requested_by_name: getResolverName(requestData.requester_email || ""),
        requested_by_email: requestData.requester_email || "",
        requested_by_role: "crisis_employee",
        requested_at: newDoc.created_at,
        created_at: newDoc.created_at,
        updated_at: newDoc.created_at,
        history: newDoc.history,
      };

      const insertedRows = await supabaseRequest<Array<{ id?: string }>>("label_change_requests", "", {
        method: "POST",
        body: JSON.stringify([supabasePayload]),
        headers: { Prefer: "return=representation" },
      });

      if (dbSecond) {
        await addDoc(collection(dbSecond, "label_change_requests"), {
          ...newDoc,
          supabase_request_id: insertedRows?.[0]?.id || null,
        });
      }

      const createdRequest: CorrectionRequest = {
        id: insertedRows?.[0]?.id || requestData.alert_id,
        alert_id: requestData.alert_id,
        brand: requestData.brand || "",
        requester_uid: requestData.requester_uid || "",
        requester_email: requestData.requester_email || "",
        created_at: newDoc.created_at,
        status: "pending",
        original_sentiment: newDoc.old_label.sentiment,
        new_sentiment: newDoc.proposed_label.sentiment,
        original_severity: newDoc.old_label.urgency,
        new_severity: newDoc.proposed_label.urgency,
        original_topic: newDoc.old_label.topic,
        new_topic: newDoc.proposed_label.topic,
        original_relevance: newDoc.old_label.relevance,
        new_relevance: newDoc.proposed_label.relevance,
        original_urgency: newDoc.old_label.urgency,
        new_urgency: newDoc.proposed_label.urgency,
        original_intent: newDoc.old_label.intent,
        new_intent: newDoc.proposed_label.intent,
        reason: newDoc.reason,
        alert_text: alert?.text || "",
      };
      set((state) => ({
        correctionRequests: [
          createdRequest,
          ...state.correctionRequests.filter((request) => request.id !== createdRequest.id),
        ],
      }));

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

      // Add real-time notification for the crisis employee who requested it
      if (req?.requester_email) {
        const notifyTitle = decision === "approved" ? "Yêu cầu sửa nhãn đã được duyệt" : "Yêu cầu sửa nhãn bị từ chối";
        const notifyMsg = decision === "approved"
          ? `Brand Manager đã duyệt yêu cầu sửa nhãn của bạn cho vụ việc #${alertId.slice(-4)}.`
          : `Brand Manager đã từ chối yêu cầu sửa nhãn của bạn cho vụ việc #${alertId.slice(-4)}.`;

        await addDoc(collection(dbSecond, "notifications"), {
          title: notifyTitle,
          message: notifyMsg,
          type: "correction_result",
          alert_id: alertId,
          brand: req.brand || "",
          created_at: new Date().toISOString(),
          read: false,
          recipient_role: "crisis_employee",
          recipient_email: req.requester_email,
        });
      }

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

      // Sync the request resolution back to Supabase label_change_requests table
      try {
        await supabaseRequest<void>(
          "label_change_requests",
          `mention_id=eq.${encodeURIComponent(alertId)}&status=eq.pending`,
          {
            method: "PATCH",
            body: JSON.stringify({
              status: decision,
              reviewed_by: profile.uid,
              reviewed_by_name: profile.displayName || profile.email || "",
              reviewed_at: changedAt,
              updated_at: changedAt,
            }),
          }
        );
      } catch (supabaseErr) {
        console.warn("[AlertStore] Failed to update request status in Supabase:", supabaseErr);
      }
    },

    lockAlertForResolution: async (id, profile) => {
      if (!profile) return;
      const now = new Date().toISOString();

      // Update local state immediately
      set((state) => {
        const nextRawAlerts = state.rawAlerts.map((alert) => {
          if (alert.id === id) {
            return {
              ...alert,
              being_resolved_by: profile.email,
              being_resolved_at: now,
            };
          }
          return alert;
        });

        const nextRecentLocks = { ...state.recentLocks };
        nextRecentLocks[id] = { email: profile.email, timestamp: Date.now() };

        return {
          rawAlerts: nextRawAlerts,
          alerts: applyFilters(nextRawAlerts, state.filters),
          recentLocks: nextRecentLocks,
        };
      });

      try {
        await updateSupabaseAlertLabel(id, (existingLabel) => ({
          ...existingLabel,
          being_resolved_by: profile.email,
          being_resolved_at: now,
        }));
      } catch (error) {
        console.error("[AlertStore] Failed to lock alert:", error);
      }
    },

    unlockAlertForResolution: async (id) => {
      // Update local state immediately
      set((state) => {
        const nextRawAlerts = state.rawAlerts.map((alert) => {
          if (alert.id === id) {
            return {
              ...alert,
              being_resolved_by: null,
              being_resolved_at: null,
            };
          }
          return alert;
        });

        const nextRecentLocks = { ...state.recentLocks };
        nextRecentLocks[id] = { email: null, timestamp: Date.now() };

        return {
          rawAlerts: nextRawAlerts,
          alerts: applyFilters(nextRawAlerts, state.filters),
          recentLocks: nextRecentLocks,
        };
      });

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
