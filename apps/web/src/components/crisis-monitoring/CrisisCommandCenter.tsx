"use client";

import React, { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Clock3,
  ListChecks,
  MessageSquareWarning,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { useDashboardStore } from "@/stores/dashboard.store";
import { getPersistedAlertStatus } from "@/lib/alertWorkflow";
import { calculateNegativityScore } from "@/lib/negativityScore";
import { cn } from "@/lib/utils";
import { CrisisTable, type CrisisTableAlert } from "./CrisisTable";
import { LiveCrisisFeed } from "./LiveCrisisFeed";

type AnyMention = {
  id?: string;
  platform?: string;
  sentiment?: string;
  topic?: string | null;
  content?: string | null;
  posted_at?: string;
  created_at?: string;
};

type CountStat = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

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

function topicLabel(topic?: string | null) {
  const key = String(topic || "other").toLowerCase();
  return TOPIC_LABELS[key] || key.replace(/_/g, " ") || "Khác";
}

function platformLabel(platform?: string | null) {
  const key = String(platform || "unknown").toLowerCase();
  return PLATFORM_LABELS[key] || key.replace(/_/g, " ") || "Nguồn khác";
}

function buildStats(items: AnyMention[], getKey: (item: AnyMention) => string, labeler: (key: string) => string): CountStat[] {
  const total = Math.max(items.length, 1);
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item) || "other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([key, count]) => ({
      key,
      label: labeler(key),
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function hoursSince(dateValue?: string) {
  const time = new Date(dateValue || "").getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, (Date.now() - time) / 36e5);
}

function formatTimeAgo(dateValue?: string) {
  const hours = hoursSince(dateValue);
  if (hours < 1) return "vừa xong";
  if (hours < 24) return `${Math.round(hours)} giờ trước`;
  return `${Math.round(hours / 24)} ngày trước`;
}

function buildRiskScore(negativeCount: number, criticalCount: number, overdueCount: number, negativeRatio: number) {
  if (negativeCount === 0 && criticalCount === 0) return 12;
  return Math.min(98, 32 + Math.min(negativeCount, 80) * 0.45 + criticalCount * 12 + overdueCount * 8 + negativeRatio * 0.25);
}

function normalizeCrisisSeverity(severity?: string) {
  const value = String(severity || "").toLowerCase();
  if (value === "critical" || value === "urgent") return "critical";
  if (value === "high") return "high";
  if (value === "medium" || value === "normal") return "medium";
  return "low";
}

function normalizeCrisisStatus(status?: string) {
  const value = String(status || "").toLowerCase();
  if (value === "resolved" || value === "contact_failed") return "resolved";
  if (value === "new" || value === "pending" || !value) return "new";
  return "acknowledged";
}

const kpiCardClass = "rounded-lg border-[#DDD9E8] bg-white shadow-[0_8px_24px_rgba(30,31,36,0.06)]";

