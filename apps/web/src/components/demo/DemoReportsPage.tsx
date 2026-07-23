"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  Filter,
  Lightbulb,
  Table2,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react";

// ─── Hardcoded Demo Data ───────────────────────────────────────────────────────

const DEMO_KPIS = {
  completedTasks: 87,
  slaOnTimeRate: 82,
  pendingTasks: 46,
  overdueTasks: 14,
};

const DEMO_LEAD_KPIS = {
  total: 2296,
  contacted: 1688,
  conversionRate: 42,
  needResult: 13,
  slaBreached: 179,
};

const DEMO_CRISIS_KPIS = {
  total: 1665,
  resolved: 1401,
  critical: 6,
  high: 27,
  pendingApproval: 8,
  overdue: 11,
};

const DEMO_ATTENTION_ITEMS = [
  {
    key: "sla_overdue",
    tone: "danger" as const,
    title: "Lead trễ SLA",
    count: 130,
    description:
      "Các lead chưa được liên hệ sau ngày mở đã quá thời hạn xử lý. Cần ưu tiên gọi lại trong hôm nay.",
    href: "/demo/leads",
  },
  {
    key: "sla_warning",
    tone: "warn" as const,
    title: "Cảnh báo quá hạn",
    count: 124,
    description:
      "Case khủng hoảng cần giải quyết trước khi hết 36 giờ. Một số trường hợp đang ở mức Critical.",
    href: "/demo/alerts",
  },
  {
    key: "no_result",
    tone: "info" as const,
    title: "Chưa ghi kết quả",
    count: 13,
    description:
      "Lead đã liên hệ nhưng chưa cập nhật trạng thái chuyển đổi. Cần bổ sung dữ liệu.",
    href: "/demo/leads",
  },
];

const DEMO_RECOMMENDATIONS = [
  "Liên hệ lại ngay 130 Lead đã quá SLA — ưu tiên Hot Lead có điểm intent cao nhất trước.",
  "Liên hệ lại 33 Lead cần liên hệ mà chưa có phản hồi để không mất cơ hội chuyển đổi.",
  "Hoàn tất ghi nhận kết quả cho 13 Lead đang xử lý để đảm bảo dữ liệu báo cáo chính xác.",
];

const DEMO_LEAD_TREND = [
  { day: "16/07", created: 312, contacted: 248 },
  { day: "17/07", created: 287, contacted: 261 },
  { day: "18/07", created: 354, contacted: 290 },
  { day: "19/07", created: 298, contacted: 275 },
  { day: "20/07", created: 421, contacted: 308 },
  { day: "21/07", created: 389, contacted: 342 },
  { day: "22/07", created: 235, contacted: 164 },
];

const DEMO_CRISIS_TREND = [
  { day: "16/07", created: 218, resolved: 195 },
  { day: "17/07", created: 241, resolved: 228 },
  { day: "18/07", created: 265, resolved: 241 },
  { day: "19/07", created: 192, resolved: 187 },
  { day: "20/07", created: 312, resolved: 271 },
  { day: "21/07", created: 287, resolved: 249 },
  { day: "22/07", created: 150, resolved: 30 },
];

