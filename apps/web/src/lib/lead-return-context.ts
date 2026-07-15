import type { DashboardFilters } from "@/types/dashboard";
import type { LeadWorkbenchView } from "@/lib/lead-workbench";

export type LeadDetailPanelTab = "action" | "profile" | "history";

export interface LeadReturnContext {
  token: string;
  leadId: string;
  selectedLeadId: string;
  view: LeadWorkbenchView;
  page: number;
  filters: Partial<DashboardFilters>;
  panelTab: LeadDetailPanelTab;
  listScrollTop: number;
  panelScrollTop: number;
  openedAt: string;
}

export const LEAD_DETAIL_PANEL_SCROLL_ID = "lead-detail-panel-scroll";
const STORAGE_PREFIX = "insightflow.leads.returnContext.";

export function createLeadReturnToken(leadId: string) {
  return `${leadId}-${Date.now()}`;
}

export function saveLeadReturnContext(context: LeadReturnContext) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    `${STORAGE_PREFIX}${context.token}`,
    JSON.stringify(context),
  );
}

export function loadLeadReturnContext(token: string | null) {
  if (typeof window === "undefined" || !token) return null;

  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${token}`);
    return raw ? (JSON.parse(raw) as LeadReturnContext) : null;
  } catch {
    return null;
  }
}

export function clearLeadReturnContext(token: string | null) {
  if (typeof window === "undefined" || !token) return;
  window.sessionStorage.removeItem(`${STORAGE_PREFIX}${token}`);
}
