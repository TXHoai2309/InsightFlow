import { normalizeBrandName } from "@/lib/services/dashboard";
import { isIntentLead } from "@/lib/lead-intent";
import type { DashboardFilters, Lead } from "@/types/dashboard";

export { isIntentLead };

export function isDateInDashboardRange(
  dateValue: string | undefined,
  filters: DashboardFilters,
) {
  if (!dateValue) return false;
  const time = new Date(dateValue).getTime();
  if (!Number.isFinite(time)) return false;

  if (filters.time_range === "custom") {
    if (filters.custom_start_date) {
      const start = new Date(`${filters.custom_start_date}T00:00:00`).getTime();
      if (time < start) return false;
    }
    if (filters.custom_end_date) {
      const end = new Date(`${filters.custom_end_date}T23:59:59`).getTime();
      if (time > end) return false;
    }
    return true;
  }

  if (filters.time_range === "single") {
    if (!filters.single_date) return true;
    const start = new Date(`${filters.single_date}T00:00:00`).getTime();
    const end = new Date(`${filters.single_date}T23:59:59`).getTime();
    return time >= start && time <= end;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  const cutoff =
    filters.time_range === "24h"
      ? startOfTodayMs
      : filters.time_range === "2d"
        ? startOfTodayMs - 1 * 24 * 60 * 60 * 1000
        : filters.time_range === "3d"
          ? startOfTodayMs - 2 * 24 * 60 * 60 * 1000
          : filters.time_range === "5d"
            ? startOfTodayMs - 4 * 24 * 60 * 60 * 1000
            : filters.time_range === "7d"
              ? startOfTodayMs - 6 * 24 * 60 * 60 * 1000
              : filters.time_range === "30d"
                ? startOfTodayMs - 29 * 24 * 60 * 60 * 1000
                : null;

  if (cutoff === null) return true;
  return time >= cutoff && time <= Date.now();
}

export function filterLeadsForDashboard(leads: Lead[], filters: DashboardFilters) {
  const targetBrand =
    filters.workspace_id !== "all" ? normalizeBrandName(filters.workspace_id) : null;

  return leads.filter((lead) => {
    if (!isIntentLead(lead)) return false;

    if (targetBrand && normalizeBrandName(lead.workspace_id || "") !== targetBrand) {
      return false;
    }
    if (filters.platform !== "all" && lead.platform !== filters.platform) {
      return false;
    }

    // Dùng posted_at (ngày đăng bài gốc) để filter, fallback về created_at
    const dateForFilter = lead.posted_at || lead.created_at;
    return isDateInDashboardRange(dateForFilter, filters);
  });
}

export function getLeadMetrics(leads: Lead[]) {
  const intentLeads = leads.filter(isIntentLead);
  const pending = intentLeads.filter((lead) => lead.status === "new" || lead.status === "processing");

  return {
    total: intentLeads.length,
    hot: intentLeads.filter((lead) => lead.intent === "hot").length,
    warm: intentLeads.filter((lead) => lead.intent === "warm").length,
    cold: intentLeads.filter((lead) => lead.intent === "cold").length,
    hotPending: pending.filter((lead) => lead.intent === "hot").length,
    new: intentLeads.filter((lead) => lead.status === "new").length,
    processing: intentLeads.filter((lead) => lead.status === "processing").length,
    completed: intentLeads.filter((lead) => lead.status === "completed").length,
    skipped: intentLeads.filter((lead) => lead.status === "skipped").length,
    unassignedPending: pending.filter((lead) => !lead.owner_id).length,
  };
}
