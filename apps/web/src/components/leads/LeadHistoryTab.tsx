"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  Clock3,
  ExternalLink,
  FileText,
  Flag,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import type { Lead } from "@/types/dashboard";
import type { LeadWorkbenchMeta } from "@/lib/lead-workbench";
import {
  buildLeadHistoryEvents,
  getLeadActionLabel,
  getLeadStatusLabel,
  type LeadHistoryActor,
  type LeadHistoryEvent,
  type LeadHistoryKind,
} from "@/lib/lead-history";

interface LeadHistoryTabProps {
  lead: Lead;
  meta: LeadWorkbenchMeta;
  platformLabel: string;
  slaLabel: string;
}

const INITIAL_EVENT_COUNT = 4;

const KIND_ICONS: Record<LeadHistoryKind, typeof Clock3> = {
  created: MessageCircle,
  assigned: UserRound,
  contact: ExternalLink,
  status: RefreshCw,
  result: CheckCircle2,
  follow_up: CalendarClock,
  transfer: Flag,
  closed: FileText,
};

const ACTOR_STYLES: Record<LeadHistoryActor, string> = {
  customer: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
  employee: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300",
  system: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300",
};

function formatEventDate(value: string) {
  const date = new Date(value);
  return {
    time: date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    date: date.toLocaleDateString("vi-VN"),
  };
}

function HistoryEventRow({ event, compact = false }: { event: LeadHistoryEvent; compact?: boolean }) {
  const Icon = KIND_ICONS[event.kind];
  const occurredAt = formatEventDate(event.occurredAt);
  return (
    <article className="grid grid-cols-[68px_34px_minmax(0,1fr)] gap-2 border-b border-[var(--color-border)] py-3 last:border-b-0">
      <time className="text-[11px] leading-4 text-[var(--color-text-muted)]" dateTime={event.occurredAt}>
        <strong className="block text-xs text-[var(--color-text-secondary)]">{occurredAt.time}</strong>
        {occurredAt.date}
      </time>
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${ACTOR_STYLES[event.actor]}`}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">{event.title}</p>
          <span className="rounded-md bg-[var(--color-bg-surface-raised)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-secondary)]">{event.badge}</span>
        </div>
        {!compact && <p className="mt-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">{event.actorName}</p>}
        {event.description && <p className={`${compact ? "line-clamp-2" : "line-clamp-3"} mt-1 break-words text-xs leading-5 text-[var(--color-text-secondary)]`}>{event.description}</p>}
      </div>
    </article>
  );
}

export function LeadHistoryTab({
  lead,
  meta,
  platformLabel,
  slaLabel,
}: LeadHistoryTabProps) {
  const events = useMemo(() => buildLeadHistoryEvents(lead), [lead]);
  const activityEvents = useMemo(
    () => events.filter((event) => event.actor !== "customer"),
    [events],
  );
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const latestEvent = events.at(-1);
  const latestInteractionAt =
    lead.last_contact_at || lead.last_action_at || lead.posted_at || lead.created_at;
  const latestInteraction = formatEventDate(latestInteractionAt);
  const interactionCount = Math.max(1, (lead.contact_attempts || 0) + 1);
  const statusLabel = getLeadStatusLabel(lead);
  const visibleTimeline = showAllTimeline
    ? events
    : events.slice(-INITIAL_EVENT_COUNT);
  const visibleActivity = showAllActivity
    ? activityEvents
    : activityEvents.slice(-INITIAL_EVENT_COUNT);

  const summaryItems = [
    {
      label: "Tương tác gần nhất",
      value: latestInteraction.time,
      sub: latestInteraction.date,
      icon: Clock3,
      tone: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
    },
    {
      label: "Số lần tương tác",
      value: String(interactionCount),
      sub: "lần",
      icon: MessagesSquare,
      tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300",
    },
    {
      label: "Bước xử lý gần nhất",
      value: latestEvent?.title || getLeadActionLabel(lead.last_action_type),
      sub: latestEvent ? formatEventDate(latestEvent.occurredAt).date : "Chưa có thời điểm",
      icon: Flag,
      tone: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300",
    },
    {
      label: "Trạng thái hiện tại",
      value: statusLabel,
      sub: meta.isOverdue ? slaLabel : platformLabel,
      icon: meta.isOverdue ? TriangleAlert : CheckCircle2,
      tone: meta.isOverdue
        ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300"
        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300",
    },
  ];

  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="flex min-w-0 items-center gap-3 rounded-lg border border-[var(--color-border)] p-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.tone}`}>
                <Icon size={21} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs text-[var(--color-text-secondary)]">{item.label}</p>
                <p className="mt-0.5 line-clamp-2 text-sm font-black text-[var(--color-text-primary)]">{item.value}</p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">{item.sub}</p>
              </div>
            </article>
          );
        })}
      </section>

      <div className="grid items-start gap-3 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-lg border border-[var(--color-border)] p-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
            <MessagesSquare size={18} className="text-[var(--color-brand)]" aria-hidden="true" />
            Timeline tương tác
          </h3>
          <div className="mt-2">
            {visibleTimeline.length > 0
              ? visibleTimeline.map((event) => <HistoryEventRow key={event.id} event={event} />)
              : <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">Chưa có dữ liệu tương tác.</p>}
          </div>
          {events.length > INITIAL_EVENT_COUNT && (
            <button type="button" onClick={() => setShowAllTimeline((value) => !value)} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 border-t border-[var(--color-border)] pt-3 text-sm font-bold text-[var(--color-brand)]">
              {showAllTimeline ? "Thu gọn lịch sử tương tác" : "Xem thêm lịch sử tương tác"}
              {showAllTimeline ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
            </button>
          )}
        </section>

        <section className="rounded-lg border border-[var(--color-border)] p-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
            <CircleUserRound size={18} className="text-[var(--color-brand)]" aria-hidden="true" />
            Activity log xử lý
          </h3>
          <div className="mt-2">
            {visibleActivity.length > 0
              ? visibleActivity.map((event) => <HistoryEventRow key={`activity-${event.id}`} event={event} compact />)
              : <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">Chưa có thao tác xử lý được ghi nhận.</p>}
          </div>
          {lead.notes && (
            <div className="mt-3 border-t border-[var(--color-border)] pt-3">
              <p className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]"><FileText size={15} aria-hidden="true" />Ghi chú hiện tại</p>
              <p className="mt-1 whitespace-pre-line text-xs leading-5 text-[var(--color-text-secondary)]">{lead.notes}</p>
            </div>
          )}
          {activityEvents.length > INITIAL_EVENT_COUNT && (
            <button type="button" onClick={() => setShowAllActivity((value) => !value)} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 border-t border-[var(--color-border)] pt-3 text-sm font-bold text-[var(--color-brand)]">
              {showAllActivity ? "Thu gọn hoạt động xử lý" : "Xem thêm hoạt động xử lý"}
              {showAllActivity ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
