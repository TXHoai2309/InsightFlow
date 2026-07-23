"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { auth } from "@/lib/firebase";

type Run = Record<string, any> & { id: string };
type Event = Record<string, any> & { id: string };

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

const ACTIVE_RUN_STATUSES = new Set([
  "queued",
  "waiting_resource",
  "running",
  "labeling",
  "syncing",
]);

function dateText(value: any) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString("vi-VN") : "—";
}

const statusStyle: Record<string, string> = {
  queued: "bg-slate-100 text-slate-700",
  waiting_resource: "bg-amber-100 text-amber-700",
  running: "bg-blue-100 text-blue-700",
  labeling: "bg-violet-100 text-violet-700",
  syncing: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  partial: "bg-orange-100 text-orange-700",
  failed: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-200 text-slate-700",
};

export default function AdminCrawlOperationsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const loadRuns = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/crawl-runs?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      const next = Array.isArray(payload.runs) ? payload.runs : [];
      setRuns(next);
      setSelectedId((current) => current && next.some((run: Run) => run.id === current)
        ? current
        : next[0]?.id || null);
      setErrorMessage("");
    } catch (error) {
      console.error("[Crawl operations] load runs:", error);
      setErrorMessage(error instanceof Error ? error.message : "Không tải được danh sách phiên cào.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) void loadRuns();
      else {
        setLoading(false);
        setErrorMessage("Phiên đăng nhập chưa sẵn sàng.");
      }
    });
    const timer = window.setInterval(() => void loadRuns(), 60000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [loadRuns]);

  const selectedStatus = runs.find((run) => run.id === selectedId)?.status;

  useEffect(() => {
    if (!selectedId) { setEvents([]); return; }
    let cancelled = false;
    const loadDetail = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/admin/crawl-runs/${encodeURIComponent(selectedId)}?eventLimit=30`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
        if (cancelled) return;
        setEvents(Array.isArray(payload.events)
          ? payload.events.filter((event: Event) => event.eventType !== "heartbeat")
          : []);
        if (payload.run) {
          setRuns((current) => current.map((run) => run.id === payload.run.id ? payload.run : run));
        }
        setErrorMessage("");
      } catch (error) {
        if (cancelled) return;
        console.error("[Crawl operations] load detail:", error);
        setErrorMessage(error instanceof Error ? error.message : "Không tải được log phiên cào.");
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

  const selected = useMemo(() => runs.find((run) => run.id === selectedId) || null, [runs, selectedId]);
  const iconFor = (status: string) => status === "failed" ? XCircle : status === "completed" ? CheckCircle2 : status === "running" ? Activity : Clock3;

  const cancelQueuedRun = async () => {
    if (!selected || selected.status !== "queued") return;
    if (!window.confirm("Xóa phiên này khỏi hàng đợi? Lịch sử vẫn được giữ với trạng thái cancelled.")) return;
    setActionBusy(true);
    setErrorMessage("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn.");
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/crawl-runs/${encodeURIComponent(selected.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      if (payload.run) {
        setRuns((current) => current.map((run) => run.id === payload.run.id ? payload.run : run));
      }
      await loadRuns();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể xóa phiên khỏi hàng đợi.");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-8 text-[var(--color-foreground)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">Operations</p>
            <h1 className="mt-1 text-2xl font-black">Tiến trình cào dữ liệu</h1>
            <p className="mt-1 text-sm opacity-70">Production và trial dùng chung một luồng giám sát realtime.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />Tự cập nhật tiết kiệm 30–60 giây</div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <section className="space-y-3">
            {errorMessage && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertTriangle className="mr-2 inline" size={16} />{errorMessage}</div>}
            {loading && runs.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm opacity-60">Đang tải các phiên cào…</div>}
            {!loading && !errorMessage && runs.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm opacity-60">Chưa có phiên cào nào.</div>}
            {runs.map((run) => {
              const Icon = iconFor(run.status);
              const ratio = run.progressTotal ? Math.min(100, Math.round((run.progressCurrent || 0) / run.progressTotal * 100)) : 0;
              return <button key={run.id} type="button" onClick={() => setSelectedId(run.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === run.id ? "border-[var(--color-brand)] shadow-md" : "hover:border-[var(--color-brand)]/40"}`}>
                <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><Icon size={18} /><span className="font-bold">{run.runType === "trial" ? "Trial" : "Production"}</span></div><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusStyle[run.status] || statusStyle.queued}`}>{run.status}</span></div>
                <div className="mt-2 text-xs opacity-70">{(run.platforms || []).join(" · ")} · {dateText(run.createdAt)}</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--color-brand)] transition-all" style={{ width: `${ratio}%` }} /></div>
                <div className="mt-2 flex justify-between text-xs opacity-70"><span>{run.currentPlatform || "—"} / {run.currentPhase || "đang chờ"}</span><span>{run.progressCurrent || 0}/{run.progressTotal || 0}</span></div>
              </button>;
            })}
          </section>
          <section className="rounded-2xl border p-5">
            {!selected ? <div className="flex h-full min-h-64 items-center justify-center text-sm opacity-60">Chọn một phiên cào để xem log.</div> : <>
              <div className="flex items-start justify-between gap-4 border-b pb-4"><div><h2 className="font-black">{selected.lastMessage || "Phiên cào"}</h2><p className="mt-1 text-xs opacity-60">Bắt đầu: {dateText(selected.startedAt || selected.createdAt)} · heartbeat: {dateText(selected.heartbeatAt)}</p></div><button type="button" onClick={() => void loadRuns()} className="rounded-lg border p-2" title="Refresh"><RefreshCw size={16} /></button></div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl bg-slate-50 p-3"><b className="block text-lg">{selected.postsFound || 0}</b>bài viết</div><div className="rounded-xl bg-slate-50 p-3"><b className="block text-lg">{selected.commentsFound || 0}</b>bình luận</div><div className="rounded-xl bg-slate-50 p-3"><b className="block text-lg">{selected.errorsCount || 0}</b>lỗi</div></div>
              <div className="mt-5 rounded-2xl border bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold">Cấu hình trial</h3>
                    <p className="mt-1 text-xs opacity-60">Run ID: {selected.id}{selected.consultationId ? ` · Yêu cầu: ${selected.consultationId}` : ""}</p>
                  </div>
                  {selected.runType === "trial" && selected.status === "queued" && <div className="flex gap-2">
                    <button type="button" onClick={() => void cancelQueuedRun()} disabled={actionBusy} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 size={14} />Xóa khỏi hàng đợi</button>
                  </div>}
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div><span className="text-xs font-bold opacity-60">THƯƠNG HIỆU</span><p className="mt-1 font-semibold">{String(selected.metadata?.brandName || selected.metadata?.company || "—")}</p></div>
                  <div><span className="text-xs font-bold opacity-60">NỀN TẢNG</span><div className="mt-2 flex flex-wrap gap-2">{(selected.platforms || []).map((platform: string) => <span key={platform} className="rounded-full border bg-white px-2.5 py-1 text-xs">{PLATFORM_OPTIONS.find(([value]) => value === platform)?.[1] || platform}</span>)}</div></div>
                  <div><span className="text-xs font-bold opacity-60">TỪ KHÓA</span><div className="mt-2 flex flex-wrap gap-2">{(Array.isArray(selected.metadata?.keywords) ? selected.metadata.keywords : []).map((keyword: string) => <span key={keyword} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800">{keyword}</span>)}</div></div>
                  <p className="text-xs text-[var(--color-text-muted)]">Cấu hình được quản lý tại trang Yêu cầu tư vấn.</p>
                </div>
              </div>
              <div className="mt-5 max-h-[520px] space-y-3 overflow-auto pr-1">{events.length === 0 && <p className="text-sm opacity-60">Chưa có event.</p>}{events.map((event) => <div key={event.id} className="border-l-2 border-slate-200 pl-3"><div className="flex items-center justify-between gap-3 text-[11px] opacity-60"><span>{event.platform || "system"} · {event.phase || ""}</span><span>{dateText(event.createdAt)}</span></div><p className={`mt-1 text-sm ${event.level === "error" ? "text-rose-600" : event.level === "warn" ? "text-amber-700" : ""}`}>{event.message}</p></div>)}</div>
            </>}
          </section>
        </div>
      </div>
    </main>
  );
}

