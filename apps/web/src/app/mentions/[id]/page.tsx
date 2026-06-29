"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import {
  DashboardService,
  PLATFORM_META,
  formatBrandDisplayName,
} from "@/lib/services/dashboard";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import type { Mention } from "@/types/dashboard";

const STICKY_HEADER_OFFSET = 96;
const DETAIL_TOP_ID = "mention-detail-top";
const APP_SCROLL_ROOT_SELECTOR = '[data-app-scroll-root="true"]';

const sentimentMeta: Record<
  Mention["sentiment"],
  { labelKey: string; color: string; bg: string; icon: string }
> = {
  positive: {
    labelKey: "mentionDetail.sentiment.positive",
    color: "text-[var(--color-success)]",
    bg: "bg-[var(--color-success-subtle)]",
    icon: "sentiment_satisfied",
  },
  neutral: {
    labelKey: "mentionDetail.sentiment.neutral",
    color: "text-[var(--color-info)]",
    bg: "bg-[var(--color-info-subtle)]",
    icon: "sentiment_neutral",
  },
  negative: {
    labelKey: "mentionDetail.sentiment.negative",
    color: "text-[var(--color-error)]",
    bg: "bg-[var(--color-error-subtle)]",
    icon: "sentiment_very_dissatisfied",
  },
};

type CommentNode = Mention & {
  children: CommentNode[];
};

type CommentSentimentFilter = "all" | Mention["sentiment"];
type CommentLevelFilter = "all" | "comment" | "reply";

type CommentFilters = {
  sentiment: CommentSentimentFilter;
  level: CommentLevelFilter;
  keyword: string;
};

const DEFAULT_COMMENT_FILTERS: CommentFilters = {
  sentiment: "all",
  level: "all",
  keyword: "",
};

