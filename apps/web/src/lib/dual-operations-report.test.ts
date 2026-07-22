import test from "node:test";
import assert from "node:assert/strict";
import type { CrisisReportData } from "./crisis-report";
import type { LeadReportData } from "./lead-report";
import { buildDualOperationsReportData } from "./dual-operations-report";
import { buildDualOperationsReportExcelDocument } from "./excelExport";

function leadReport(): LeadReportData {
  return {
    generatedAt: "2026-07-17T08:00:00.000Z",
    kpis: {
      total: 2,
      hot: 1,
      warm: 1,
      cold: 0,
      contacted: 1,
      uncontacted: 1,
      needResult: 1,
      followUpDue: 0,
      followUpOverdue: 0,
      salesHandoff: 0,
      converted: 0,
      skipped: 0,
      slaBreached: 1,
      avgFirstResponseMinutes: 20,
      avgResultMinutes: null,
      conversionRate: 0,
      contactRate: 50,
      slaOnTimeRate: 50,
    },
    intentDistribution: [],
    sourceDistribution: [],
    pipeline: [],
    responseTrend: [],
    staffPerformance: [],
    detailRows: [{
      id: "lead-1",
      customer: "Khách hàng A",
      workspaceId: "brand-a",
      platform: "facebook",
      intent: "hot",
      status: "processing",
      ownerName: "Nhân viên",
      createdAt: "2026-07-16T08:00:00.000Z",
      firstContactedAt: "2026-07-16T09:00:00.000Z",
      responseMinutes: 60,
      resultType: "",
      resultRecordedAt: "",
      contactAttempts: 1,
      followUpAt: "",
      slaStatus: "Quá hạn",
      priorityScore: 90,
      content: "Khách quan tâm sản phẩm",
      url: "",
    }],
    aiSummary: "",
  };
}

function crisisReport(): CrisisReportData {
  return {
    generatedAt: "2026-07-17T08:00:00.000Z",
    kpis: {
      total: 1,
      new: 0,
      resolving: 1,
      monitoring: 0,
      pendingApproval: 0,
      resolved: 0,
      overdue: 1,
      escalated: 0,
      critical: 1,
      high: 0,
      avgFirstResponseMinutes: null,
      avgResolutionMinutes: null,
      resolvedRate: 0,
      slaOnTimeRate: 0,
    },
    severityDistribution: [],
    statusDistribution: [],
    sourceDistribution: [],
    topicDistribution: [],
    responseTrend: [],
    staffPerformance: [],
    overdueRows: [],
    escalationRows: [],
    detailRows: [{
      id: "alert-1",
      brand: "brand-a",
      platform: "facebook",
      topic: "Dịch vụ",
      severity: "critical",
      sentiment: "negative",
      status: "resolving",
      assigneeName: "Nhân viên",
      createdAt: "2026-07-16T08:00:00.000Z",
      firstResponseAt: "",
      resolvedAt: "",
      responseMinutes: null,
      resolutionMinutes: null,
      slaStatus: "Quá hạn",
      negativityScore: 90,
      reach: 100,
      engagement: 10,
      escalated: false,
      notesCount: 0,
      content: "Khách hàng phản ánh dịch vụ",
      url: "",
    }],
    aiSummary: "",
  };
}

test("builds aggregate management risks for both operations", () => {
  const report = buildDualOperationsReportData(leadReport(), crisisReport());

  assert.deepEqual(report.kpis.workflow.inProgress, { total: 2, lead: 1, crisis: 1 });
  assert.deepEqual(report.kpis.workflow.unassigned, { total: 0, lead: 0, crisis: 0 });
  assert.deepEqual(report.kpis.workflow.completionRate, { total: 0, lead: 0, crisis: 0 });
  assert.equal(report.kpis.workflow.overdueOpen.total, 2);
  assert.deepEqual(report.kpis.priorityOpen, { total: 2, lead: 1, crisis: 1 });
  assert.ok(report.kpis.overdueTasks <= report.kpis.pendingTasks);
  assert.equal(report.attentionItems[0]?.count, 1);
  assert.ok(report.attentionItems.some((item) => item.key === "crisis_high_priority"));
  assert.ok(report.attentionItems.every((item) => !Object.hasOwn(item, "content")));
  assert.ok(report.managementInsights.length > 0);
  assert.ok(report.managementInsights.length <= 3);
  assert.ok(report.recommendations.length > 0);
  assert.ok(report.recommendations.length <= 3);
});

