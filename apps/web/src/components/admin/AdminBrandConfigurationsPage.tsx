"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import {
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Settings2,
  Tags,
  XCircle,
} from "lucide-react";

type ConfigurationStatus = "pending" | "reviewing" | "approved" | "rejected";

interface BrandConfiguration {
  id: string;
  consultationId: string;
  company: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  keywords: string[];
  platforms: string[];
  notes?: string;
  adminNotes?: string;
  status: ConfigurationStatus;
  createdAt?: string;
}

const statusOptions: Array<{ value: ConfigurationStatus; label: string; className: string }> = [
  { value: "pending", label: "Chờ tiếp nhận", className: "bg-amber-500/10 text-amber-600" },
  { value: "reviewing", label: "Đang cấu hình", className: "bg-blue-500/10 text-blue-600" },
  { value: "approved", label: "Đã hoàn tất", className: "bg-emerald-500/10 text-emerald-600" },
  { value: "rejected", label: "Không phù hợp", className: "bg-rose-500/10 text-rose-600" },
];

function statusMeta(status: ConfigurationStatus) {
  return statusOptions.find((item) => item.value === status) || statusOptions[0];
}

function formatDate(value?: string) {
  if (!value) return "Chưa có thời gian";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có thời gian" : date.toLocaleString("vi-VN");
}

