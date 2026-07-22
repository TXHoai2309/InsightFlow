"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { useAuth } from "@/hooks/useAuth";
import { getScopedBrandKey } from "@/lib/brandScope";
import { isSkippedAlert, isTerminalAlert } from "@/lib/alertWorkflow";
import {
  buildAlertOperationalMetrics,
  filterOperationalAlerts,
  getAlertDeduplicationKey,
} from "@/lib/operational-metrics";
import { getDiscussionPeriodDays } from "@/lib/dashboard-display";
import { cn } from "@/lib/utils";
import { useAlertStore, type AlertData } from "@/stores/alert.store";
import { useDashboardStore } from "@/stores/dashboard.store";
import { CrisisAnalyticsCharts } from "./CrisisAnalyticsCharts";
import { CrisisTable } from "./CrisisTable";

type CountStat = { key: string; label: string; count: number; percent: number };

const TOPIC_LABELS: Record<string, string> = {
  service: "Dịch vụ",
  quality: "Chất lượng",
  price: "Giá cả",
  location: "Chi nhánh",
  promotion: "Khuyến mãi",
  delivery: "Giao hàng",
  staff: "Nhân viên",
  hygiene: "Vệ sinh",
  other: "Khác",
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  thread: "Threads",
  threads: "Threads",
  google_maps: "Google Maps",
  googlemap: "Google Maps",
  be: "BeFood",
  befood: "BeFood",
  news: "News",
};

function displayLabel(value: string | null | undefined, labels: Record<string, string>, fallback: string) {
  const key = String(value || "").toLowerCase() || fallback;
  return labels[key] || key.replace(/_/g, " ");
}

