import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { dbSecond } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from "firebase/firestore";

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
  fetchAlerts: () => Promise<void>;
  updateAlertStatus: (id: string, newStatus: string) => Promise<void>;
}

// Helper to parse Firestore/general dates into ISO String
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

  // Try to parse custom date format "HH:mm dd/MM/yyyy" or "dd/MM/yyyy HH:mm"
  if (s.includes("/")) {
    try {
      const parts = s.split(" ");
      let timePart = "00:00";
      let datePart = "";
      if (parts.length === 2) {
        if (parts[0].includes(":")) {
          timePart = parts[0];
          datePart = parts[1];
        } else {
          datePart = parts[0];
          timePart = parts[1];
        }
      } else if (parts.length === 1) {
        datePart = parts[0];
      }

      if (datePart && datePart.includes("/")) {
        const dParts = datePart.split("/");
        if (dParts.length === 3) {
          const day = parseInt(dParts[0], 10);
          const month = parseInt(dParts[1], 10) - 1; // 0-indexed month
          const year = parseInt(dParts[2], 10);
          
          const tParts = timePart.split(":");
          const hour = tParts.length >= 1 ? parseInt(tParts[0], 10) : 0;
          const min = tParts.length >= 2 ? parseInt(tParts[1], 10) : 0;
          const sec = tParts.length >= 3 ? parseInt(tParts[2], 10) : 0;

          const date = new Date(year, month, day, hour, min, sec);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
      }
    } catch (e) {
      console.warn("[AlertStore] Custom format parsing failed:", s, e);
    }
  }

  return s.includes("+") || s.endsWith("Z") ? s : s + "Z";
}

function applyFilters(rawAlerts: AlertData[], filters: AlertFilters): AlertData[] {
  let result = [...rawAlerts];

  // Sort: Newest first
  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (filters.brand !== "all") {
    const bLower = filters.brand.toLowerCase();
    result = result.filter((a) => a.brand.toLowerCase().includes(bLower));
  }
  if (filters.status !== "all") {
    const sLower = filters.status.toLowerCase();
    result = result.filter((a) => a.status.toLowerCase() === sLower);
  }
  if (filters.severity !== "all") {
    const sevLower = filters.severity.toLowerCase();
    result = result.filter((a) => a.severity.toLowerCase() === sevLower);
  }

  return result;
}

