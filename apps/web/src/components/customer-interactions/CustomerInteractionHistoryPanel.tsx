"use client";

import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { InteractionHistoryState } from "@/components/customer-interactions/InteractionHistoryState";
import { useCustomerInteractionHistory } from "@/hooks/useCustomerInteractionHistory";
import { PLATFORM_META } from "@/lib/services/dashboard";
import type {
  CustomerInteractionItem,
  CustomerInteractionSourceType,
} from "@/types/customer-interactions";

function formatDate(value?: string) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "Tích cực",
  neutral: "Trung tính",
  negative: "Tiêu cực",
  unknown: "Chưa xác định",
};

const INTENT_LABELS: Record<string, string> = {
  hot: "Tiềm năng cao",
  warm: "Có tiềm năng",
  cold: "Tiềm năng thấp",
};

function statusLabel(item: CustomerInteractionItem) {
  if (item.crisisStatus) {
    const labels: Record<string, string> = {
      new: "Crisis · Chưa xử lý",
      processing: "Crisis · Đang xử lý",
      contact_waiting: "Crisis · Chờ phản hồi",
      contact_failed: "Crisis · Liên hệ thất bại",
      resolved: "Crisis · Đã xử lý",
    };
    return labels[item.crisisStatus] || `Crisis · ${item.crisisStatus}`;
  }
  if (item.leadStatus) {
    const labels: Record<string, string> = {
      new: "Lead · Chưa xử lý",
      processing: "Lead · Đang xử lý",
      completed: "Lead · Đã hoàn tất",
      skipped: "Lead · Đã bỏ qua",
    };
    return labels[item.leadStatus] || `Lead · ${item.leadStatus}`;
  }
  return item.classificationStatus === "classified" ? "Đã phân loại" : "Chưa phân loại";
}

function InteractionRow({ item }: { item: CustomerInteractionItem }) {
  const platformLabel = PLATFORM_META[item.platform]?.label || item.platform;
  return (
    <article className={`relative border-l-2 py-3 pl-4 pr-2 ${item.isCurrent ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)]/30" : "border-[var(--color-border)]"}`}>
      <span className={`absolute -left-[5px] top-5 h-2 w-2 rounded-full ${item.isCurrent ? "bg-[var(--color-brand)] ring-4 ring-[var(--color-brand)]/15" : "bg-[var(--color-border-strong)]"}`} aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformLogo platform={item.platform} size="xs" />
          <span className="text-xs font-bold text-[var(--color-text-primary)]">{platformLabel}</span>
          <span className="rounded-full bg-[var(--color-bg-surface-raised)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
            {item.contentType}
          </span>
          {item.isCurrent && (
            <span className="rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-[10px] font-bold text-white">Đang xử lý</span>
          )}
        </div>
        <time className="text-[10px] text-[var(--color-text-muted)]" dateTime={item.postedAt}>{formatDate(item.postedAt)}</time>
      </div>

      {item.parentPostContent && (
        <div className="mt-2 rounded-md border-l-2 border-[var(--color-brand-border)] bg-[var(--color-bg-surface-raised)] px-2.5 py-2">
          <p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Ngữ cảnh bài viết</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{item.parentPostContent}</p>
        </div>
      )}

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text-primary)]">{item.content || "Không có nội dung hiển thị."}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.sentiment === "negative" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300" : item.sentiment === "positive" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]"}`}>
          {SENTIMENT_LABELS[item.sentiment] || item.sentiment}
        </span>
        {item.intent !== "none" && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">{INTENT_LABELS[item.intent] || item.intent}</span>
        )}
        <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-secondary)]">{statusLabel(item)}</span>
        {item.sourceUrl && (
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]">
            Mở nguồn <span className="material-symbols-outlined text-sm">open_in_new</span>
          </a>
        )}
      </div>
    </article>
  );
}

