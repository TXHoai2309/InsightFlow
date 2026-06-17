"use client";

import { useMemo } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useMentionsData } from "@/hooks/useMentionsData";
import { MentionFilters } from "@/components/mentions/MentionFilters";
import { MentionTable } from "@/components/mentions/MentionTable";
import { MentionStats } from "@/components/mentions/MentionStats";

export default function MentionsPage() {
  useMentionsData({ autoFetch: true, refetchInterval: 120000 });

  const { getFilteredMentions, filters, workspaces, isLoading } =
    useDashboardStore();
  const mentions = useMemo(
    () => getFilteredMentions(),
    [getFilteredMentions, filters],
  );

  return (
    <div className="p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-on-surface">
            Khám phá Đề cập
          </h1>
          <p className="text-base text-on-surface-variant mt-2">
            Theo dõi và quản lý các phản hồi từ đa nền tảng thời gian thực.
          </p>
        </div>
        <div className="flex gap-2 md:gap-3 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-3 bg-surface-container-high text-on-surface-variant rounded-lg border border-outline-variant hover:bg-surface-container-highest transition-all font-medium text-sm">
            <span className="material-symbols-outlined text-lg">
              file_download
            </span>
            Xuất báo cáo
          </button>
          <button className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-lg shadow-sm hover:opacity-90 transition-all font-medium text-sm">
            <span className="material-symbols-outlined text-lg">refresh</span>
            Làm mới
          </button>
        </div>
      </div>

      {/* Filters Bar - 4 Column Bento Style */}
      <div className="mb-6">
        <MentionFilters workspaces={workspaces} filters={filters} />
      </div>

      {/* Mentions Table */}
      <div className="mb-8">
        <MentionTable mentions={mentions} isLoading={isLoading} />
      </div>

      {/* Stats Dashboard Widget */}
      <div>
        <MentionStats mentions={mentions} isLoading={isLoading} />
      </div>
    </div>
  );
}
