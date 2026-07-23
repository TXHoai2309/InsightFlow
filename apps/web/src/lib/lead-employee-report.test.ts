import test from "node:test";
import assert from "node:assert/strict";
import type { UserRoleProfile } from "./rbac";
import type { Lead } from "../types/dashboard";
import { buildLeadEmployeeReportData } from "./lead-employee-report";
import { DEFAULT_LEAD_REPORT_FILTERS } from "./lead-report-filters";
import { buildLeadEmployeeReportExcelDocument } from "./excelExport";

const profile: UserRoleProfile = {
  uid: "lead-employee-1",
  email: "lead@example.com",
  displayName: "Nguyễn Lead",
  role: "lead_employee",
  companyDomain: "example.com",
  brandId: "highlands-coffee",
  brandName: "Highlands Coffee",
  permissions: ["leads", "reports"],
  defaultRoute: "/leads",
};

function lead(overrides: Partial<Lead>): Lead {
  return {
    id: "lead-default",
    workspace_id: "highlands-coffee",
    platform: "facebook",
    author: "Khách hàng",
    content: "Tôi muốn mua sản phẩm",
    intent: "warm",
    intent_signals: [],
    status: "new",
    created_at: "2026-07-17T08:00:00.000Z",
    ...overrides,
  };
}

test("personal Lead KPIs exclude unassigned leads and use activity timestamps in the selected period", () => {
  const now = new Date("2026-07-17T12:00:00.000Z").getTime();
  const report = buildLeadEmployeeReportData(
    [
      lead({
        id: "owned-hot-overdue",
        owner_id: profile.uid,
        owner_name: profile.displayName,
        intent: "hot",
        expiry_at: "2026-07-17T09:00:00.000Z",
      }),
      lead({
        id: "owned-contacted",
        owner_id: profile.uid,
        owner_name: profile.displayName,
        status: "processing",
        created_at: "2026-07-16T08:00:00.000Z",
        expiry_at: "2026-07-18T08:00:00.000Z",
        first_contacted_at: "2026-07-16T09:00:00.000Z",
        last_contact_at: "2026-07-16T09:00:00.000Z",
        contact_attempts: 1,
      }),
      lead({
        id: "owned-converted-in-period",
        owner_id: profile.uid,
        owner_name: profile.displayName,
        status: "completed",
        intent: "hot",
        created_at: "2026-06-20T08:00:00.000Z",
        result_type: "converted",
        result_recorded_at: "2026-07-16T10:00:00.000Z",
        closed_at: "2026-07-16T10:00:00.000Z",
      }),
      lead({ id: "unassigned", owner_id: null }),
    ],
    { ...DEFAULT_LEAD_REPORT_FILTERS, timeRange: "7d", owner: "mine" },
    profile,
    now,
  );

  assert.equal(report.personalKpis.openCurrent, 2);
  assert.equal(report.personalKpis.claimable, 1);
  assert.equal(report.personalKpis.contactedInPeriod, 1);
  assert.equal(report.personalKpis.convertedInPeriod, 1);
  assert.equal(report.personalKpis.resultRecordedInPeriod, 1);
  assert.equal(report.personalKpis.conversionRate, 100);
  assert.equal(report.personalKpis.needResultCurrent, 1);
  assert.equal(report.kpis.total, 2);
  const overdueRow = report.priorityRows.find((row) => row.id === "owned-hot-overdue");
  assert.equal(overdueRow?.urgencyLevel, "urgent");
  assert.ok(overdueRow?.urgencyReasons.includes("Đã quá SLA"));
  assert.ok(!report.detailRows.some((row) => row.id === "unassigned"));
});

test("does not charge employees for SLA already breached before ingestion", () => {
  const now = new Date("2026-07-22T12:00:00.000Z").getTime();
  const report = buildLeadEmployeeReportData(
    [
      lead({
        id: "eligible",
        owner_id: profile.uid,
        posted_at: "2026-07-22T08:00:00.000Z",
        created_at: "2026-07-22T08:05:00.000Z",
        first_contacted_at: "2026-07-22T08:30:00.000Z",
        last_contact_at: "2026-07-22T08:30:00.000Z",
      }),
      lead({
        id: "late-ingestion",
        owner_id: profile.uid,
        posted_at: "2026-06-21T01:04:00.000Z",
        created_at: "2026-07-21T02:10:00.000Z",
        first_contacted_at: "2026-07-21T03:00:00.000Z",
        last_contact_at: "2026-07-21T03:00:00.000Z",
      }),
    ],
    { ...DEFAULT_LEAD_REPORT_FILTERS, timeRange: "7d", owner: "mine" },
    profile,
    now,
  );

  assert.equal(report.personalKpis.contactedInPeriod, 2);
  assert.equal(report.personalKpis.slaOnTimeRate, 100);
  assert.equal(
    report.detailRows.find((row) => row.id === "late-ingestion")?.slaStatus,
    "Qua han truoc ghi nhan",
  );
});

test("Lead Excel preview and downloaded document share the same report sections", () => {
  const now = new Date("2026-07-17T12:00:00.000Z").getTime();
  const report = buildLeadEmployeeReportData(
    [lead({ id: "owned-lead", owner_id: profile.uid, intent: "hot" })],
    { ...DEFAULT_LEAD_REPORT_FILTERS, timeRange: "7d", owner: "mine" },
    profile,
    now,
  );
  const document = buildLeadEmployeeReportExcelDocument(report, {
    periodLabel: "7 ngày gần nhất",
    filterLabel: "Lead thuộc trách nhiệm của tôi",
  });

  assert.match(document, /Báo cáo công việc cá nhân/);
  assert.match(document, /Cần xử lý ngay/);
  assert.match(document, /Kết quả của tôi trong kỳ/);
  assert.match(document, /Lead ưu tiên hiện tại/);
  assert.match(document, /owned-lead/);
  assert.match(document, /7 ngày gần nhất/);
});
