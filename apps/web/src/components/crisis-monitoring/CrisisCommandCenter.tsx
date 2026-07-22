"use client";

import { useEffect, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock3,
  MessageSquareWarning,
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
import { cn } from "@/lib/utils";
import { useAlertStore, type AlertData } from "@/stores/alert.store";
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
  const createdAt = new Date(alert.created_at).getTime();
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
  const isLoading = useAlertStore((state) => state.isLoading);
  const error = useAlertStore((state) => state.error);
  const fetchAlerts = useAlertStore((state) => state.fetchAlerts);
  const scopedBrandKey = getScopedBrandKey(profile);

  useEffect(() => {
    if (!profile) return;
    void fetchAlerts(scopedBrandKey, false);
  }, [fetchAlerts, profile, scopedBrandKey]);

  const alerts = useMemo(() => {
    return filterOperationalAlerts(rawAlerts, { profile });
  }, [profile, rawAlerts]);

  const data = useMemo(() => {
    const operationalMetrics = buildAlertOperationalMetrics(alerts);
    const activeAlerts = alerts.filter(isActive);
    const criticalAlerts = activeAlerts.filter((alert) => ["critical", "high"].includes(normalizeSeverity(alert.severity)));
    const overdueAlerts = activeAlerts.filter(isOverdue);
    const unassignedAlerts = activeAlerts.filter((alert) => !alert.being_resolved_by);
    const platformStats = buildStats(alerts, (alert) => alert.source || "other", PLATFORM_LABELS);
    const topicStats = buildStats(alerts, (alert) => alert.topic || "other", TOPIC_LABELS);
    const latestAlert = alerts.slice().sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];
    const averageRisk = alerts.length ? alerts.reduce((total, alert) => total + Math.max(0, Math.min(100, alert.negativity_score || 0)), 0) / alerts.length : 0;
    const criticalShare = activeAlerts.length ? Math.round((criticalAlerts.length / activeAlerts.length) * 100) : 0;
    const riskScore = Math.round(Math.min(100, averageRisk * 0.7 + criticalShare * 0.3));
    return { activeAlerts, criticalAlerts, overdueAlerts, unassignedAlerts, platformStats, topicStats, latestAlert, criticalShare, riskScore, operationalMetrics };
  }, [alerts]);

  const topPlatform = data.platformStats[0];
  const topTopic = data.topicStats[0];
  const riskTone = data.riskScore >= 80 ? "CRITICAL" : data.riskScore >= 55 ? "HIGH" : "WATCH";

  return (
    <div data-tour="dashboard-insights" className="w-full space-y-6">
      <Card data-tour="dashboard-insights-risk" className="rounded-xl border-[#F1B7B2] bg-[#FFF7F6] shadow-[0_10px_30px_rgba(186,26,26,0.08)]">
        <CardContent className="p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#BA1A1A] text-white shadow-sm"><ShieldAlert className="h-6 w-6" /></div>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#BA1A1A] text-white hover:bg-[#BA1A1A]">CẢNH BÁO THƯƠNG HIỆU</Badge>
                  <Badge variant="outline" className="border-[#F1B7B2] bg-white text-[#BA1A1A]">{riskTone}</Badge>
                </div>
                <h2 className="text-xl font-black leading-tight text-[#1A1B20]">{alerts.length > 0 ? `${alerts.length} cảnh báo cần theo dõi trong 30 ngày.` : "Chưa có rủi ro nổi bật trong 30 ngày."}</h2>
                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#514D5E]">Nguồn chính: <span className="font-bold text-[#1A1B20]">{topPlatform?.label || "Chưa xác định"}</span>. Chủ đề nổi bật: <span className="font-bold text-[#1A1B20]">{topTopic?.label || "Chưa xác định"}</span>. Cập nhật mới nhất {formatTimeAgo(data.latestAlert?.created_at)}.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 xl:w-[360px]">
              <div className="rounded-lg border border-[#F1B7B2] bg-white p-3 text-center"><div className="text-2xl font-black text-[#BA1A1A]">{data.riskScore}</div><div className="mt-1 text-[10px] font-bold uppercase text-[#6E6A7C]">Risk score</div></div>
              <div className="rounded-lg border border-[#F1B7B2] bg-white p-3 text-center"><div className="text-2xl font-black text-[#1A1B20]">{data.criticalShare}%</div><div className="mt-1 text-[10px] font-bold uppercase text-[#6E6A7C]">Critical/Cao</div></div>
              <div className="rounded-lg border border-[#F1B7B2] bg-white p-3 text-center"><div className="text-2xl font-black text-[#BA1A1A]">{data.operationalMetrics.active}</div><div className="mt-1 text-[10px] font-bold uppercase text-[#6E6A7C]">Đang mở</div></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section data-tour="dashboard-insights-kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={MessageSquareWarning} label="Cảnh báo" value={String(alerts.length)} meta="Trong 30 ngày gần nhất" tone="bg-red-50 text-[#BA1A1A]" />
        <KpiCard icon={AlertTriangle} label="Critical / Cao" value={String(data.criticalAlerts.length)} meta="Cần ưu tiên kiểm tra" tone="bg-amber-50 text-amber-700" />
        <KpiCard icon={Clock3} label="Trễ SLA" value={String(data.overdueAlerts.length)} meta="Cần xử lý ngay" tone="bg-rose-50 text-rose-700" />
        <KpiCard icon={UserRoundCheck} label="Chưa giao" value={String(data.unassignedAlerts.length)} meta="Đang chờ người phụ trách" tone="bg-indigo-50 text-indigo-700" />
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
