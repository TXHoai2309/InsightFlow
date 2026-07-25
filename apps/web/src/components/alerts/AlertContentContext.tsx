"use client";

import { useEffect, useMemo, useState } from "react";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import {
  buildMentionThreadContext,
  mergeMentionThreadItems,
  type MentionThreadNode,
} from "@/lib/mention-thread";
import { getAlertSourceUrl } from "@/lib/alert-source-url";
import { DashboardService, PLATFORM_META } from "@/lib/services/dashboard";
import type { AlertData } from "@/stores/alert.store";
import type { Mention } from "@/types/dashboard";

type AlertContentContextProps = {
  alert: AlertData;
};

function formatContentTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizeContentType(value?: string): Mention["content_type"] {
  if (value === "post" || value === "reply") return value;
  return "comment";
}

function makeAlertMentions(alert: AlertData) {
  const contentType = normalizeContentType(alert.content_type);
  const targetId = alert.source_id || alert.comment_id || alert.id;
  const postId = alert.post_id || (contentType === "post" ? targetId : "");
  const targetContent = contentType === "post"
    ? alert.post_content || alert.text
    : alert.comment_content || alert.text;
  const platform = alert.source as Mention["platform"];

  const target: Mention = {
    id: targetId,
    post_id: postId || undefined,
    comment_id: contentType === "post" ? null : alert.comment_id || targetId,
    parent_id: alert.parent_id,
    workspace_id: alert.brand,
    platform,
    content: targetContent || "",
    post_content: alert.post_content,
    comment_content: contentType === "post" ? undefined : targetContent,
    original_content: targetContent,
    content_type: contentType,
    author: alert.author || "Người dùng ẩn danh",
    sentiment: alert.sentiment === "positive" || alert.sentiment === "negative"
      ? alert.sentiment
      : "neutral",
    topic: alert.topic || "other",
    credibility_score: 100,
    created_at: alert.created_at,
    posted_at: alert.created_at,
    url: getAlertSourceUrl(alert) || alert.url || alert.post_url,
    post_url: alert.post_url,
    comment_url: alert.comment_url,
    source_url: alert.source_url,
  };

  const post = contentType !== "post" && postId && alert.post_content
    ? {
        ...target,
        id: postId,
        comment_id: null,
        parent_id: null,
        content: alert.post_content,
        comment_content: undefined,
        original_content: alert.post_content,
        content_type: "post" as const,
        author: "Tác giả bài viết",
        url: alert.post_url || alert.source_url || alert.url,
        post_url: alert.post_url,
        source_url: alert.source_url,
      }
    : null;

  return { target, post, targetId, postId, platform };
}

function getContentTypeLabel(mention: Mention, level: number) {
  if (mention.content_type === "post") return "Bài viết gốc";
  if (mention.content_type === "reply" || level > 0) {
    return level > 0 ? `Reply cấp ${level}` : "Reply";
  }
  return "Bình luận";
}

