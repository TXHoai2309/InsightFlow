import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { Mention } from "@/types/dashboard";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { resolveMentionDetailTarget } from "@/lib/mention-navigation";

interface MentionTableProps {
  mentions: Mention[];
  isLoading: boolean;
  contentMode: "all" | "post" | "comment";
}

const formatCredibilityScore = (score: number) => {
  const percentage = score <= 1 ? score * 100 : score;
  return Math.max(0, Math.min(100, Math.round(percentage)));
};

const sentimentMap: Record<
  Mention["sentiment"],
  { labelKey: string; icon: string; className: string }
> = {
  positive: {
    labelKey: "mentions.table.tags.positive",
    icon: "sentiment_satisfied",
    className: "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
  },
  negative: {
    labelKey: "mentions.table.tags.negative",
    icon: "sentiment_very_dissatisfied",
    className: "bg-[var(--color-error-subtle)] text-[var(--color-error)]",
  },
  neutral: {
    labelKey: "mentions.table.tags.neutral",
    icon: "sentiment_neutral",
    className: "bg-[var(--color-info-subtle)] text-[var(--color-info)]",
  },
};

// Sample tags/hashtags based on topic
const topicTags: Record<Mention["topic"], string[]> = {
  quality: ["#UX/UI", "#Recommend"],
  price: ["#Price", "#Value"],
  service: ["#Performance", "#Support"],
  staff: ["#Team", "#Culture"],
  delivery: ["#Logistics", "#Timing"],
  experience: ["#Experience", "#Feedback"],
  legal: ["#Legal", "#Compliance"],
  operation: ["#Operation", "#Process"],
  marketing: ["#Marketing", "#Campaign"],
  competitor: ["#Competitor", "#Market"],
  other: ["#Other"],
};

