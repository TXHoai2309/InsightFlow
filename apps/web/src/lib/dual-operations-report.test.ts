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

test("builds explainable attention and urgency data for both operations", () => {
  const report = buildDualOperationsReportData(leadReport(), crisisReport());

  assert.equal(report.attentionItems[0]?.count, 1);
  assert.equal(report.priorityRows[0]?.urgencyLevel, "urgent");
  assert.ok(report.priorityRows.some((row) => row.type === "lead"));
  assert.ok(report.priorityRows.some((row) => row.type === "crisis"));
  assert.ok(report.priorityRows.every((row) => row.urgencyReasons.length > 0));
  assert.ok(report.recommendations.length > 0);
  assert.ok(report.recommendations.length <= 3);
});

test("Excel preview document contains the same report sections and filtered context", () => {
  const report = buildDualOperationsReportData(leadReport(), crisisReport());
  const document = buildDualOperationsReportExcelDocument(report, {
    periodLabel: "7 ngày gần nhất",
    filterLabel: "Cả hai nghiệp vụ",
  });

  assert.match(document, /Báo cáo công việc cá nhân/);
  assert.match(document, /7 ngày gần nhất/);
  assert.match(document, /Cả hai nghiệp vụ/);
  assert.match(document, /Kết quả trong kỳ/);
  assert.match(document, /Chi tiết Lead/);
  assert.match(document, /Chi tiết Khủng hoảng/);
  assert.match(document, /Khách hàng A/);

  const leadOnlyDocument = buildDualOperationsReportExcelDocument(report, {
    periodLabel: "7 ngày gần nhất",
    filterLabel: "Chỉ Khách hàng tiềm năng",
    operation: "lead",
  });
  assert.match(leadOnlyDocument, /Chi tiết Lead/);
  assert.doesNotMatch(leadOnlyDocument, /Chi tiết Khủng hoảng/);
});
