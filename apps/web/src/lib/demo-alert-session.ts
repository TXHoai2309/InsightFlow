import type { AlertData } from "@/stores/alert.store";

const DEMO_ALERT_SESSION_KEY = "insightflow.demo.alert-workflow.v1";
const DEMO_ALERT_SESSION_VERSION = 1;

const WORKFLOW_FIELDS = [
  "status",
  "updated_at",
  "resolved_at",
  "being_resolved_by",
  "being_resolved_at",
  "resolution_history",
  "resolved_by",
  "resolved_by_email",
  "resolved_by_name",
  "skipped_at",
  "skipped_by_uid",
  "skipped_by_email",
  "skipped_by_name",
  "internal_notes",
  "escalation",
  "monitoring_started_at",
  "monitoring_duration_hours",
  "monitoring_initial_comments",
  "monitoring_initial_likes",
  "monitoring_initial_shares",
  "customer_contact_opened_at",
  "customer_contact_opened_by",
  "customer_contact_template",
  "customer_contact_note",
  "customer_contact_evidence_image",
  "customer_response_result",
  "customer_contact_history",
] as const;

type DemoAlertWorkflowField = (typeof WORKFLOW_FIELDS)[number];
type DemoAlertWorkflowPatch = Partial<Record<DemoAlertWorkflowField, unknown>>;

interface DemoAlertSessionDocument {
  version: number;
  alerts: Record<string, DemoAlertWorkflowPatch>;
}

export interface DemoSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getSessionStorage(): DemoSessionStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function emptyDocument(): DemoAlertSessionDocument {
  return {
    version: DEMO_ALERT_SESSION_VERSION,
    alerts: {},
  };
}

function readDocument(storage: DemoSessionStorage | null): DemoAlertSessionDocument {
  if (!storage) return emptyDocument();
  try {
    const raw = storage.getItem(DEMO_ALERT_SESSION_KEY);
    if (!raw) return emptyDocument();
    const parsed = JSON.parse(raw) as Partial<DemoAlertSessionDocument>;
    if (
      parsed.version !== DEMO_ALERT_SESSION_VERSION ||
      !parsed.alerts ||
      typeof parsed.alerts !== "object" ||
      Array.isArray(parsed.alerts)
    ) {
      storage.removeItem(DEMO_ALERT_SESSION_KEY);
      return emptyDocument();
    }
    return {
      version: DEMO_ALERT_SESSION_VERSION,
      alerts: parsed.alerts as Record<string, DemoAlertWorkflowPatch>,
    };
  } catch {
    try {
      storage.removeItem(DEMO_ALERT_SESSION_KEY);
    } catch {
      // Ignore unavailable or quota-restricted session storage.
    }
    return emptyDocument();
  }
}

function createWorkflowPatch(alert: AlertData): DemoAlertWorkflowPatch {
  const patch: DemoAlertWorkflowPatch = {};
  const record = alert as unknown as Record<string, unknown>;
  WORKFLOW_FIELDS.forEach((field) => {
    // Persist an explicit null for cleared optional values. Without it, a
    // refresh would restore the original workflow value from demoData.
    patch[field] = record[field] === undefined ? null : record[field];
  });
  return patch;
}

export function isDemoAlertRecord(alert: Pick<AlertData, "id" | "source_id"> | null | undefined) {
  return Boolean(
    alert &&
      [alert.id, alert.source_id].some((value) =>
        String(value || "").startsWith("demo-"),
      ),
  );
}

export function hydrateDemoAlertWorkflows(
  alerts: AlertData[],
  storage: DemoSessionStorage | null = getSessionStorage(),
) {
  const document = readDocument(storage);
  return alerts.map((alert) => {
    if (!isDemoAlertRecord(alert)) return alert;
    const patch = document.alerts[alert.id];
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) return alert;
    return {
      ...alert,
      ...patch,
    } as AlertData;
  });
}

export function persistDemoAlertWorkflow(
  alert: AlertData,
  storage: DemoSessionStorage | null = getSessionStorage(),
) {
  if (!storage || !isDemoAlertRecord(alert)) return;
  const document = readDocument(storage);
  document.alerts[alert.id] = createWorkflowPatch(alert);
  try {
    storage.setItem(DEMO_ALERT_SESSION_KEY, JSON.stringify(document));
  } catch {
    // The in-memory Demo state remains usable even when browser storage is
    // unavailable or its quota is exhausted.
  }
}

export function clearDemoAlertWorkflowSession(
  storage: DemoSessionStorage | null = getSessionStorage(),
) {
  try {
    storage?.removeItem(DEMO_ALERT_SESSION_KEY);
  } catch {
    // Session cleanup is best-effort.
  }
}