export function MentionTable({ mentions, isLoading, contentMode }: MentionTableProps) {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const mentionById = useMemo(
    () => new Map<string, Mention>(mentions.map((item) => [item.id, item])),
    [mentions],
  );

  const getDisplayContent = (mention: Mention) => {
    if (contentMode === "comment") {
      return mention.comment_content || mention.content;
    }
    if (contentMode === "post") {
      return mention.post_content || mention.original_content || mention.content;
    }
    return mention.content_type === "post"
      ? mention.post_content || mention.original_content || mention.content
      : mention.comment_content || mention.content || mention.original_content;
  };

  const getContentTypeLabel = (mention: Mention) => {
    if (!mention.content_type) return "—";
    return t(`mentions.table.contentTypes.${mention.content_type}`, {
      defaultValue: mention.content_type,
    });
  };

  // Reset page when mentions change (e.g. filters applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [mentions]);

  const totalPages = Math.ceil(mentions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, mentions.length);
  const currentMentions = mentions.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return { 
        timeStr: t("mentions.table.unknownTime"), 
        relativeTime: t("mentions.table.unknownTimeDesc") 
      };
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    let relativeTime = t("mentions.table.justNow");
    if (diffMs < -60000) relativeTime = t("mentions.table.future");
    else if (diffMs < 0) relativeTime = t("mentions.table.justNow"); // Handle minor clock skews
    else if (diffDays >= 365) relativeTime = t("mentions.table.yearsAgo", { count: Math.floor(diffDays / 365.25) });
    else if (diffDays >= 30) relativeTime = t("mentions.table.monthsAgo", { count: Math.floor(diffDays / 30.44) });
    else if (diffDays >= 1) relativeTime = t("mentions.table.daysAgo", { count: diffDays });
    else if (diffHours >= 1) relativeTime = t("mentions.table.hoursAgo", { count: diffHours });
    else if (diffMinutes >= 1) relativeTime = t("mentions.table.minutesAgo", { count: diffMinutes });

    return { timeStr, relativeTime };
  };

  return (
    <>
      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Mobile View: Card List */}
        <div className="md:hidden divide-y" style={{ borderColor: "var(--color-border)" }}>
          {isLoading ? (
            <div className="py-20 text-center text-[var(--color-text-muted)]">{t("mentions.table.loading")}</div>
          ) : currentMentions.length === 0 ? (
            <div className="py-20 text-center text-[var(--color-text-muted)]">{t("mentions.table.noData")}</div>
          ) : (
            currentMentions.map((mention) => {
              const { timeStr, relativeTime } = formatTime(mention.posted_at);
              const tags = topicTags[mention.topic] || [];
              const displayContent = getDisplayContent(mention);

              return (
                <div key={mention.id} className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <PlatformLogo platform={mention.platform} size="sm" />
                      <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        {t(`dashboard.filters.${mention.platform.toLowerCase()}`, { defaultValue: mention.platform })}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sentimentMap[mention.sentiment].className}`}
                    >
                      {t(sentimentMap[mention.sentiment].labelKey)}
                    </span>
                  </div>

                  <Link
                    href={resolveMentionDetailTarget(mention, mentionById).href}
                    className="text-sm leading-relaxed text-[var(--color-text-primary)] hover:text-[var(--color-brand)] line-clamp-3"
                  >
                    "{displayContent}"
                  </Link>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-[var(--color-brand-subtle)] text-[var(--color-brand)] rounded text-[10px] font-bold uppercase border border-[var(--color-brand-border)]">
                      {getContentTypeLabel(mention)}
                    </span>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)] rounded text-[10px] font-bold uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-[var(--color-text-primary)]">
                        {timeStr}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {relativeTime}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border-collapse [&_th:not(:last-child)]:border-r [&_td:not(:last-child)]:border-r [&_th]:border-[var(--color-border)] [&_td]:border-[var(--color-border)]">
            <thead>
              <tr className="" style={{ backgroundColor: "var(--color-bg-surface-raised)", borderBottom: "1px solid var(--color-border)" }}>
                 <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-24">{t("mentions.table.platform")}</th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-24">{t("mentions.table.credibility")}</th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-[34rem] max-w-[34rem]">
                  {contentMode === "all"
                    ? t("mentions.table.relatedContent", { defaultValue: "Nội dung liên quan" })
                    : contentMode === "comment"
                      ? t("mentions.table.commentContent", { defaultValue: "Nội dung bình luận" })
                      : t("mentions.table.postContent", { defaultValue: "Nội dung bài viết" })}
                </th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-32">
                  {t("mentions.table.category", { defaultValue: "Phân loại" })}
                </th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-32">{t("mentions.table.sentiment")}</th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-32">{t("mentions.table.topic")}</th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-40">{t("mentions.table.time")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-20 text-center text-[var(--color-text-muted)]"
                  >{t("mentions.table.loading")}</td>
                </tr>
              ) : currentMentions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-20 text-center text-[var(--color-text-muted)]"
                  >{t("mentions.table.noData")}</td>
                </tr>
              ) : (
                currentMentions.map((mention) => {
                  const { timeStr, relativeTime } = formatTime(
                    mention.posted_at,
                  );
                  const tags = topicTags[mention.topic] || [];
                  const displayContent = getDisplayContent(mention);

                  return (
                    <tr
                      key={mention.id}
                      className="hover:bg-[var(--color-bg-surface-raised)] transition-colors"
                    >
                      {/* Platform */}
                      <td className="px-4 py-4 align-top text-center">
                        <div className="flex items-center justify-center">
                          <PlatformLogo platform={mention.platform} size="md" />
                        </div>
                      </td>

                      {/* Credibility Score with Progress Bar */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <span className="font-bold text-[var(--color-text-primary)] text-center">
                            {formatCredibilityScore(mention.credibility_score)}%
                          </span>
                          <div className="w-24 h-2 bg-[var(--color-bg-surface-raised)] rounded-full overflow-hidden">
                            <div
                              className="bg-[var(--color-brand)] h-full rounded-full"
                              style={{
                                width: `${formatCredibilityScore(mention.credibility_score)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Content */}
                      <td className="px-4 py-4 align-top w-[34rem] max-w-[34rem]">
                        <Link
                          href={resolveMentionDetailTarget(mention, mentionById).href}
                          className="text-sm leading-relaxed line-clamp-2 text-[var(--color-text-primary)] hover:text-[var(--color-brand)]"
                        >
                          "{displayContent}"
                        </Link>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)] rounded text-xs font-bold uppercase"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4 align-top text-center">
                        <span className="inline-flex px-3 py-1 bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] rounded-full text-xs font-bold uppercase border border-[var(--color-border)]">
                          {getContentTypeLabel(mention)}
                        </span>
                      </td>

                      {/* Sentiment */}
                      <td className="px-4 py-4 align-top text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${sentimentMap[mention.sentiment].className}`}
                        >
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: '"FILL" 1' }}
                          >
                            {sentimentMap[mention.sentiment].icon}
                          </span>
                          {t(sentimentMap[mention.sentiment].labelKey)}
                        </span>
                      </td>

                      {/* Topic */}
                      <td className="px-4 py-4 align-top text-center">
                        <span className="inline-flex px-3 py-1 bg-[var(--color-brand-subtle)] text-[var(--color-brand)] rounded-full text-xs font-bold uppercase border border-[var(--color-brand-border)]">
                          {t(`dashboard.topics.${mention.topic.toLowerCase()}`, { defaultValue: mention.topic })}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <div className="flex flex-col text-center">
                          <span className="font-medium text-[var(--color-text-primary)] text-sm">
                            {timeStr}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {relativeTime}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {mentions.length > 0 && (
          <div
            className="px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{
              backgroundColor: "var(--color-bg-surface-raised)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <span className="text-xs text-[var(--color-text-muted)] font-medium">
              {t("mentions.table.paginationInfo", { start: startIndex + 1, end: endIndex, total: mentions.length })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
                  currentPage === 1
                    ? 'text-[var(--color-text-disabled)] cursor-not-allowed border-[var(--color-border)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)] border-[var(--color-border)]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  chevron_left
                </span>
              </button>

              {/* Show simple pagination numbers (e.g. up to 5 visible) */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Calculate which page numbers to show to keep the current page roughly in the middle
                let startPage = Math.max(1, currentPage - 2);
                if (startPage + 4 > totalPages) startPage = Math.max(1, totalPages - 4);
                const pageNum = startPage + i;

                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded font-medium text-sm transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[var(--color-brand)] text-white'
                        : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
                  currentPage === totalPages
                    ? 'text-[var(--color-text-disabled)] cursor-not-allowed border-[var(--color-border)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)] border-[var(--color-border)]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
