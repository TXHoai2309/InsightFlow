"use client";

import React, { useMemo } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { getLeadWorkbenchMeta } from "@/lib/lead-workbench";
import { useLeadMonitoringLeads } from "./useLeadMonitoringLeads";
import { useLeadMonitoringReport } from "./useLeadMonitoringReport";

export function AISummaryBanner() {
  const leads = useLeadMonitoringLeads();
  const report = useLeadMonitoringReport();

  const insight = useMemo(() => {
    const nowMs = Date.now();
    const last24hMs = nowMs - 24 * 60 * 60 * 1000;
    const pending = leads.filter((lead) => lead.status === "new" || lead.status === "processing");
    const newIn24h = leads.filter((lead) => {
      const createdAt = new Date(lead.created_at).getTime();
      return Number.isFinite(createdAt) && createdAt >= last24hMs;
    }).length;
    const highScoreUncontacted = pending.filter((lead) => {
      const meta = getLeadWorkbenchMeta(lead, nowMs);
      return meta.priorityScore >= 90 && !lead.first_contacted_at && !lead.last_contact_at;
    }).length;
    const unassigned = pending.filter((lead) => !lead.owner_id).length;
    const overdue = pending.filter((lead) => getLeadWorkbenchMeta(lead, nowMs).isOverdue).length;
    const topSource = report.sourceDistribution.find((source) => source.count > 0);
    const topSourceLabel = topSource?.label || "nguồn lead chính";

    return {
      actions: [
        highScoreUncontacted > 0
          ? `${highScoreUncontacted} lead điểm cao chưa được phản hồi`
          : `${report.kpis.contacted} lead đã có tín hiệu liên hệ trong kỳ`,
        topSource
          ? `${topSourceLabel} tạo nhiều lead nhất (${topSource.count} lead, ${topSource.percentage}%)`
          : "Chưa có đủ dữ liệu nguồn lead để so sánh",
        unassigned > 0
          ? `${unassigned} lead chưa gán nhân sự, nên chia trước nhóm quá SLA`
          : "Tất cả lead đang chờ đã có người phụ trách hoặc đã đóng",
      ],
      newIn24h,
      overdue,
      unassigned,
      topSourceLabel,
    };
  }, [leads, report]);

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E9E7EE] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#5B4FCF] shadow-sm">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-['Hanken_Grotesk'] text-[18px] font-bold text-[#1A1B20]">
              AI đề xuất xử lý
            </p>
            <p className="mt-1 max-w-3xl text-[14px] leading-6 text-[#474554]">
              Hệ thống ghi nhận <strong className="font-bold text-[#4234B6]">{insight.newIn24h} lead mới</strong> trong 24 giờ qua. Ưu tiên hiện tại là xử lý {insight.overdue} lead quá SLA, gán owner cho {insight.unassigned} lead chưa phụ trách và kiểm tra nguồn {insight.topSourceLabel}.
            </p>
          </div>
        </div>

        <div className="grid min-w-0 flex-1 gap-2 lg:max-w-[620px]">
          {insight.actions.map((action, index) => (
            <div
              key={action}
              className="flex items-center gap-3 rounded-[10px] border border-[#EEEDF4] bg-[#FAF8FF] px-3 py-2 text-[13px] font-semibold text-[#1A1B20]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#4234B6] shadow-sm">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{action}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#787585]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