export function CustomerInteractionHistoryPanel({
  sourceType,
  sourceId,
}: {
  sourceType: CustomerInteractionSourceType;
  sourceId: string;
}) {
  const { data, error, isLoading, isLoadingMore, reload, loadMore } =
    useCustomerInteractionHistory({ sourceType, sourceId });

  if (isLoading && !data) {
    return <div className="space-y-3" aria-busy="true">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg bg-[var(--color-bg-surface-raised)]" />)}</div>;
  }

  if (error) {
    if (error.code === "SOURCE_NOT_FOUND") {
      return (
        <InteractionHistoryState
          kind="source_unavailable"
          actionLabel="Kiểm tra lại"
          onAction={() => void reload()}
        />
      );
    }
    if (error.code === "ACCESS_DENIED" || error.code === "BRAND_SCOPE_MISMATCH") {
      return <InteractionHistoryState kind="access_denied" />;
    }
    if (error.code === "AUTH_REQUIRED") {
      return <InteractionHistoryState kind="auth_required" />;
    }
    return (
      <InteractionHistoryState
        kind="technical_error"
        actionLabel={error.code === "TEMPORARY_ERROR" ? "Thử lại" : undefined}
        onAction={error.code === "TEMPORARY_ERROR" ? () => void reload() : undefined}
      />
    );
  }

  if (!data || data.availability === "insufficient_identity") {
    return <InteractionHistoryState kind="identity_unavailable" />;
  }

  const summary = data.summary!;
  const subject = data.subject!;
  const platformLabel = PLATFORM_META[subject.platform]?.label || subject.platform;
  const hasPreviousInteractions = summary.totalInteractions > 1;
  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-[var(--color-border)] p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <PlatformLogo platform={subject.platform} size="md" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-[var(--color-text-primary)]">{subject.displayName}</h3>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">Lịch sử tài khoản trên {platformLabel}</p>
            </div>
          </div>
          <span className="rounded-full bg-[var(--color-bg-surface-raised)] px-2.5 py-1 text-[10px] font-bold text-[var(--color-text-secondary)]">
            {subject.identityConfidence === "high" ? "Định danh bằng ID nền tảng" : "Đối chiếu bằng profile URL"}
          </span>
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Tổng tương tác", String(summary.totalInteractions)],
          ["Trong 30 ngày", String(summary.interactionsLast30Days)],
          ["Tín hiệu lead", String(summary.leadSignals)],
          ["Tín hiệu crisis", String(summary.crisisSignals)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[var(--color-border)] p-3">
            <p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">{label}</p>
            <p className="mt-1 text-lg font-black text-[var(--color-text-primary)]">{value}</p>
          </div>
        ))}
      </section>

      {(summary.latestTransition || summary.truncated) && (
        <section className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          {summary.latestTransition === "lead_to_crisis" && "Sắc thái gần đây chuyển từ tín hiệu tiềm năng sang phản hồi tiêu cực cần xử lý."}
          {summary.latestTransition === "crisis_to_lead" && "Sau các phản hồi tiêu cực trước đây, tài khoản gần đây xuất hiện tín hiệu quan tâm mua hàng."}
          {summary.truncated && " Lịch sử rất lớn nên số liệu tổng hợp đang giới hạn ở 2.000 bản ghi gần nhất."}
        </section>
      )}

      {!hasPreviousInteractions ? (
        <InteractionHistoryState kind="empty_history" />
      ) : (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">Các lần tương tác với thương hiệu</h3>
            <p className="text-[10px] text-[var(--color-text-muted)]">{formatDate(summary.firstInteractionAt)} — {formatDate(summary.lastInteractionAt)}</p>
          </div>
          <div className="mt-3">
            {data.items.map((item) => <InteractionRow key={item.id} item={item} />)}
          </div>
          {data.nextCursor && (
            <button type="button" disabled={isLoadingMore} onClick={() => void loadMore()} className="mt-3 inline-flex w-full items-center justify-center gap-2 border-t border-[var(--color-border)] pt-3 text-sm font-bold text-[var(--color-brand)] disabled:opacity-50">
              {isLoadingMore ? "Đang tải..." : "Xem thêm lịch sử"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
