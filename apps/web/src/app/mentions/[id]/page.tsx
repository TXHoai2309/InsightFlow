"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import {
  DashboardService,
  PLATFORM_META,
  formatBrandDisplayName,
} from "@/lib/services/dashboard";
import type { Mention } from "@/types/dashboard";

const sentimentMeta: Record<
  Mention["sentiment"],
  { label: string; color: string; bg: string; icon: string }
> = {
  positive: {
    label: "Tích cực",
    color: "text-[var(--color-success)]",
    bg: "bg-[var(--color-success-subtle)]",
    icon: "sentiment_satisfied",
  },
  neutral: {
    label: "Trung lập",
    color: "text-[var(--color-info)]",
    bg: "bg-[var(--color-info-subtle)]",
    icon: "sentiment_neutral",
  },
  negative: {
    label: "Tiêu cực",
    color: "text-[var(--color-error)]",
    bg: "bg-[var(--color-error-subtle)]",
    icon: "sentiment_very_dissatisfied",
  },
};

const platformIcons: Record<string, string> = {
  facebook: "chat",
  tiktok: "music_note",
  youtube: "play_circle",
  thread: "alternate_email",
  google_maps: "location_on",
  be: "restaurant",
  news: "newspaper",
};

type CommentNode = Mention & {
  children: CommentNode[];
};

function formatDateTime(value?: string) {
  if (!value) return "Không rõ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không rõ";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatRelativeTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays >= 1) return `${diffDays} ngày trước`;
  if (diffHours >= 1) return `${diffHours} giờ trước`;
  if (diffMinutes >= 1) return `${diffMinutes} phút trước`;
  return "Vừa xong";
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
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MentionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const mentionId = decodeURIComponent(String(params.id || ""));
  const cachedMentions = useDashboardStore((state) => state.mentions);
  const [mentions, setMentions] = useState<Mention[]>(cachedMentions);
  const [isLoading, setIsLoading] = useState(cachedMentions.length === 0);
  const [error, setError] = useState<string | null>(null);

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
        if (mounted) setError("Không thể tải dữ liệu đề cập từ Firebase.");
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

  if (isLoading) {
    return (
      <div className="p-6 md:p-10">
        <div className="glass-card rounded-3xl p-10 text-center text-[var(--color-text-muted)]">
          Đang tải chi tiết đề cập từ Firebase...
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
            Không tìm thấy đề cập
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            {error || "Bài viết này không còn trong dữ liệu Firebase hiện tại."}
          </p>
          <button
            onClick={() => router.push("/mentions")}
            className="mt-6 rounded-xl bg-[var(--color-brand)] px-5 py-3 text-sm font-bold text-white"
          >
            Quay lại Mentions
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
  const donutStyle = {
    background: `conic-gradient(var(--color-success) 0 ${sentimentStats.positive}%, var(--color-info) ${sentimentStats.positive}% ${sentimentStats.positive + sentimentStats.neutral}%, var(--color-error) ${sentimentStats.positive + sentimentStats.neutral}% 100%)`,
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)]">
      <div className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/mentions")}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
              aria-label="Quay lại"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
                Chi tiết đề cập
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
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ backgroundColor: platform.color }}
                >
                  <span className="material-symbols-outlined text-3xl">
                    {platformIcons[postMention.platform] || "public"}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">
                    Bài viết gốc
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {platform.label} · {formatDateTime(postMention.posted_at)}
                  </p>
                </div>
              </div>

              <div className="rounded-full bg-[var(--color-success-subtle)] px-4 py-2 text-sm font-extrabold text-[var(--color-success)]">
                {credibility}% Độ tin cậy
              </div>
            </div>

            <p className="mt-7 whitespace-pre-wrap break-words text-lg font-medium leading-relaxed text-[var(--color-text-primary)] md:text-xl">
              {postMention.original_content || postMention.content}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--color-brand-subtle)] px-4 py-2 text-xs font-extrabold uppercase text-[var(--color-brand)]">
                #{postMention.topic}
              </span>
              <span
                className={`rounded-full px-4 py-2 text-xs font-extrabold ${sentiment.bg} ${sentiment.color}`}
              >
                {sentiment.label}
              </span>
              <span className="rounded-full bg-[var(--color-bg-surface-raised)] px-4 py-2 text-xs font-extrabold uppercase text-[var(--color-text-muted)]">
                {platform.label}
              </span>
            </div>

            <div className="mt-6 border-t border-[var(--color-border)] pt-6">
              <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                <Metric label="Tác giả" value={postMention.author || "N/A"} />
                <Metric
                  label="Chủ đề"
                  value={postMention.topic.toUpperCase()}
                />
                <Metric label="Sắc thái" value={sentiment.label} />
                <Metric label="Độ tin cậy" value={`${credibility}%`} />
              </div>
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
                  Mở bài viết gốc
                </Link>
              </div>
            )}
          </article>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Bình luận ({postContext.total})
            </h2>
          </div>

          <div className="space-y-4">
            {postContext.tree.length === 0 ? (
              <div className="glass-card rounded-3xl p-8 text-center text-[var(--color-text-muted)]">
                Chưa có comment nào cho bài viết này trong Firebase.
              </div>
            ) : (
              postContext.tree.map((item) => (
                <CommentThread key={item.id} comment={item} level={0} />
              ))
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="glass-card rounded-3xl p-6">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-[var(--color-text-primary)]">
              <span className="material-symbols-outlined text-[var(--color-brand)]">
                donut_large
              </span>
              Phân tích sắc thái
            </h2>

            <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row">
              <div
                className="relative h-40 w-40 rounded-full p-5"
                style={donutStyle}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[var(--color-bg-surface)]">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Chỉ số
                  </span>
                  <span className="text-3xl font-extrabold text-[var(--color-text-primary)]">
                    {sentimentStats.positive}%
                  </span>
                </div>
              </div>

              <div className="w-full space-y-4">
                <Legend
                  label="Tích cực"
                  value={sentimentStats.positive}
                  color="bg-[var(--color-success)]"
                />
                <Legend
                  label="Trung lập"
                  value={sentimentStats.neutral}
                  color="bg-[var(--color-info)]"
                />
                <Legend
                  label="Tiêu cực"
                  value={sentimentStats.negative}
                  color="bg-[var(--color-error)]"
                />
              </div>
            </div>
          </section>

          <section className="glass-card rounded-3xl p-6">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-[var(--color-text-primary)]">
              <span className="material-symbols-outlined text-[var(--color-brand)]">
                info
              </span>
              Thông tin đề cập
            </h2>

            <div className="mt-6 divide-y divide-[var(--color-border)]">
              <InfoRow label="Thương hiệu" value={brandName} highlight />
              <InfoRow label="Nền tảng" value={platform.label} />
              <InfoRow label="Tác giả" value={postMention.author || "N/A"} />
              <InfoRow
                label="Thời gian"
                value={formatDateTime(postMention.posted_at)}
              />
              <InfoRow label="Chủ đề" value={postMention.topic.toUpperCase()} />
              <div className="flex items-center justify-between gap-4 py-4">
                <span className="text-[var(--color-text-secondary)]">
                  Độ tin cậy AI
                </span>
                <div className="flex min-w-[160px] items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-surface-raised)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-success)]"
                      style={{ width: `${credibility}%` }}
                    />
                  </div>
                  <span className="text-sm font-extrabold text-[var(--color-success)]">
                    {credibility}%
                  </span>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="truncate text-2xl font-extrabold text-[var(--color-text-primary)]">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </div>
    </div>
  );
}

