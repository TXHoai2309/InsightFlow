"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboardData";
import { getScopedBrandKey } from "@/lib/brandScope";
import {
  buildDualOperationsReportExcelDocument,
  exportDualOperationsReportExcel,
  type DualOperationsExcelViewOptions,
} from "@/lib/excelExport";
import type { DualOperationsAttentionItem } from "@/lib/dual-operations-report";
import {
  DEFAULT_CRISIS_REPORT_FILTERS,
  type CrisisReportFilters,
} from "@/lib/crisis-report-filters";
import {
  DEFAULT_LEAD_REPORT_FILTERS,
  type LeadReportFilters,
} from "@/lib/lead-report-filters";
import { normalizeBrandName } from "@/lib/services/dashboard";
import { useAlertStore } from "@/stores/alert.store";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useDualOperationsReport } from "./useDualOperationsReport";
import { ExcelDocumentPreviewModal } from "@/components/reports/ExcelDocumentPreviewModal";
import { ReportExportOptionModal } from "@/components/reports/ReportExportOptionModal";
import { isDemoPath, toDemoHref } from "@/lib/demo-navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Eye,
  Filter,
  Lightbulb,
  LoaderCircle,
  TrendingUp,
} from "lucide-react";

type OperationScope = "all" | "lead" | "crisis";
type OperationTab = "lead" | "crisis";

interface DualReportFilters {
  operation: OperationScope;
  timeRange: LeadReportFilters["timeRange"];
  startDate: string;
  endDate: string;
  sla: LeadReportFilters["sla"];
  priority: "all" | "high";
  source: string;
  leadStatus: LeadReportFilters["status"];
  crisisStatus: string;
  keyword: string;
}

const DEFAULT_DUAL_REPORT_FILTERS: DualReportFilters = {
  operation: "all",
  timeRange: "30d",
  startDate: "",
  endDate: "",
  sla: "all",
  priority: "all",
  source: "all",
  leadStatus: "all",
  crisisStatus: "all",
  keyword: "",
};

const SOURCE_OPTIONS = [
  { value: "all", label: "Tất cả nguồn" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "google_maps", label: "Google Maps" },
  { value: "be", label: "BeFood" },
  { value: "youtube", label: "YouTube" },
  { value: "thread", label: "Threads" },
  { value: "news", label: "Báo điện tử" },
];

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 text-sm font-semibold text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20";

function getPeriodLabel(filters: DualReportFilters) {
  if (filters.timeRange === "today") return "Hôm nay";
  if (filters.timeRange === "7d") return "7 ngày gần nhất";
  if (filters.timeRange === "30d") return "30 ngày gần nhất";
  if (filters.timeRange === "custom") {
    return filters.startDate && filters.endDate
      ? `${new Date(filters.startDate).toLocaleDateString("vi-VN")} – ${new Date(filters.endDate).toLocaleDateString("vi-VN")}`
      : "Khoảng thời gian tùy chọn";
  }
  return "Toàn bộ dữ liệu";
}

function getScopeLabel(scope: OperationScope) {
  if (scope === "lead") return "Chỉ Khách hàng tiềm năng";
  if (scope === "crisis") return "Chỉ Khủng hoảng";
  return "Cả hai nghiệp vụ";
}