export default function AdminBrandConfigurationsPage() {
  const [configurations, setConfigurations] = useState<BrandConfiguration[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ConfigurationStatus>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draftStatus, setDraftStatus] = useState<ConfigurationStatus>("pending");
  const [draftNotes, setDraftNotes] = useState("");

  const loadConfigurations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/brand-configurations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể tải dữ liệu.");
      const items = (result.configurations || []) as BrandConfiguration[];
      setConfigurations(items);
      setSelectedId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id || null);
    } catch (loadError: any) {
      setError(loadError?.message || "Không thể tải cấu hình thương hiệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfigurations();
  }, [loadConfigurations]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");
    return configurations.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const haystack = [item.company, item.industry, item.contactName, item.contactEmail, ...(item.keywords || [])].join(" ").toLocaleLowerCase("vi");
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [configurations, search, statusFilter]);

  const selected = configurations.find((item) => item.id === selectedId) || null;

  useEffect(() => {
    if (!selected) return;
    setDraftStatus(selected.status);
    setDraftNotes(selected.adminNotes || "");
  }, [selected]);

  const saveConfiguration = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/brand-configurations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: selected.id, status: draftStatus, adminNotes: draftNotes }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể lưu thay đổi.");
      setConfigurations((current) => current.map((item) => item.id === selected.id ? { ...item, status: draftStatus, adminNotes: draftNotes } : item));
    } catch (saveError: any) {
      setError(saveError?.message || "Không thể lưu thay đổi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[var(--color-bg-base)] p-4 text-[var(--color-text-primary)] md:p-6 xl:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"><Settings2 className="h-5 w-5" /></span>
              <div>
                <h1 className="text-2xl font-bold">Cấu hình thương hiệu</h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Tiếp nhận cấu hình được gửi cùng yêu cầu tư vấn.</p>
              </div>
            </div>
          </div>
          <button onClick={() => void loadConfigurations()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-sm font-semibold transition hover:border-[var(--color-brand)] disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</div>}

        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm thương hiệu, liên hệ hoặc từ khóa..." className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] pl-11 pr-4 text-sm outline-none focus:border-[var(--color-brand)]" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-sm outline-none focus:border-[var(--color-brand)]">
            <option value="all">Tất cả trạng thái</option>
            {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>

        <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm lg:grid-cols-[390px_1fr]">
          <div className="border-b border-[var(--color-border)] lg:border-b-0 lg:border-r">
            <div className="border-b border-[var(--color-border)] px-5 py-4 text-sm font-semibold text-[var(--color-text-secondary)]">{filtered.length} cấu hình</div>
            <div className="max-h-[720px] overflow-y-auto">
              {loading ? (
                <div className="flex h-52 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--color-brand)]" /></div>
              ) : filtered.length === 0 ? (
                <div className="flex h-52 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[var(--color-text-muted)]"><Layers3 className="h-8 w-8" />Chưa có cấu hình phù hợp.</div>
              ) : filtered.map((item) => {
                const meta = statusMeta(item.status);
                return (
                  <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full border-b border-[var(--color-border)] p-5 text-left transition hover:bg-[var(--color-bg-surface-raised)] ${selectedId === item.id ? "bg-[var(--color-brand-subtle)]" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="truncate font-bold">{item.company}</p><p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">{item.contactName} · {item.industry}</p></div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>
                    </div>
                    <p className="mt-3 line-clamp-1 text-xs text-[var(--color-text-muted)]">{(item.keywords || []).join(", ")}</p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]"><Clock3 className="h-3 w-3" />{formatDate(item.createdAt)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 md:p-7">
            {!selected ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center text-[var(--color-text-muted)]"><Settings2 className="mb-3 h-10 w-10" /><p>Chọn một cấu hình để xem chi tiết.</p></div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border)] pb-5">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">Thương hiệu</p><h2 className="mt-1 text-2xl font-bold">{selected.company}</h2><p className="mt-1 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><Building2 className="h-4 w-4" />{selected.industry}</p></div>
                  <Link href="/admin/consultations" className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)]">Mở yêu cầu tư vấn</Link>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-[var(--color-border)] p-4"><p className="text-xs text-[var(--color-text-muted)]">Người liên hệ</p><p className="mt-2 font-semibold">{selected.contactName}</p></div>
                  <div className="rounded-xl border border-[var(--color-border)] p-4"><p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]"><Mail className="h-3 w-3" />Email</p><p className="mt-2 break-all text-sm font-semibold">{selected.contactEmail}</p></div>
                  <div className="rounded-xl border border-[var(--color-border)] p-4"><p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]"><Phone className="h-3 w-3" />Điện thoại</p><p className="mt-2 font-semibold">{selected.contactPhone}</p></div>
                </div>

                <section><h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Tags className="h-4 w-4 text-[var(--color-brand)]" />Từ khóa thương hiệu</h3><div className="flex flex-wrap gap-2">{selected.keywords?.map((keyword) => <span key={keyword} className="rounded-full bg-[var(--color-brand-subtle)] px-3 py-1.5 text-sm font-semibold text-[var(--color-brand)]">{keyword}</span>)}</div></section>
                <section><h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Layers3 className="h-4 w-4 text-[var(--color-brand)]" />Nền tảng cần theo dõi</h3><div className="flex flex-wrap gap-2">{selected.platforms?.map((platform) => <span key={platform} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm font-semibold">{platform}</span>)}</div></section>
                <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-4"><h3 className="flex items-center gap-2 text-sm font-bold"><FileText className="h-4 w-4 text-[var(--color-brand)]" />Ghi chú từ khách hàng</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">{selected.notes || "Không có ghi chú."}</p></section>

                <section className="grid gap-4 rounded-xl border border-[var(--color-border)] p-5">
                  <h3 className="font-bold">Xử lý cấu hình</h3>
                  <label className="grid gap-2 text-sm font-semibold">Trạng thái<select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as ConfigurationStatus)} className="h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 outline-none focus:border-[var(--color-brand)]">{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                  <label className="grid gap-2 text-sm font-semibold">Ghi chú của Admin<textarea value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} rows={4} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 font-normal outline-none focus:border-[var(--color-brand)]" placeholder="Ghi chú tiến độ hoặc hướng cấu hình..." /></label>
                  <button onClick={() => void saveConfiguration()} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : draftStatus === "approved" ? <CheckCircle2 className="h-4 w-4" /> : draftStatus === "rejected" ? <XCircle className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}Lưu cập nhật</button>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