function CommentThread({
  comment,
  level,
}: {
  comment: CommentNode;
  level: number;
}) {
  const itemSentiment = sentimentMeta[comment.sentiment];
  const borderClass =
    comment.sentiment === "positive"
      ? "border-l-[var(--color-success)]"
      : comment.sentiment === "negative"
        ? "border-l-[var(--color-error)]"
        : "border-l-[var(--color-info)]";
  const safeLevel = Math.min(level, 6);

  return (
    <div
      className="space-y-3"
      style={{ marginLeft: safeLevel ? `${safeLevel * 28}px` : undefined }}
    >
      <div
        className={`block rounded-3xl border border-l-4 bg-[var(--color-bg-surface)] p-5 shadow-sm transition ${borderClass}`}
        style={{
          borderTopColor: "var(--color-border)",
          borderRightColor: "var(--color-border)",
          borderBottomColor: "var(--color-border)",
        }}
      >
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-surface-raised)] text-sm font-extrabold text-[var(--color-text-secondary)]">
            {makeInitials(comment.author || "KH")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-[var(--color-text-primary)]">
                  {comment.author || "Khách hàng"}
                </h3>
                {level > 0 && (
                  <span className="mt-1 inline-flex rounded-full bg-[var(--color-bg-surface-raised)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                    Reply cấp {level}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                {formatRelativeTime(comment.posted_at)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-[var(--color-text-primary)]">
              {comment.original_content || comment.content}
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${itemSentiment.bg} ${itemSentiment.color}`}
            >
              {itemSentiment.label}
            </span>
          </div>
        </div>
      </div>

      {comment.children.length > 0 && (
        <div className="space-y-3 border-l border-dashed border-[var(--color-border)] pl-3">
          {comment.children.map((child) => (
            <CommentThread key={child.id} comment={child} level={level + 1} />
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
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-[var(--color-text-secondary)]">
        <span className={`h-3 w-3 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-extrabold text-[var(--color-text-primary)]">
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
    <div className="flex items-center justify-between gap-4 py-4">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span
        className={`text-right font-extrabold ${highlight ? "text-[var(--color-brand)]" : "text-[var(--color-text-primary)]"}`}
      >
        {value}
      </span>
    </div>
  );
}
