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
    success: "border-[var(--color-success)]/30 bg-[var(--color-success-subtle)] text-[var(--color-success)]",
    info: "border-[var(--color-info)]/30 bg-[var(--color-info-subtle)] text-[var(--color-info)]",
    brand: "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
    danger: "border-[var(--color-error)]/30 bg-[var(--color-error-subtle)] text-[var(--color-error)]",
    warning: "border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
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
      <section className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 md:grid-cols-[1fr_0.8fr_1fr_auto] md:items-center">
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
          <AlarmClock className={meta.isOverdue ? "text-[var(--color-error)]" : "text-[var(--color-warning)]"} size={24} aria-hidden="true" />
          <div className="min-w-0">
            <p className={`truncate text-sm font-bold ${meta.isOverdue ? "text-[var(--color-error)]" : "text-[var(--color-text-primary)]"}`}>{slaLabel}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">SLA xử lý</p>
          </div>
        </div>
        <button type="button" onClick={onOpenSource} disabled={!canOpenSource} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] px-3 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-45">
          Mở nguồn
          <ExternalLink size={16} aria-hidden="true" />
        </button>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--color-border)] lg:col-span-2">
          <div className="grid lg:grid-cols-2">
            <div className="p-4 lg:border-r lg:border-[var(--color-border)]">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                <UserRound size={18} className="text-[var(--color-brand)]" aria-hidden="true" />
                Thông tin cơ bản
              </h3>
              <dl className="mt-3 space-y-2.5">
                <InfoRow label="Tên hiển thị">{lead.author || "Khách hàng"}</InfoRow>
                <InfoRow label="Nền tảng">{platformLabel}</InfoRow>
                <InfoRow label="Liên hệ">{contactValue}</InfoRow>
              </dl>
            </div>
            <div className="border-t border-[var(--color-border)] p-4 lg:border-t-0">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                <ClipboardList size={18} className="text-[var(--color-brand)]" aria-hidden="true" />
                Thông tin xử lý
              </h3>
              <dl className="mt-3 space-y-2.5">
                <InfoRow label="Người phụ trách">{ownership.ownerName}</InfoRow>
                <InfoRow label="Trạng thái">{getLeadStatusLabel(lead)}</InfoRow>
                <InfoRow label="Mức ưu tiên"><span className={`uppercase ${lead.intent === "hot" ? "text-[var(--color-error)]" : lead.intent === "warm" ? "text-[var(--color-warning)]" : "text-[var(--color-text-secondary)]"}`}>{lead.intent}</span></InfoRow>
              </dl>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
            <Flag size={18} className="text-[var(--color-warning)]" aria-hidden="true" />
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

      <section className="flex flex-col gap-3 rounded-lg border-t border-[var(--color-border)] px-1 pt-3 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link2 size={18} className="shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--color-text-primary)]">Liên kết và nguồn</p>
            <p className="truncate text-xs text-[var(--color-text-secondary)]" title={sourceDisplay}>{sourceDisplay}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={handleCopySource} disabled={!sourceHref} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 text-sm font-bold text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-45"><Copy size={16} aria-hidden="true" />Sao chép link</button>
        </div>
      </section>
    </div>
  );
}