function buildStats(alerts: AlertData[], getKey: (alert: AlertData) => string, labels: Record<string, string>): CountStat[] {
  const counts = alerts.reduce<Record<string, number>>((result, alert) => {
    const key = getKey(alert).toLowerCase() || "other";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  const total = Math.max(1, alerts.length);
  return Object.entries(counts)
    .map(([key, count]) => ({ key, label: displayLabel(key, labels, "other"), count, percent: Math.round((count / total) * 100) }))
    .sort((left, right) => right.count - left.count);
}

function normalizeSeverity(value?: string) {
  const severity = String(value || "").toLowerCase();
  if (severity === "critical" || severity === "urgent") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium" || severity === "normal") return "medium";
  return "low";
}

function slaLimitHours(alert: AlertData) {
  const severity = normalizeSeverity(alert.severity);
  if (severity === "critical") return 1;
  if (severity === "high") return 2;
  if (severity === "medium") return 4;
  return 8;
}

function isActive(alert: AlertData) {
  return !isTerminalAlert(alert);
}

function isOverdue(alert: AlertData) {
  if (!isActive(alert)) return false;
  // SLA starts when the item is ingested/classified, not when the customer
  // originally published the post or comment.
  const createdAt = new Date(alert.detected_at || alert.created_at).getTime();
  return Number.isFinite(createdAt) && Date.now() - createdAt > slaLimitHours(alert) * 36e5;
}

function formatTimeAgo(value?: string) {
  const time = new Date(value || "").getTime();
  if (!Number.isFinite(time)) return "chưa xác định";
  const hours = Math.max(0, (Date.now() - time) / 36e5);
  if (hours < 1) return "vừa xong";
  if (hours < 24) return `${Math.round(hours)} giờ trước`;
  return `${Math.round(hours / 24)} ngày trước`;
}

const cardClass = "rounded-xl border-[#DDD9E8] bg-white shadow-[0_8px_24px_rgba(30,31,36,0.06)]";

function KpiCard({ icon: Icon, label, value, tone, meta }: { icon: React.ElementType; label: string; value: string; tone: string; meta: string }) {
  return (
    <Card className={cn(cardClass, "min-h-[120px]")}>
      <CardContent className="flex h-full flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tone)}><Icon className="h-[18px] w-[18px]" /></div>
          <span className="text-[11px] font-bold uppercase text-[#6E6A7C]">{label}</span>
        </div>
        <div><div className="text-2xl font-black leading-none text-[#1A1B20]">{value}</div><div className="mt-2 text-xs font-medium text-[#6E6A7C]">{meta}</div></div>
      </CardContent>
    </Card>
  );
}

export function CrisisCommandCenter() {
  const { profile } = useAuth();
  const rawAlerts = useAlertStore((state) => state.rawAlerts);
  const filters = useDashboardStore((state) => state.filters);
  const isLoading = useAlertStore((state) => state.isLoading);
  const error = useAlertStore((state) => state.error);
  const fetchAlerts = useAlertStore((state) => state.fetchAlerts);
  const scopedBrandKey = getScopedBrandKey(profile);
  const periodDays = useMemo(() => {
    if (filters.time_range === "all") return 36_500;
    return getDiscussionPeriodDays({ timeRange: filters.time_range, customStartDate: filters.custom_start_date, customEndDate: filters.custom_end_date });
  }, [filters.custom_end_date, filters.custom_start_date, filters.time_range]);

  useEffect(() => {
    if (!profile) return;
    void fetchAlerts(scopedBrandKey, false);
  }, [fetchAlerts, profile, scopedBrandKey]);

  const alerts = useMemo(() => {
    // Every negative mention must enter the Crisis work queue. The crisis
    // classification is a priority signal, not an admission condition.
    return filterOperationalAlerts(rawAlerts.filter(
      (alert) => alert.sentiment === "negative",
    ), {
      profile,
      workspaceId: filters.workspace_id,
      platform: filters.platform,
      reviewWindowDays: periodDays,
      dateBasis: "created_at",
    });
  }, [filters.platform, filters.workspace_id, periodDays, profile, rawAlerts]);

  const data = useMemo(() => {
    const operationalMetrics = buildAlertOperationalMetrics(alerts);
    const skippedAlertKeys = new Set(rawAlerts.filter(isSkippedAlert).map(getAlertDeduplicationKey));
    const activeAlerts = alerts.filter((alert) => isActive(alert) && !skippedAlertKeys.has(getAlertDeduplicationKey(alert)));
    const criticalAlerts = activeAlerts.filter((alert) => alert.sentiment === "negative" && ["critical", "high"].includes(normalizeSeverity(alert.severity)));
    const overdueAlerts = activeAlerts.filter((alert) => !isSkippedAlert(alert) && isOverdue(alert));
    const unassignedAlerts = activeAlerts.filter((alert) => !isSkippedAlert(alert) && !alert.being_resolved_by);
    const resolvedAlerts = alerts.filter((alert) => !isActive(alert));
    const platformStats = buildStats(alerts, (alert) => alert.source || "other", PLATFORM_LABELS);
    const topicStats = buildStats(alerts, (alert) => alert.topic || "other", TOPIC_LABELS);
    const latestAlert = alerts.slice().sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];
    return { activeAlerts, criticalAlerts, overdueAlerts, unassignedAlerts, resolvedAlerts, platformStats, topicStats, latestAlert, operationalMetrics };
  }, [alerts, rawAlerts]);

  const totalNegativeHref = `/alerts?status=all&time=${encodeURIComponent(filters.time_range)}`;
  const highPriorityHref = `/alerts?status=all&time=${encodeURIComponent(filters.time_range)}&severity=high_priority`;
  const overdueHref = `/alerts?status=all&time=${encodeURIComponent(filters.time_range)}&sla=overdue`;
  const unassignedHref = `/alerts?status=pending&time=${encodeURIComponent(filters.time_range)}`;
  const alertFilterHref = (extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ scope: "crisis", status: "all", time: filters.time_range, ...extra });
    if (filters.workspace_id !== "all") params.set("brand", filters.workspace_id);
    if (filters.platform !== "all") params.set("source", filters.platform);
    if (filters.single_date) params.set("date", filters.single_date);
    if (filters.custom_start_date) params.set("start", filters.custom_start_date);
    if (filters.custom_end_date) params.set("end", filters.custom_end_date);
    return `/alerts?${params.toString()}`;
  };
  const topPlatform = data.platformStats[0];
  const topTopic = data.topicStats[0];
  return (
    <div data-tour="dashboard-insights" className="w-full space-y-6">
      <section data-tour="dashboard-insights-kpis" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: ShieldAlert, label: "Tổng tiêu cực", value: alerts.length, unit: "đề cập", hint: "Tất cả đề cập tiêu cực cần theo dõi trong kỳ", href: totalNegativeHref, tone: "border-[#E2DFFF] bg-[#F7F5FF] text-[#4234B6]", iconTone: "bg-[#E2DFFF] text-[#4234B6]" },
          { icon: AlertTriangle, label: "Ưu tiên cao", value: data.criticalAlerts.length, unit: "cảnh báo", hint: "Mức Critical hoặc Cao đang mở", href: highPriorityHref, tone: "border-[#FFE2C7] bg-[#FFF8F0] text-[#A14A00]", iconTone: "bg-[#FFE2C7] text-[#A14A00]" },
          { icon: Clock3, label: "Quá SLA", value: data.overdueAlerts.length, unit: "cảnh báo", hint: "Vượt thời gian phản hồi theo mức ưu tiên", href: overdueHref, tone: "border-[#FFDAD6] bg-[#FFF4F2] text-[#BA1A1A]", iconTone: "bg-[#FFDAD6] text-[#BA1A1A]" },
          { icon: UserRoundCheck, label: "Chưa có người xử lý", value: data.unassignedAlerts.length, unit: "cảnh báo", hint: "Cần phân công nhân viên", href: unassignedHref, tone: "border-[#D7F4E2] bg-[#F3FCF6] text-[#147A3F]", iconTone: "bg-[#D7F4E2] text-[#147A3F]" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.label} className={`rounded-[12px] border px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.tone}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-wide text-[#474554]">{item.label}</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="font-sans text-[30px] font-bold leading-none">{item.value}</span>
                    <span className="pb-1 text-[12px] font-semibold text-[#787585]">{item.unit}</span>
                  </div>
                  <p className="mt-2 text-[13px] font-medium text-[#474554]">{item.hint}</p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${item.iconTone}`}><Icon className="h-5 w-5" /></div>
              </div>
            </Link>
          );
        })}
      </section>

      <CrisisAnalyticsCharts alerts={alerts} periodDays={periodDays} />

      <section data-tour="dashboard-insights-breakdown" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className={cardClass}>
          <CardHeader className="px-5 pb-3 pt-5"><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-base font-black text-[#1A1B20]">Rủi ro theo nền tảng</CardTitle><p className="mt-1 text-xs font-medium text-[#6E6A7C]">Xác định kênh đang tập trung nhiều sự vụ nhất.</p></div><BarChart3 className="h-4 w-4 text-[#6E6A7C]" /></div></CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            {(data.platformStats.length ? data.platformStats.slice(0, 5) : [{ key: "unknown", label: "Chưa có dữ liệu", count: 0, percent: 0 }]).map((item) => (
              <div key={item.key} className="space-y-2"><div className="flex items-center justify-between gap-3 text-sm"><div className="flex min-w-0 items-center gap-2 font-bold text-[#1A1B20]"><PlatformLogo platform={item.key} size="xs" /><span className="truncate">{item.label}</span></div><span className="shrink-0 font-black text-[#BA1A1A]">{item.count} · {item.percent}%</span></div><div className="h-2 rounded-full bg-[#F1EEF8]"><div className="h-2 rounded-full bg-[#BA1A1A]" style={{ width: `${Math.max(item.percent, item.count ? 8 : 0)}%` }} /></div></div>
            ))}
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="px-5 pb-3 pt-5"><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-base font-black text-[#1A1B20]">Chủ đề cần xử lý</CardTitle><p className="mt-1 text-xs font-medium text-[#6E6A7C]">Nhóm nguyên nhân đang tác động nhiều nhất đến thương hiệu.</p></div><Activity className="h-4 w-4 text-[#6E6A7C]" /></div></CardHeader>
          <CardContent className="space-y-3 px-5 pb-5">
            {(data.topicStats.length ? data.topicStats.slice(0, 5) : [{ key: "other", label: "Chưa có dữ liệu", count: 0, percent: 0 }]).map((item, index) => (
              <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg border border-[#EEEAF6] bg-[#FBFAFE] px-3 py-3"><div className="min-w-0"><div className="text-sm font-black text-[#1A1B20]">{index + 1}. {item.label}</div><div className="mt-1 text-xs font-medium text-[#6E6A7C]">{item.percent}% tổng cảnh báo trong kỳ</div></div><Badge variant="outline" className="shrink-0 border-[#DDD9E8] bg-white text-[#BA1A1A]">{item.count}</Badge></div>
            ))}
          </CardContent>
        </Card>
      </section>

      {isLoading && alerts.length === 0 ? <div className="rounded-xl border border-[#DDD9E8] bg-white px-5 py-12 text-center text-sm font-medium text-[#6E6A7C]">Đang đồng bộ dữ liệu cảnh báo...</div> : <CrisisTable alerts={alerts} />}
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Dữ liệu realtime đang gián đoạn. Hệ thống đang hiển thị bản dữ liệu gần nhất: {error}</div>}
    </div>
  );
}