const DEMO_PRIORITY_ROWS = [
  {
    id: "L-2891",
    type: "lead" as const,
    typeLabel: "LEAD",
    title: "@Hana Marchiki",
    content: "Hỏi về giá gói Premium dịch vụ InsightFlow — khách đang so sánh với đối thủ cạnh tranh.",
    urgencyLevel: "urgent" as const,
    urgencyReasons: ["Trễ SLA", "Hot Lead chưa phản hồi"],
    href: "/demo/leads",
  },
  {
    id: "L-2890",
    type: "lead" as const,
    typeLabel: "LEAD",
    title: "@Minh Nguyễn",
    content: "Cần tư vấn Data Report — Khách liên quan trực tiếp đến Data team.",
    urgencyLevel: "urgent" as const,
    urgencyReasons: ["Trễ SLA", "Hot Lead chưa phản hồi"],
    href: "/demo/leads",
  },
  {
    id: "L-2887",
    type: "lead" as const,
    typeLabel: "LEAD",
    title: "@Em Nguyễn Vương",
    content:
      "Hỏi về voucher ăn uống nhà hàng; nhận đc 80k giảm giá lần mua trước trị giá mua tối thiểu #Highlands. Đang cân nhắc gói thường.",
    urgencyLevel: "attention" as const,
    urgencyReasons: ["Trễ SLA", "Hot Lead chưa phản hồi"],
    href: "/demo/leads",
  },
  {
    id: "L-2885",
    type: "lead" as const,
    typeLabel: "LEAD",
    title: "@Ngọc Chi Nguyễn",
    content: "Hỏi về giá gói Premium — Hot lead cần phản hồi ngay.",
    urgencyLevel: "attention" as const,
    urgencyReasons: ["Trễ SLA", "Hot Lead chưa phản hồi"],
    href: "/demo/leads",
  },
  {
    id: "A-1042",
    type: "crisis" as const,
    typeLabel: "KHỦNG HOẢNG",
    title: "@Highlands Coffee",
    content:
      "Nhiều CSKH: 1(YÊN CẦU SEO đang cực cho anh chi. Trong 5.000 bạn quan tâm Highlands, tran giảm số điểm Highlands Coffee Combo Moka 200g Tại quán tặng VPoints Chi cần chi...",
    urgencyLevel: "urgent" as const,
    urgencyReasons: ["Trễ SLA", "Hot Lead chưa phản hồi"],
    href: "/demo/alerts",
  },
  {
    id: "L-2880",
    type: "lead" as const,
    typeLabel: "LEAD",
    title: "@Triển Bảo",
    content: "giảm giá — Hot lead cần liên hệ sớm trong ngày.",
    urgencyLevel: "urgent" as const,
    urgencyReasons: ["Trễ SLA", "Hot Lead chưa phản hồi"],
    href: "/demo/leads",
  },
  {
    id: "L-2878",
    type: "lead" as const,
    typeLabel: "LEAD",
    title: "@Trần Thị Hương",
    content: "Khách hàng hỏi về combo thức uống mùa hè — đang trong kỳ khuyến mãi.",
    urgencyLevel: "attention" as const,
    urgencyReasons: ["Trễ SLA", "Hot Lead chưa phản hồi"],
    href: "/demo/leads",
  },
  {
    id: "L-2876",
    type: "lead" as const,
    typeLabel: "LEAD",
    title: "@Quyên Quyên",
    content: "Đã nói xin — Hot lead chưa được phân công nhân viên xử lý.",
    urgencyLevel: "urgent" as const,
    urgencyReasons: ["Trễ SLA", "Chưa phân công"],
    href: "/demo/leads",
  },
  {
    id: "A-1038",
    type: "crisis" as const,
    typeLabel: "KHỦNG HOẢNG",
    title: "@Highlands Coffee",
    content:
      "Hành vi đến 4084#508#8#Dùng, Địa điểm địa chỉ, cần dịch vụ, Đã 80 nâu, xuất, và khiếu nại, cho phép chủ nhận nặng chọn theo vùng, Đơn vị tại Tên công cụ công giá tham..",
    urgencyLevel: "attention" as const,
    urgencyReasons: ["Critical severity", "Chưa có phản hồi chính thức"],
    href: "/demo/alerts",
  },
  {
    id: "L-2871",
    type: "lead" as const,
    typeLabel: "LEAD",
    title: "@yhayenBB",
    content: "là ở hà — Case đang theo dõi, cần cập nhật trạng thái xử lý.",
    urgencyLevel: "normal" as const,
    urgencyReasons: ["Theo dõi theo thứ tự SLA"],
    href: "/demo/leads",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--color-border)] dark:border-white/10 bg-[var(--color-bg-surface)] dark:bg-white/5 px-3 text-sm font-semibold text-[var(--color-text-primary)] dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all";

