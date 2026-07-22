"use client";

import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  ExternalLink,
  FileText,
  History,
  RefreshCw,
  StickyNote,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { useLeadActivityHistory } from "@/hooks/useLeadActivityHistory";
import type { Lead } from "@/types/dashboard";
import type { LeadWorkbenchMeta } from "@/lib/lead-workbench";
import {
  buildLeadHistoryEvents,
  getLeadStatusLabel,
  mapLeadActivityEvent,
  type LeadHistoryActor,
  type LeadHistoryEvent,
  type LeadHistoryKind,
} from "@/lib/lead-history";

interface LeadHistoryTabProps {
  lead: Lead;
  meta: LeadWorkbenchMeta;
  slaLabel: string;
}
type HistoryFilter =
  | "all"
  | "assignment"
  | "contact"
  | "status"
  | "result"
  | "follow_up"
  | "note"
  | "system";

const KIND_ICONS: Record<LeadHistoryKind, typeof Clock3> = {
  created: History,
  assigned: UserRound,
  contact: ExternalLink,
  status: RefreshCw,
  result: CheckCircle2,
  follow_up: CalendarClock,
  note: StickyNote,
  sales: BriefcaseBusiness,
  closed: FileText,
};

const ACTOR_STYLES: Record<LeadHistoryActor, string> = {
  employee: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
  system: "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]",
};

const FILTERS: Array<{ key: HistoryFilter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "assignment", label: "Phân công" },
  { key: "contact", label: "Liên hệ" },
  { key: "status", label: "Trạng thái" },
  { key: "result", label: "Kết quả" },
  { key: "follow_up", label: "Follow-up" },
  { key: "note", label: "Ghi chú" },
  { key: "system", label: "Hệ thống" },
];

function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { time: "--:--", date: "Chưa có" };
  return {
    time: date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    date: date.toLocaleDateString("vi-VN"),
  };
}

function matchesFilter(event: LeadHistoryEvent, filter: HistoryFilter) {
  if (filter === "all") return true;
  if (filter === "assignment") return event.kind === "assigned";
  if (filter === "contact") return event.kind === "contact";
  if (filter === "status") return event.kind === "status" || event.kind === "closed";
  if (filter === "result") return event.kind === "result" || event.kind === "sales";
  if (filter === "follow_up") return event.kind === "follow_up";
  if (filter === "note") return event.kind === "note";
  return event.actor === "system";
}