test("does not count completed late work as open or overdue", () => {
  const lead = leadReport();
  const crisis = crisisReport();
  lead.detailRows = lead.detailRows.map((row) => ({
    ...row,
    status: "completed",
    workflowStatus: "completed",
    slaStatus: "Tre SLA",
  }));
  crisis.detailRows = crisis.detailRows.map((row) => ({
    ...row,
    status: "resolved",
    workflowStatus: "resolved",
    slaStatus: "Tre SLA",
  }));

  const report = buildDualOperationsReportData(lead, crisis);

  assert.deepEqual(report.kpis.workflow.completed, { total: 2, lead: 1, crisis: 1 });
  assert.deepEqual(report.kpis.workflow.completionRate, { total: 100, lead: 100, crisis: 100 });
  assert.equal(report.kpis.pendingTasks, 0);
  assert.equal(report.kpis.overdueTasks, 0);
  assert.deepEqual(report.kpis.priorityOpen, { total: 0, lead: 0, crisis: 0 });
});

test("uses the same actionable queues as the customer and alert pages", () => {
  const lead = leadReport();
  const crisis = crisisReport();
  const leadRow = lead.detailRows[0];
  const crisisRow = crisis.detailRows[0];

  lead.detailRows = [
    { ...leadRow, id: "lead-unassigned", workflowStatus: "unassigned" },
    { ...leadRow, id: "lead-waiting", workflowStatus: "waiting" },
    { ...leadRow, id: "lead-processing", workflowStatus: "processing" },
    { ...leadRow, id: "lead-follow-up", workflowStatus: "follow_up" },
    { ...leadRow, id: "lead-completed", status: "completed", workflowStatus: "completed" },
    { ...leadRow, id: "lead-skipped", status: "skipped", workflowStatus: "skipped" },
  ];
  crisis.detailRows = [
    { ...crisisRow, id: "alert-pending", workflowStatus: "pending" },
    { ...crisisRow, id: "alert-processing", workflowStatus: "processing" },
    { ...crisisRow, id: "alert-contact-failed", workflowStatus: "contact_failed" },
    { ...crisisRow, id: "alert-resolved", status: "resolved", workflowStatus: "resolved" },
    { ...crisisRow, id: "alert-skipped", status: "skipped", workflowStatus: "skipped" },
  ];

  const report = buildDualOperationsReportData(lead, crisis);

  assert.deepEqual(report.kpis.workflow.unassigned, { total: 2, lead: 1, crisis: 1 });
  assert.deepEqual(report.kpis.workflow.inProgress, { total: 4, lead: 2, crisis: 2 });
  assert.deepEqual(report.kpis.workflow.completed, { total: 2, lead: 1, crisis: 1 });
  assert.deepEqual(report.kpis.workflow.completionRate, { total: 22, lead: 20, crisis: 25 });
  assert.equal(report.kpis.totalTasks, 9);
  assert.equal(report.kpis.pendingTasks, 7);
});

test("Excel preview document contains the same report sections and filtered context", () => {
  const report = buildDualOperationsReportData(leadReport(), crisisReport());
  const document = buildDualOperationsReportExcelDocument(report, {
    periodLabel: "7 ngày gần nhất",
    filterLabel: "Cả hai nghiệp vụ",
  });

  assert.match(document, /Báo cáo tổng quan thương hiệu/);
  assert.match(document, /7 ngày gần nhất/);
  assert.match(document, /Cả hai nghiệp vụ/);
  assert.match(document, /Kết quả trong kỳ/);
  assert.match(document, /Tóm tắt điều hành/);
  assert.match(document, /Tình trạng công việc theo nghiệp vụ/);
  assert.match(document, /Tỷ lệ hoàn thành/);
  assert.match(document, /Nhận định:/);
  assert.match(document, /Hành động:/);
  assert.match(document, /Xu hướng và biến động tồn đọng 7 ngày/);
  assert.match(document, /Xu hướng Khách hàng 7 ngày/);
  assert.match(document, /Xu hướng Cảnh báo 7 ngày/);
  assert.match(document, /Cơ cấu nguồn phát sinh/);
  assert.match(document, /Ghi chú cách tính/);
  assert.match(document, /không tính Đã bỏ qua/);
  assert.doesNotMatch(document, /Chi tiết Lead/);
  assert.doesNotMatch(document, /Chi tiết Khủng hoảng/);
  assert.doesNotMatch(document, /Khách hàng A/);

  const leadOnlyDocument = buildDualOperationsReportExcelDocument(report, {
    periodLabel: "7 ngày gần nhất",
    filterLabel: "Chỉ Khách hàng tiềm năng",
    operation: "lead",
  });
  assert.match(leadOnlyDocument, /Xu hướng Khách hàng 7 ngày/);
  assert.doesNotMatch(leadOnlyDocument, /Xu hướng Cảnh báo 7 ngày/);
});
