"use client";

import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { getAlertWorkflowStatus } from "@/lib/alertWorkflow";
import type { AlertData } from "@/stores/alert.store";

interface AlertWorkbenchRowProps {
  alert: AlertData;
  selected: boolean;
  pinned?: boolean;
  canPin?: boolean;
  pinDisabled?: boolean;
  onSelect: (alert: AlertData) => void;
  onTogglePin?: (alert: AlertData) => void;
  getResolverName: (value: string | null | undefined) => string;
}

const SEVERITY_STYLE: Record<string, { label: string; border: string; badge: string }> = {
  critical: { label: "CRITICAL", border: "border-l-red-500", badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300" },
  high: { label: "HIGH", border: "border-l-orange-500", badge: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-300" },
  medium: { label: "MEDIUM", border: "border-l-amber-400", badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300" },
  low: { label: "LOW", border: "border-l-slate-300", badge: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" },
};

function formatAge(createdAt: string) {
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return "Không rõ thời gian";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Vừa phát hiện";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function getStatusLabel(alert: AlertData) {
  const status = getAlertWorkflowStatus(alert);
  if (status === "resolved") return "Đã giải quyết";
  if (status === "contact_failed") return "Liên hệ không thành";
  if (status === "processing") return alert.status === "contact_waiting" ? "Chờ phản hồi" : "Đang xử lý";
  return "Chưa phân công";
}

export function AlertWorkbenchRow({ alert, selected, pinned = false, canPin = false, pinDisabled = false, onSelect, onTogglePin, getResolverName }: AlertWorkbenchRowProps) {
  const severityKey = String(alert.severity || "low").toLowerCase();
  const severity = SEVERITY_STYLE[severityKey] || SEVERITY_STYLE.low;
  const owner = getResolverName(alert.being_resolved_by);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(alert);
  };

  return (
    <div role="button" tabIndex={0} onClick={() => onSelect(alert)} onKeyDown={handleKeyDown} aria-current={selected ? "true" : undefined}
      className={`w-full cursor-pointer rounded-lg border border-l-4 ${pinned ? "border-l-orange-500" : severity.border} bg-[var(--color-bg-surface)] p-[4%] text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${pinned || selected ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/25" : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-surface-raised)]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-xs font-black text-[var(--color-brand)]">
            {(alert.author || "CB").slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[var(--color-text-primary)]">{alert.author || "Người dùng ẩn danh"}</p>
            <div className="mt-1 flex min-w-0 items-center gap-1.5">
              <PlatformLogo platform={alert.source} size="sm" />
              <span className="truncate text-[10px] font-bold text-[var(--color-text-muted)]">{alert.source || "Nền tảng khác"}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {canPin && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTogglePin?.(alert);
              }}
              disabled={pinDisabled && !pinned}
              aria-pressed={pinned}
              aria-label={pinned ? "Bỏ ghim cảnh báo" : "Ghim cảnh báo"}
              title={pinDisabled && !pinned ? "Chỉ được ghim tối đa 3 cảnh báo" : pinned ? "Bỏ ghim" : "Ghim lên đầu"}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${pinned ? "border-orange-300 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300" : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"}`}
            >
              <span className="material-symbols-outlined text-[16px]">push_pin</span>
            </button>
          )}
          <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-black ${severity.badge}`}>{severity.label}</span>
        </div>
      </div>

      <p className="mt-3 text-xs font-bold text-[var(--color-text-primary)]">
        {severityKey === "critical" ? "Cần xử lý ngay" : severityKey === "high" ? "Rủi ro ảnh hưởng thương hiệu" : "Cần kiểm tra nội dung"}
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{alert.text || alert.comment_content || "Không có nội dung hiển thị."}</p>

      <div className="mt-3 border-t border-[var(--color-border)] pt-2.5">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold text-[var(--color-text-secondary)]">{getStatusLabel(alert)}{owner ? ` · ${owner}` : ""}</p>
            <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{formatAge(alert.created_at)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-black leading-none text-[var(--color-brand)]">{Math.max(0, Math.round(alert.negativity_score || 0))}</p>
            <p className="mt-1 text-[9px] font-bold text-[var(--color-text-muted)]">Điểm rủi ro</p>
          </div>
        </div>
      </div>
    </div>
  );
}
