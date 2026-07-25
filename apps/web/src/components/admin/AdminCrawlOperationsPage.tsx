"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Clock3,
  Coffee,
  Database,
  Filter,
  Globe2,
  MapPinned,
  MessageCircle,
  Music2,
  Newspaper,
  PauseCircle,
  Play,
  RefreshCw,
  Search,
  ThumbsUp,
  Trash2,
  Utensils,
  XCircle,
} from "lucide-react";
import { auth } from "@/lib/firebase";

type Run = Record<string, any> & { id: string };
type RunEvent = Record<string, any> & { id: string };
type RunTab = "production" | "trial";
type ProductionControl = {
  paused: boolean;
  updatedAt?: string;
  updatedBy?: string;
  reason?: string;
};

const PAGE_SIZE = 6;

const PLATFORM_OPTIONS = [
  ["facebook", "Facebook"],
  ["threads", "Threads"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
  ["google_maps", "Google Maps"],
  ["befood", "BeFood"],
  ["news_html", "Tin tức"],
  ["website", "Website"],
] as const;

const STATUS_OPTIONS = [
  ["all", "Tất cả trạng thái"],
  ["active", "Đang hoạt động"],
  ["queued", "Đang xếp hàng"],
  ["waiting_resource", "Chờ tài nguyên"],
  ["running", "Đang thu thập"],
  ["labeling", "Đang gán nhãn"],
  ["syncing", "Đang đồng bộ"],
  ["completed", "Hoàn tất"],
  ["partial", "Hoàn tất một phần"],
  ["failed", "Thất bại"],
  ["cancelled", "Đã hủy"],
] as const;

const ACTIVE_RUN_STATUSES = new Set([
  "queued",
  "waiting_resource",
  "running",
  "labeling",
  "syncing",
]);

const STATUS_LABELS: Record<string, string> = {
  queued: "Đang xếp hàng",
  waiting_resource: "Chờ tài nguyên",
  running: "Đang thu thập",
  labeling: "Đang gán nhãn",
  syncing: "Đang đồng bộ",
  completed: "Hoàn tất",
  partial: "Hoàn tất một phần",
  failed: "Thất bại",
  cancelled: "Đã hủy",
};

const PHASE_LABELS: Record<string, string> = {
  queued: "đang xếp hàng",
  starting: "đang khởi động",
  crawl: "đang thu thập",
  completed: "đã hoàn tất",
  failed: "thất bại",
  import_failed: "nhập dữ liệu thất bại",
  labeling: "đang gán nhãn",
  syncing: "đang đồng bộ",
  publish_failed: "xuất bản thất bại",
  skipped: "đã bỏ qua",
  finished: "đã kết thúc",
  worker_error: "worker gặp lỗi",
  worker_stopped: "worker đã dừng",
};

const statusStyle: Record<string, string> = {
  queued: "bg-slate-100 text-slate-700",
  waiting_resource: "bg-amber-100 text-amber-700",
  running: "bg-blue-100 text-blue-700",
  labeling: "bg-violet-100 text-violet-700",
  syncing: "bg-cyan-100 text-cyan-700",
  completed: "bg-emerald-100 text-emerald-700",
  partial: "bg-orange-100 text-orange-700",
  failed: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-200 text-slate-700",
};

const statusDotStyle: Record<string, string> = {
  queued: "bg-slate-400",
  waiting_resource: "bg-amber-500",
  running: "bg-blue-500",
  labeling: "bg-violet-500",
  syncing: "bg-cyan-500",
  completed: "bg-emerald-500",
  partial: "bg-orange-500",
  failed: "bg-rose-500",
  cancelled: "bg-slate-500",
};

function dateText(value: any) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString("vi-VN")
    : "—";
}

function platformLabel(platform: string) {
  return PLATFORM_OPTIONS.find(([value]) => value === platform)?.[1] || platform;
}

function PlatformIcon({ platform, size = 15 }: { platform?: string; size?: number }) {
  const props = { size, strokeWidth: 2 };
  if (platform === "facebook") return <ThumbsUp {...props} />;
  if (platform === "threads") return <MessageCircle {...props} />;
  if (platform === "tiktok") return <Music2 {...props} />;
  if (platform === "youtube") return <Play {...props} />;
  if (platform === "google_maps") return <MapPinned {...props} />;
  if (platform === "befood") return <Utensils {...props} />;
  if (platform === "news_html") return <Newspaper {...props} />;
  if (platform === "website") return <Globe2 {...props} />;
  return <Database {...props} />;
}