function formatDateTime(value: string | undefined, locale = "vi-VN") {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatRelativeTime(value: string | undefined, t: (key: string, options?: Record<string, unknown>) => string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays >= 1) return t("mentionDetail.time.daysAgo", { count: diffDays });
  if (diffHours >= 1) return t("mentionDetail.time.hoursAgo", { count: diffHours });
  if (diffMinutes >= 1) return t("mentionDetail.time.minutesAgo", { count: diffMinutes });
  return t("mentionDetail.time.justNow");
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function scoreToPercent(score: number) {
  const normalized = score <= 1 ? score * 100 : score;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function makeInitials(name: string) {
  return (name || "KH")
    .replace(/^@+/, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatAuthorName(author: string | undefined, platform?: Mention["platform"]) {
  const cleanAuthor = (author || "").trim();
  if (!cleanAuthor) return "N/A";

  if (platform === "facebook") {
    return cleanAuthor.replace(/^@+/, "").trim() || cleanAuthor;
  }

  return cleanAuthor;
}

function normalizeSearchText(value: string | undefined) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function hasActiveCommentFilters(filters: CommentFilters) {
  return (
    filters.sentiment !== "all" ||
    filters.level !== "all" ||
    filters.keyword.trim().length > 0
  );
}

function getCommentLevel(level: number): Exclude<CommentLevelFilter, "all"> {
  return level === 0 ? "comment" : "reply";
}

function matchesCommentFilters(
  comment: CommentNode,
  filters: CommentFilters,
  level: number,
) {
  if (filters.sentiment !== "all" && comment.sentiment !== filters.sentiment) {
    return false;
  }

  const commentLevel = getCommentLevel(level);
  if (filters.level !== "all" && filters.level !== commentLevel) {
    return false;
  }

  const keyword = normalizeSearchText(filters.keyword);
  if (!keyword) return true;

  const haystacks = [
    comment.author,
    comment.content,
    comment.original_content,
    comment.post_content,
    comment.comment_content,
  ];

  return haystacks.some((value) => normalizeSearchText(value).includes(keyword));
}

function filterCommentTree(
  nodes: CommentNode[],
  filters: CommentFilters,
  level = 0,
): { tree: CommentNode[]; matchedCount: number } {
  let matchedCount = 0;
  const tree: CommentNode[] = [];

  nodes.forEach((node) => {
    const childResult = filterCommentTree(node.children, filters, level + 1);
    const selfMatches = matchesCommentFilters(node, filters, level);

    if (selfMatches || childResult.tree.length > 0) {
      tree.push({
        ...node,
        children: childResult.tree,
      });
    }

    if (selfMatches) matchedCount += 1;
    matchedCount += childResult.matchedCount;
  });

  return { tree, matchedCount };
}

function treeContainsComment(
  nodes: CommentNode[],
  targetId: string,
): boolean {
  return nodes.some(
    (node) =>
      node.id === targetId || treeContainsComment(node.children, targetId),
  );
}

function getAppScrollRoot() {
  return document.querySelector<HTMLElement>(APP_SCROLL_ROOT_SELECTOR);
}

function scrollToElementWithOffset(
  elementId: string,
  behavior: ScrollBehavior,
  focusTarget = false,
) {
  const target = document.getElementById(elementId);
  if (!target) return false;
  const scrollRoot = getAppScrollRoot();

  if (scrollRoot) {
    const top =
      target.getBoundingClientRect().top -
      scrollRoot.getBoundingClientRect().top +
      scrollRoot.scrollTop -
      STICKY_HEADER_OFFSET;
    scrollRoot.scrollTo({ top: Math.max(0, top), behavior });
  } else {
    const top =
      target.getBoundingClientRect().top + window.scrollY - STICKY_HEADER_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior });
  }

  if (focusTarget && typeof target.focus === "function") {
    target.focus({ preventScroll: true });
  }

  return true;
}

export default function MentionDetailPage() {
  const { t, i18n } = useTranslation();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const mentionId = decodeURIComponent(String(params.id || ""));
  const cachedMentions = useDashboardStore((state) => state.mentions);
  const [mentions, setMentions] = useState<Mention[]>(cachedMentions);
  const [isLoading, setIsLoading] = useState(cachedMentions.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [commentFilters, setCommentFilters] =
    useState<CommentFilters>(DEFAULT_COMMENT_FILTERS);
  const [requestedTargetId, setRequestedTargetId] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadMentions() {
      if (cachedMentions.length > 0) {
        setMentions(cachedMentions);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await DashboardService.fetchRawData();
        if (mounted) setMentions(data.mentions);
      } catch (err) {
        console.error("[MentionDetailPage] load error:", err);
        if (mounted) setError("mentionDetail.loadError");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadMentions();
    return () => {
      mounted = false;
    };
  }, [cachedMentions]);

  const mention = useMemo(
    () => mentions.find((item) => item.id === mentionId),
    [mentionId, mentions],
  );

  const mentionById = useMemo(() => {
    return new Map(mentions.map((item) => [item.id, item]));
  }, [mentions]);

  const postContext = useMemo(() => {
    if (!mention) {
      return {
        post: null as Mention | null,
        rootParentId: "",
        comments: [] as Mention[],
        tree: [] as CommentNode[],
        total: 0,
      };
    }

    let rootMention = mention;
    const visited = new Set<string>();
    while (
      rootMention.parent_id &&
      mentionById.has(rootMention.parent_id) &&
      !visited.has(rootMention.id)
    ) {
      visited.add(rootMention.id);
      rootMention = mentionById.get(rootMention.parent_id)!;
    }

    const threadRootId =
      rootMention.parent_id && !mentionById.has(rootMention.parent_id)
        ? rootMention.parent_id
        : rootMention.id;

    const isDescendantOf = (item: Mention, rootId: string) => {
      if (item.id === rootId) return false;
      let cursor: Mention | undefined = item;
      const seen = new Set<string>();

      while (cursor?.parent_id) {
        if (cursor.parent_id === rootId) return true;
        if (seen.has(cursor.id)) return false;
        seen.add(cursor.id);
        cursor = mentionById.get(cursor.parent_id);
      }

      return false;
    };

    const sortByPostedAt = (a: Mention, b: Mention) =>
      new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime();

    const comments = mentions
      .filter((item) => isDescendantOf(item, threadRootId))
      .sort(sortByPostedAt);

    const childrenByParent = new Map<string, Mention[]>();
    comments.forEach((item) => {
      const parentId = item.parent_id || threadRootId;
      const list = childrenByParent.get(parentId) || [];
      list.push(item);
      childrenByParent.set(parentId, list);
    });
    childrenByParent.forEach((items) => items.sort(sortByPostedAt));

    const buildTree = (parentId: string): CommentNode[] => {
      return (childrenByParent.get(parentId) || []).map((item) => ({
        ...item,
        children: buildTree(item.id),
      }));
    };

    const tree = buildTree(threadRootId);

    return {
      post: rootMention,
      rootParentId: threadRootId,
      comments,
      tree,
      total: comments.length,
    };
  }, [mention, mentionById, mentions]);

  const sentimentStats = useMemo(() => {
    const pool = postContext.post
      ? [postContext.post, ...postContext.comments]
      : mentions;
    const total = pool.length || 1;
    const positive = pool.filter(
      (item) => item.sentiment === "positive",
    ).length;
    const neutral = pool.filter((item) => item.sentiment === "neutral").length;
    const negative = pool.filter(
      (item) => item.sentiment === "negative",
    ).length;
    return {
      positive: percent(positive, total),
      neutral: percent(neutral, total),
      negative: percent(negative, total),
    };
  }, [postContext, mentions]);

  const dominantSentiment = useMemo(() => {
    return (Object.entries(sentimentStats) as Array<[Mention["sentiment"], number]>).reduce(
      (largest, current) => current[1] > largest[1] ? current : largest,
    );
  }, [sentimentStats]);

  const filteredComments = useMemo(() => {
    if (!hasActiveCommentFilters(commentFilters)) {
      return {
        tree: postContext.tree,
        matchedCount: postContext.total,
      };
    }

    return filterCommentTree(postContext.tree, commentFilters);
  }, [commentFilters, postContext]);

  const isTargetCommentHidden = useMemo(() => {
    if (!requestedTargetId || !hasActiveCommentFilters(commentFilters)) {
      return false;
    }

    return !treeContainsComment(filteredComments.tree, requestedTargetId);
  }, [commentFilters, filteredComments.tree, requestedTargetId]);

  useEffect(() => {
    if (!mention) return;

    const hashPrefix = "#comment-";
    const hashTarget = window.location.hash.startsWith(hashPrefix)
      ? decodeURIComponent(window.location.hash.slice(hashPrefix.length))
      : "";
    const targetId =
      hashTarget || (mention.content_type === "post" ? "" : mention.id);
    setRequestedTargetId(targetId);
  }, [mention]);

  useEffect(() => {
    if (!requestedTargetId) return;

    const frame = window.requestAnimationFrame(() =>
      scrollToElementWithOffset(`comment-${requestedTargetId}`, "auto", true),
    );
    const retries = [
      window.setTimeout(
        () =>
          scrollToElementWithOffset(
            `comment-${requestedTargetId}`,
            "smooth",
            true,
          ),
        250,
      ),
      window.setTimeout(
        () =>
          scrollToElementWithOffset(
            `comment-${requestedTargetId}`,
            "smooth",
            true,
          ),
        800,
      ),
    ];

    return () => {
      window.cancelAnimationFrame(frame);
      retries.forEach(window.clearTimeout);
    };
  }, [filteredComments.tree, requestedTargetId]);

  useEffect(() => {
    const scrollRoot = getAppScrollRoot();
    const handleScroll = () => {
      const currentScrollTop = scrollRoot ? scrollRoot.scrollTop : window.scrollY;
      setShowBackToTop(currentScrollTop > 320);
    };

    handleScroll();
    const scrollTarget: HTMLElement | Window = scrollRoot || window;
    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollTarget.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 md:p-10">
        <div className="glass-card rounded-3xl p-10 text-center text-[var(--color-text-muted)]">
          {t("mentionDetail.loading")}
        </div>
      </div>
    );
  }

  if (error || !mention) {
    return (
      <div className="p-6 md:p-10">
        <div className="glass-card rounded-3xl p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-[var(--color-error)]">
            error
          </span>
          <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">
            {t("mentionDetail.notFound")}
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            {error ? t(error) : t("mentionDetail.notFoundDescription")}
          </p>
          <button
            onClick={() => router.push("/mentions")}
            className="mt-6 rounded-xl bg-[var(--color-brand)] px-5 py-3 text-sm font-bold text-white"
          >
            {t("mentionDetail.backToMentions")}
          </button>
        </div>
      </div>
    );
  }

  const postMention = postContext.post || mention;
  const platform = PLATFORM_META[postMention.platform] || {
    label: postMention.platform,
    color: "var(--color-text-muted)",
  };
  const sentiment = sentimentMeta[postMention.sentiment];
  const credibility = scoreToPercent(postMention.credibility_score);
  const brandName = formatBrandDisplayName(postMention.workspace_id);
  const postAuthorName = formatAuthorName(postMention.author, postMention.platform);
  const postTopicLabel = t(`dashboard.topics.${postMention.topic}`);
  const donutStyle = {
    background: `conic-gradient(var(--color-success) 0 ${sentimentStats.positive}%, var(--color-info) ${sentimentStats.positive}% ${sentimentStats.positive + sentimentStats.neutral}%, var(--color-error) ${sentimentStats.positive + sentimentStats.neutral}% 100%)`,
  };
  const hasCommentFilters = hasActiveCommentFilters(commentFilters);
  const commentsHeadingCount = hasCommentFilters
    ? `${filteredComments.matchedCount}/${postContext.total}`
    : `${postContext.total}`;

  return (
    <div
      id={DETAIL_TOP_ID}
      tabIndex={-1}
      className="min-h-screen bg-[var(--color-bg-canvas)]"
    >
      <div className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/mentions")}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
              aria-label={t("mentionDetail.back")}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
                {t("mentionDetail.title")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="grid gap-6 p-4 md:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] md:p-8">
        <section className="space-y-6">
          <article className="glass-card rounded-3xl p-5 md:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <PlatformLogo platform={postMention.platform} size="lg" className="shadow-lg" />
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">
                    {postAuthorName}
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {platform.label} · {formatDateTime(postMention.posted_at, i18n.language === "en" ? "en-US" : "vi-VN")}
                  </p>
                </div>
              </div>

              <div className="rounded-full bg-[var(--color-success-subtle)] px-4 py-2 text-sm font-extrabold text-[var(--color-success)]">
                {credibility}% {t("mentionDetail.credibility")}
              </div>
            </div>

            <p className="mt-7 whitespace-pre-wrap break-words text-lg font-medium leading-relaxed text-[var(--color-text-primary)] md:text-xl">
              {postMention.original_content || postMention.content}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--color-brand-subtle)] px-4 py-2 text-xs font-extrabold uppercase text-[var(--color-brand)]">
                #{postTopicLabel}
              </span>
              <span
                className={`rounded-full px-4 py-2 text-xs font-extrabold ${sentiment.bg} ${sentiment.color}`}
              >
                {t(sentiment.labelKey)}
              </span>
              <span className="rounded-full bg-[var(--color-bg-surface-raised)] px-4 py-2 text-xs font-extrabold uppercase text-[var(--color-text-muted)]">
                {platform.label}
              </span>
            </div>

            {postMention.url && (
              <div className="mt-6">
                <Link
                  href={postMention.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[var(--color-brand-hover)]"
                >
                  <span className="material-symbols-outlined text-lg">
                    open_in_new
                  </span>
                  {t("mentionDetail.openOriginalPost")}
                </Link>
              </div>
            )}
          </article>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              {t("mentionDetail.comments")} ({commentsHeadingCount})
            </h2>
            {hasCommentFilters && (
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {t("mentionDetail.filters.matchingCount", {
                  shown: filteredComments.matchedCount,
                  total: postContext.total,
                })}
              </span>
            )}
          </div>

          {postContext.total > 0 && (
            <div className="glass-card rounded-3xl p-4 md:p-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--color-brand)]">
                    {t("mentionDetail.filters.title")}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {t("mentionDetail.filters.subtitle")}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,180px)_minmax(0,180px)_minmax(0,1fr)_auto]">
                  <select
                    value={commentFilters.sentiment}
                    onChange={(event) =>
                      setCommentFilters((current) => ({
                        ...current,
                        sentiment: event.target
                          .value as CommentFilters["sentiment"],
                      }))
                    }
                    className="h-11 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-brand)]"
                  >
                    <option value="all">
                      {t("mentionDetail.filters.allSentiments")}
                    </option>
                    <option value="positive">
                      {t("mentionDetail.sentiment.positive")}
                    </option>
                    <option value="neutral">
                      {t("mentionDetail.sentiment.neutral")}
                    </option>
                    <option value="negative">
                      {t("mentionDetail.sentiment.negative")}
                    </option>
                  </select>

                  <select
                    value={commentFilters.level}
                    onChange={(event) =>
                      setCommentFilters((current) => ({
                        ...current,
                        level: event.target.value as CommentFilters["level"],
                      }))
                    }
                    className="h-11 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-brand)]"
                  >
                    <option value="all">
                      {t("mentionDetail.filters.allLevels")}
                    </option>
                    <option value="comment">
                      {t("mentionDetail.filters.commentsOnly")}
                    </option>
                    <option value="reply">
                      {t("mentionDetail.filters.repliesOnly")}
                    </option>
                  </select>

                  <input
                    type="text"
                    value={commentFilters.keyword}
                    onChange={(event) =>
                      setCommentFilters((current) => ({
                        ...current,
                        keyword: event.target.value,
                      }))
                    }
                    placeholder={t("mentionDetail.filters.keywordPlaceholder")}
                    className="h-11 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-sm font-medium text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
                  />

                  <button
                    type="button"
                    onClick={() => setCommentFilters(DEFAULT_COMMENT_FILTERS)}
                    disabled={!hasCommentFilters}
                    className="h-11 rounded-2xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-surface-raised)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("mentionDetail.filters.reset")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isTargetCommentHidden && (
            <div className="rounded-3xl border border-[var(--color-warning)]/25 bg-[var(--color-warning-subtle)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">
                  {t("mentionDetail.filters.targetHidden")}
                </p>
                <button
                  type="button"
                  onClick={() => setCommentFilters(DEFAULT_COMMENT_FILTERS)}
                  className="rounded-xl bg-[var(--color-warning)] px-4 py-2 text-sm font-bold text-white"
                >
                  {t("mentionDetail.filters.showTarget")}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {postContext.total === 0 ? (
              <div className="glass-card rounded-3xl p-8 text-center text-[var(--color-text-muted)]">
                {t("mentionDetail.noComments")}
              </div>
            ) : filteredComments.tree.length === 0 ? (
              <div className="glass-card rounded-3xl p-8 text-center text-[var(--color-text-muted)]">
                {t("mentionDetail.filters.empty")}
              </div>
            ) : (
              filteredComments.tree.map((item) => (
                <CommentThread
                  key={item.id}
                  comment={item}
                  level={0}
                  targetId={mention.content_type === "post" ? undefined : mention.id}
                />
              ))
            )}
          </div>
        </section>

        <aside className="self-start md:sticky md:top-24">
          <section className="glass-card rounded-3xl p-5 lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-[var(--color-text-primary)] lg:text-xl">
                  <span className="material-symbols-outlined text-[var(--color-brand)]">
                    donut_large
                  </span>
                  {t("mentionDetail.sentimentAnalysis")}
                </h2>
                <p className="mt-2 text-sm font-medium text-[var(--color-text-secondary)]">
                  {t("mentionDetail.dominantSentiment")}:{" "}
                  <span className="font-extrabold text-[var(--color-text-primary)]">
                    {t(sentimentMeta[dominantSentiment[0]].labelKey)} ({dominantSentiment[1]}%)
                  </span>
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${sentimentMeta[dominantSentiment[0]].bg} ${sentimentMeta[dominantSentiment[0]].color}`}
              >
                {t(sentimentMeta[dominantSentiment[0]].labelKey)}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[112px_minmax(0,1fr)] md:items-center lg:grid-cols-[124px_minmax(0,1fr)]">
              <div
                className="mx-auto h-28 w-28 shrink-0 rounded-full shadow-inner lg:h-32 lg:w-32"
                style={donutStyle}
              />

              <div className="grid gap-2.5">
                <Legend
                  label={t("mentionDetail.sentiment.positive")}
                  value={sentimentStats.positive}
                  color="bg-[var(--color-success)]"
                />
                <Legend
                  label={t("mentionDetail.sentiment.neutral")}
                  value={sentimentStats.neutral}
                  color="bg-[var(--color-info)]"
                />
                <Legend
                  label={t("mentionDetail.sentiment.negative")}
                  value={sentimentStats.negative}
                  color="bg-[var(--color-error)]"
                />
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--color-border)] pt-5">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-[var(--color-text-primary)] lg:text-xl">
                <span className="material-symbols-outlined text-[var(--color-brand)]">
                  info
                </span>
                {t("mentionDetail.mentionInfo")}
              </h2>

              <div className="mt-4 divide-y divide-[var(--color-border)]">
                <InfoRow label={t("mentionDetail.brand")} value={brandName} highlight />
                <InfoRow label={t("mentionDetail.platform")} value={platform.label} />
                <InfoRow label={t("mentionDetail.author")} value={postAuthorName} />
                <InfoRow
                  label={t("mentionDetail.timeLabel")}
                  value={formatDateTime(postMention.posted_at, i18n.language === "en" ? "en-US" : "vi-VN")}
                />
                <InfoRow
                  label={t("mentionDetail.topic")}
                  value={postTopicLabel}
                />
                <div className="grid gap-2 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {t("mentionDetail.aiCredibility")}
                    </span>
                    <span className="text-sm font-extrabold text-[var(--color-success)]">
                      {credibility}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-surface-raised)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-success)]"
                      style={{ width: `${credibility}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </main>

      {showBackToTop && (
        <button
          type="button"
          onClick={() =>
            scrollToElementWithOffset(DETAIL_TOP_ID, "smooth", true)
          }
          aria-label={t("mentionDetail.backToTop")}
          title={t("mentionDetail.backToTop")}
          className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition hover:bg-[var(--color-brand-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--color-brand-border)] md:bottom-6 md:right-6"
        >
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
      )}
    </div>
  );
}

function CommentThread({
  comment,
  level,
  targetId,
}: {
  comment: CommentNode;
  level: number;
  targetId?: string;
}) {
  const { t } = useTranslation();
  const itemSentiment = sentimentMeta[comment.sentiment];
  const isTarget = comment.id === targetId;
  const safeLevel = Math.min(level, 6);

  return (
    <div
      id={`comment-${comment.id}`}
      tabIndex={-1}
      className="scroll-mt-24 space-y-3"
      style={{ marginLeft: safeLevel ? `${safeLevel * 28}px` : undefined }}
    >
      <div
        className={`block rounded-2xl border p-4 shadow-sm transition-colors duration-200 md:p-5 ${isTarget ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)]" : "border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-strong)]"}`}
      >
        {isTarget && (
          <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-bold text-[var(--color-brand)]">
            <span className="material-symbols-outlined text-sm">my_location</span>
            {t("mentionDetail.selectedComment")}
          </div>
        )}
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-surface-raised)] text-sm font-extrabold text-[var(--color-text-secondary)]">
            {makeInitials(comment.author || "KH")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-[var(--color-text-primary)]">
                  {comment.author || t("mentionDetail.customer")}
                </h3>
                {level > 0 && (
                  <span className="mt-1 inline-flex rounded-full bg-[var(--color-bg-surface-raised)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                    {t("mentionDetail.replyLevel", { level })}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                {formatRelativeTime(comment.posted_at, t)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-[var(--color-text-primary)]">
              {comment.original_content || comment.content}
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${itemSentiment.bg} ${itemSentiment.color}`}
            >
              {t(itemSentiment.labelKey)}
            </span>
          </div>
        </div>
      </div>

      {comment.children.length > 0 && (
        <div className="space-y-3 border-l border-dashed border-[var(--color-border)] pl-3">
          {comment.children.map((child) => (
            <CommentThread
              key={child.id}
              comment={child}
              level={level + 1}
              targetId={targetId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-bg-surface)] px-3 py-2">
      <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
        {label}
      </span>
      <span className="shrink-0 text-sm font-extrabold text-[var(--color-text-primary)]">
        {value}%
      </span>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="min-w-0 text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span
        className={`max-w-[58%] text-right text-sm font-extrabold leading-6 ${highlight ? "text-[var(--color-brand)]" : "text-[var(--color-text-primary)]"}`}
      >
        {value}
      </span>
    </div>
  );
}