function HistoryEventRow({ event }: { event: LeadHistoryEvent }) {
  const Icon = KIND_ICONS[event.kind];
  const occurredAt = formatEventDate(event.occurredAt);
  const isInferred = event.source !== "live";
  return (
    <article className="grid grid-cols-[62px_34px_minmax(0,1fr)] gap-2 border-b border-[var(--color-border)] py-3 last:border-b-0 sm:grid-cols-[72px_36px_minmax(0,1fr)]">
      <time className="text-[10px] leading-4 text-[var(--color-text-muted)]" dateTime={event.occurredAt}>
        <strong className="block text-xs text-[var(--color-text-secondary)]">{occurredAt.time}</strong>
        {occurredAt.date}
      </time>
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${ACTOR_STYLES[event.actor]}`}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">{event.title}</p>
          <span className="rounded-md bg-[var(--color-bg-surface-raised)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-secondary)]">
            {event.badge}
          </span>
          {isInferred && (
            <span className="rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-warning)]">
              Dữ liệu suy diễn
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">{event.actorName}</p>
        {event.description && (
          <p className="mt-1 break-words text-xs leading-5 text-[var(--color-text-secondary)]">{event.description}</p>
        )}
      </div>
    </article>
  );
}

export function LeadHistoryTab({ lead, meta, slaLabel }: LeadHistoryTabProps) {
  const fallbackEvents = useMemo(() => buildLeadHistoryEvents(lead), [lead]);
  const { data, errorCode, isLoading, isLoadingMore, reload, loadMore } =
    useLeadActivityHistory(lead.id);
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("all");
  const persistedEvents = useMemo(
    () => (data?.events || []).map(mapLeadActivityEvent),
    [data?.events],
  );
  const hasPersistedEvents = data?.availability === "available" && persistedEvents.length > 0;
  const events = hasPersistedEvents ? persistedEvents : fallbackEvents;
  const filteredEvents = events.filter((event) => matchesFilter(event, activeFilter));
  const latestEvent = events[0];
  const startedAt = lead.claimed_at || lead.assigned_at || lead.created_at;
  const started = formatEventDate(startedAt);
  const latest = latestEvent ? formatEventDate(latestEvent.occurredAt) : null;
  const statusLabel = getLeadStatusLabel(lead);
  const ownerName = lead.owner_name || lead.owner_email || "Chưa phân công";
  const isLimitedHistory = !hasPersistedEvents || events.some((event) => event.source !== "live");
  const eventCount = hasPersistedEvents ? Math.max(data?.total || 0, events.length) : events.length;

  const summaryItems = [
    {
      label: "Bắt đầu xử lý",
      value: started.time,
      sub: started.date,
      icon: Clock3,
      tone: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
    },
    {
      label: "Người phụ trách",
      value: ownerName,
      sub: lead.owner_id ? "Đang phụ trách" : "Chưa có người nhận",
      icon: CircleUserRound,
      tone: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
    },
    {
      label: "Thao tác gần nhất",
      value: latestEvent?.title || "Chưa có thao tác",
      sub: latest ? `${latest.time} · ${latest.date}` : "Chưa có thời điểm",
      icon: History,
      tone: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
    },
    {
      label: "Trạng thái hiện tại",
      value: statusLabel,
      sub: meta.wasOverdueOnIngest
        ? "Quá hạn trước khi hệ thống ghi nhận"
        : meta.isOverdue
          ? slaLabel
          : "Trong quy trình xử lý",
      icon: meta.isOverdue ? TriangleAlert : CheckCircle2,
      tone: meta.isOverdue
        ? "bg-[var(--color-error-subtle)] text-[var(--color-error)]"
        : "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
    },
  ];

  if (errorCode === "ACCESS_DENIED" || errorCode === "AUTH_REQUIRED") {
    return (
      <section className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]/40 p-7 text-center" role="status">
        <CircleUserRound className="mx-auto text-[var(--color-text-muted)]" size={30} aria-hidden="true" />
        <h3 className="mt-2 text-sm font-black text-[var(--color-text-primary)]">Lịch sử xử lý bị giới hạn</h3>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          Bạn không có quyền xem nhật ký này hoặc phiên đăng nhập đã hết hạn.
        </p>
      </section>
    );
  }

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

      {(isLimitedHistory || errorCode === "TEMPORARY_ERROR") && (
        <section className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] px-3 py-2.5 text-xs leading-5 text-[var(--color-warning)]">
          <p>
            {errorCode === "TEMPORARY_ERROR"
              ? "Chưa thể đồng bộ event log. Hệ thống đang hiển thị các mốc có thể suy ra từ Lead hiện tại."
              : "Lịch sử cũ chỉ gồm các mốc có thể khôi phục từ dữ liệu Lead hiện tại; event log đầy đủ áp dụng cho các thao tác mới."}
          </p>
          {errorCode === "TEMPORARY_ERROR" && (
            <button type="button" onClick={() => void reload()} className="shrink-0 font-bold underline underline-offset-2">
              Thử lại
            </button>
          )}
        </section>
      )}

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(250px,0.55fr)]">
        <section className="rounded-lg border border-[var(--color-border)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
              <History size={18} className="text-[var(--color-brand)]" aria-hidden="true" />
              Nhật ký xử lý Lead
            </h3>
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">{eventCount} sự kiện</span>
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" aria-label="Lọc nhật ký xử lý">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                aria-pressed={activeFilter === filter.key}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-1 ${
                  activeFilter === filter.key
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mt-2" aria-busy={isLoading}>
            {isLoading && !data ? (
              <div className="space-y-2 py-2">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-[var(--color-bg-surface-raised)]" />)}</div>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map((event) => <HistoryEventRow key={event.id} event={event} />)
            ) : (
              <div className="py-8 text-center">
                <History className="mx-auto text-[var(--color-text-muted)]" size={28} aria-hidden="true" />
                <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">Chưa có thao tác phù hợp</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Chưa có sự kiện nào thuộc nhóm đang chọn.</p>
              </div>
            )}
          </div>

          {hasPersistedEvents && data?.nextCursor && activeFilter === "all" && (
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={() => void loadMore()}
              className="mt-2 inline-flex w-full items-center justify-center border-t border-[var(--color-border)] pt-3 text-sm font-bold text-[var(--color-brand)] disabled:opacity-50"
            >
              {isLoadingMore ? "Đang tải..." : "Xem thêm nhật ký"}
            </button>
          )}
        </section>

        <aside className="space-y-3 rounded-lg bg-[var(--color-bg-surface-raised)] p-3">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Tóm tắt quy trình</h3>
          <dl className="space-y-3 text-xs">
            <div>
              <dt className="text-[var(--color-text-muted)]">Số sự kiện xử lý</dt>
              <dd className="mt-0.5 font-bold text-[var(--color-text-primary)]">{eventCount}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Tình trạng SLA</dt>
              <dd className={`mt-0.5 font-bold ${meta.isOverdue ? "text-[var(--color-error)]" : "text-[var(--color-text-primary)]"}`}>{slaLabel}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Follow-up tiếp theo</dt>
              <dd className="mt-0.5 font-bold text-[var(--color-text-primary)]">
                {lead.follow_up_at ? new Date(lead.follow_up_at).toLocaleString("vi-VN") : "Chưa đặt lịch"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Nguồn lịch sử</dt>
              <dd className="mt-0.5 font-bold text-[var(--color-text-primary)]">
                {isLimitedHistory ? "Mốc khôi phục" : "Event log nghiệp vụ"}
              </dd>
            </div>
          </dl>
          {lead.notes && (
            <div className="border-t border-[var(--color-border)] pt-3">
              <p className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                <StickyNote size={15} aria-hidden="true" /> Ghi chú hiện tại
              </p>
              <p className="mt-1 whitespace-pre-line text-xs leading-5 text-[var(--color-text-secondary)]">{lead.notes}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