function ContentNodeCard({
  mention,
  targetId,
  level,
}: {
  mention: Mention;
  targetId: string;
  level: number;
}) {
  const isTarget = mention.id === targetId;
  const content = mention.original_content || mention.comment_content || mention.content;

  return (
    <article
      id={`alert-context-${mention.id}`}
      className={`rounded-lg border p-3 transition ${
        isTarget
          ? "border-[var(--color-brand)] bg-[var(--color-bg-surface)] ring-2 ring-[var(--color-brand)]/15 shadow-sm"
          : "border-[var(--color-border)] bg-[var(--color-bg-surface)]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--color-bg-surface-raised)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
            {getContentTypeLabel(mention, level)}
          </span>
          {isTarget && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              <span className="material-symbols-outlined text-[12px]">electric_bolt</span>
              Đang cần xử lý
            </span>
          )}
        </div>
        <time className="shrink-0 text-[10px] font-medium text-[var(--color-text-muted)]">
          {formatContentTime(mention.posted_at || mention.created_at)}
        </time>
      </div>
      <p className="mt-2 text-xs font-bold text-[var(--color-text-secondary)]">
        {mention.author || "Người dùng ẩn danh"}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text-primary)]">
        {content || "Không có nội dung hiển thị."}
      </p>
    </article>
  );
}

function ThreadTree({
  nodes,
  targetId,
  level = 0,
}: {
  nodes: MentionThreadNode[];
  targetId: string;
  level?: number;
}) {
  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <div key={node.id} className="space-y-2">
          <ContentNodeCard mention={node} targetId={targetId} level={level} />
          {node.children.length > 0 && (
            <div className={`space-y-2 border-l border-dashed border-[var(--color-border-strong)] ${level < 3 ? "ml-3 pl-3" : "ml-1 pl-2"}`}>
              <ThreadTree nodes={node.children} targetId={targetId} level={level + 1} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function AlertContentContext({ alert }: AlertContentContextProps) {
  const [remoteMentions, setRemoteMentions] = useState<Mention[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showFullThread, setShowFullThread] = useState(false);
  const fallback = useMemo(() => makeAlertMentions(alert), [alert]);

  useEffect(() => {
    let active = true;
    setRemoteMentions([]);
    setLoadError("");
    setShowFullThread(false);

    if (!fallback.postId) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    DashboardService.fetchMentionThread(fallback.postId)
      .then((mentions) => {
        if (active) setRemoteMentions(mentions);
      })
      .catch((error) => {
        console.error("[AlertContentContext] Cannot load thread:", error);
        if (active) setLoadError("Chưa tải được toàn bộ thảo luận từ nguồn.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [alert.id, fallback.postId]);

  const threadMentions = useMemo(
    () => mergeMentionThreadItems(
      remoteMentions,
      fallback.post ? [fallback.post] : [],
      [fallback.target],
    ),
    [fallback, remoteMentions],
  );
  const context = useMemo(
    () => buildMentionThreadContext(threadMentions, {
      targetId: fallback.targetId,
      postId: fallback.postId,
    }),
    [fallback.postId, fallback.targetId, threadMentions],
  );
  const target = context.target || fallback.target;
  const postContent =
    context.post?.post_content ||
    context.post?.original_content ||
    context.post?.content ||
    target.post_content ||
    (target.content_type === "post" ? target.content : "");
  const pathNodes = context.contextPath.filter(
    (mention) => mention.id !== context.post?.id && mention.content_type !== "post",
  );
  const visiblePathNodes = pathNodes.length > 0
    ? pathNodes
    : target.content_type === "post"
      ? []
      : [target];
  const platformLabel = PLATFORM_META[fallback.platform]?.label || alert.source;
  const canToggleThread = context.total > visiblePathNodes.length;
  const hasIncompleteContext = target.content_type !== "post" && (!postContent || context.orphanedCount > 0);

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-[var(--color-brand)]">electric_bolt</span>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Nội dung cần xử lý</h3>
        </div>
        {isLoading && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-muted)]">
            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            Đang tải ngữ cảnh
          </span>
        )}
      </div>

      {(context.post || postContent) && (
        <article className={`mt-2 rounded-lg border p-3 ${target.content_type === "post" ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)]" : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <PlatformLogo platform={alert.source} size="xs" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase text-[var(--color-brand)]">Bài viết gốc</p>
                  {target.content_type === "post" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      <span className="material-symbols-outlined text-[10px]">electric_bolt</span>
                      Đang cần xử lý
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-secondary)]">
                  {context.post?.author || "Không rõ tác giả"} · {platformLabel}
                </p>
              </div>
            </div>
            <time className="shrink-0 text-[10px] font-medium text-[var(--color-text-muted)]">
              {formatContentTime(context.post?.posted_at || context.post?.created_at)}
            </time>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text-primary)]">
            {postContent || "Không có nội dung bài viết gốc."}
          </p>
        </article>
      )}

      {visiblePathNodes.length > 0 && (
        <div className="mt-2 space-y-2 border-l-2 border-dashed border-[var(--color-brand-border)] pl-2.5">
          {showFullThread ? (
            <ThreadTree nodes={context.tree} targetId={fallback.targetId} />
          ) : (
            visiblePathNodes.map((mention, index) => (
              <ContentNodeCard key={mention.id} mention={mention} targetId={fallback.targetId} level={index} />
            ))
          )}
        </div>
      )}

      {canToggleThread && (
        <button type="button" onClick={() => setShowFullThread((current) => !current)} className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)]">
          <span className="material-symbols-outlined text-base">{showFullThread ? "unfold_less" : "account_tree"}</span>
          {showFullThread ? "Chỉ xem đường dẫn ngữ cảnh" : `Xem toàn bộ thảo luận (${context.total})`}
        </button>
      )}

      {(loadError || hasIncompleteContext) && !isLoading && (
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] p-3 text-[var(--color-warning)]">
          <span className="material-symbols-outlined shrink-0 text-xl">info</span>
          <p className="text-xs leading-5">
            {loadError || "Chưa có đầy đủ dữ liệu bài viết gốc; nội dung cảnh báo vẫn được giữ nguyên để xử lý."}
          </p>
        </div>
      )}
    </section>
  );
}
