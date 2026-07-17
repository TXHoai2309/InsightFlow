"use client";

import {
  AlarmClock,
  CheckCircle2,
  ClipboardList,
  Copy,
  ExternalLink,
  Flag,
  Flame,
  Gauge,
  Globe2,
  Link2,
  MessageSquareText,
  UserRound,
} from "lucide-react";
import type { Lead } from "@/types/dashboard";
import type {
  LeadOwnershipMeta,
  LeadWorkbenchMeta,
} from "@/lib/lead-workbench";
import { getLeadStatusLabel } from "@/lib/lead-history";

interface LeadProfileTabProps {
  lead: Lead;
  meta: LeadWorkbenchMeta;
  ownership: LeadOwnershipMeta;
  platformLabel: string;
  slaLabel: string;
  sourceHref: string;
  canOpenSource: boolean;
  onOpenSource: () => void;
  onFeedback: (message: string, type?: "success" | "error") => void;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[34%_minmax(0,1fr)] gap-3 text-sm">
      <dt className="text-[var(--color-text-secondary)]">{label}</dt>
      <dd className="min-w-0 break-words font-semibold text-[var(--color-text-primary)]">
        {children}
      </dd>
    </div>
  );
}

export function LeadProfileTab({
  lead,
  meta,
  ownership,
  platformLabel,
  slaLabel,
  sourceHref,
  canOpenSource,
  onOpenSource,
  onFeedback,
}: LeadProfileTabProps) {
  const contactValue =
    lead.phone || lead.email || lead.social_profile_url || "Chưa có thông tin";
  const latestInteractionAt =
    lead.last_contact_at || lead.last_action_at || lead.posted_at || lead.created_at;
  const sourceDisplay = sourceHref || "Chưa có đường dẫn nguồn";
  const signals = [
    lead.intent === "hot"
      ? { label: "Có ý định mua rõ ràng", tone: "success", icon: Flame }
      : null,
    lead.contact_attempts
      ? { label: `Đã liên hệ ${lead.contact_attempts} lần`, tone: "info", icon: MessageSquareText }
      : null,
    meta.needsResultCapture
      ? { label: "Cần ghi nhận kết quả", tone: "brand", icon: ClipboardList }
      : null,
    meta.isOverdue
      ? { label: slaLabel, tone: "danger", icon: AlarmClock }
      : null,
    meta.priorityScore >= 80
      ? { label: "Điểm ưu tiên cao", tone: "warning", icon: Gauge }
      : null,
    meta.isFollowUp
      ? { label: "Có lịch follow-up", tone: "info", icon: CheckCircle2 }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    tone: "success" | "info" | "brand" | "danger" | "warning";
    icon: typeof Flame;
  }>;

  const toneClasses = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300",
    info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300",
    brand: "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
    danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300",
  };

  const handleCopySource = async () => {
    if (!sourceHref) return;
    try {
      const absoluteUrl = new URL(sourceHref, window.location.origin).toString();
      await navigator.clipboard.writeText(absoluteUrl);
      onFeedback("Đã sao chép đường dẫn nguồn.");
    } catch (error) {
      console.error(error);
      onFeedback("Không thể sao chép đường dẫn nguồn.", "error");
    }
  };

  return (
    <div className="space-y-3">
      <section className="grid gap-3 rounded-lg border border-[var(--color-border)] p-3 md:grid-cols-[1fr_0.8fr_1fr_auto] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
            <Globe2 size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{platformLabel}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Nền tảng nguồn</p>
          </div>
        </div>
        <div className="border-[var(--color-border)] md:border-l md:pl-4">
          <p className="text-2xl font-black text-[var(--color-brand)]">{meta.priorityScore}<span className="text-sm text-[var(--color-text-muted)]">/100</span></p>
          <p className="text-xs text-[var(--color-text-secondary)]">Điểm ưu tiên</p>
        </div>
        <div className="flex min-w-0 items-center gap-3 border-[var(--color-border)] md:border-l md:pl-4">
          <AlarmClock className={meta.isOverdue ? "text-red-500" : "text-[var(--color-warning)]"} size={24} aria-hidden="true" />
          <div className="min-w-0">
            <p className={`truncate text-sm font-bold ${meta.isOverdue ? "text-red-600" : "text-[var(--color-text-primary)]"}`}>{slaLabel}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">SLA xử lý</p>
          </div>
        </div>
        <button type="button" onClick={onOpenSource} disabled={!canOpenSource} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-brand-border)] px-3 py-2 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)] disabled:cursor-not-allowed disabled:opacity-45">
          Mở nguồn
          <ExternalLink size={16} aria-hidden="true" />
        </button>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-[var(--color-border)] p-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
            <UserRound size={18} className="text-[var(--color-brand)]" aria-hidden="true" />
            Thông tin cơ bản
          </h3>
          <dl className="mt-3 space-y-2.5">
            <InfoRow label="Tên hiển thị">{lead.author || "Khách hàng"}</InfoRow>
            <InfoRow label="Nền tảng">{platformLabel}</InfoRow>
            <InfoRow label="Liên hệ">{contactValue}</InfoRow>
            <InfoRow label="Điểm ưu tiên"><span className="text-[var(--color-brand)]">{meta.priorityScore}/100</span></InfoRow>
          </dl>
        </section>

        <section className="rounded-lg border border-[var(--color-border)] p-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
            <ClipboardList size={18} className="text-[var(--color-brand)]" aria-hidden="true" />
            Thông tin xử lý
          </h3>
          <dl className="mt-3 space-y-2.5">
            <InfoRow label="Người phụ trách">{ownership.ownerName}</InfoRow>
            <InfoRow label="Trạng thái">{getLeadStatusLabel(lead)}</InfoRow>
            <InfoRow label="Mức ưu tiên"><span className="uppercase text-red-600">{lead.intent}</span></InfoRow>
            <InfoRow label="Nghiệp vụ"><span className="text-[var(--color-success)]">Tiềm năng</span></InfoRow>
          </dl>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-900/40 dark:bg-amber-950/10">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
            <Flag size={18} aria-hidden="true" />
            Tín hiệu quan trọng
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {signals.length > 0 ? signals.map((signal) => {
              const Icon = signal.icon;
              return (
                <span key={signal.label} className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${toneClasses[signal.tone]}`}>
                  <Icon size={14} aria-hidden="true" />
                  {signal.label}
                </span>
              );
            }) : <p className="text-sm text-[var(--color-text-secondary)]">Chưa có tín hiệu vận hành nổi bật.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-[var(--color-border)] p-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
            <MessageSquareText size={18} className="text-[var(--color-brand)]" aria-hidden="true" />
            Tương tác gần nhất
          </h3>
          <blockquote className="mt-3 border-l-2 border-[var(--color-brand-border)] pl-3 text-sm leading-6 text-[var(--color-text-primary)]">
            {lead.content}
          </blockquote>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-2 text-xs text-[var(--color-text-secondary)]">
            <span>Số lần tương tác: <strong className="text-[var(--color-text-primary)]">{Math.max(1, (lead.contact_attempts || 0) + 1)}</strong></span>
            <span>{new Date(latestInteractionAt).toLocaleString("vi-VN")}</span>
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] p-3 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link2 size={18} className="shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--color-text-primary)]">Liên kết và nguồn</p>
            <p className="truncate text-xs text-[var(--color-text-secondary)]" title={sourceDisplay}>{sourceDisplay}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={handleCopySource} disabled={!sourceHref} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] disabled:cursor-not-allowed disabled:opacity-45"><Copy size={16} aria-hidden="true" />Sao chép link</button>
          <button type="button" onClick={onOpenSource} disabled={!canOpenSource} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-brand-border)] px-3 py-2 text-sm font-bold text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] disabled:cursor-not-allowed disabled:opacity-45"><ExternalLink size={16} aria-hidden="true" />Mở nguồn</button>
        </div>
      </section>
    </div>
  );
}
