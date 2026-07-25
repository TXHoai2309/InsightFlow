"use client";

import { useEffect, useRef, useState } from "react";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { getAlertWorkflowStatus } from "@/lib/alertWorkflow";
import { getEffectiveAlertOwner } from "@/lib/alert-visibility";
import type { AlertData } from "@/stores/alert.store";
import type { AlertViewer } from "@/hooks/useAlertViewPresence";
import { dispatchTourAction } from "@/components/onboarding/RouteTour";

interface AlertWorkbenchRowProps {
  alert: AlertData;
  selected: boolean;
  pinned?: boolean;
  canPin?: boolean;
  pinDisabled?: boolean;
  onSelect: (alert: AlertData) => void;
  onTogglePin?: (alert: AlertData) => void;
  getResolverName: (value: string | null | undefined) => string;
  viewers?: AlertViewer[];
  currentViewerId?: string | null;
}

const SEVERITY_STYLE: Record<string, { label: string; border: string; badge: string }> = {
  critical: { label: "CRITICAL", border: "border-l-red-500", badge: "border-red-200/60 bg-red-50/60 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300" },
  high: { label: "HIGH", border: "border-l-orange-400", badge: "border-orange-200/60 bg-orange-50/60 text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-300" },
  medium: { label: "MEDIUM", border: "border-l-amber-400", badge: "border-amber-200/60 bg-amber-50/60 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300" },
  low: { label: "LOW", border: "border-l-slate-300", badge: "border-slate-200/60 bg-slate-50/60 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" },
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
  if (status === "resolved") return "Đã đóng";
  if (status === "skipped") return "Đã bỏ qua";
  if (status === "contact_failed") return "Liên hệ không thành";
  if (status === "processing") return alert.status === "contact_waiting" ? "Chờ phản hồi" : "Đang xử lý";
  return "Chưa phân công";
}

export function AlertWorkbenchRow({ alert, selected, pinned = false, canPin = false, pinDisabled = false, onSelect, onTogglePin, getResolverName, viewers = [], currentViewerId }: AlertWorkbenchRowProps) {
  const [showViewers, setShowViewers] = useState(false);
  const viewerTriggerRef = useRef<HTMLButtonElement>(null);
  const viewerPopoverRef = useRef<HTMLDivElement>(null);
  const severityKey = String(alert.severity || "low").toLowerCase();
  const severity = SEVERITY_STYLE[severityKey] || SEVERITY_STYLE.low;
  const owner = getResolverName(getEffectiveAlertOwner(alert));
  const workflowStatus = getAlertWorkflowStatus(alert);

  useEffect(() => {
    if (!showViewers) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        viewerTriggerRef.current?.contains(target) ||
        viewerPopoverRef.current?.contains(target)
      ) {
        return;
      }
      setShowViewers(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [showViewers]);

  useEffect(() => {
    if (!selected || workflowStatus !== "pending") {
      setShowViewers(false);
    }
  }, [selected, workflowStatus]);

  const statusLabel = getStatusLabel(alert);
  const statusAccent = workflowStatus === "contact_failed"
    ? { dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" }
    : workflowStatus === "processing"
      ? { dot: "bg-orange-500", text: "text-orange-700 dark:text-orange-300" }
      : workflowStatus === "resolved"
        ? { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" }
        : workflowStatus === "skipped"
          ? { dot: "bg-slate-400", text: "text-slate-700 dark:text-slate-300" }
          : { dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-300" };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(alert);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        onSelect(alert);
        dispatchTourAction("select_alert");
      }}
      onKeyDown={handleKeyDown}
      aria-current={selected ? "true" : undefined}
      className={`relative w-full cursor-pointer rounded-lg border border-l-2 ${pinned ? "border-l-orange-500" : severity.border} bg-[var(--color-bg-surface)] p-3 text-left shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${pinned || selected ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/20" : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-surface-raised)]"}`}>
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
          {selected && workflowStatus === "pending" && (
            <button
              ref={viewerTriggerRef}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowViewers((value) => !value);
              }}
              aria-expanded={showViewers}
              aria-label={`${viewers.length} người đang xem cảnh báo`}
              title={`${viewers.length} người đang xem`}
              className="inline-flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-1.5 text-[10px] font-black text-[var(--color-text-muted)] transition hover:border-violet-300 hover:text-violet-600"
            >
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              <span>{viewers.length}</span>
            </button>
          )}
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
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-extrabold leading-5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${statusAccent.dot}`} aria-hidden="true" />
              <span className={statusAccent.text}>{statusLabel}</span>
              {owner && <><span className="text-[var(--color-text-muted)]">·</span><span className="text-[var(--color-text-primary)]">{owner}</span></>}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{formatAge(alert.created_at)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-black leading-none text-[var(--color-brand)]">{Math.max(0, Math.round(alert.negativity_score || 0))}</p>
            <p className="mt-1 text-[9px] font-bold text-[var(--color-text-muted)]">Điểm rủi ro</p>
          </div>
        </div>
      </div>

      {selected && workflowStatus === "pending" && showViewers && (
        <div
          ref={viewerPopoverRef}
          role="dialog"
          aria-label="Danh sách người đang xem cảnh báo"
          onClick={(event) => event.stopPropagation()}
          className="absolute right-3 top-12 z-30 w-[min(18rem,calc(100%-1.5rem))] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 text-left shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2">
            <p className="text-sm font-black text-[var(--color-text-primary)]">Người đang xem ({viewers.length})</p>
            <button type="button" onClick={() => setShowViewers(false)} className="grid h-7 w-7 place-items-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)]" aria-label="Đóng danh sách người xem">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          {viewers.length === 0 ? (
            <p className="py-3 text-xs text-[var(--color-text-secondary)]">Chưa có người nào đang xem.</p>
          ) : (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {viewers.map((viewer) => (
                <li key={viewer.uid} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-[var(--color-bg-surface-raised)]">
                  {viewer.photoURL ? (
                    <span
                      aria-hidden="true"
                      className="h-8 w-8 shrink-0 rounded-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${JSON.stringify(viewer.photoURL).slice(1, -1)})` }}
                    />
                  ) : (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-black text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                      {(viewer.displayName || viewer.email || "ND").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-[var(--color-text-primary)]">
                      {viewer.displayName || viewer.email || "Người dùng"}{viewer.uid === currentViewerId ? " (Bạn)" : ""}
                    </p>
                    {viewer.email && <p className="truncate text-[10px] text-[var(--color-text-muted)]">{viewer.email}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