function KpiCard({ icon: Icon, label, value, tone, meta }: { icon: React.ElementType; label: string; value: string; tone: string; meta: string }) {
  return (
    <Card className={cn(kpiCardClass, "min-h-[120px]")}> 
      <CardContent className="flex h-full flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tone)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <span className="text-[11px] font-bold uppercase text-[#6E6A7C]">{label}</span>
        </div>
        <div>
          <div className="text-2xl font-black leading-none text-[#1A1B20]">{value}</div>
          <div className="mt-2 text-xs font-medium text-[#6E6A7C]">{meta}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CrisisCommandCenter() {
  const dashboardMentions = useDashboardStore((state) => state.mentions);

  const mentions = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return dashboardMentions.filter((mention) => {
      const timestamp = new Date(mention.posted_at || mention.created_at || "").getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff;
    });
  }, [dashboardMentions]);

  const alerts = useMemo<CrisisTableAlert[]>(() => mentions
    .filter((mention) => mention.sentiment === "negative")
    .map((mention) => {
      const labels = (mention.labels || {}) as Record<string, any>;
      const negativity = calculateNegativityScore({
        sentiment: mention.sentiment,
        topic: mention.topic || "other",
        urgency: labels.urgency || "normal",
        likeCount: mention.star_count || 0,
        commentCount: 0,
        shareCount: 0,
        platform: mention.platform || "",
        text: mention.content || "",
      });
      const severity = labels.urgency || (negativity.score > 80 ? "high" : negativity.severity);

      return {
        id: mention.entity_key || mention.id,
        message: mention.content || "Sự vụ tiêu cực cần xử lý",
        severity: normalizeCrisisSeverity(severity),
        status: normalizeCrisisStatus(getPersistedAlertStatus(labels)),
        created_at: mention.posted_at || mention.created_at,
        assigned_to: labels.being_resolved_by || null,
      };
    }), [mentions]);

  const data = useMemo(() => {
    const negativeMentions = mentions.filter((mention) => mention.sentiment === "negative");
    const activeAlerts = alerts.filter((alert) => alert.status === "new" || alert.status === "acknowledged");
    const criticalAlerts = alerts.filter((alert) => alert.severity === "critical" || alert.severity === "high");
    const overdueAlerts = activeAlerts.filter((alert) => hoursSince(alert.created_at) > (alert.severity === "critical" ? 1 : 4));
    const unassignedAlerts = activeAlerts.filter((alert) => !alert.assigned_to).length;
    const platformStats = buildStats(negativeMentions, (mention) => String(mention.platform || "unknown"), platformLabel);
    const topicStats = buildStats(negativeMentions, (mention) => String(mention.topic || "other"), topicLabel);
    const negativeRatio = mentions.length ? Math.round((negativeMentions.length / mentions.length) * 100) : 0;
    const topMention = negativeMentions
      .slice()
      .sort((a, b) => new Date(b.posted_at || b.created_at || "").getTime() - new Date(a.posted_at || a.created_at || "").getTime())[0];
    const riskScore = Math.round(buildRiskScore(negativeMentions.length, criticalAlerts.length, overdueAlerts.length, negativeRatio));

    return {
      mentions,
      alerts,
      negativeMentions,
      activeAlerts,
      criticalAlerts,
      overdueAlerts,
      unassignedAlerts,
      platformStats,
      topicStats,
      negativeRatio,
      topMention,
      riskScore,
    };
  }, [mentions, alerts]);

  const topPlatform = data.platformStats[0];
  const topTopic = data.topicStats[0];
  const riskTone = data.riskScore >= 80 ? "CRITICAL" : data.riskScore >= 55 ? "HIGH" : "WATCH";
  const topSamples = data.negativeMentions.slice(0, 3);
  const recommendations = [
    `Ưu tiên xử lý nhóm ${topTopic?.label || "bình luận tiêu cực"} trước khi lan sang nguồn khác.`,
    `Giao owner cho ${data.unassignedAlerts || data.activeAlerts.length} sự vụ đang mở trong ca trực hiện tại.`,
    `Chuẩn bị phản hồi công khai cho ${topPlatform?.label || "kênh có nhiều đề cập"} và lưu bằng chứng nguồn.`,
  ];

  return (
    <div data-tour="dashboard-insights" className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <Card data-tour="dashboard-insights-risk" className="rounded-lg border-[#F1B7B2] bg-[#FFF7F6] shadow-[0_10px_30px_rgba(186,26,26,0.08)]">
          <CardContent className="p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#BA1A1A] text-white shadow-sm">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#BA1A1A] text-white hover:bg-[#BA1A1A]">AI ALERT</Badge>
                    <Badge variant="outline" className="border-[#F1B7B2] bg-white text-[#BA1A1A]">{riskTone}</Badge>
                  </div>
                  <h2 className="text-xl font-black leading-tight text-[#1A1B20]">
                    {data.negativeMentions.length > 0
                      ? `Phát hiện ${data.negativeMentions.length} đề cập tiêu cực cần theo dõi.`
                      : "Chưa có cụm rủi ro nổi bật trong bộ lọc hiện tại."}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#514D5E]">
                    Nguồn chính: <span className="font-bold text-[#1A1B20]">{topPlatform?.label || "Chưa xác định"}</span>. Chủ đề nổi bật: <span className="font-bold text-[#1A1B20]">{topTopic?.label || "Chưa xác định"}</span>. Cập nhật mới nhất {formatTimeAgo(data.topMention?.posted_at || data.topMention?.created_at)}.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 xl:w-[330px]">
                <div className="rounded-lg border border-[#F1B7B2] bg-white p-3 text-center">
                  <div className="text-2xl font-black text-[#BA1A1A]">{data.riskScore}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase text-[#6E6A7C]">Risk score</div>
                </div>
                <div className="rounded-lg border border-[#F1B7B2] bg-white p-3 text-center">
                  <div className="text-2xl font-black text-[#1A1B20]">{data.negativeRatio}%</div>
                  <div className="mt-1 text-[10px] font-bold uppercase text-[#6E6A7C]">Negative</div>
                </div>
                <div className="rounded-lg border border-[#F1B7B2] bg-white p-3 text-center">
                  <div className="text-2xl font-black text-[#BA1A1A]">{data.activeAlerts.length}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase text-[#6E6A7C]">Open</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <section data-tour="dashboard-insights-kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={MessageSquareWarning} label="Tiêu cực" value={String(data.negativeMentions.length)} meta="Bài viết và bình luận" tone="bg-red-50 text-[#BA1A1A]" />
          <KpiCard icon={AlertTriangle} label="Critical" value={String(data.criticalAlerts.length)} meta="Sự vụ ưu tiên cao" tone="bg-amber-50 text-amber-700" />
          <KpiCard icon={Clock3} label="Trễ SLA" value={String(data.overdueAlerts.length)} meta="Cần xử lý ngay" tone="bg-rose-50 text-rose-700" />
          <KpiCard icon={UserRoundCheck} label="Chưa giao" value={String(data.unassignedAlerts)} meta="Đang chờ owner" tone="bg-indigo-50 text-indigo-700" />
        </section>

        <section data-tour="dashboard-insights-breakdown" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className={kpiCardClass}>
            <CardHeader className="px-5 pb-3 pt-5">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-black uppercase text-[#1A1B20]">Rủi ro theo nền tảng</CardTitle>
                <BarChart3 className="h-4 w-4 text-[#6E6A7C]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              {(data.platformStats.length ? data.platformStats.slice(0, 5) : [{ key: "unknown", label: "Chưa có dữ liệu", count: 0, percent: 0 }]).map((item) => (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2 font-bold text-[#1A1B20]">
                      <PlatformLogo platform={item.key} size="xs" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className="shrink-0 font-black text-[#BA1A1A]">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F1EEF8]">
                    <div className="h-2 rounded-full bg-[#BA1A1A]" style={{ width: `${Math.max(item.percent, item.count ? 8 : 0)}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={kpiCardClass}>
            <CardHeader className="px-5 pb-3 pt-5">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-black uppercase text-[#1A1B20]">Chủ đề cần xử lý</CardTitle>
                <Activity className="h-4 w-4 text-[#6E6A7C]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              {(data.topicStats.length ? data.topicStats.slice(0, 5) : [{ key: "other", label: "Chưa có dữ liệu", count: 0, percent: 0 }]).map((item, index) => (
                <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg border border-[#EEEAF6] bg-[#FBFAFE] px-3 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-[#1A1B20]">{index + 1}. {item.label}</div>
                    <div className="mt-1 text-xs font-medium text-[#6E6A7C]">{item.percent}% trong nhóm tiêu cực</div>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-[#DDD9E8] bg-white text-[#BA1A1A]">{item.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card data-tour="dashboard-insights-actions" className={kpiCardClass}>
          <CardHeader className="px-5 pb-3 pt-5">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-black uppercase text-[#1A1B20]">AI đề xuất hành động</CardTitle>
              <ListChecks className="h-4 w-4 text-[#6E6A7C]" />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 px-5 pb-5 md:grid-cols-3">
            {recommendations.map((item, index) => (
              <div key={item} className="rounded-lg border border-[#EEEAF6] bg-white p-4">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F0FF] text-[#4234B6]">
                  <span className="text-sm font-black">{index + 1}</span>
                </div>
                <p className="text-sm font-bold leading-6 text-[#1A1B20]">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {topSamples.length > 0 && (
          <Card className={kpiCardClass}>
            <CardHeader className="px-5 pb-3 pt-5">
              <CardTitle className="text-sm font-black uppercase text-[#1A1B20]">Mẫu đề cập cần xem trước</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 px-5 pb-5 md:grid-cols-3">
              {topSamples.map((mention, index) => (
                <div key={mention.id || index} className="rounded-lg border border-[#EEEAF6] bg-[#FBFAFE] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#6E6A7C]">
                      <PlatformLogo platform={mention.platform || "unknown"} size="xs" />
                      <span>{platformLabel(mention.platform)}</span>
                    </div>
                    <Badge className="bg-red-50 text-[#BA1A1A] hover:bg-red-50">{topicLabel(mention.topic)}</Badge>
                  </div>
                  <p className="line-clamp-3 text-sm font-semibold leading-6 text-[#1A1B20]">{mention.content || "Không có nội dung hiển thị"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <CrisisTable alerts={data.alerts} mentions={data.mentions} />
      </div>

      <aside className="lg:col-span-4 lg:sticky lg:top-4">
        <div className="space-y-6">
          <Card className="rounded-lg border-[#DDD9E8] bg-white shadow-[0_8px_24px_rgba(30,31,36,0.06)]">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase text-[#6E6A7C]">Trạng thái xử lý</div>
                  <div className="mt-1 text-lg font-black text-[#1A1B20]">Ca trực hiện tại</div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-[#4234B6]" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#6E6A7C]">Sự vụ mở</span>
                  <span className="font-black text-[#1A1B20]">{data.activeAlerts.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#6E6A7C]">Chưa giao owner</span>
                  <span className="font-black text-[#BA1A1A]">{data.unassignedAlerts}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#6E6A7C]">Risk score</span>
                  <span className="font-black text-[#BA1A1A]">{data.riskScore}/100</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <LiveCrisisFeed mentions={data.mentions} />
        </div>
      </aside>
    </div>
  );
}