export const useAlertStore = create<AlertState>()(
  subscribeWithSelector((set, get) => ({
    rawAlerts: [],
    alerts: [],
    brands: [],
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
        const filtered = applyFilters(state.rawAlerts, nextFilters);
        return {
          filters: nextFilters,
          alerts: filtered,
        };
      });
    },
    fetchAlerts: async () => {
      set({ isLoading: true, error: null });
      try {
        let fetchedAlerts: AlertData[] = [];
        let fetchedFromReal = false;

        // 1. Try client-side Firestore connection to the second database (DataInsight) first
        if (dbSecond) {
          try {
            console.log("[AlertStore] Querying client-side Firestore (alerts_demo)...");
            const alertsRef = collection(dbSecond, "alerts_demo");
            const q = query(alertsRef, orderBy("created_at", "desc"), limit(100));
            const snap = await getDocs(q);

            if (!snap.empty) {
              fetchedAlerts = snap.docs.map((doc) => {
                const d = doc.data();
                return {
                  id: doc.id,
                  brand: String(d.brand || d.workspace_id || ""),
                  source: String(d.source || d.platform || ""),
                  text: String(d.text || d.message || d.content || ""),
                  sentiment: String(d.sentiment || "negative"),
                  topic: String(d.topic || "other"),
                  severity: String(d.severity || "medium"),
                  created_at: parseDate(d.created_at || d.triggered_at),
                  status: String(d.status || "new"),
                  resolved_at: d.resolved_at ? parseDate(d.resolved_at) : undefined,
                  collectionName: "alerts_demo",
                  url: String(d.url || d.post_url || d.permalink || d.source_url || ""),
                  reach: Number(d.reach || d.views || d.views_count || d.view_count || d.reach_count || 0),
                  likes: Number(d.likes || d.like_count || d.likes_count || 0),
                  comments: Number(d.comments || d.comment_count || d.comments_count || 0),
                  shares: Number(d.shares || d.share_count || d.shares_count || 0),
                  author: String(d.author || d.author_name || d.username || d.owner || ""),
                  title: String(d.title || d.headline || ""),
                };
              });
              fetchedFromReal = true;
              console.log(`[AlertStore] Loaded ${fetchedAlerts.length} alerts from alerts_demo.`);
            }

            // If alerts_demo has no data, fallback to mentions_nlp_demo (where crawled documents reside)
            if (!fetchedFromReal) {
              console.log("[AlertStore] alerts_demo empty, loading candidates from mentions_nlp_demo...");
              const mentionsRef = collection(dbSecond, "mentions_nlp_demo");
              const qMentions = query(mentionsRef, orderBy("crawled_at", "desc"), limit(150));
              const snapMentions = await getDocs(qMentions);

              if (!snapMentions.empty) {
                const candidates = snapMentions.docs.map((doc) => {
                  const d = doc.data();
                  
                  let calculatedSeverity = "medium";
                  if (d.baseline_sentiment === "negative") {
                    const parsedConf = parseFloat(String(d.baseline_confidence || 0.5));
                    const conf = isNaN(parsedConf) ? 0.5 : parsedConf;
                    if (conf >= 0.8) calculatedSeverity = "critical";
                    else if (conf >= 0.6) calculatedSeverity = "high";
                    else calculatedSeverity = "medium";
                  } else {
                    calculatedSeverity = "low";
                  }

                  return {
                    id: doc.id,
                    brand: String(d.brand || d.workspace_id || ""),
                    source: String(d.source || d.platform || ""),
                    text: String(d.processed_text || d.text || d.content || ""),
                    sentiment: String(d.baseline_sentiment || d.sentiment || "neutral"),
                    topic: String(d.baseline_topic || d.topic || "other"),
                    severity: calculatedSeverity,
                    created_at: parseDate(d.posted_at || d.crawled_at || d.created_at),
                    status: String(d.status || "new"),
                    resolved_at: d.resolved_at ? parseDate(d.resolved_at) : undefined,
                    risk_flag: d.risk_flag === true,
                    collectionName: "mentions_nlp_demo",
                    url: String(d.url || d.post_url || d.permalink || d.source_url || ""),
                    reach: Number(d.reach || d.views || d.views_count || d.view_count || d.reach_count || 0),
                    likes: Number(d.likes || d.like_count || d.likes_count || 0),
                    comments: Number(d.comments || d.comment_count || d.comments_count || 0),
                    shares: Number(d.shares || d.share_count || d.shares_count || 0),
                    author: String(d.author || d.author_name || d.username || d.owner || ""),
                    title: String(d.title || d.headline || ""),
                  };
                });

                // Filter out candidates that are classified as negative sentiment or flagged
                fetchedAlerts = candidates.filter(
                  (c: any) => c.risk_flag || c.sentiment === "negative"
                );
                fetchedFromReal = true;
                console.log(`[AlertStore] Loaded ${fetchedAlerts.length} alerts from mentions_nlp_demo.`);
              }
            }
          } catch (err: any) {
            console.warn("[AlertStore] Client-side Firestore query failed, falling back to backend API:", err.message);
          }
        }

        // 2. Fallback to API if client-side query failed or was empty
        if (!fetchedFromReal) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
          const response = await fetch(`${apiUrl}/api/alerts?limit=100`);
          if (response.ok) {
            const json = await response.json();
            if (json.success && json.data && json.data.length > 0) {
              fetchedAlerts = json.data;
              fetchedFromReal = true;
              console.log(`[AlertStore] Loaded ${fetchedAlerts.length} alerts from backend API.`);
            }
          }
        }

        // 3. Fallback to simulated data if both failed
        if (!fetchedFromReal || fetchedAlerts.length === 0) {
          console.log("[AlertStore] No real alerts loaded. Using simulated fallback data.");
          fetchedAlerts = [
            {
              id: "simulated-alert-1",
              brand: "Highlands Coffee",
              source: "facebook",
              text: "Phát hiện gia tăng đột ngột của bài đăng phàn nàn về vệ sinh tại chi nhánh Quận 1. Tiếp cận 45k+ người.",
              sentiment: "negative",
              topic: "quality",
              severity: "critical",
              created_at: new Date().toISOString(),
              status: "new",
              url: "https://www.facebook.com/groups/congdongreview/posts/1029381923",
              reach: 45000,
              likes: 1200,
              comments: 450,
              shares: 180,
              author: "Nguyễn Minh Anh",
              title: "Sự cố vệ sinh thực phẩm chi nhánh Quận 1",
            },
            {
              id: "simulated-alert-2",
              brand: "Phúc Long Tea",
              source: "tiktok",
              text: "Video KOL @HoangMedia chia sẻ nội dung so sánh tiêu cực: Tiếp cận 150k+ người.",
              sentiment: "negative",
              topic: "service",
              severity: "high",
              created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
              status: "new",
              url: "https://www.tiktok.com/@hoangmedia/video/71239849102",
              reach: 150000,
              likes: 25000,
              comments: 1800,
              shares: 4200,
              author: "Hoàng Media",
              title: "Video review tiêu cực từ KOL @HoangMedia",
            },
            {
              id: "simulated-alert-3",
              brand: "The Coffee House",
              source: "news",
              text: "Đánh giá 1 sao hàng loạt phản ánh thái độ nhân viên chi nhánh Nguyễn Trãi thiếu tôn trọng khách hàng.",
              sentiment: "negative",
              topic: "staff",
              severity: "medium",
              created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
              status: "new",
              url: "https://vnexpress.net/the-coffee-house-nguyen-trai-bi-phan-anh-thai-do-phuc-vu-459201.html",
              reach: 85000,
              likes: 340,
              comments: 120,
              shares: 45,
              author: "VnExpress",
              title: "Báo chí phản ánh sự cố nhân viên chi nhánh Nguyễn Trãi",
            },
            {
              id: "simulated-alert-4",
              brand: "Highlands Coffee",
              source: "youtube",
              text: "Vlog đánh giá đồ uống mới của Highlands nhận xét tiêu cực về độ ngọt vượt mức cho phép.",
              sentiment: "negative",
              topic: "quality",
              severity: "low",
              created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
              status: "new",
              url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              reach: 12000,
              likes: 850,
              comments: 95,
              shares: 32,
              author: "Khoai Lang Thang",
              title: "Vlog đánh giá sản phẩm đồ uống mới",
            }
          ];
        }

        // Extract all unique brands from the unfiltered fetchedAlerts
        const uniqueBrands = Array.from(
          new Set(fetchedAlerts.map((a) => a.brand.toLowerCase().trim()).filter(Boolean))
        );

        // Apply filters in memory
        const filtered = applyFilters(fetchedAlerts, get().filters);

        set({
          rawAlerts: fetchedAlerts,
          alerts: filtered,
          brands: uniqueBrands,
        });
      } catch (err: any) {
        set({ error: err.message || "Failed to load alerts" });
        console.error("fetchAlerts error:", err);
      } finally {
        set({ isLoading: false });
      }
    },
    updateAlertStatus: async (id, newStatus) => {
      const resolvedAt = newStatus === "resolved" ? new Date().toISOString() : undefined;

      // Optimistically update rawAlerts and alerts for real-time interaction
      set((state) => {
        const nextRawAlerts = state.rawAlerts.map((a) =>
          a.id === id
            ? {
                ...a,
                status: newStatus,
                ...(newStatus === "resolved" ? { resolved_at: resolvedAt } : {}),
              }
            : a
        );
        const nextAlerts = applyFilters(nextRawAlerts, state.filters);
        return {
          rawAlerts: nextRawAlerts,
          alerts: nextAlerts,
        };
      });

      // Persist to Firestore if dbSecond is available
      if (dbSecond) {
        try {
          const alert = get().rawAlerts.find((a) => a.id === id);
          const collName = alert?.collectionName || "alerts_demo";
          const docRef = doc(dbSecond, collName, id);
          
          const updateData: Record<string, any> = {
            status: newStatus,
          };
          if (newStatus === "resolved") {
            updateData.resolved_at = resolvedAt;
          }
          
          await updateDoc(docRef, updateData);
          console.log(`[AlertStore] Status successfully persisted to Firestore (${collName}/${id}): ${newStatus}`);
        } catch (err: any) {
          console.error(`[AlertStore] Failed to persist status to Firestore:`, err);
        }
      }
    },
  }))
);