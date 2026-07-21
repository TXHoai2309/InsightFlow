"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { Activity, AlertTriangle, CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";
import { db } from "@/lib/firebase";

type Run = Record<string, any> & { id: string };
type Event = Record<string, any> & { id: string };

function dateText(value: any) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString("vi-VN") : "—";
}

const statusStyle: Record<string, string> = {
  queued: "bg-slate-100 text-slate-700",
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

  useEffect(() => {
    const runsQuery = query(collection(db, "crawl_runs"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(runsQuery, (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      setRuns(next);
      setSelectedId((current) => current && next.some((run) => run.id === current) ? current : next[0]?.id || null);
    }, (error) => console.error("[Crawl operations] runs listener:", error));
  }, []);

  useEffect(() => {
    if (!selectedId) { setEvents([]); return; }
    const eventsQuery = query(collection(db, "crawl_runs", selectedId, "events"), orderBy("createdAt", "desc"), limit(100));
    return onSnapshot(eventsQuery, (snapshot) => {
      setEvents(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).reverse());
    }, (error) => console.error("[Crawl operations] events listener:", error));
  }, [selectedId]);

  const selected = useMemo(() => runs.find((run) => run.id === selectedId) || null, [runs, selectedId]);
  const iconFor = (status: string) => status === "failed" ? XCircle : status === "completed" ? CheckCircle2 : status === "running" ? Activity : Clock3;

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-8 text-[var(--color-foreground)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">Operations</p>
            <h1 className="mt-1 text-2xl font-black">Tiến trình cào dữ liệu</h1>
            <p className="mt-1 text-sm opacity-70">Production và trial dùng chung một luồng giám sát realtime.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />Realtime</div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <section className="space-y-3">
            {runs.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm opacity-60">Chưa có phiên cào nào.</div>}
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
              <div className="flex items-start justify-between gap-4 border-b pb-4"><div><h2 className="font-black">{selected.lastMessage || "Phiên cào"}</h2><p className="mt-1 text-xs opacity-60">Bắt đầu: {dateText(selected.startedAt || selected.createdAt)} · heartbeat: {dateText(selected.heartbeatAt)}</p></div><button type="button" onClick={() => window.location.reload()} className="rounded-lg border p-2" title="Refresh"><RefreshCw size={16} /></button></div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl bg-slate-50 p-3"><b className="block text-lg">{selected.postsFound || 0}</b>bài viết</div><div className="rounded-xl bg-slate-50 p-3"><b className="block text-lg">{selected.commentsFound || 0}</b>bình luận</div><div className="rounded-xl bg-slate-50 p-3"><b className="block text-lg">{selected.errorsCount || 0}</b>lỗi</div></div>
              <div className="mt-5 max-h-[520px] space-y-3 overflow-auto pr-1">{events.length === 0 && <p className="text-sm opacity-60">Chưa có event.</p>}{events.map((event) => <div key={event.id} className="border-l-2 border-slate-200 pl-3"><div className="flex items-center justify-between gap-3 text-[11px] opacity-60"><span>{event.platform || "system"} · {event.phase || ""}</span><span>{dateText(event.createdAt)}</span></div><p className={`mt-1 text-sm ${event.level === "error" ? "text-rose-600" : event.level === "warn" ? "text-amber-700" : ""}`}>{event.message}</p></div>)}</div>
            </>}
          </section>
        </div>
      </div>
    </main>
  );
}

