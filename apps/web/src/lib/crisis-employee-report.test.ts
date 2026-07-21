import test from "node:test";
import assert from "node:assert/strict";
import type { UserRoleProfile } from "./rbac";
import type { AlertData } from "../stores/alert.store";
import { buildCrisisEmployeeReportData } from "./crisis-employee-report";
import { DEFAULT_CRISIS_REPORT_FILTERS } from "./crisis-report-filters";
import { buildCrisisEmployeeReportExcelDocument } from "./excelExport";

const profile: UserRoleProfile = {
  uid: "employee-1",
  email: "crisis@example.com",
  displayName: "Nguyễn Crisis",
  role: "crisis_employee",
  companyDomain: "example.com",
  brandId: "highlands-coffee",
  brandName: "Highlands Coffee",
  permissions: ["alerts", "reports"],
  defaultRoute: "/alerts",
};

function alert(overrides: Partial<AlertData>): AlertData {
  return {
    id: "alert-default",
    brand: "Highlands Coffee",
    source: "facebook",
    text: "Nội dung cảnh báo",
    sentiment: "negative",
    topic: "service",
    severity: "high",
    negativity_score: 80,
    created_at: "2026-07-16T08:00:00.000Z",
    status: "new",
    ...overrides,
  };
}

test("personal KPIs exclude unassigned alerts while keeping them claimable", () => {
  const now = new Date("2026-07-17T12:00:00.000Z").getTime();
  const report = buildCrisisEmployeeReportData(
    [
      alert({
        id: "owned-critical",
        being_resolved_by: profile.email,
        severity: "critical",
        created_at: "2026-07-17T00:00:00.000Z",
      }),
      alert({
        id: "unassigned",
        text: "Case chưa phân công",
        being_resolved_by: null,
      }),
      alert({
        id: "resolved-in-period",
        being_resolved_by: profile.email,
        resolved_by_email: profile.email,
        resolved_by_name: profile.displayName,
        status: "resolved",
        created_at: "2026-07-01T08:00:00.000Z",
        being_resolved_at: "2026-07-01T08:30:00.000Z",
        resolved_at: "2026-07-16T09:00:00.000Z",
      }),
    ],
    { ...DEFAULT_CRISIS_REPORT_FILTERS, timeRange: "7d" },
    profile,
    now,
  );

  assert.equal(report.personalKpis.openCurrent, 1);
  assert.equal(report.personalKpis.claimable, 1);
  assert.equal(report.personalKpis.resolvedInPeriod, 1);
  assert.equal(report.personalKpis.createdInPeriod, 1);
  assert.equal(report.priorityRows[0]?.id, "owned-critical");
  assert.equal(report.priorityRows[0]?.urgencyLevel, "urgent");
  assert.ok(report.priorityRows[0]?.urgencyReasons.includes("Quá hạn"));
});

test("Excel preview is generated from personal report data and preserves layout sections", () => {
  const now = new Date("2026-07-17T12:00:00.000Z").getTime();
  const report = buildCrisisEmployeeReportData(
    [
      alert({
        id: "owned-alert",
        being_resolved_by: profile.email,
        severity: "critical",
      }),
    ],
    { ...DEFAULT_CRISIS_REPORT_FILTERS, timeRange: "7d" },
    profile,
    now,
  );
  const document = buildCrisisEmployeeReportExcelDocument(report, {
    periodLabel: "7 ngày gần nhất",
    filterLabel: "Case thuộc trách nhiệm của tôi",
  });

  assert.match(document, /Báo cáo công việc cá nhân/);
  assert.match(document, /Cần xử lý ngay/);
  assert.match(document, /Kết quả của tôi trong kỳ/);
  assert.match(document, /Case ưu tiên hiện tại/);
  assert.match(document, /owned-alert/);
  assert.match(document, /7 ngày gần nhất/);
});
