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
import { canAlertBeVisibleToUser } from "@/lib/alert-visibility";
import { getScopedBrandKey } from "@/lib/brandScope";
import { getAlertWorkflowStatus } from "@/lib/alertWorkflow";
import { cn } from "@/lib/utils";
import { useAlertStore, type AlertData } from "@/stores/alert.store";
import { CrisisAnalyticsCharts } from "./CrisisAnalyticsCharts";
import { CrisisTable } from "./CrisisTable";
import { DEMO_PROFILE, DEMO_MOCK_ALERTS } from "@/lib/demo-mock-data";

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
  return !["resolved", "contact_failed"].includes(getAlertWorkflowStatus(alert));
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

const cardClass = "rounded-2xl border border-[#DDD9E8] dark:border-white/10 bg-white dark:bg-[#1A1B20] shadow-[0_12px_32px_rgba(30,31,36,0.06)] dark:shadow-none";

function KpiCard({ icon: Icon, label, value, tone, borderTone, meta }: { icon: React.ElementType; label: string; value: string; tone: string; borderTone?: string; meta: string }) {
  return (
    <Card className={cn(cardClass, "min-h-[125px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-t-4", borderTone || "border-t-indigo-500")}>
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shadow-sm", tone)}><Icon className="h-5 w-5" /></div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#6E6A7C] dark:text-gray-400">{label}</span>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-black leading-none text-[#1A1B20] dark:text-white">{value}</div>
          <div className="mt-2 text-xs font-semibold text-[#6E6A7C] dark:text-gray-400 flex items-center gap-1.5">{meta}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CrisisCommandCenter() {
  const { profile: realProfile } = useAuth();
  const isDemo = typeof window !== "undefined" && window.location.pathname.startsWith("/demo");
  const profile = realProfile || (isDemo ? DEMO_PROFILE : null);
  const rawAlertsStore = useAlertStore((state) => state.rawAlerts);
  const rawAlerts = rawAlertsStore.length === 0 && isDemo ? DEMO_MOCK_ALERTS : rawAlertsStore;
  const isLoading = useAlertStore((state) => state.isLoading);
  const error = useAlertStore((state) => state.error);
  const fetchAlerts = useAlertStore((state) => state.fetchAlerts);
  const scopedBrandKey = getScopedBrandKey(profile);

  useEffect(() => {
    if (!profile) return;
    void fetchAlerts(scopedBrandKey, false);
  }, [profile?.uid, scopedBrandKey]);

  const alerts = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return rawAlerts.filter((alert) => {
      const time = new Date(alert.created_at).getTime();
      if (!Number.isFinite(time) || time < cutoff) return false;
      if (isDemo) return true;
      return canAlertBeVisibleToUser(alert, profile);
    });
  }, [isDemo, profile, rawAlerts]);

  const data = useMemo(() => {
    const activeAlerts = alerts.filter(isActive);
    const criticalAlerts = alerts.filter((alert) => ["critical", "high"].includes(normalizeSeverity(alert.severity)));
    const overdueAlerts = activeAlerts.filter(isOverdue);
    const unassignedAlerts = activeAlerts.filter((alert) => !alert.being_resolved_by);
    const platformStats = buildStats(alerts, (alert) => alert.source || "other", PLATFORM_LABELS);
    const topicStats = buildStats(alerts, (alert) => alert.topic || "other", TOPIC_LABELS);
    const latestAlert = alerts.slice().sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];
    const averageRisk = alerts.length ? alerts.reduce((total, alert) => total + Math.max(0, Math.min(100, alert.negativity_score || 0)), 0) / alerts.length : 0;
    const criticalShare = alerts.length ? Math.round((criticalAlerts.length / alerts.length) * 100) : 0;
    const riskScore = Math.round(Math.min(100, averageRisk * 0.7 + criticalShare * 0.3));
    return { activeAlerts, criticalAlerts, overdueAlerts, unassignedAlerts, platformStats, topicStats, latestAlert, criticalShare, riskScore };
  }, [alerts]);

  const topPlatform = data.platformStats[0];
  const topTopic = data.topicStats[0];
  const riskTone = data.riskScore >= 80 ? "CRITICAL" : data.riskScore >= 55 ? "HIGH" : "WATCH";

  return (
    <div data-tour="dashboard-insights" className="w-full space-y-6">
      <Card data-tour="dashboard-insights-risk" className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-rose-500/5 to-amber-500/10 dark:bg-red-500/10 shadow-[0_12px_36px_rgba(225,29,72,0.12)]">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className="bg-red-600 text-white font-bold border-none shadow-sm flex items-center gap-1.5 px-3 py-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    CẢNH BÁO THƯƠNG HIỆU
                  </Badge>
                  <Badge variant="outline" className="border-red-400 bg-white/80 dark:bg-transparent font-extrabold text-red-600 px-2.5 py-0.5">{riskTone}</Badge>
                </div>
                <h2 className="text-2xl font-black leading-tight text-[#1A1B20] dark:text-white">
                  {alerts.length > 0 ? `${alerts.length} cảnh báo cần theo dõi trong 30 ngày.` : "Chưa có rủi ro nổi bật trong 30 ngày."}
                </h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#514D5E] dark:text-gray-300">
                  Nguồn chính: <span className="font-extrabold text-[#1A1B20] dark:text-white bg-white/60 dark:bg-white/10 px-2 py-0.5 rounded-md">{topPlatform?.label || "Chưa xác định"}</span>. 
                  Chủ đề nổi bật: <span className="font-extrabold text-[#1A1B20] dark:text-white bg-white/60 dark:bg-white/10 px-2 py-0.5 rounded-md">{topTopic?.label || "Chưa xác định"}</span>. 
                  Cập nhật mới nhất <span className="text-red-600 font-bold">{formatTimeAgo(data.latestAlert?.created_at)}</span>.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 xl:w-[380px]">
              <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-white/90 dark:bg-red-500/10 p-4 text-center shadow-sm">
                <div className="text-3xl font-black text-red-600 dark:text-red-400">{data.riskScore}</div>
                <div className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#6E6A7C] dark:text-gray-400">Risk Score</div>
              </div>
              <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-white/90 dark:bg-red-500/10 p-4 text-center shadow-sm">
                <div className="text-3xl font-black text-[#1A1B20] dark:text-white">{data.criticalShare}%</div>
                <div className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#6E6A7C] dark:text-gray-400">Critical/Cao</div>
              </div>
              <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-white/90 dark:bg-red-500/10 p-4 text-center shadow-sm">
                <div className="text-3xl font-black text-red-600 dark:text-red-400">{data.activeAlerts.length}</div>
                <div className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#6E6A7C] dark:text-gray-400">Đang mở</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section data-tour="dashboard-insights-kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={MessageSquareWarning} label="Cảnh báo" value={String(alerts.length)} meta="Trong 30 ngày gần nhất" tone="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" borderTone="border-t-red-500" />
        <KpiCard icon={AlertTriangle} label="Critical / Cao" value={String(data.criticalAlerts.length)} meta="Cần ưu tiên kiểm tra" tone="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" borderTone="border-t-amber-500" />
        <KpiCard icon={Clock3} label="Trễ SLA" value={String(data.overdueAlerts.length)} meta="Cần xử lý ngay" tone="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" borderTone="border-t-rose-500" />
        <KpiCard icon={UserRoundCheck} label="Chưa giao" value={String(data.unassignedAlerts.length)} meta="Đang chờ người phụ trách" tone="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" borderTone="border-t-indigo-500" />
      </section>

      <CrisisAnalyticsCharts alerts={alerts} />

      <section data-tour="dashboard-insights-breakdown" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className={cn(cardClass, "transition-all hover:shadow-[0_16px_40px_rgba(30,31,36,0.08)]")}>
          <CardHeader className="px-6 pb-3 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-black text-[#1A1B20] dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Rủi ro theo nền tảng
                </CardTitle>
                <p className="mt-1 text-xs font-medium text-[#6E6A7C] dark:text-gray-400">Xác định kênh đang tập trung nhiều sự vụ nhất.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {(data.platformStats.length ? data.platformStats.slice(0, 5) : [{ key: "unknown", label: "Chưa có dữ liệu", count: 0, percent: 0 }]).map((item) => (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm font-bold">
                  <div className="flex min-w-0 items-center gap-2.5 text-[#1A1B20] dark:text-gray-200">
                    <PlatformLogo platform={item.key} size="xs" />
                    <span className="truncate font-bold">{item.label}</span>
                  </div>
                  <span className="shrink-0 font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2.5 py-0.5 rounded-full text-xs">
                    {item.count} sự cố ({item.percent}%)
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[#F1EEF8] dark:bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-500" 
                    style={{ width: `${Math.max(item.percent, item.count ? 10 : 0)}%` }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={cn(cardClass, "transition-all hover:shadow-[0_16px_40px_rgba(30,31,36,0.08)]")}>
          <CardHeader className="px-6 pb-3 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-black text-[#1A1B20] dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
                  Chủ đề cần xử lý
                </CardTitle>
                <p className="mt-1 text-xs font-medium text-[#6E6A7C] dark:text-gray-400">Nhóm nguyên nhân đang tác động nhiều nhất đến thương hiệu.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {(data.topicStats.length ? data.topicStats.slice(0, 5) : [{ key: "other", label: "Chưa có dữ liệu", count: 0, percent: 0 }]).map((item, index) => (
              <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-[#EEEAF6] dark:border-white/10 bg-[#FBFAFE] dark:bg-white/5 p-3.5 transition-all hover:border-red-300 dark:hover:border-red-500/30 hover:bg-white dark:hover:bg-white/10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20 text-xs font-black text-red-600 dark:text-red-400">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#1A1B20] dark:text-gray-200">{item.label}</div>
                    <div className="mt-0.5 text-xs font-semibold text-[#6E6A7C] dark:text-gray-400">{item.percent}% tổng cảnh báo trong kỳ</div>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-extrabold px-3 py-1 text-xs">
                  {item.count} vụ
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {isLoading && alerts.length === 0 ? <div className="rounded-xl border border-[#DDD9E8] dark:border-white/10 bg-white dark:bg-[#1A1B20] px-5 py-12 text-center text-sm font-medium text-[#6E6A7C] dark:text-gray-400">Đang đồng bộ dữ liệu cảnh báo...</div> : <CrisisTable alerts={alerts} />}
      {error && <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-400">Dữ liệu realtime đang gián đoạn. Hệ thống đang hiển thị bản dữ liệu gần nhất: {error}</div>}
    </div>
  );
}