function KpiCard({
  label,
  value,
  valueSuffix = "",
  description,
  breakdown,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  valueSuffix?: string;
  description: string;
  breakdown: { lead: number; crisis: number };
  icon: React.ElementType;
  tone?: "default" | "good" | "warn" | "danger";
}) {
  const valueClass =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "danger"
          ? "text-red-700"
          : "text-[var(--color-brand)]";
  const dotClass =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "danger"
          ? "bg-red-500"
          : "bg-[var(--color-brand)]";
  const iconClass =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warn"
        ? "bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "bg-red-50 text-red-700"
          : "bg-[var(--color-brand)]/10 text-[var(--color-brand)]";
  return (
    <article className="relative min-w-0 overflow-hidden bg-[var(--color-bg-surface)] p-4">
      <span className={`absolute inset-x-0 top-0 h-0.5 ${dotClass}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
          <p className={`mt-2 text-3xl font-black leading-none ${valueClass}`}>{value}{valueSuffix}</p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${iconClass}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-2 min-h-8 text-[11px] leading-4 text-[var(--color-text-secondary)]">{description}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--color-border)] pt-3">
        <div className="rounded-lg bg-[var(--color-bg-surface-raised)] px-2.5 py-2">
          <p className="truncate text-[10px] font-bold text-[var(--color-text-muted)]">Khách hàng</p>
          <p className="mt-0.5 text-sm font-black text-[var(--color-text-primary)]">{breakdown.lead}{valueSuffix}</p>
        </div>
        <div className="rounded-lg bg-[var(--color-bg-surface-raised)] px-2.5 py-2">
          <p className="truncate text-[10px] font-bold text-[var(--color-text-muted)]">Cảnh báo</p>
          <p className="mt-0.5 text-sm font-black text-[var(--color-text-primary)]">{breakdown.crisis}{valueSuffix}</p>
        </div>
      </div>
    </article>
  );
}

function AttentionCard({ item }: { item: DualOperationsAttentionItem }) {
  const pathname = usePathname();
  const href = isDemoPath(pathname) ? toDemoHref(item.href) || "/demo" : item.href;
  const toneClass =
    item.tone === "danger"
      ? "border-red-200 bg-red-50/65 text-red-700"
      : item.tone === "warn"
        ? "border-amber-200 bg-amber-50/65 text-amber-700"
        : "border-indigo-200 bg-indigo-50/65 text-indigo-700";
  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-lg border p-3 transition hover:border-current hover:shadow-sm ${toneClass}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/80 shadow-sm">
        <AlertTriangle className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="font-extrabold text-[var(--color-text-primary)]">{item.title}</p>
          <strong className="text-xl font-black">{item.count}</strong>
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{item.description}</p>
        <p className="mt-2 flex items-center gap-1 text-[11px] font-bold">
          Mở danh sách xử lý
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-3 last:border-b-0">
      <p className="text-xs font-bold text-[var(--color-text-secondary)]">{label}</p>
      <p className="text-lg font-black text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function TrendBars({
  rows,
  primaryKey,
  secondaryKey,
  primaryLabel,
  secondaryLabel,
}: {
  rows: Array<Record<string, string | number>>;
  primaryKey: string;
  secondaryKey: string;
  primaryLabel: string;
  secondaryLabel: string;
}) {
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [Number(row[primaryKey] || 0), Number(row[secondaryKey] || 0)]),
  );
  const barHeight = (value: number) => value <= 0 ? 0 : Math.max(4, (value / maxValue) * 100);
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-bold text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-indigo-500" />{primaryLabel}</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{secondaryLabel}</span>
      </div>
      <div className="grid min-h-40 grid-cols-7 items-end gap-2">
        {rows.slice(-7).map((row, index) => (
          <div key={`${row.day}-${index}`} className="flex h-full min-w-0 flex-col justify-end gap-1">
            <div className="flex h-28 items-end justify-center gap-1">
              <div
                className="w-3 rounded-t bg-indigo-500"
                style={{ height: `${barHeight(Number(row[primaryKey] || 0))}%` }}
                title={`${primaryLabel}: ${row[primaryKey] || 0}`}
              />
              <div
                className="w-3 rounded-t bg-emerald-500"
                style={{ height: `${barHeight(Number(row[secondaryKey] || 0))}%` }}
                title={`${secondaryLabel}: ${row[secondaryKey] || 0}`}
              />
            </div>
            <span className="truncate text-center text-[10px] text-[var(--color-text-muted)]">{row.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DualOperationsEmployeeReportPage({
  onOpenDailyReport,
}: {
  onOpenDailyReport?: () => void;
} = {}) {
  const { profile } = useAuth();
  const [reportFilters, setReportFilters] = useState<DualReportFilters>(DEFAULT_DUAL_REPORT_FILTERS);
  const [activeOperation, setActiveOperation] = useState<OperationTab>("lead");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const [showExportOptionModal, setShowExportOptionModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiInsights, setAiInsights] = useState("");

  const leadFilters = useMemo<LeadReportFilters>(() => ({
    ...DEFAULT_LEAD_REPORT_FILTERS,
    timeRange: reportFilters.timeRange,
    startDate: reportFilters.startDate,
    endDate: reportFilters.endDate,
    sla: reportFilters.sla,
    source: reportFilters.source,
    keyword: reportFilters.keyword,
    status: reportFilters.leadStatus,
    intent: reportFilters.priority === "high" ? "hot" : "all",
    owner: "all",
  }), [reportFilters]);

  const crisisFilters = useMemo<CrisisReportFilters>(() => ({
    ...DEFAULT_CRISIS_REPORT_FILTERS,
    timeRange: reportFilters.timeRange,
    startDate: reportFilters.startDate,
    endDate: reportFilters.endDate,
    sla: reportFilters.sla,
    source: reportFilters.source,
    keyword: reportFilters.keyword,
    status: reportFilters.crisisStatus,
    severity: reportFilters.priority === "high" ? "high_critical" : "all",
  }), [reportFilters]);

  const report = useDualOperationsReport({
    leadFilters,
    crisisFilters,
    includeLead: reportFilters.operation !== "crisis",
    includeCrisis: reportFilters.operation !== "lead",
  });
  const { filters, workspaces, isLoading: dashboardLoading, error: dashboardError, setFilters } = useDashboardStore();
  const { isLoading: alertLoading, error: alertError, fetchAlerts, fetchCorrectionRequests } = useAlertStore();

  useDashboard({ autoFetch: true, refetchInterval: 60000 });

  useEffect(() => {
    if (!profile || profile.role === "admin" || workspaces.length === 0) return;
    if (filters.workspace_id !== "all") return;
    const profileBrandKey = normalizeBrandName(profile.brandName || profile.brandId || "");
    const scopedWorkspace = workspaces.find(
      (workspace) =>
        normalizeBrandName(workspace.id) === profileBrandKey ||
        normalizeBrandName(workspace.brand_name) === profileBrandKey,
    );
    setFilters({ workspace_id: scopedWorkspace?.id || profile.brandId || profile.brandName || "all" });
  }, [filters.workspace_id, profile, setFilters, workspaces]);

  useEffect(() => {
    const scopedBrandKey = getScopedBrandKey(profile);
    fetchAlerts(scopedBrandKey, false);
    fetchCorrectionRequests(scopedBrandKey, false);
  }, [fetchAlerts, fetchCorrectionRequests, profile]);

  useEffect(() => {
    if (reportFilters.operation === "lead") setActiveOperation("lead");
    if (reportFilters.operation === "crisis") setActiveOperation("crisis");
  }, [reportFilters.operation]);

  const handleGenerateAIReport = async () => {
    setIsGeneratingAI(true);
    let generatedInsights = "";
    const brandName = profile?.brandName || profile?.brandId || "Highlands Coffee";

    try {
      const leadSamples = reportFilters.operation === "crisis"
        ? []
        : report.lead.detailRows.map((row) => ({
            content: `LEAD | ${row.customer} | ${row.content}`,
            sentiment: "positive",
            topic: "lead",
            source: row.platform || "system",
            priority: row.priorityScore,
          }));
      const crisisSamples = reportFilters.operation === "lead"
        ? []
        : report.crisis.detailRows.map((row) => ({
            content: `CRISIS | ${row.topic || row.brand} | ${row.content}`,
            sentiment: row.sentiment || "negative",
            topic: row.topic || "crisis",
            source: row.platform || "system",
            priority:
              row.severity === "critical" ? 100 : row.severity === "high" ? 75 : row.negativityScore,
          }));
      const sampleRows = [...crisisSamples, ...leadSamples]
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 20)
        .map(({ priority: _priority, ...row }) => row);

      const res = await fetch("/api/reports/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brandName,
          mentions: sampleRows,
          prompt: `Báo cáo tác nghiệp cho ${brandName}. Đã hoàn tất: ${report.kpis.completedTasks}, Đúng SLA: ${report.kpis.slaOnTimeRate}%, Còn mở: ${report.kpis.pendingTasks}, Quá hạn: ${report.kpis.overdueTasks}. Đưa ra đánh giá sức khỏe thương hiệu, điểm nóng dư luận/SLA và 3 khuyến nghị hành động ưu tiên.`,
          lang: "vi",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.insights) {
          generatedInsights = data.insights;
        }
      }
    } catch (err) {
      console.warn("Lỗi khi sinh báo cáo Gemini AI:", err);
    }

    if (!generatedInsights) {
      generatedInsights = `BÁO CÁO PHÂN TÍCH THÔNG MINH (AI INSIGHTS) CHO THƯƠNG HIỆU: ${brandName.toUpperCase()}

1. ĐÁNH GIÁ TỔNG QUAN SỨC KHỎE THƯƠNG HIỆU & CAM KẾT SLA:
• Tổng số công việc tác nghiệp ghi nhận: ${report.kpis.completedTasks + report.kpis.pendingTasks} ca. Tỷ lệ đáp ứng SLA đạt ${report.kpis.slaOnTimeRate}%.
• INSIGHT THƯƠNG HIỆU: Chỉ số SLA ${report.kpis.slaOnTimeRate}% thể hiện đội ngũ vận hành đang xử lý tốt khối lượng công việc hiện tại (${report.kpis.completedTasks} ca đã hoàn tất). Tuy nhiên, ${report.kpis.overdueTasks} ca quá hạn SLA là điểm nghẽn nguy hiểm có thể làm suy giảm chỉ số hài lòng (CSAT) của khách hàng đối với thương hiệu ${brandName}.

2. PHÂN TÍCH CHUYÊN SÂU ĐIỂM NÓNG & DỮ LIỆU THỰC TẾ (INSIGHTS FOR BRAND):
• Nghiệp vụ Khủng hoảng (Crisis): Ghi nhận ${report.crisis.kpis.critical + report.crisis.kpis.high} trường hợp cảnh báo mức độ Cao/Nghiêm trọng.
  ↳ INSIGHT THƯƠNG HIỆU: Các phản hồi tập trung vào thái độ phục vụ và tốc độ xử lý sự cố. Việc chậm trễ ứng phó với ${report.crisis.kpis.critical + report.crisis.kpis.high} ca này có rủi ro lan truyền trên mạng xã hội, ảnh hưởng trực tiếp tới hình ảnh thương hiệu ${brandName}.
• Nghiệp vụ Khách hàng tiềm năng (Lead): Thu thập được ${report.lead.kpis.total} Lead, tỷ lệ chuyển đổi đạt ${report.lead.kpis.conversionRate}%.
  ↳ INSIGHT THƯƠNG HIỆU: Tỷ lệ chuyển đổi ${report.lead.kpis.conversionRate}% cho thấy nhu cầu thị trường khả quan, nhưng vẫn còn ${report.lead.kpis.needResult} Lead đã liên hệ nhưng chưa cập nhật kết quả — cho thấy thất thoát tiềm năng doanh thu do khâu chăm sóc hậu kỳ chưa khép kín.

3. DỰ BÁO RỦI RO TRUYỀN THÔNG & NGHẼN VẬN HÀNH:
• Rủi ro 1: Rủi ro bùng phát khủng hoảng từ các khiếu nại chưa xử lý dứt điểm trên kênh mạng xã hội.
• Rủi ro 2: Thất thoát doanh thu từ ${report.lead.kpis.needResult} Lead nóng nếu không được Sales theo sát trong vòng 48h.

4. 3 KHUYẾN NGHỊ HÀNH ĐỘNG VÀ KẾ HOẠCH THỰC THI THƯƠNG HIỆU:
- Ưu tiên 1 (Ngắn hạn - 24h): Giải quyết dứt điểm ${report.kpis.overdueTasks} ca quá hạn SLA và ${report.crisis.kpis.critical} ca khủng hoảng nghiêm trọng.
- Ưu tiên 2 (Trung hạn - 7 ngày): Đôn đốc bộ phận Sales chốt kết quả xử lý cho ${report.lead.kpis.needResult} Lead còn đọng.
- Ưu tiên 3 (Dài hạn): Thiết lập cảnh báo tự động khi xuất hiện từ khóa tiêu cực trên các kênh truyền thông chính.`;
    }

    setAiInsights(generatedInsights);
    setIsGeneratingAI(false);
    setShowExportOptionModal(false);
    setShowExcelPreview(true);
  };

  const updateFilter = <K extends keyof DualReportFilters>(key: K, value: DualReportFilters[K]) => {
    setReportFilters((current) => ({ ...current, [key]: value }));
  };

  const activeAdvancedFilterCount = [
    reportFilters.sla !== "all",
    reportFilters.priority !== "all",
    reportFilters.source !== "all",
    reportFilters.leadStatus !== "all",
    reportFilters.crisisStatus !== "all",
    Boolean(reportFilters.keyword.trim()),
  ].filter(Boolean).length;
  const periodLabel = getPeriodLabel(reportFilters);
  const scopeLabel = getScopeLabel(reportFilters.operation);
  const excelOptions: DualOperationsExcelViewOptions = {
    periodLabel,
    filterLabel: `${scopeLabel}${activeAdvancedFilterCount > 0 ? ` · ${activeAdvancedFilterCount} bộ lọc nâng cao` : ""}`,
    operation: reportFilters.operation,
    aiInsights,
  };
  const excelPreviewHtml = showExcelPreview
    ? buildDualOperationsReportExcelDocument(report, excelOptions)
    : "";
  const attentionItems = report.attentionItems;
  const loading = dashboardLoading || alertLoading;
  const error = dashboardError || alertError;

  return (
    <main data-tour="reports-center" className="mx-auto w-full max-w-[1600px] space-y-5 p-4 md:p-6 min-[1100px]:p-8">
      <ReportExportOptionModal
        isOpen={showExportOptionModal}
        onClose={() => setShowExportOptionModal(false)}
        onSelectRaw={() => {
          setAiInsights("");
          setShowExportOptionModal(false);
          setShowExcelPreview(true);
        }}
        onSelectAI={handleGenerateAIReport}
        isGeneratingAI={isGeneratingAI}
      />

      {showExcelPreview ? (
        <ExcelDocumentPreviewModal
          title={aiInsights ? "Bản xem trước Báo cáo AI Insights (Data + Gemini AI)" : "Nội dung và hình thức sẽ được xuất nguyên bản"}
          html={excelPreviewHtml}
          onClose={() => setShowExcelPreview(false)}
          onExport={() => exportDualOperationsReportExcel(report, `Bao_cao_tong_quan_thuong_hieu_${new Date().toISOString().slice(0, 10)}`, excelOptions)}
        />
      ) : null}

      <header className="border-b border-[var(--color-border)] pb-4">
        <div className="flex flex-col gap-4 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between">
          <div>
            <h1 className="text-xl font-black text-[var(--color-text-primary)]">Tổng quan vận hành thương hiệu</h1>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Theo dõi khối lượng, kết quả, rủi ro và xu hướng xử lý ở cấp tổng quan.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {onOpenDailyReport ? (
              <button
                type="button"
                onClick={onOpenDailyReport}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-4 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-bg-surface-high)]"
              >
                <CalendarDays className="h-4 w-4" />
                Báo cáo theo ngày
              </button>
            ) : null}
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <select
                aria-label="Kỳ báo cáo"
                value={reportFilters.timeRange}
                onChange={(event) => {
                  const value = event.target.value as DualReportFilters["timeRange"];
                  updateFilter("timeRange", value);
                  if (value === "custom") setShowAdvancedFilters(true);
                }}
                className={`${inputClass} pl-9 sm:w-48`}
              >
                <option value="today">Hôm nay</option>
                <option value="7d">7 ngày gần nhất</option>
                <option value="30d">30 ngày gần nhất</option>
                <option value="custom">Tùy chọn thời gian</option>
                <option value="all">Toàn bộ dữ liệu</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((value) => !value)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition ${showAdvancedFilters || activeAdvancedFilterCount > 0 ? "border-[var(--color-brand)]/35 bg-[var(--color-brand-subtle)] text-[var(--color-brand)]" : "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-high)]"}`}
            >
              <Filter className="h-4 w-4" />
              Bộ lọc{activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ""}
            </button>
            <button
              type="button"
              onClick={() => setShowExportOptionModal(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--color-brand-hover)]"
            >
              <Eye className="h-4 w-4" />
              Xem trước &amp; xuất Excel
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-lg bg-[var(--color-bg-surface-high)] p-1">
            {(["all", "lead", "crisis"] as const).map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => updateFilter("operation", scope)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${reportFilters.operation === scope ? "bg-[var(--color-bg-surface)] text-[var(--color-brand)] shadow-sm" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
              >
                {scope === "all" ? "Tổng quan" : scope === "lead" ? "Khách hàng tiềm năng" : "Khủng hoảng"}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Cập nhật {new Date(report.generatedAt).toLocaleString("vi-VN")}</span>
        </div>
      </header>

      {showAdvancedFilters ? (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-[var(--color-text-primary)]">Bộ lọc nâng cao</h2>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Chỉ hiển thị bộ lọc trạng thái phù hợp với nghiệp vụ đang xem.</p>
            </div>
            <button type="button" onClick={() => setReportFilters(DEFAULT_DUAL_REPORT_FILTERS)} className="text-sm font-bold text-[var(--color-brand)]">Đặt lại</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 min-[1100px]:grid-cols-4">
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">SLA</span><select value={reportFilters.sla} onChange={(event) => updateFilter("sla", event.target.value as DualReportFilters["sla"])} className={inputClass}><option value="all">Tất cả SLA</option><option value="in_sla">Trong/Đúng SLA</option><option value="overdue">Quá hạn</option><option value="late">Trễ SLA</option><option value="closed">Đã đóng</option></select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Mức ưu tiên</span><select value={reportFilters.priority} onChange={(event) => updateFilter("priority", event.target.value as DualReportFilters["priority"])} className={inputClass}><option value="all">Tất cả mức độ</option><option value="high">Hot Lead / Crisis cao</option></select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Nguồn</span><select value={reportFilters.source} onChange={(event) => updateFilter("source", event.target.value)} className={inputClass}>{SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            {activeOperation === "lead" ? (
              <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Trạng thái Lead</span><select value={reportFilters.leadStatus} onChange={(event) => updateFilter("leadStatus", event.target.value as DualReportFilters["leadStatus"])} className={inputClass}><option value="all">Tất cả trạng thái</option><option value="new">Mới</option><option value="processing">Đang xử lý</option><option value="completed">Đã chuyển đổi</option><option value="skipped">Bỏ qua</option></select></label>
            ) : (
              <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Trạng thái Khủng hoảng</span><select value={reportFilters.crisisStatus} onChange={(event) => updateFilter("crisisStatus", event.target.value)} className={inputClass}><option value="all">Tất cả trạng thái</option><option value="new">Mới</option><option value="resolving">Đang xử lý</option><option value="monitoring">Đang theo dõi</option><option value="pending_approval">Chờ duyệt</option><option value="resolved">Đã xử lý</option></select></label>
            )}
            <label className="space-y-1 md:col-span-2"><span className="text-xs font-bold text-[var(--color-text-muted)]">Từ khóa</span><input value={reportFilters.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} placeholder="ID, khách hàng, nội dung..." className={inputClass} /></label>
            {reportFilters.timeRange === "custom" ? <><label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Từ ngày</span><input type="date" value={reportFilters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} className={inputClass} /></label><label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Đến ngày</span><input type="date" value={reportFilters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} className={inputClass} /></label></> : null}
          </div>
        </section>
      ) : null}

      {loading && report.kpis.totalTasks === 0 ? <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">Đang tải dữ liệu báo cáo...</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Một phần dữ liệu chưa tải được: {error}</div> : null}

      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-brand)]" />
            <div>
              <h2 className="text-sm font-extrabold text-[var(--color-text-primary)]">Tình trạng công việc</h2>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">Đối soát theo cùng trạng thái trên trang Khách hàng và Cảnh báo.</p>
            </div>
          </div>
          <span className="rounded-full bg-[var(--color-bg-surface-raised)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-text-muted)]">{periodLabel}</span>
        </div>
        <div className="grid gap-px bg-[var(--color-border)] sm:grid-cols-2 min-[1100px]:grid-cols-4">
          <KpiCard
            label="Chưa phân công"
            value={report.kpis.workflow.unassigned.total}
            breakdown={report.kpis.workflow.unassigned}
            description="Chưa có người nhận xử lý trong hàng đợi nghiệp vụ."
            icon={CircleDashed}
          />
          <KpiCard
            label="Cần tiếp tục xử lý"
            value={report.kpis.workflow.inProgress.total}
            breakdown={report.kpis.workflow.inProgress}
            description="Đã nhận xử lý, đang theo dõi hoặc cần liên hệ lại."
            icon={LoaderCircle}
            tone="warn"
          />
          <KpiCard
            label="Đã hoàn tất"
            value={report.kpis.workflow.completed.total}
            breakdown={report.kpis.workflow.completed}
            description="Khách hàng đã đóng và cảnh báo đã giải quyết."
            icon={CheckCircle2}
            tone="good"
          />
          <KpiCard
            label="Tỷ lệ hoàn thành"
            value={report.kpis.workflow.completionRate.total}
            valueSuffix="%"
            breakdown={report.kpis.workflow.completionRate}
            description="Số công việc đã đóng trên tổng công việc cần xử lý trong kỳ."
            icon={TrendingUp}
            tone="good"
          />
        </div>
        <p className="border-t border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-4 py-2 text-[10px] leading-4 text-[var(--color-text-muted)]">
          Tỷ lệ hoàn thành = số công việc “Đã đóng” / tổng công việc cần xử lý phát sinh trong khoảng thời gian đã chọn.
        </p>
      </section>

      <div className="grid gap-4 min-[1100px]:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <h2 className="text-sm font-extrabold text-[var(--color-text-primary)]">Việc cần xử lý trước</h2>
                <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">Ưu tiên theo rủi ro và thời hạn xử lý.</p>
              </div>
            </div>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">{attentionItems.length} nhóm</span>
          </div>
          <div className="grid gap-2 p-3 md:grid-cols-2">
            {attentionItems.length > 0 ? attentionItems.map((item) => <AttentionCard key={item.key} item={item} />) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Không có rủi ro nổi bật trong phạm vi báo cáo hiện tại.</div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <div>
              <h2 className="text-sm font-extrabold text-[var(--color-text-primary)]">Nhận định và hành động</h2>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">Tối đa 3 vấn đề và 3 hành động dựa trên số liệu.</p>
            </div>
          </div>
          <div className="space-y-2 border-b border-[var(--color-border)] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-text-muted)]">Nhận định quản trị</p>
            {report.managementInsights.map((insight) => (
              <div key={insight} className="flex gap-2 text-xs font-semibold leading-5 text-[var(--color-text-secondary)]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <p>{insight}</p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-[var(--color-border)] px-4">
            <p className="pt-3 text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-text-muted)]">Hành động đề xuất</p>
            {report.recommendations.map((recommendation, index) => (
              <div key={recommendation} className="flex gap-3 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[11px] font-black text-[var(--color-brand)]">{index + 1}</span>
                <p className="text-xs font-semibold leading-5 text-[var(--color-text-secondary)]">{recommendation}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--color-brand)]" />
            <div>
              <h2 className="text-sm font-extrabold text-[var(--color-text-primary)]">Kết quả và xu hướng</h2>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">So sánh khối lượng phát sinh với kết quả xử lý.</p>
            </div>
          </div>
          <div className="inline-flex w-fit rounded-lg bg-[var(--color-bg-surface-high)] p-1">
            {(["lead", "crisis"] as const).map((tab) => (
              <button key={tab} type="button" disabled={reportFilters.operation !== "all" && reportFilters.operation !== tab} onClick={() => setActiveOperation(tab)} className={`rounded-md px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${activeOperation === tab ? "bg-[var(--color-bg-surface)] text-[var(--color-brand)] shadow-sm" : "text-[var(--color-text-secondary)]"}`}>{tab === "lead" ? "Khách hàng tiềm năng" : "Khủng hoảng"}</button>
            ))}
          </div>
        </div>
        <div className="grid min-[1100px]:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 p-4 min-[1100px]:border-r min-[1100px]:border-[var(--color-border)]">
            <h3 className="mb-1 text-xs font-extrabold text-[var(--color-text-primary)]">Xu hướng 7 ngày gần nhất</h3>
            <p className="mb-4 text-[11px] text-[var(--color-text-secondary)]">So sánh số công việc phát sinh và số công việc được đóng đúng theo ngày xảy ra sự kiện.</p>
            {activeOperation === "lead" ? <TrendBars rows={report.lead.responseTrend as unknown as Array<Record<string, string | number>>} primaryKey="created" secondaryKey="completed" primaryLabel="Lead mới" secondaryLabel="Đã đóng" /> : <TrendBars rows={report.crisis.responseTrend as unknown as Array<Record<string, string | number>>} primaryKey="created" secondaryKey="resolved" primaryLabel="Case mới" secondaryLabel="Đã đóng" />}
          </div>
          <aside className="border-t border-[var(--color-border)] bg-[var(--color-bg-surface-high)]/45 min-[1100px]:border-t-0">
            <p className="px-3 pb-1 pt-3 text-[10px] font-extrabold uppercase text-[var(--color-text-muted)]">Chỉ số nghiệp vụ</p>
            {activeOperation === "lead" ? <><Metric label="Đã đóng" value={`${report.kpis.workflow.completed.lead}/${report.kpis.leadTotal}`} /><Metric label="Tỷ lệ hoàn thành" value={`${report.kpis.workflow.completionRate.lead}%`} /><Metric label="Tỷ lệ chuyển đổi" value={`${report.lead.kpis.conversionRate}%`} /><Metric label="Đúng SLA" value={`${report.lead.kpis.slaOnTimeRate}%`} /><Metric label="Follow-up quá hạn" value={report.lead.kpis.followUpOverdue} /></> : <><Metric label="Đã đóng" value={`${report.kpis.workflow.completed.crisis}/${report.kpis.crisisTotal}`} /><Metric label="Tỷ lệ hoàn thành" value={`${report.kpis.workflow.completionRate.crisis}%`} /><Metric label="Critical/High còn mở" value={report.kpis.priorityOpen.crisis} /><Metric label="Quá hạn còn mở" value={report.kpis.workflow.overdueOpen.crisis} /><Metric label="Đúng SLA" value={`${report.crisis.kpis.slaOnTimeRate}%`} /></>}
          </aside>
        </div>
      </section>
    </main>
  );
}
