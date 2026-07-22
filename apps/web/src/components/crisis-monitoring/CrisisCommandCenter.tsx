"use client";

import { useEffect, useMemo } from "react";
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
import { isTerminalAlert } from "@/lib/alertWorkflow";
import {
  buildAlertOperationalMetrics,
  filterOperationalAlerts,
} from "@/lib/operational-metrics";
import { getCalendarPeriodStartMs } from "@/lib/dashboard-display";
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
  const mentions = useDashboardStore((state) => state.mentions);
  const isLoading = useAlertStore((state) => state.isLoading);
  const error = useAlertStore((state) => state.error);
  const fetchAlerts = useAlertStore((state) => state.fetchAlerts);
  const scopedBrandKey = getScopedBrandKey(profile);

  useEffect(() => {
    if (!profile) return;
    void fetchAlerts(scopedBrandKey, false);
  }, [fetchAlerts, profile, scopedBrandKey]);

  const alerts = useMemo(() => {
    return filterOperationalAlerts(rawAlerts, {
      profile,
      crisisOnly: true,
      dateBasis: "created_at",
    });
  }, [profile, rawAlerts]);

  const negativeMentionsCount = useMemo(() => {
    const cutoff = getCalendarPeriodStartMs(30);
    const now = Date.now();
    return mentions.filter((mention) => {
      const time = new Date(mention.posted_at).getTime();
      return (
        mention.sentiment === "negative" &&
        Number.isFinite(time) &&
        time >= cutoff &&
        time <= now
      );
    }).length;
  }, [mentions]);

  const data = useMemo(() => {
    const operationalMetrics = buildAlertOperationalMetrics(alerts);
    const activeAlerts = alerts.filter(isActive);
    const criticalAlerts = activeAlerts.filter((alert) => ["critical", "high"].includes(normalizeSeverity(alert.severity)));
    const overdueAlerts = activeAlerts.filter(isOverdue);
    const unassignedAlerts = activeAlerts.filter((alert) => !alert.being_resolved_by);
    const resolvedAlerts = alerts.filter((alert) => !isActive(alert));
    const platformStats = buildStats(alerts, (alert) => alert.source || "other", PLATFORM_LABELS);
    const topicStats = buildStats(alerts, (alert) => alert.topic || "other", TOPIC_LABELS);
    const latestAlert = alerts.slice().sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];
    return { activeAlerts, criticalAlerts, overdueAlerts, unassignedAlerts, resolvedAlerts, platformStats, topicStats, latestAlert, operationalMetrics };
  }, [alerts]);

  const topPlatform = data.platformStats[0];
  const topTopic = data.topicStats[0];
  return (
    <div data-tour="dashboard-insights" className="w-full space-y-6">
      <Card data-tour="dashboard-insights-risk" className="rounded-xl border-[#DDD9E8] bg-white shadow-[0_8px_24px_rgba(30,31,36,0.06)]">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FDECEA] text-[#BA1A1A]"><ShieldAlert className="h-6 w-6" /></div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2"><h2 className="text-xl font-black text-[#1A1B20]">Tổng quan cảnh báo Crisis</h2><Badge variant="outline" className="border-[#DDD9E8] bg-[#F8F7FC] text-[#514D5E]">30 ngày</Badge></div>
                <p className="max-w-3xl text-sm font-medium leading-6 text-[#6E6A7C]">Hàng đợi Crisis gồm nội dung tiêu cực có mức khẩn cấp Trung bình/Cao và mọi tín hiệu được đánh dấu Khẩn cấp.</p>
              </div>
            </div>
            <div className="rounded-xl bg-[#F8F7FC] px-4 py-3 text-sm text-[#514D5E] xl:max-w-[360px]"><span className="font-black text-[#1A1B20]">Nổi bật:</span> {topPlatform?.label || "Chưa xác định"} · {topTopic?.label || "Chưa xác định"}<div className="mt-1 text-xs text-[#787585]">Dữ liệu mới nhất {formatTimeAgo(data.latestAlert?.created_at)}</div></div>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[#DDD9E8] bg-white p-5"><div className="text-xs font-black uppercase tracking-wide text-[#787585]">Bối cảnh · Đề cập tiêu cực</div><div className="mt-2 text-3xl font-black text-[#1A1B20]">{negativeMentionsCount}</div><div className="mt-2 text-xs font-medium text-[#6E6A7C]">Toàn bộ nội dung mang cảm xúc tiêu cực</div></div>
        <div className="rounded-xl border border-[#F1B7B2] bg-[#FFF8F7] p-5"><div className="text-xs font-black uppercase tracking-wide text-[#BA1A1A]">Hàng đợi · Cảnh báo Crisis</div><div className="mt-2 text-3xl font-black text-[#BA1A1A]">{alerts.length}</div><div className="mt-2 text-xs font-medium text-[#6E6A7C]">Nội dung thỏa quy tắc mức khẩn cấp</div></div>
        <div className="rounded-xl border border-[#DDD9E8] bg-white p-5"><div className="text-xs font-black uppercase tracking-wide text-[#5B4FCF]">Cần làm · Đang mở</div><div className="mt-2 text-3xl font-black text-[#4234B6]">{data.operationalMetrics.active}</div><div className="mt-2 text-xs font-medium text-[#6E6A7C]">Chưa kết thúc hoặc chưa liên hệ xong</div></div>
      </section>

      <section data-tour="dashboard-insights-kpis" className="space-y-3">
        <div><h3 className="text-base font-black text-[#1A1B20]">Tình trạng vận hành</h3><p className="mt-1 text-xs font-medium text-[#6E6A7C]">Các nhóm bên dưới có thể giao nhau; ví dụ một cảnh báo vừa ưu tiên cao, vừa quá hạn và chưa được giao.</p></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={AlertTriangle} label="Ưu tiên cao đang mở" value={String(data.criticalAlerts.length)} meta="Mức Critical hoặc Cao" tone="bg-amber-50 text-amber-700" />
          <KpiCard icon={Clock3} label="Quá hạn phản hồi" value={String(data.overdueAlerts.length)} meta="Vượt SLA theo mức ưu tiên" tone="bg-rose-50 text-rose-700" />
          <KpiCard icon={UserRoundCheck} label="Chưa có người xử lý" value={String(data.unassignedAlerts.length)} meta="Cần phân công nhân viên" tone="bg-indigo-50 text-indigo-700" />
          <KpiCard icon={CheckCircle2} label="Đã kết thúc" value={String(data.resolvedAlerts.length)} meta="Đã giải quyết hoặc liên hệ xong" tone="bg-emerald-50 text-emerald-700" />
        </div>
      </section>

      <CrisisAnalyticsCharts alerts={alerts} />

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
