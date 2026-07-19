"use client";

import { useEffect, useMemo, useState } from "react";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import {
  buildMentionThreadContext,
  mergeMentionThreadItems,
  type MentionThreadNode,
} from "@/lib/mention-thread";
import { resolveLeadMentionTarget } from "@/lib/mention-navigation";
import { DashboardService, PLATFORM_META } from "@/lib/services/dashboard";
import type { Lead, Mention } from "@/types/dashboard";

type LeadContentContextProps = {
  lead: Lead;
  mentions: Mention[];
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

function getContentTypeLabel(mention: Mention, level = 0) {
  if (mention.content_type === "post") return "Bài viết gốc";
  if (mention.content_type === "reply" || level > 0) {
    return level > 0 ? `Reply cấp ${level}` : "Reply";
  }
  return "Bình luận";
}

function makeFallbackMention(lead: Lead): Mention {
  return {
    id: lead.mention_id || lead.source_mention_id || lead.id,
    post_id: lead.post_id,
    comment_id: lead.content_type === "post" ? null : lead.mention_id || lead.id,
    parent_id: lead.parent_id,
    workspace_id: lead.workspace_id,
    platform: lead.platform,
    content: lead.content,
    comment_content: lead.content_type === "post" ? undefined : lead.content,
    post_content: lead.content_type === "post" ? lead.content : undefined,
    original_content: lead.content,
    content_type: lead.content_type || "comment",
    author: lead.author || "Khách hàng",
    sentiment: lead.labels?.sentiment || "neutral",
    topic: lead.labels?.topic?.[0] || "other",
    credibility_score: 100,
    created_at: lead.created_at,
    posted_at: lead.posted_at || lead.created_at,
    url: lead.url || lead.source_url,
    labels: lead.labels,
  };
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
      id={`lead-context-${mention.id}`}
      className={`rounded-lg border p-3 transition-all duration-300 ${
        isTarget
          ? "border-[var(--color-brand)] bg-white ring-2 ring-[var(--color-brand)]/20 shadow-md shadow-[var(--color-brand)]/5"
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
        <time className="shrink-0 text-[10px] text-gray-400 font-medium">
          {formatContentTime(mention.posted_at || mention.created_at)}
        </time>
      </div>
      <p className="mt-2 text-xs font-bold text-[var(--color-text-secondary)]">
        {mention.author || "Khách hàng"}
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
            <div
              className={`space-y-2 border-l border-dashed border-[var(--color-border-strong)] ${
                level < 3 ? "ml-3 pl-3" : "ml-1 pl-2"
              }`}
            >
              <ThreadTree nodes={node.children} targetId={targetId} level={level + 1} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function LeadContentContext({ lead, mentions }: LeadContentContextProps) {
  const [remoteMentions, setRemoteMentions] = useState<Mention[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showFullThread, setShowFullThread] = useState(false);

  const mentionById = useMemo(
    () => new Map(mentions.map((mention) => [mention.id, mention])),
    [mentions],
  );
  const mentionTarget = useMemo(
    () => resolveLeadMentionTarget(lead, mentionById),
    [lead, mentionById],
  );
  const fallbackMention = useMemo(() => makeFallbackMention(lead), [lead]);
  const targetMention = mentionTarget.matchedMention || fallbackMention;
  const targetId = targetMention.id;
  const postId =
    targetMention.post_id ||
    (targetMention.content_type === "post" ? targetMention.id : "") ||
    lead.post_id ||
    "";

  useEffect(() => {
    let active = true;
    setShowFullThread(false);
    setRemoteMentions([]);
    setLoadError("");

    if (!postId) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    DashboardService.fetchMentionThread(postId)
      .then((items) => {
        if (active) setRemoteMentions(items);
      })
      .catch((error) => {
        console.error("[LeadContentContext] Cannot load thread:", error);
        if (active) setLoadError("Chưa tải được toàn bộ thảo luận từ nguồn.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lead.id, postId]);

  const localThreadMentions = useMemo(
    () =>
      mentions.filter(
        (mention) =>
          mention.id === targetId ||
          mention.id === postId ||
          Boolean(postId && mention.post_id === postId),
      ),
    [mentions, postId, targetId],
  );
  const threadMentions = useMemo(
    () => mergeMentionThreadItems(remoteMentions, localThreadMentions, [targetMention]),
    [localThreadMentions, remoteMentions, targetMention],
  );
  const context = useMemo(
    () => buildMentionThreadContext(threadMentions, { targetId, postId }),
    [postId, targetId, threadMentions],
  );

  const target = context.target || targetMention;
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
  const platformLabel = PLATFORM_META[lead.platform]?.label || lead.platform;
  const canToggleThread = context.total > visiblePathNodes.length;
  const hasIncompleteContext =
    target.content_type !== "post" && (!postContent || context.orphanedCount > 0);

  return (
    <section className="rounded-xl border border-[var(--color-brand-border)] bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-1">
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
        <article className="mt-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <PlatformLogo platform={lead.platform} size="xs" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase text-[var(--color-brand)]">Bài viết gốc</p>
                  {target.content_type === "post" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                      <span className="material-symbols-outlined text-[10px]">electric_bolt</span>
                      Đang cần xử lý
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px] text-gray-500 mt-0.5">
                  {context.post?.author || "Không rõ tác giả"} · {platformLabel}
                </p>
              </div>
            </div>
            <time className="shrink-0 text-[10px] text-gray-400 font-medium">
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
            <ThreadTree nodes={context.tree} targetId={targetId} />
          ) : (
            visiblePathNodes.map((mention, index) => (
              <ContentNodeCard
                key={mention.id}
                mention={mention}
                targetId={targetId}
                level={index}
              />
            ))
          )}
        </div>
      )}

      {canToggleThread && (
        <button
          type="button"
          onClick={() => setShowFullThread((current) => !current)}
          className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)]"
        >
          <span className="material-symbols-outlined text-base">
            {showFullThread ? "unfold_less" : "account_tree"}
          </span>
          {showFullThread ? "Chỉ xem đường dẫn ngữ cảnh" : `Xem toàn bộ thảo luận (${context.total})`}
        </button>
      )}

      {(loadError || hasIncompleteContext) && !isLoading && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
          <span className="material-symbols-outlined shrink-0 text-xl text-amber-500">warning</span>
          <p className="text-xs leading-5">
            {loadError || "Một phần ngữ cảnh không còn trong dữ liệu; nội dung cần xử lý vẫn được giữ nguyên."}
          </p>
        </div>
      )}
    </section>
  );
}
