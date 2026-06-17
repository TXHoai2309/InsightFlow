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
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-on-surface">Mentions</h1>
          <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">
            Quản lý danh sách đề cập, lọc theo nguồn và trạng thái sentiment, và
            thực hiện relabel khi cần.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl border border-outline-variant bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:bg-surface-container-low">
            Lọc nhanh
          </button>
          <button className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
            Làm mới
          </button>
        </div>
      </div>

      <MentionStats mentions={mentions} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] mt-6">
        <MentionFilters workspaces={workspaces} filters={filters} />
        <MentionTable mentions={mentions} isLoading={isLoading} />
      </div>
    </div>
  );
}