function KpiCard({
  label,
  value,
  description,
  tone = "default",
  trend,
}: {
  label: string;
  value: React.ReactNode;
  description: string;
  tone?: "default" | "good" | "warn" | "danger";
  trend?: { value: number; label: string };
}) {
  const valueClass =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "danger"
          ? "text-red-600 dark:text-red-400"
          : "text-[var(--color-brand)] dark:text-[#9B8CFF]";
  const dotClass =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "danger"
          ? "bg-red-500"
          : "bg-[var(--color-brand)]";
  const bgGlow =
    tone === "good"
      ? "from-emerald-500/5"
      : tone === "warn"
        ? "from-amber-500/5"
        : tone === "danger"
          ? "from-red-500/5"
          : "from-[var(--color-brand)]/5";

  return (
    <article className={`min-w-0 bg-gradient-to-br ${bgGlow} to-transparent p-5 relative overflow-hidden`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-2 w-2 rounded-full ${dotClass} shadow-sm`} />
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] dark:text-gray-400">
          {label}
        </p>
      </div>
      <p className={`text-3xl font-black leading-none ${valueClass} tabular-nums`}>{value}</p>
      <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-[var(--color-text-secondary)] dark:text-gray-400">
        {description}
      </p>
      {trend && (
        <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${trend.value >= 0 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"}`}>
          {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
        </div>
      )}
    </article>
  );
}

