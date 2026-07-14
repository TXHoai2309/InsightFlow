"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboardData";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useAlertStore } from "@/stores/alert.store";
import { getScopedBrandKey } from "@/lib/brandScope";
import { getAlertWorkflowStatus } from "@/lib/alertWorkflow";
import { isIntentLead } from "@/lib/lead-intent";
import type { Alert, Lead, Mention } from "@/types/dashboard";

type DashboardRole = "crisis" | "lead";

interface RoleCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  urgentLabel: string;
  completedLabel: string;
  waitingLabel: string;
  actionTitle: string;
  actionDescription: string;
  itemNoun: string;
  primaryHref: string;
  primaryAction: string;
  insightTitle: string;
}

const ROLE_COPY: Record<DashboardRole, RoleCopy> = {
  crisis: {
    eyebrow: "Daily Crisis Briefing",
    title: "Trung tâm công việc xử lý khủng hoảng",
    subtitle: "Ưu tiên tín hiệu rủi ro, phản hồi nhanh và theo dõi tiến độ trong ngày.",
    urgentLabel: "Cần xử lý",
    completedLabel: "Đã xử lý",
    waitingLabel: "Chờ phản hồi",
    actionTitle: "Tín hiệu cần ưu tiên",
    actionDescription: "Các cảnh báo chưa hoàn tất, xếp theo mức độ rủi ro và thời gian.",
    itemNoun: "tín hiệu",
    primaryHref: "/alerts",
    primaryAction: "Mở cảnh báo",
    insightTitle: "Gợi ý xử lý khủng hoảng",
  },
  lead: {
    eyebrow: "Daily Lead Briefing",
    title: "Trung tâm công việc khách hàng tiềm năng",
    subtitle: "Ưu tiên khách có ý định mua, theo dõi phản hồi và hoàn tất liên hệ trong ngày.",
    urgentLabel: "Cần liên hệ",
    completedLabel: "Đã hoàn tất",
    waitingLabel: "Chờ khách phản hồi",
    actionTitle: "Khách hàng cần ưu tiên",
    actionDescription: "Các khách hàng tiềm năng cần liên hệ hoặc theo dõi tiếp trong ngày.",
    itemNoun: "khách hàng",
    primaryHref: "/leads",
    primaryAction: "Mở khách hàng",
    insightTitle: "Gợi ý chăm sóc khách hàng",
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function dayStart(value: Date | string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function isSameDay(value: string | undefined, selectedDate: Date) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && dayStart(value) === dayStart(selectedDate);
}

function isBeforeDay(value: string | undefined, selectedDate: Date) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && dayStart(value) < dayStart(selectedDate);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function relativeTime(value?: string) {
  if (!value) return "Không rõ thời gian";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Không rõ thời gian";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function leadDate(lead: Lead) {
  return lead.last_action_at || lead.assigned_at || lead.created_at;
}

function alertDate(alert: Alert) {
  return alert.created_at;
}

function isLeadDone(lead: Lead) {
  return lead.status === "completed" || lead.status === "skipped" || Boolean(lead.closed_at);
}

function isAlertDone(alert: Alert) {
  return getCrisisStatus(alert) === "resolved";
}

type CrisisStatus = "unprocessed" | "processing" | "resolved";

function getCrisisStatus(alert: Alert): CrisisStatus {
  const status = getAlertWorkflowStatus(alert);
  if (status === "resolved") return "resolved";
  if (status === "processing" || status === "contact_failed") return "processing";
  return "unprocessed";
}

function crisisStatusLabel(status: CrisisStatus) {
  if (status === "resolved") return "Đã xử lý";
  if (status === "processing") return "Đang xử lý";
  return "Chưa xử lý";
}

function crisisStatusTone(status: CrisisStatus) {
  if (status === "resolved") return "bg-emerald-100 text-emerald-700";
  if (status === "processing") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
}

function leadNeedsReply(lead: Lead) {
  return lead.result_type === "no_response" || lead.result_type === "follow_up" || Boolean(lead.follow_up_at);
}

function alertNeedsReply(alert: Alert) {
  const item = alert as Alert & { pending_result?: boolean; response_status?: string };
  return item.pending_result === true || item.response_status === "waiting" || alert.status === "acknowledged";
}

function getMentionDate(mention: Mention) {
  return mention.posted_at || mention.created_at;
}

function sentimentLabel(sentiment: Mention["sentiment"]) {
  if (sentiment === "positive") return "Tích cực";
  if (sentiment === "negative") return "Tiêu cực";
  return "Trung lập";
}

function severityRank(value: Alert["severity"]) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[value] || 0;
}

export function EmployeeOverviewDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const { refetch } = useDashboard();
  const { mentions, alerts: dashboardAlerts, leads, isLoading, error } = useDashboardStore();
  const {
    rawAlerts,
    isLoading: isAlertLoading,
    error: alertError,
    fetchAlerts,
  } = useAlertStore();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [query, setQuery] = useState("");

  const role: DashboardRole = profile?.role === "lead_employee" ? "lead" : "crisis";
  const copy = ROLE_COPY[role];

  useEffect(() => {
    if (authLoading || role !== "crisis" || !profile) return;
    void fetchAlerts(getScopedBrandKey(profile), false);
  }, [authLoading, fetchAlerts, profile, role]);

  // Trang Alert dùng AlertStore làm nguồn dữ liệu chính. Chuẩn hóa dữ liệu đó
  // về cấu trúc dashboard để Tổng quan luôn hiển thị cùng một hàng đợi.
  const alerts = useMemo<Alert[]>(() => {
    if (role !== "crisis") return dashboardAlerts;
    return rawAlerts.map((alert) => ({
      id: alert.id,
      workspace_id: alert.brand,
      severity: alert.severity as Alert["severity"],
      signal_type: (alert.topic || alert.source || "sensitive_topic") as Alert["signal_type"],
      message: alert.text || alert.title || "Cảnh báo cần xử lý",
      created_at: alert.created_at,
      resolved_at: alert.resolved_at,
      assigned_to: alert.being_resolved_by,
      status: alert.status as Alert["status"],
    }));
  }, [dashboardAlerts, rawAlerts, role]);

  const pageLoading = role === "crisis" ? isAlertLoading : isLoading;
  const pageError = role === "crisis" ? alertError : error;

  const handleRefresh = async () => {
    if (role === "crisis") {
      await fetchAlerts(getScopedBrandKey(profile), true);
      return;
    }
    await refetch(true);
  };

  const dashboard = useMemo(() => {
    const todayMentions = mentions.filter((mention) => isSameDay(getMentionDate(mention), selectedDate));
    const positiveCount = todayMentions.filter((mention) => mention.sentiment === "positive").length;
    const negativeCount = todayMentions.filter((mention) => mention.sentiment === "negative").length;

    if (role === "lead") {
      const leadQueueItems = leads.filter(isIntentLead);
      const currentItems = leadQueueItems.filter((lead) => isSameDay(leadDate(lead), selectedDate));
      const unfinished = leadQueueItems.filter((lead) => isBeforeDay(leadDate(lead), selectedDate) && !isLeadDone(lead));
      const actionable = [...currentItems.filter((lead) => !isLeadDone(lead)), ...unfinished]
        .filter((lead, index, list) => list.findIndex((item) => item.id === lead.id) === index)
        .filter((lead) => {
          const text = `${lead.author || ""} ${lead.content || ""}`.toLowerCase();
          return text.includes(query.trim().toLowerCase());
        })
        .sort((a, b) => {
          const intent = { hot: 3, warm: 2, cold: 1, none: 0 };
          return intent[b.intent] - intent[a.intent] || new Date(leadDate(b)).getTime() - new Date(leadDate(a)).getTime();
        });

      return {
        actionable,
        total: currentItems.length + unfinished.length,
        completed: currentItems.filter(isLeadDone).length,
        carryOver: unfinished.length,
        waiting: leadQueueItems.filter((lead) => !isLeadDone(lead) && leadNeedsReply(lead)).length,
        positiveCount,
        negativeCount,
      };
    }

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * DAY_MS;
    const currentItems = alerts.filter((alert) => {
      const createdAt = new Date(alertDate(alert)).getTime();
      return Number.isFinite(createdAt) && createdAt >= thirtyDaysAgo && createdAt <= now;
    });
    const actionable = currentItems
      .filter((alert) => {
        const text = `${alert.message || ""} ${alert.signal_type || ""}`.toLowerCase();
        return text.includes(query.trim().toLowerCase());
      })
      .sort((a, b) => {
        const statusRank: Record<CrisisStatus, number> = { unprocessed: 3, processing: 2, resolved: 1 };
        return statusRank[getCrisisStatus(b)] - statusRank[getCrisisStatus(a)]
          || severityRank(b.severity) - severityRank(a.severity)
          || new Date(alertDate(b)).getTime() - new Date(alertDate(a)).getTime();
      });

    const statusCounts = currentItems.reduce<Record<CrisisStatus, number>>((counts, alert) => {
      counts[getCrisisStatus(alert)] += 1;
      return counts;
    }, { unprocessed: 0, processing: 0, resolved: 0 });

    return {
      actionable,
      total: currentItems.length,
      completed: statusCounts.resolved,
      carryOver: statusCounts.unprocessed,
      waiting: 0,
      processing: statusCounts.processing,
      positiveCount,
      negativeCount,
    };
  }, [alerts, leads, mentions, query, role, selectedDate]);

  const displayName = profile?.displayName || profile?.email?.split("@")[0] || "bạn";
  const isToday = dayStart(selectedDate) === dayStart(new Date());

  if (!authLoading && profile?.role !== "crisis_employee" && profile?.role !== "lead_employee") {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-8">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Trang tổng quan này dành cho nhân viên xử lý khủng hoảng và nhân viên khách hàng tiềm năng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_75%_0%,rgba(124,58,237,0.10),transparent_30%)] p-4 text-[var(--color-text-primary)] sm:p-6 xl:p-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--color-brand)]">Tổng quan nhân viên</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{copy.title}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Xin chào {displayName}. {copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {role === "lead" ? <div className="flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-1 shadow-sm">
              <button type="button" onClick={() => setSelectedDate((date) => new Date(date.getTime() - DAY_MS))} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[var(--color-brand-subtle)]" aria-label="Ngày trước">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="min-w-[185px] px-2 text-center text-xs font-bold capitalize">{formatDate(selectedDate)}</span>
              <button type="button" disabled={isToday} onClick={() => setSelectedDate((date) => new Date(Math.min(Date.now(), date.getTime() + DAY_MS)))} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[var(--color-brand-subtle)] disabled:opacity-30" aria-label="Ngày sau">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div> : <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-xs font-bold shadow-sm"><span className="material-symbols-outlined text-lg text-[var(--color-brand)]">date_range</span>30 ngày gần nhất</div>}
            <button type="button" onClick={handleRefresh} disabled={pageLoading} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-sm font-bold shadow-sm disabled:opacity-60">
              <span className={`material-symbols-outlined text-lg ${pageLoading ? "animate-spin" : ""}`}>refresh</span>
              Làm mới
            </button>
          </div>
        </header>

        {pageError && <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{pageError}</div>}

        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-950 via-slate-900 to-violet-900 p-6 text-white shadow-xl">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
                <span className="material-symbols-outlined text-lg">auto_awesome</span>{copy.eyebrow}
              </p>
              <h2 className="mt-3 max-w-3xl text-xl font-extrabold sm:text-2xl">{role === "crisis" ? `${dashboard.total} khủng hoảng trong 30 ngày gần nhất` : `${dashboard.total} ${copy.itemNoun} trong kế hoạch, còn ${dashboard.actionable.length} cần tiếp tục xử lý`}</h2>
              <p className="mt-2 text-sm text-slate-300">{role === "crisis" ? `${dashboard.carryOver} chờ xử lý · ${dashboard.processing || 0} đang xử lý · ${dashboard.completed} đã giải quyết.` : `${dashboard.carryOver} việc tồn từ hôm qua · ${dashboard.waiting} trường hợp đang chờ phản hồi.`}</p>
            </div>
            <Link href={copy.primaryHref} className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 text-sm font-extrabold text-violet-700 shadow-lg lg:self-center">
              {copy.primaryAction}<span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>
        </section>

        <section className={`grid grid-cols-2 gap-3 ${role === "crisis" ? "xl:grid-cols-4" : "xl:grid-cols-5"}`}>
          {(role === "crisis" ? [
            ["crisis_alert", "Tổng 30 ngày", dashboard.total, "text-violet-600", "bg-violet-50"],
            ["pending_actions", "Chờ xử lý", dashboard.carryOver, "text-amber-600", "bg-amber-50"],
            ["sync", "Đang xử lý", dashboard.processing || 0, "text-blue-600", "bg-blue-50"],
            ["task_alt", "Đã giải quyết", dashboard.completed, "text-emerald-600", "bg-emerald-50"],
          ] : [
            ["task_alt", "Việc trong ngày", dashboard.total, "text-violet-600", "bg-violet-50"],
            ["history", "Tồn từ hôm qua", dashboard.carryOver, "text-amber-600", "bg-amber-50"],
            ["mark_chat_unread", copy.waitingLabel, dashboard.waiting, "text-blue-600", "bg-blue-50"],
            ["thumb_up", "Tích cực hôm nay", dashboard.positiveCount, "text-emerald-600", "bg-emerald-50"],
            ["thumb_down", "Tiêu cực hôm nay", dashboard.negativeCount, "text-rose-600", "bg-rose-50"],
          ]).map(([icon, label, value, color, background]) => (
            <article key={String(label)} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${background} ${color}`}><span className="material-symbols-outlined">{icon}</span></span>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
              <p className="mt-1 text-3xl font-extrabold">{value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold">{copy.actionTitle}</h2>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{copy.actionDescription}</p>
              </div>
              <label className="relative block sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[var(--color-text-muted)]">search</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Tìm ${copy.itemNoun}...`} className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] pl-10 pr-3 text-sm outline-none focus:border-[var(--color-brand)]" />
              </label>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {pageLoading && dashboard.actionable.length === 0 ? (
                [1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse bg-[var(--color-bg-surface-raised)]" />)
              ) : dashboard.actionable.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-emerald-500">task_alt</span>
                  <h3 className="mt-3 font-extrabold">Không còn công việc phù hợp</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Bạn đã xử lý hết hoặc chưa có dữ liệu trong ngày được chọn.</p>
                </div>
              ) : dashboard.actionable.slice(0, 8).map((item) => {
                const isLead = role === "lead";
                const lead = isLead ? item as Lead : null;
                const alert = !isLead ? item as Alert : null;
                const title = lead ? (lead.author || "Khách hàng chưa xác định") : (alert?.message || "Cảnh báo cần xử lý");
                const description = lead ? lead.content : `${alert?.signal_type?.replaceAll("_", " ") || "Tín hiệu rủi ro"}`;
                const badge = lead ? lead.intent.toUpperCase() : alert?.severity.toUpperCase();
                const date = lead ? leadDate(lead) : alertDate(alert!);
                const href = lead ? `/leads?lead=${encodeURIComponent(lead.id)}` : `/alerts/${encodeURIComponent(alert!.id)}`;
                const tone = lead ? (lead.intent === "hot" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700") : (alert?.severity === "critical" || alert?.severity === "high" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700");

                return (
                  <article key={item.id} className="p-4 transition hover:bg-[var(--color-bg-surface-raised)] sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${tone}`}>{badge}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-extrabold">{title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                          <span>{relativeTime(date)}</span>
                          {lead && <span>{lead.platform}</span>}
                          {alert && <span className={`rounded-full px-2 py-0.5 font-bold ${crisisStatusTone(getCrisisStatus(alert))}`}>{crisisStatusLabel(getCrisisStatus(alert))}</span>}
                          {lead && leadNeedsReply(lead) && <span className="font-bold text-blue-600">Đang chờ phản hồi</span>}
                          {alert && alertNeedsReply(alert) && <span className="font-bold text-blue-600">Đang chờ phản hồi</span>}
                        </div>
                      </div>
                      <Link href={href} className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-[var(--color-border)] text-[var(--color-brand)]" aria-label="Mở chi tiết">
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[24px] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 text-slate-900 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white"><span className="material-symbols-outlined">auto_awesome</span></span>
                <div><h2 className="text-sm font-extrabold">{copy.insightTitle}</h2><p className="text-[11px] text-violet-600">Từ dữ liệu mới nhất</p></div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                {role === "crisis"
                  ? dashboard.negativeCount > dashboard.positiveCount
                    ? `Tiêu cực đang cao hơn tích cực ${dashboard.negativeCount - dashboard.positiveCount} đề cập. Hãy ưu tiên cảnh báo mức Critical và High.`
                    : "Tình hình cảm xúc đang ổn định. Tiếp tục xử lý các cảnh báo tồn và theo dõi phản hồi mới."
                  : dashboard.waiting > 0
                    ? `Có ${dashboard.waiting} khách hàng đang chờ theo dõi. Nên ghi nhận kết quả liên hệ trước khi nhận thêm lead mới.`
                    : "Chưa có khách đang chờ phản hồi. Hãy ưu tiên nhóm Hot trước, sau đó đến nhóm Warm."}
              </p>
            </section>

            <section className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="text-sm font-extrabold">Cảm xúc hôm nay</h2><span className="text-xs font-bold text-[var(--color-text-muted)]">{dashboard.positiveCount + dashboard.negativeCount}</span></div>
              <div className="mt-5 space-y-4">
                {(["positive", "negative"] as const).map((sentiment) => {
                  const value = sentiment === "positive" ? dashboard.positiveCount : dashboard.negativeCount;
                  const total = Math.max(1, dashboard.positiveCount + dashboard.negativeCount);
                  return <div key={sentiment}><div className="mb-1.5 flex justify-between text-xs font-bold"><span>{sentimentLabel(sentiment)}</span><span>{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${sentiment === "positive" ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${value / total * 100}%` }} /></div></div>;
                })}
              </div>
              <Link href="/mentions" className="mt-5 inline-flex items-center gap-1 text-xs font-extrabold text-[var(--color-brand)]">Xem tất cả đề cập<span className="material-symbols-outlined text-base">arrow_forward</span></Link>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}
