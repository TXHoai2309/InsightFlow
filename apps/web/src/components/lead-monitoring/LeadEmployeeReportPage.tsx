"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboardData";
import { normalizeBrandName } from "@/lib/services/dashboard";
import { exportLeadReportCsv, exportLeadReportExcel } from "@/lib/excelExport";
import {
  DEFAULT_LEAD_REPORT_FILTERS,
  type LeadReportFilters,
} from "@/lib/lead-report-filters";
import { ReportExportPreviewModal } from "@/components/reports/ReportExportPreviewModal";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useLeadMonitoringReport } from "./useLeadMonitoringReport";

// V2 specialized components
import { ReportHero } from "./report/ReportHero"; // We still need the top filter bar
import { ReportPersonalPerformance } from "./report/ReportPersonalPerformance";
import { ReportKPIs } from "./report/ReportKPIs";
import { ReportPerformanceCharts } from "./report/ReportPerformanceCharts";
import { ReportAIInsights } from "./report/ReportAIInsights";
import { ReportAchievements } from "./report/ReportAchievements";
import { ReportLeadTable } from "./report/ReportLeadTable";

function formatPercent(value: number) {
  return `${value}%`;
}

function reportFilename() {
  return `Bao_cao_nhan_vien_lead_${new Date().toISOString().slice(0, 10)}`;
}

export function LeadEmployeeReportPage() {
  const { profile } = useAuth();
  const { filters, workspaces, isLoading, error, setFilters } = useDashboardStore();
  const [reportFilters, setReportFilters] = useState<LeadReportFilters>(DEFAULT_LEAD_REPORT_FILTERS);
  const report = useLeadMonitoringReport(reportFilters);
  const [pendingExport, setPendingExport] = useState<"excel" | "csv" | null>(null);

  const updateReportFilter = <K extends keyof LeadReportFilters>(
    key: K,
    value: LeadReportFilters[K],
  ) => {
    setReportFilters((current) => ({ ...current, [key]: value }));
  };

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

    setFilters({
      workspace_id: scopedWorkspace?.id || profile.brandId || profile.brandName || "all",
    });
  }, [
    filters.workspace_id,
    profile,
    profile?.brandId,
    profile?.brandName,
    setFilters,
    workspaces,
  ]);

  const exportFile = () => {
    if (pendingExport === "excel") exportLeadReportExcel(report, reportFilename());
    if (pendingExport === "csv") exportLeadReportCsv(report, reportFilename());
    setPendingExport(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0914] text-slate-900 dark:text-white selection:bg-indigo-500/30 transition-colors">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in relative z-10">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div className="absolute top-[20%] left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        {pendingExport ? (
          <ReportExportPreviewModal
            title="Báo cáo hiệu suất cá nhân"
            subtitle="Preview 3 trang báo cáo trước khi xuất PDF/Excel."
            generatedAt={report.generatedAt}
            formatLabel={pendingExport.toUpperCase()}
            stats={[
              { label: "Điểm hiệu suất", value: "87/100", tone: "good" },
              { label: "Tỷ lệ chuyển đổi", value: formatPercent(report.kpis.conversionRate), tone: "good" },
              { label: "Tỷ lệ đúng SLA", value: "91%", tone: "default" },
            ]}
            summary={"- Phản hồi khách nhanh hơn trung bình nhóm 18%.\n- Cần cải thiện tốc độ follow-up.\n- Có 7 lead quá SLA cần xử lý ngay."}
            sections={[
              {
                title: "Trang 2: Biểu đồ & Xu hướng",
                rows: [
                  { label: "Hiệu suất xử lý", value: "Chi tiết theo tuần/ngày" },
                  { label: "Nguồn khách hàng", value: "Phân bổ Facebook, TikTok..." },
                ],
              },
              {
                title: "Trang 3: Dữ liệu chi tiết",
                rows: [
                  { label: "Danh sách lead", value: `${report.detailRows.length} dòng` },
                  { label: "Lịch sử tương tác", value: "Bao gồm kết quả cuối cùng" },
                ],
              },
            ]}
            sampleRows={report.detailRows.slice(0, 3).map((row) => ({
              label: row.customer,
              meta: `${row.platform} · ${row.status} · ${row.resultType || "Đang xử lý"}`,
              badge: row.intent.toUpperCase(),
              description: row.content,
            }))}
            onClose={() => setPendingExport(null)}
            onConfirm={exportFile}
          />
        ) : null}

        {/* Action Bar / Export & Filter */}
        <ReportHero 
          profile={profile} 
          filters={reportFilters} 
          updateFilter={updateReportFilter} 
          onExport={setPendingExport} 
          kpiScore={87} 
        />

        {isLoading && report.kpis.total === 0 && (
          <div className="bg-white dark:bg-[#13111c] border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-4 text-sm font-semibold text-indigo-600 dark:text-indigo-300 flex items-center justify-center gap-2 shadow-sm">
            <i className="ti ti-loader animate-spin text-lg"></i>
            Đang tải dữ liệu báo cáo lead...
          </div>
        )}

        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-4 text-sm font-semibold text-rose-600 dark:text-rose-400 shadow-sm">
            {error}
          </div>
        )}

        {/* 1. Khối Hiệu suất cá nhân */}
        <ReportPersonalPerformance staffPerformance={report.staffPerformance} profile={profile} filters={reportFilters} />

        {/* 2. Đánh giá AI & Thành tích cá nhân */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <ReportAchievements report={report} />
          </div>
          <div>
            <ReportAIInsights report={report} />
          </div>
        </div>

        {/* 3. Kết quả công việc cơ bản */}
        <ReportKPIs report={report} />

        {/* 4. Biểu đồ hiệu suất */}
        <div className="mb-8">
          <ReportPerformanceCharts trendData={report.responseTrend} />
        </div>

        {/* 5. Bảng chi tiết */}
        <div id="lead-table" className="mb-8">
          <ReportLeadTable detailRows={report.detailRows} />
        </div>

      </div>
    </div>
  );
}