function AttentionCard({
  item,
}: {
  item: (typeof DEMO_ATTENTION_ITEMS)[0];
}) {
  const toneClass =
    item.tone === "danger"
      ? "border-red-200 dark:border-red-500/25 bg-red-50/80 dark:bg-red-500/10 text-red-700 dark:text-red-400"
      : item.tone === "warn"
        ? "border-amber-200 dark:border-amber-500/25 bg-amber-50/80 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "border-indigo-200 dark:border-indigo-500/25 bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400";

  return (
    <a
      href={item.href}
      className={`group flex items-start gap-3 rounded-xl border p-3.5 transition-all hover:shadow-md hover:scale-[1.01] ${toneClass}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/90 dark:bg-white/10 shadow-sm">
        <AlertTriangle className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="font-extrabold text-sm text-[var(--color-text-primary)] dark:text-white">{item.title}</p>
          <strong className="text-2xl font-black tabular-nums">{item.count}</strong>
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)] dark:text-gray-400">
          {item.description}
        </p>
        <p className="mt-2 flex items-center gap-1 text-[11px] font-bold">
          Mở danh sách xử lý
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </a>
  );
}

function Metric({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] dark:border-white/5 px-4 py-3.5 last:border-b-0">
      <p className="text-xs font-bold text-[var(--color-text-secondary)] dark:text-gray-400">{label}</p>
      <p className={`text-lg font-black tabular-nums ${highlight ? "text-[var(--color-brand)] dark:text-[#9B8CFF]" : "text-[var(--color-text-primary)] dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function TrendBars({
  rows,
  primaryKey,
  secondaryKey,
  primaryLabel,
  secondaryLabel,
}: {
  rows: Array<Record<string, string | number>>;
  primaryKey: string;
  secondaryKey: string;
  primaryLabel: string;
  secondaryLabel: string;
}) {
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [Number(row[primaryKey] || 0), Number(row[secondaryKey] || 0)]),
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-5 text-xs font-bold text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-5 rounded-full bg-indigo-500 inline-block" />
          {primaryLabel}
        </span>
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-5 rounded-full bg-emerald-500 inline-block" />
          {secondaryLabel}
        </span>
      </div>
      <div className="grid min-h-44 grid-cols-7 items-end gap-3">
        {rows.map((row, index) => {
          const primary = Number(row[primaryKey] || 0);
          const secondary = Number(row[secondaryKey] || 0);
          return (
            <div key={index} className="flex h-full flex-col justify-end gap-1.5">
              <div className="flex h-36 items-end justify-center gap-1.5">
                <div
                  className="w-3.5 rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all"
                  style={{ height: `${Math.max(5, (primary / maxValue) * 100)}%` }}
                  title={`${primaryLabel}: ${primary}`}
                />
                <div
                  className="w-3.5 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all"
                  style={{ height: `${Math.max(5, (secondary / maxValue) * 100)}%` }}
                  title={`${secondaryLabel}: ${secondary}`}
                />
              </div>
              <span className="truncate text-center text-[10px] font-semibold text-[var(--color-text-muted)]">
                {row.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PriorityRow({ row }: { row: (typeof DEMO_PRIORITY_ROWS)[0] }) {
  const urgencyClass =
    row.urgencyLevel === "urgent"
      ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20"
      : row.urgencyLevel === "attention"
        ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
        : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-white/10";
  const urgencyLabel =
    row.urgencyLevel === "urgent" ? "Khẩn cấp" : row.urgencyLevel === "attention" ? "Cần chú ý" : "Theo dõi";

  return (
    <a
      href={row.href}
      className="block border-t border-[var(--color-border)] dark:border-white/5 px-5 py-3.5 first:border-t-0 hover:bg-[var(--color-bg-surface-high)] dark:hover:bg-white/[0.04] transition-colors group"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                row.type === "lead"
                  ? "bg-[var(--color-brand-subtle)] dark:bg-[#9B8CFF]/10 text-[var(--color-brand)] dark:text-[#9B8CFF]"
                  : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
            >
              {row.typeLabel}
            </span>
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] dark:text-gray-500">
              #{row.id}
            </span>
            <p className="truncate text-sm font-extrabold text-[var(--color-text-primary)] dark:text-white group-hover:text-[var(--color-brand)] transition-colors">
              {row.title}
            </p>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-secondary)] dark:text-gray-400">
            {row.content}
          </p>
          <p className="mt-2 text-[11px] font-semibold text-[var(--color-text-muted)] dark:text-gray-500">
            {row.urgencyReasons.join(" · ")}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${urgencyClass}`}>
          {urgencyLabel}
        </span>
      </div>
    </a>
  );
}

// ─── Main Demo Reports Page ────────────────────────────────────────────────────

export function DemoReportsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "lead" | "crisis">("all");
  const [activeTrendTab, setActiveTrendTab] = useState<"lead" | "crisis">("lead");
  const [showFilters, setShowFilters] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");

  const periodLabel =
    timeRange === "today"
      ? "Hôm nay"
      : timeRange === "7d"
        ? "7 ngày gần nhất"
        : timeRange === "30d"
          ? "30 ngày gần nhất"
          : "Toàn bộ dữ liệu";

  const visibleRows = DEMO_PRIORITY_ROWS.filter(
    (r) => activeTab === "all" || r.type === activeTab,
  );

  return (
    <main data-tour="reports-center" className="mx-auto w-full max-w-[1600px] space-y-5 p-4 md:p-6 min-[1100px]:p-8">
      {/* ── Header ── */}
      <header className="border-b border-[var(--color-border)] dark:border-white/10 pb-5">
        <div className="flex flex-col gap-4 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-[var(--color-text-primary)] dark:text-white">
                Tiềm năng & Khủng hoảng
              </h1>
              <span className="rounded-full bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 px-2.5 py-0.5 text-[10px] font-black text-[var(--color-brand)] dark:text-[#9B8CFF]">
                DEMO
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] dark:text-gray-400">
              Theo dõi hiệu suất, rủi ro và việc cần xử lý của toàn bộ đội ngũ trong kỳ báo cáo.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {/* Time filter */}
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`${inputClass} pl-9 sm:w-48`}
              >
                <option value="today">Hôm nay</option>
                <option value="7d">7 ngày gần nhất</option>
                <option value="30d">30 ngày gần nhất</option>
                <option value="all">Toàn bộ dữ liệu</option>
              </select>
            </div>

            {/* Advanced filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition ${
                showFilters
                  ? "border-[var(--color-brand)]/35 bg-[var(--color-brand-subtle)] text-[var(--color-brand)] dark:border-[#9B8CFF]/50 dark:bg-[#9B8CFF]/10 dark:text-[#9B8CFF]"
                  : "border-[var(--color-border)] dark:border-white/10 bg-[var(--color-bg-surface)] dark:bg-white/5 text-[var(--color-text-primary)] dark:text-white hover:bg-[var(--color-bg-surface-high)] dark:hover:bg-white/10"
              }`}
            >
              <Filter className="h-4 w-4" />
              Bộ lọc
            </button>

            {/* Export button */}
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] dark:bg-gradient-to-r dark:from-[#9B8CFF] dark:to-[#B4A8FF] px-4 text-sm font-bold text-white dark:text-[#1A1B20] shadow-sm transition hover:opacity-90 dark:hover:shadow-lg dark:hover:-translate-y-0.5"
              onClick={() => alert("Tính năng xuất Excel chỉ khả dụng sau khi đăng ký.")}
            >
              <Eye className="h-4 w-4" />
              Xem trước & xuất Excel
            </button>
          </div>
        </div>

        {/* Tab + Updated time */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-lg bg-[var(--color-bg-surface-high)] dark:bg-white/5 p-1 border border-transparent dark:border-white/10">
            {(["all", "lead", "crisis"] as const).map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => setActiveTab(scope)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === scope
                    ? "bg-[var(--color-bg-surface)] dark:bg-[#2A2B35] text-[var(--color-brand)] dark:text-white shadow-sm"
                    : "text-[var(--color-text-secondary)] dark:text-gray-400 hover:text-[var(--color-text-primary)] dark:hover:text-white"
                }`}
              >
                {scope === "all" ? "Tổng quan" : scope === "lead" ? "Khách hàng tiềm năng" : "Khủng hoảng"}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-semibold text-[var(--color-text-muted)] dark:text-gray-500">
            Cập nhật {new Date().toLocaleString("vi-VN")}
          </span>
        </div>
      </header>

      {/* ── Advanced Filters (collapsible) ── */}
      {showFilters && (
        <section className="rounded-2xl border border-[var(--color-border)] dark:border-white/10 bg-[var(--color-bg-surface)] dark:bg-[#1A1B20]/95 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-[var(--color-text-primary)] dark:text-white">Bộ lọc nâng cao</h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] dark:text-gray-400">
                Chỉ hiển thị bộ lọc trạng thái phù hợp với nghiệp vụ đang xem.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="text-sm font-bold text-[var(--color-brand)]"
            >
              Đặt lại
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 min-[1100px]:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs font-bold text-[var(--color-text-muted)]">SLA</span>
              <select className={inputClass}>
                <option>Tất cả SLA</option>
                <option>Trong/Đúng SLA</option>
                <option>Quá hạn</option>
                <option>Trễ SLA</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-[var(--color-text-muted)]">Mức ưu tiên</span>
              <select className={inputClass}>
                <option>Tất cả mức độ</option>
                <option>Hot Lead / Crisis cao</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-[var(--color-text-muted)]">Nguồn</span>
              <select className={inputClass}>
                <option>Tất cả nguồn</option>
                <option>Facebook</option>
                <option>TikTok</option>
                <option>Google Maps</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-[var(--color-text-muted)]">Trạng thái</span>
              <select className={inputClass}>
                <option>Tất cả trạng thái</option>
                <option>Mới</option>
                <option>Đang xử lý</option>
                <option>Đã chuyển đổi</option>
              </select>
            </label>
          </div>
        </section>
      )}

      {/* ── KPI Summary cards ── */}
      <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] dark:border-white/10 bg-[var(--color-bg-surface)] dark:bg-[#1A1B20]/90 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] dark:border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-brand)] dark:text-[#9B8CFF]" />
            <h2 className="text-sm font-extrabold text-[var(--color-text-primary)] dark:text-white">
              Tình trạng công việc
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-[var(--color-text-muted)] dark:text-gray-400">
            {periodLabel}
          </span>
        </div>
        <div className="grid gap-[1px] bg-[var(--color-border)] dark:bg-white/10 sm:grid-cols-2 min-[1100px]:grid-cols-4">
          <KpiCard
            label="Đã hoàn tất"
            value={DEMO_KPIS.completedTasks}
            description="Lead đã kết thúc và case đã giải quyết."
            tone="good"
            trend={{ value: 12, label: "so tuần trước" }}
          />
          <KpiCard
            label="Đúng SLA"
            value={`${DEMO_KPIS.slaOnTimeRate}%`}
            description="Tỷ lệ chung trên các việc có thể đánh giá SLA."
            trend={{ value: 5, label: "so tuần trước" }}
          />
          <KpiCard
            label="Còn mở"
            value={DEMO_KPIS.pendingTasks}
            description="Công việc vẫn cần tiếp tục xử lý."
            tone="warn"
            trend={{ value: -8, label: "so tuần trước" }}
          />
          <KpiCard
            label="Quá hạn"
            value={DEMO_KPIS.overdueTasks}
            description="Việc quá hạn hoặc đã hoàn tất trễ SLA."
            tone="danger"
            trend={{ value: -3, label: "so tuần trước" }}
          />
        </div>
      </section>

      {/* ── Attention + Recommendations ── */}
      <div className="grid gap-4 min-[1100px]:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        {/* Attention items */}
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] dark:border-white/10 bg-[var(--color-bg-surface)] dark:bg-[#1A1B20]/90 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] dark:border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-sm font-extrabold text-[var(--color-text-primary)] dark:text-white">
                  Việc cần xử lý trước
                </h2>
                <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)] dark:text-gray-400">
                  Ưu tiên theo rủi ro và thời hạn xử lý.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-red-50 dark:bg-red-500/10 px-3 py-1 text-xs font-black text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
              {DEMO_ATTENTION_ITEMS.reduce((t, i) => t + i.count, 0)}
            </span>
          </div>
          <div className="space-y-2.5 p-3.5">
            {DEMO_ATTENTION_ITEMS.map((item) => (
              <AttentionCard key={item.key} item={item} />
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] dark:border-white/10 bg-[var(--color-bg-surface)] dark:bg-[#1A1B20]/90 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] dark:border-white/10 px-5 py-4">
            <Lightbulb className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <div>
              <h2 className="text-sm font-extrabold text-[var(--color-text-primary)] dark:text-white">
                Hành động đề xuất
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)] dark:text-gray-400">
                Các bước nên thực hiện trong kỳ.
              </p>
            </div>
          </div>
          <div className="divide-y divide-[var(--color-border)] dark:divide-white/5 px-4">
            {DEMO_RECOMMENDATIONS.map((rec, i) => (
              <div key={i} className="flex gap-3 py-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] dark:bg-[#9B8CFF]/10 text-[11px] font-black text-[var(--color-brand)] dark:text-[#9B8CFF]">
                  {i + 1}
                </span>
                <p className="text-xs font-semibold leading-5 text-[var(--color-text-secondary)] dark:text-gray-300">
                  {rec}
                </p>
              </div>
            ))}
          </div>

          {/* Summary stats mini */}
          <div className="border-t border-[var(--color-border)] dark:border-white/10 mx-4 mt-2 pt-3 pb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[var(--color-bg-surface-high)] dark:bg-white/5 p-3 text-center">
              <Users className="h-4 w-4 mx-auto mb-1 text-indigo-500" />
              <p className="text-xl font-black text-[var(--color-text-primary)] dark:text-white">2,296</p>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)]">Tổng Lead</p>
            </div>
            <div className="rounded-xl bg-[var(--color-bg-surface-high)] dark:bg-white/5 p-3 text-center">
              <Zap className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-xl font-black text-[var(--color-text-primary)] dark:text-white">1,665</p>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)]">Tổng Case</p>
            </div>
          </div>
        </section>
      </div>

      {/* ── Trend Chart ── */}
      <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] dark:border-white/10 bg-[var(--color-bg-surface)] dark:bg-[#1A1B20]/90 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] dark:border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--color-brand)] dark:text-[#9B8CFF]" />
            <div>
              <h2 className="text-sm font-extrabold text-[var(--color-text-primary)] dark:text-white">
                Kết quả và xu hướng
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)] dark:text-gray-400">
                So sánh khối lượng phát sinh với kết quả xử lý.
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit rounded-lg bg-[var(--color-bg-surface-high)] dark:bg-white/5 p-1 border border-transparent dark:border-white/10">
            {(["lead", "crisis"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTrendTab(tab)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  activeTrendTab === tab
                    ? "bg-[var(--color-bg-surface)] dark:bg-[#2A2B35] text-[var(--color-brand)] dark:text-white shadow-sm"
                    : "text-[var(--color-text-secondary)] dark:text-gray-400 hover:text-[var(--color-text-primary)] dark:hover:text-white"
                }`}
              >
                {tab === "lead" ? "Khách hàng tiềm năng" : "Khủng hoảng"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid min-[1100px]:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 p-5 min-[1100px]:border-r min-[1100px]:border-[var(--color-border)] dark:min-[1100px]:border-white/10">
            <h3 className="mb-1 text-xs font-extrabold text-[var(--color-text-primary)] dark:text-white">
              Xu hướng 7 ngày
            </h3>
            <p className="mb-5 text-[11px] text-[var(--color-text-secondary)] dark:text-gray-400">
              Dữ liệu phát sinh và kết quả hoàn thành theo ngày.
            </p>
            {activeTrendTab === "lead" ? (
              <TrendBars
                rows={DEMO_LEAD_TREND}
                primaryKey="created"
                secondaryKey="contacted"
                primaryLabel="Lead mới"
                secondaryLabel="Đã liên hệ"
              />
            ) : (
              <TrendBars
                rows={DEMO_CRISIS_TREND}
                primaryKey="created"
                secondaryKey="resolved"
                primaryLabel="Case mới"
                secondaryLabel="Đã giải quyết"
              />
            )}
          </div>
          <aside className="border-t border-[var(--color-border)] dark:border-t-white/10 bg-[var(--color-bg-surface-high)]/45 dark:bg-black/20 min-[1100px]:border-t-0 pt-2 pb-2">
            <p className="px-4 pb-2 pt-3 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] dark:text-gray-500">
              Chỉ số nghiệp vụ
            </p>
            {activeTrendTab === "lead" ? (
              <>
                <Metric
                  label="Đã liên hệ"
                  value={`${DEMO_LEAD_KPIS.contacted}/${DEMO_LEAD_KPIS.total}`}
                  highlight
                />
                <Metric label="Tỷ lệ chuyển đổi" value={`${DEMO_LEAD_KPIS.conversionRate}%`} highlight />
                <Metric label="Chưa ghi kết quả" value={DEMO_LEAD_KPIS.needResult} />
                <Metric label="Trễ SLA" value={DEMO_LEAD_KPIS.slaBreached} />
              </>
            ) : (
              <>
                <Metric
                  label="Đã giải quyết"
                  value={`${DEMO_CRISIS_KPIS.resolved}/${DEMO_CRISIS_KPIS.total}`}
                  highlight
                />
                <Metric label="Critical/High" value={DEMO_CRISIS_KPIS.critical + DEMO_CRISIS_KPIS.high} />
                <Metric label="Chờ duyệt" value={DEMO_CRISIS_KPIS.pendingApproval} />
                <Metric label="Quá hạn" value={DEMO_CRISIS_KPIS.overdue} />
              </>
            )}
          </aside>
        </div>
      </section>

      {/* ── Priority Table ── */}
      <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] dark:border-white/10 bg-[var(--color-bg-surface)] dark:bg-[#1A1B20]/90 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] dark:border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 text-[var(--color-brand)] dark:text-[#9B8CFF]" />
            <div>
              <h2 className="text-sm font-extrabold text-[var(--color-text-primary)] dark:text-white">
                Chi tiết công việc ưu tiên
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)] dark:text-gray-400">
                Mở từng mục để xử lý hoặc đối soát dữ liệu.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTab !== "crisis" && (
              <a
                href="/demo/leads"
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)]"
              >
                Khách hàng <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
            {activeTab !== "lead" && (
              <a
                href="/demo/alerts"
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)]"
              >
                Cảnh báo <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
        <div>
          {visibleRows.map((row) => (
            <PriorityRow key={`${row.type}-${row.id}`} row={row} />
          ))}
        </div>
      </section>
    </main>
  );
}
