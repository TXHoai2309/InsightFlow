// apps/api/src/services/alert_service.ts
import { db } from "./firebase";

export interface AlertFilter {
  brand?: string;
  severity?: string;
  source?: string;
  status?: string;
}

export interface AlertResponse {
  id: string;
  brand: string;
  source: string;
  text: string;
  sentiment: string;
  topic: string;
  severity: string;
  created_at: string;
  status: string;
}

function parseDate(field: any): string {
  if (!field) return new Date().toISOString();
  if (typeof field.toDate === "function") {
    return field.toDate().toISOString();
  }
  if (field instanceof Date) return field.toISOString();
  const s = String(field).trim();
  if (!s) return new Date().toISOString();
  return s.includes("+") || s.endsWith("Z") ? s : s + "Z";
}

export class AlertService {
  /**
   * Check if Firebase credentials or emulator are configured.
   * If false, queries will be skipped to avoid unhandled NO_ADC_FOUND crashes.
   */
  static hasFirebaseCredentials(): boolean {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return true;
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return true;
    if (process.env.FIRESTORE_EMULATOR_HOST) return true;
    // Check GCP environment variables
    if (
      process.env.K_SERVICE ||
      process.env.GAE_SERVICE ||
      process.env.CLOUD_RUN_JOB
    )
      return true;
    return false;
  }

  /**
   * Fetch alerts from alerts_demo, falling back to NLP baseline candidates in mentions_nlp_demo.
   * Capped to limitVal. Filters applied in-memory to prevent index errors.
   */
  static async getAlerts(
    filters: AlertFilter,
    limitVal: number = 50,
  ): Promise<AlertResponse[]> {
    // Cap limit to avoid heavy reads
    const safeLimit = Math.min(Math.max(1, limitVal), 200);

    let alerts: AlertResponse[] = [];
    let fetchedFromReal = false;

    // Only query Firestore if we have valid credentials or emulator
    if (AlertService.hasFirebaseCredentials()) {
      try {
        // 1. Attempt to fetch from alerts_demo
        console.log(
          `[AlertService] Fetching from alerts_demo (limit: ${safeLimit})`,
        );
        const alertsRef = db.collection("alerts_demo");
        const snap = await alertsRef
          .orderBy("created_at", "desc")
          .limit(safeLimit)
          .get();

        if (!snap.empty) {
          alerts = snap.docs.map((doc: any) => {
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
            };
          });
          fetchedFromReal = true;
          console.log(
            `[AlertService] Successfully loaded ${alerts.length} real alerts.`,
          );
        }
      } catch (err: any) {
        console.warn(
          `[AlertService] alerts_demo query failed: ${err.message}. Falling back to candidates.`,
        );
      }

      // 2. Fallback to NLP candidates in mentions_nlp_demo
      if (!fetchedFromReal) {
        try {
          console.log(
            `[AlertService] Fetching candidates from mentions_nlp_demo (limit: ${safeLimit})`,
          );
          const mentionsRef = db.collection("mentions_nlp_demo");
          const snap = await mentionsRef
            .orderBy("crawled_at", "desc")
            .limit(safeLimit * 2)
            .get();

          const candidates = snap.docs.map((doc: any) => {
            const d = doc.data();

            let severity = "medium";
            if (d.baseline_sentiment === "negative") {
              const parsedConf = parseFloat(
                String(d.baseline_confidence || 0.5),
              );
              const conf = isNaN(parsedConf) ? 0.5 : parsedConf;
              if (conf >= 0.8) severity = "critical";
              else if (conf >= 0.6) severity = "high";
              else severity = "medium";
            } else {
              severity = "low";
            }

            return {
              id: doc.id,
              brand: String(d.brand || d.workspace_id || ""),
              source: String(d.source || d.platform || ""),
              text: String(d.processed_text || d.text || d.content || ""),
              sentiment: String(
                d.baseline_sentiment || d.sentiment || "neutral",
              ),
              topic: String(d.baseline_topic || d.topic || "other"),
              severity,
              created_at: parseDate(
                d.crawled_at || d.posted_at || d.created_at,
              ),
              status: "new",
              risk_flag: d.risk_flag === true,
            };
          });

          alerts = candidates
            .filter((c: any) => c.risk_flag || c.sentiment === "negative")
            .slice(0, safeLimit);

          console.log(
            `[AlertService] Loaded ${alerts.length} candidates from mentions_nlp_demo.`,
          );
        } catch (err: any) {
          console.error(
            `[AlertService] mentions_nlp_demo fallback failed: ${err.message}`,
          );
        }
      }
    } else {
      console.log(
        "[AlertService] Firebase credentials not configured. Skipping Firestore queries to prevent auth crashes.",
      );
    }

    // 3. Final Fallback to simulated mock data if no database access or empty results
    if (alerts.length === 0) {
      console.log(
        "[AlertService] Database offline/empty or skip query. Returning simulated mock NLP candidates.",
      );
      alerts = [
        {
          id: "simulated-alert-1",
          brand: "Highland Coffee",
          source: "facebook",
          text: "Phát hiện gia tăng đột ngột của bài đăng phàn nàn về vệ sinh tại chi nhánh Quận 1. Tiếp cận 45k+ người.",
          sentiment: "negative",
          topic: "quality",
          severity: "critical",
          created_at: new Date().toISOString(),
          status: "new",
        },
        {
          id: "simulated-alert-2",
          brand: "Starbucks",
          source: "tiktok",
          text: "Video KOL @HoangMedia chia sẻ nội dung so sánh tiêu cực: Tiếp cận 150k+ người.",
          sentiment: "negative",
          topic: "service",
          severity: "high",
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          status: "new",
        },
        {
          id: "simulated-alert-3",
          brand: "Mixue",
          source: "youtube",
          text: "Vlog đánh giá đồ uống mới của Mixue nhận xét tiêu cực về độ ngọt vượt mức cho phép.",
          sentiment: "negative",
          topic: "quality",
          severity: "low",
          created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
          status: "new",
        },
      ];
    }

    // 4. Apply Filters in memory (AC-3)
    let filteredAlerts = alerts;

    if (filters.brand) {
      const brandLower = filters.brand.toLowerCase();
      filteredAlerts = filteredAlerts.filter((a) =>
        a.brand.toLowerCase().includes(brandLower),
      );
    }
    if (filters.severity) {
      const severityLower = filters.severity.toLowerCase();
      filteredAlerts = filteredAlerts.filter(
        (a) => a.severity.toLowerCase() === severityLower,
      );
    }
    if (filters.source) {
      const sourceLower = filters.source.toLowerCase();
      filteredAlerts = filteredAlerts.filter(
        (a) => a.source.toLowerCase() === sourceLower,
      );
    }
    if (filters.status) {
      const statusLower = filters.status.toLowerCase();
      filteredAlerts = filteredAlerts.filter(
        (a) => a.status.toLowerCase() === statusLower,
      );
    }

    return filteredAlerts;
  }
}
