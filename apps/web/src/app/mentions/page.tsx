"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useMentionsData } from "@/hooks/useMentionsData";
import { MentionFilters } from "@/components/mentions/MentionFilters";
import { MentionTable } from "@/components/mentions/MentionTable";
import { MentionStats } from "@/components/mentions/MentionStats";

export default function MentionsPage() {
  useMentionsData({ autoFetch: true, refetchInterval: 120000 });
  const { t } = useTranslation();
  const [contentMode, setContentMode] = useState<"all" | "post" | "comment">("all");

  const { getFilteredMentions, filters, workspaces, mentions: allMentions, isLoading } =
    useDashboardStore();
  const filteredMentions = useMemo(
    () => getFilteredMentions(),
    [getFilteredMentions, filters, allMentions],
  );
  const mentions = useMemo(() => {
    if (contentMode === "post") {
      return filteredMentions.filter((mention) => mention.content_type === "post");
    }
    if (contentMode === "comment") {
      return filteredMentions.filter(
        (mention) => mention.content_type === "comment" || mention.content_type === "reply",
      );
    }
    return filteredMentions;
  }, [contentMode, filteredMentions]);

  return (
    <div className="p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-[var(--color-text-primary)]">
            {t("mentions.pageTitle")}
          </h1>
          <p className="text-base text-[var(--color-text-secondary)] mt-2">
            {t("mentions.pageSubtitle")}
          </p>
        </div>
        <div className="flex gap-2 md:gap-3 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-high)] transition-all font-medium text-sm">
            <span className="material-symbols-outlined text-lg">
              file_download
            </span>
            {t("mentions.exportBtn")}
          </button>
          <button className="flex items-center gap-2 px-4 py-3 bg-[var(--color-brand)] text-white rounded-lg shadow-sm hover:bg-[var(--color-brand-hover)] transition-all font-medium text-sm">
            <span className="material-symbols-outlined text-lg">refresh</span>
            {t("mentions.refreshBtn")}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-6">
        <MentionFilters
          workspaces={workspaces}
          filters={filters}
          allMentions={allMentions}
          contentMode={contentMode}
          onContentModeChange={setContentMode}
        />
      </div>

      {/* Mentions Table */}
      <div className="mb-8">
        <MentionTable
          mentions={mentions}
          isLoading={isLoading}
          contentMode={contentMode}
        />
      </div>

      {/* Stats Dashboard Widget */}
      <div>
        <MentionStats mentions={mentions} isLoading={isLoading} />
      </div>
    </div>
  );
}