function StatusIcon({ status, size = 18 }: { status: string; size?: number }) {
  if (status === "failed") return <XCircle size={size} />;
  if (status === "completed") return <CheckCircle2 size={size} />;
  if (status === "partial") return <AlertTriangle size={size} />;
  if (status === "running" || status === "labeling" || status === "syncing") {
    return <Activity size={size} />;
  }
  if (status === "cancelled") return <XCircle size={size} />;
  if (status === "waiting_resource") return <CircleDashed size={size} />;
  return <Clock3 size={size} />;
}

export default function AdminCrawlOperationsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [controlBusy, setControlBusy] = useState(false);
  const [productionControl, setProductionControl] = useState<ProductionControl>({ paused: false });
  const [retryingPlatform, setRetryingPlatform] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RunTab>("trial");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);

  const loadRuns = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/crawl-runs?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      const next = (Array.isArray(payload.runs) ? payload.runs : [])
        .filter((run: Run) => run.metadata?.controlScope !== "production");
      setRuns(next);
      setErrorMessage("");
    } catch (error) {
      console.error("[Crawl operations] load runs:", error);
      setErrorMessage(error instanceof Error ? error.message : "Không tải được danh sách phiên cào.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCrawlControl = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/crawl-control", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setProductionControl({
        paused: payload.production?.paused === true,
        updatedAt: payload.production?.updatedAt,
        updatedBy: payload.production?.updatedBy,
        reason: payload.production?.reason,
      });
    } catch (error) {
      console.error("[Crawl operations] load control:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        void loadRuns();
        void loadCrawlControl();
      }
      else {
        setLoading(false);
        setErrorMessage("Phiên đăng nhập chưa sẵn sàng.");
      }
    });
    const timer = window.setInterval(() => {
      void loadRuns();
      void loadCrawlControl();
    }, 60000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [loadCrawlControl, loadRuns]);

  const filteredRuns = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase("vi");
    return runs.filter((run) => {
      const runTab: RunTab = run.runType === "trial" ? "trial" : "production";
      if (runTab !== activeTab) return false;
      if (
        statusFilter === "active"
          ? !ACTIVE_RUN_STATUSES.has(run.status)
          : statusFilter !== "all" && run.status !== statusFilter
      ) {
        return false;
      }
      if (platformFilter !== "all" && !(run.platforms || []).includes(platformFilter)) {
        return false;
      }
      if (!normalizedSearch) return true;
      const searchable = [
        run.id,
        run.consultationId,
        run.lastMessage,
        run.currentPlatform,
        run.metadata?.brandName,
        run.metadata?.company,
        ...(run.platforms || []),
      ].filter(Boolean).join(" ").toLocaleLowerCase("vi");
      return searchable.includes(normalizedSearch);
    });
  }, [activeTab, platformFilter, runs, searchText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / PAGE_SIZE));
  const visibleRuns = useMemo(
    () => filteredRuns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRuns, page],
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, platformFilter, searchText, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (filteredRuns.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!filteredRuns.some((run) => run.id === selectedId)) {
      setSelectedId(filteredRuns[0].id);
    }
  }, [filteredRuns, selectedId]);

  useEffect(() => {
    if (visibleRuns.length > 0 && !visibleRuns.some((run) => run.id === selectedId)) {
      setSelectedId(visibleRuns[0].id);
    }
  }, [selectedId, visibleRuns]);

  const selectedStatus = runs.find((run) => run.id === selectedId)?.status;

  useEffect(() => {
    if (!selectedId) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    const loadDetail = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch(
          `/api/admin/crawl-runs/${encodeURIComponent(selectedId)}?eventLimit=30`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
        if (cancelled) return;
        setEvents(
          Array.isArray(payload.events)
            ? payload.events.filter((event: RunEvent) => event.eventType !== "heartbeat")
            : [],
        );
        if (payload.run) {
          setRuns((current) =>
            current.map((run) => (run.id === payload.run.id ? payload.run : run)),
          );
        }
        setErrorMessage("");
      } catch (error) {
        if (cancelled) return;
        console.error("[Crawl operations] load detail:", error);
        setErrorMessage(error instanceof Error ? error.message : "Không tải được nhật ký phiên cào.");
      }
    };
    void loadDetail();
    const timer = ACTIVE_RUN_STATUSES.has(selectedStatus || "")
      ? window.setInterval(() => void loadDetail(), 30000)
      : null;
    return () => {
      cancelled = true;
      if (timer !== null) window.clearInterval(timer);
    };
  }, [selectedId, selectedStatus]);

  const selected = useMemo(
    () => runs.find((run) => run.id === selectedId) || null,
    [runs, selectedId],
  );

  const counts = useMemo(() => ({
    production: runs.filter((run) => run.runType !== "trial").length,
    trial: runs.filter((run) => run.runType === "trial").length,
    active: runs.filter((run) => ACTIVE_RUN_STATUSES.has(run.status)).length,
  }), [runs]);

  const canRetrySelectedPlatform = Boolean(
    selected
    && selected.runType === "trial"
    && !ACTIVE_RUN_STATUSES.has(selected.status)
  );

  const deleteRun = async (runId?: string) => {
    const targetId = runId || selected?.id;
    if (!targetId) return;
    const target = runs.find((r) => r.id === targetId) || selected;
    const targetLabel = target?.metadata?.brandName || target?.metadata?.company || targetId;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phiên cào "${targetLabel}" (${targetId.slice(0, 8)}) khỏi danh sách?`)) return;

    setActionBusy(true);
    setErrorMessage("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn.");
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/crawl-runs/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setRuns((current) => current.filter((run) => run.id !== targetId));
      if (selectedId === targetId) {
        setSelectedId(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể xóa phiên cào.");
    } finally {
      setActionBusy(false);
    }
  };

  const retryPlatform = async (platform: string) => {
    if (!selected || selected.runType !== "trial" || ACTIVE_RUN_STATUSES.has(selected.status)) return;
    const label = platformLabel(platform);
    if (!window.confirm(`Cào lại riêng ${label} cho phiên trial này? Các nền tảng đã xong sẽ được giữ nguyên.`)) return;
    setRetryingPlatform(platform);
    setErrorMessage("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn.");
      const token = await user.getIdToken();
      const response = await fetch(
        `/api/admin/crawl-runs/${encodeURIComponent(selected.id)}/retry-platform`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ platform }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      await loadRuns();
      if (payload.runId) setSelectedId(payload.runId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể xếp hàng cào lại nền tảng.");
    } finally {
      setRetryingPlatform(null);
    }
  };

  const setProductionPaused = async (paused: boolean) => {
    setControlBusy(true);
    setErrorMessage("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/crawl-control", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paused,
          reason: paused
            ? "Tạm dừng production để ưu tiên trial hoặc thao tác thủ công."
            : "Tiếp tục production sau khi xử lý xong.",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setProductionControl({
        paused: payload.production?.paused === true,
        updatedAt: payload.production?.updatedAt,
        updatedBy: payload.production?.updatedBy,
        reason: payload.production?.reason,
      });
      await loadRuns();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể cập nhật trạng thái tạm dừng production.");
    } finally {
      setControlBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-6 text-[var(--color-foreground)] sm:px-6 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand)]/10 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-brand)] shadow-[0_4px_14px_rgba(76,66,190,0.08)] backdrop-blur-sm">
              <Activity size={12} strokeWidth={2.4} />
              <span>Vận hành hệ thống</span>
            </div>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Tiến trình cào dữ liệu</h1>
            <p className="mt-1 text-sm opacity-70">
              Theo dõi các phiên production và dùng thử theo thời gian thực.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-tour="ops-pause-production"
              onClick={() => void setProductionPaused(!productionControl.paused)}
              disabled={controlBusy}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold shadow-sm transition disabled:cursor-wait disabled:opacity-60 ${
                productionControl.paused
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
              title={productionControl.paused
                ? "Cho phép production chạy lại từ lượt kế tiếp"
                : "Không kill tiến trình hiện tại; chỉ dừng các lượt production kế tiếp"}
            >
              {productionControl.paused ? <Play size={15} /> : <PauseCircle size={15} />}
              {productionControl.paused ? "Tiếp tục production" : "Tạm dừng production"}
            </button>
            {productionControl.paused && (
              <div className="rounded-full border border-amber-100 bg-white/80 px-4 py-2 text-xs font-semibold text-amber-700 shadow-sm">
                Production đang tạm dừng sau bước hiện tại
              </div>
            )}
            <div className="rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold shadow-sm">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]" />
              {counts.active} phiên đang hoạt động
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold text-emerald-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
              Tự cập nhật sau 30–60 giây
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertTriangle className="mr-2 inline" size={16} />
            {errorMessage}
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(390px,0.85fr)_minmax(0,1.5fr)]">
          <aside className="rounded-3xl border bg-white/80 p-4 shadow-sm lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-hidden">
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                data-tour="ops-production-tab"
                onClick={() => setActiveTab("production")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  activeTab === "production"
                    ? "bg-white text-[var(--color-brand)] shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Database size={16} />
                Production
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                  {counts.production}
                </span>
              </button>
              <button
                type="button"
                data-tour="ops-trial-tab"
                onClick={() => setActiveTab("trial")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  activeTab === "trial"
                    ? "bg-white text-[var(--color-brand)] shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Coffee size={16} />
                Dùng thử
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                  {counts.trial}
                </span>
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <label className="relative block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Tìm thương hiệu, mã phiên..."
                  className="h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[var(--color-brand)]"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select
                    data-tour="ops-status-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border bg-white pl-8 pr-2 text-xs font-semibold outline-none focus:border-[var(--color-brand)]"
                  >
                    {STATUS_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <select
                  data-tour="ops-platform-filter"
                  value={platformFilter}
                  onChange={(event) => setPlatformFilter(event.target.value)}
                  className="h-10 w-full rounded-xl border bg-white px-2 text-xs font-semibold outline-none focus:border-[var(--color-brand)]"
                >
                  <option value="all">Tất cả nền tảng</option>
                  {PLATFORM_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div data-tour="ops-task-list" className="mt-4 space-y-3 lg:max-h-[calc(100vh-350px)] lg:overflow-y-auto lg:pr-1">
              {loading && runs.length === 0 && (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm opacity-60">
                  Đang tải các phiên cào…
                </div>
              )}
              {!loading && filteredRuns.length === 0 && (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm opacity-60">
                  Không tìm thấy phiên cào phù hợp.
                </div>
              )}
              {visibleRuns.map((run) => {
                const ratio = run.progressTotal
                  ? Math.min(100, Math.round(((run.progressCurrent || 0) / run.progressTotal) * 100))
                  : 0;
                const currentPlatform = run.currentPlatform || run.platforms?.[0];
                const isSelected = selectedId === run.id;
                return (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => setSelectedId(run.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[var(--color-brand)] bg-[var(--color-brand)]/[0.035] shadow-md"
                        : "bg-white hover:border-[var(--color-brand)]/40 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                          ACTIVE_RUN_STATUSES.has(run.status)
                            ? "bg-blue-50 text-blue-600"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          <StatusIcon status={run.status} size={17} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {String(run.metadata?.brandName || run.metadata?.company || (
                              run.runType === "trial" ? "Phiên dùng thử" : "Phiên production"
                            ))}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {run.runType === "trial" ? "Dùng thử" : "Production"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold ${
                          statusStyle[run.status] || statusStyle.queued
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDotStyle[run.status] || statusDotStyle.queued}`} />
                          {STATUS_LABELS[run.status] || run.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteRun(run.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Xóa phiên cào"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(run.platforms || []).slice(0, 4).map((platform: string) => (
                        <span
                          key={platform}
                          title={platformLabel(platform)}
                          className="inline-flex h-7 items-center gap-1 rounded-lg bg-slate-50 px-2 text-[10px] font-semibold text-slate-600"
                        >
                          <PlatformIcon platform={platform} size={13} />
                          {platformLabel(platform)}
                        </span>
                      ))}
                      {(run.platforms || []).length > 4 && (
                        <span className="grid h-7 place-items-center rounded-lg bg-slate-50 px-2 text-[10px] font-bold text-slate-500">
                          +{run.platforms.length - 4}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          run.status === "failed" ? "bg-rose-500" : "bg-[var(--color-brand)]"
                        }`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                      <span className="flex min-w-0 items-center gap-1 truncate">
                        <PlatformIcon platform={currentPlatform} size={12} />
                        {currentPlatform ? platformLabel(currentPlatform) : "Chưa bắt đầu"}
                        {" · "}
                        {PHASE_LABELS[run.currentPhase] || run.currentPhase || "đang chờ"}
                      </span>
                      <span className="shrink-0 font-semibold">
                        {run.progressCurrent || 0}/{run.progressTotal || 0}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400">{dateText(run.createdAt)}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-[11px] text-slate-500">
                {filteredRuns.length === 0
                  ? "0 phiên"
                  : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredRuns.length)} / ${filteredRuns.length} phiên`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border bg-white disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="min-w-16 text-center text-xs font-bold">{page}/{totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border bg-white disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </aside>

          <section data-tour="ops-task-detail" className="min-h-[620px] rounded-3xl border bg-white/80 p-4 shadow-sm sm:p-6">
            {!selected ? (
              <div className="flex min-h-[560px] flex-col items-center justify-center text-center text-sm text-slate-500">
                <Database className="mb-3 text-slate-300" size={40} />
                Chọn một phiên cào để xem thông tin chi tiết.
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 border-b pb-5">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        statusStyle[selected.status] || statusStyle.queued
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDotStyle[selected.status] || statusDotStyle.queued}`} />
                        {STATUS_LABELS[selected.status] || selected.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {selected.runType === "trial" ? "Phiên dùng thử" : "Phiên production"}
                      </span>
                    </div>
                    <h2 className="text-lg font-black sm:text-xl">
                      {selected.lastMessage || "Chi tiết phiên cào"}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Bắt đầu: {dateText(selected.startedAt || selected.createdAt)}
                      {" · "}
                      Cập nhật gần nhất: {dateText(selected.heartbeatAt || selected.updatedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadRuns()}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-white transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                    title="Làm mới dữ liệu"
                  >
                    <RefreshCw size={17} />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs sm:gap-3">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-800">
                    <b className="block text-xl">{selected.postsFound || 0}</b>
                    bài viết
                  </div>
                  <div className="rounded-2xl bg-violet-50 p-3 text-violet-800">
                    <b className="block text-xl">{selected.commentsFound || 0}</b>
                    bình luận
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3 text-rose-800">
                    <b className="block text-xl">{selected.errorsCount || 0}</b>
                    lỗi
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border bg-slate-50/70 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">
                        {selected.runType === "trial" ? "Cấu hình dùng thử" : "Thông tin phiên chạy"}
                      </h3>
                      <p className="mt-1 break-all text-[11px] text-slate-500">
                        Mã phiên: {selected.id}
                        {selected.consultationId ? ` · Mã yêu cầu: ${selected.consultationId}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteRun()}
                      disabled={actionBusy}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      title="Xóa phiên cào này khỏi danh sách"
                    >
                      <Trash2 size={14} />
                      Xóa phiên cào
                    </button>
                  </div>

                  <div className="mt-5 space-y-4 text-sm">
                    {(selected.metadata?.brandName || selected.metadata?.company) && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Thương hiệu
                        </span>
                        <p className="mt-1 font-bold">
                          {String(selected.metadata?.brandName || selected.metadata?.company)}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Nền tảng
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(selected.platforms || []).map((platform: string) => (
                          <span
                            key={platform}
                            className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1.5 text-xs font-semibold"
                          >
                            <PlatformIcon platform={platform} size={13} />
                            {platformLabel(platform)}
                            {canRetrySelectedPlatform && (
                              <button
                                type="button"
                                data-tour="ops-rerun-platform"
                                onClick={() => void retryPlatform(platform)}
                                disabled={retryingPlatform === platform}
                                className="ml-1 inline-flex h-5 items-center gap-1 rounded-full border border-[var(--color-brand)]/20 px-1.5 text-[10px] font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand)]/10 disabled:cursor-wait disabled:opacity-60"
                                title={`Cào lại riêng ${platformLabel(platform)}`}
                              >
                                <RefreshCw
                                  size={10}
                                  className={retryingPlatform === platform ? "animate-spin" : ""}
                                />
                                Cào lại
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                    {Array.isArray(selected.metadata?.keywords) && selected.metadata.keywords.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Từ khóa
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selected.metadata.keywords.map((keyword: string) => (
                            <span
                              key={keyword}
                              className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selected.runType === "trial" && (
                      <p className="text-xs text-slate-500">
                        Cấu hình được quản lý tại trang Yêu cầu tư vấn.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-black">Nhật ký hoạt động</h3>
                    <span className="text-xs text-slate-500">{events.length} sự kiện gần nhất</span>
                  </div>
                  <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
                    {events.length === 0 && (
                      <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">
                        Chưa có sự kiện.
                      </p>
                    )}
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`rounded-r-xl border-l-2 py-1 pl-3 ${
                          event.level === "error"
                            ? "border-rose-400"
                            : event.level === "warn"
                              ? "border-amber-400"
                              : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <PlatformIcon platform={event.platform} size={12} />
                            {event.platform ? platformLabel(event.platform) : "Hệ thống"}
                            {event.phase ? ` · ${PHASE_LABELS[event.phase] || event.phase}` : ""}
                          </span>
                          <span>{dateText(event.createdAt)}</span>
                        </div>
                        <p className={`mt-1 text-sm ${
                          event.level === "error"
                            ? "text-rose-600"
                            : event.level === "warn"
                              ? "text-amber-700"
                              : ""
                        }`}>
                          {event.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
