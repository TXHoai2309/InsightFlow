"use client";

import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  History,
  MessageSquareText,
  PanelRightClose,
  ShieldAlert,
  UserPlus,
  UserRound,
} from "lucide-react";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { getAlertWorkflowStatus } from "@/lib/alertWorkflow";
import type { AlertData } from "@/stores/alert.store";

export type AlertDetailPanelTab = "action" | "profile" | "history";

interface AlertDetailPanelProps {
  alert: AlertData;
  activeTab: AlertDetailPanelTab;
  onTabChange: (tab: AlertDetailPanelTab) => void;
  profileEmail?: string | null;
  canUpdate: boolean;
  getResolverName: (value: string | null | undefined) => string;
  onClose: () => void;
  onClaim: (alert: AlertData) => Promise<void>;
  onRecordResult: (alert: AlertData) => void;
  onOpenSource: (alert: AlertData) => void;
  onOpenFullDetails: (alert: AlertData) => void;
}

function formatDate(value?: string) {
  if (!value) return "Không rõ";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Không rõ";
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function getStatusLabel(alert: AlertData) {
  const status = getAlertWorkflowStatus(alert);
  if (status === "resolved") return "Đã giải quyết";
  if (status === "contact_failed") return "Liên hệ không thành";
  if (status === "processing") return alert.status === "contact_waiting" ? "Đã liên hệ, chờ phản hồi" : "Đang xử lý";
  return "Chưa phân công";
}

function getPriorityReason(alert: AlertData) {
  const reasons: string[] = [];
  const severity = String(alert.severity || "").toLowerCase();
  if (severity === "critical") reasons.push("Mức độ nghiêm trọng đặc biệt cao");
  else if (severity === "high") reasons.push("Nguy cơ ảnh hưởng hình ảnh thương hiệu");
  if ((alert.negativity_score || 0) >= 70) reasons.push("Điểm tiêu cực cao");
  if ((alert.reach || 0) >= 10000) reasons.push("Phạm vi tiếp cận lớn");
  if (alert.transferred_at) reasons.push("Được chuyển từ nghiệp vụ khác");
  return reasons.length > 0 ? reasons.join(" · ") : "Nội dung tiêu cực cần nhân viên đánh giá và xử lý.";
}

export function AlertDetailPanel({
  alert,
  activeTab,
  onTabChange,
  profileEmail,
  canUpdate,
  getResolverName,
  onClose,
  onClaim,
  onRecordResult,
  onOpenSource,
  onOpenFullDetails,
}: AlertDetailPanelProps) {
  const workflowStatus = getAlertWorkflowStatus(alert);
  const isMine = Boolean(profileEmail && alert.being_resolved_by === profileEmail);
  const ownerName = getResolverName(alert.being_resolved_by) || "Chưa có người phụ trách";
  const canClaim = canUpdate && workflowStatus === "pending" && !alert.being_resolved_by;
  const canRecord = canUpdate && isMine && (workflowStatus === "processing" || workflowStatus === "contact_failed");
  const tabs: Array<{ id: AlertDetailPanelTab; label: string }> = [
    { id: "action", label: "Xử lý" },
    { id: "profile", label: "Hồ sơ" },
    { id: "history", label: "Lịch sử" },
  ];

  return (
    <aside data-tour="alert-detail-panel" className="min-w-0 self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
      <header className="border-b border-[var(--color-border)] p-[2%]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-sm font-black text-[var(--color-brand)]">{(alert.author || "CB").slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-black text-[var(--color-text-primary)]">{alert.author || "Người dùng ẩn danh"}</h2>
                <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase text-red-700">{alert.severity || "unknown"}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                <PlatformLogo platform={alert.source} size="sm" />
                <span>{alert.source || "Nền tảng khác"}</span><span>·</span><span>{getStatusLabel(alert)}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)]" title="Thu gọn panel" aria-label="Thu gọn panel">
            <PanelRightClose size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} className={`w-full rounded-lg px-2 py-1.5 text-xs font-semibold transition ${activeTab === tab.id ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)]"}`}>{tab.label}</button>
          ))}
        </div>
      </header>

      <div className="p-[2%]">
        {activeTab === "action" && (
          <div className="space-y-3">
            <div className={canClaim || canRecord ? "grid gap-3 md:grid-cols-[0.96fr_1.04fr]" : "block"}>
              <section className="rounded-lg border border-[var(--color-border)] p-3">
                <p className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Người phụ trách</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-sm font-black text-[var(--color-brand)]">{alert.being_resolved_by ? ownerName.slice(0, 2).toUpperCase() : "--"}</span>
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{ownerName}</p><p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">Đội xử lý khủng hoảng</p></div>
                  </div>
                  <span className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{isMine ? "Của tôi" : workflowStatus === "pending" ? "Chưa phân công" : getStatusLabel(alert)}</span>
                </div>
              </section>

              {(canClaim || canRecord) && (
                <section className="flex flex-col justify-between rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]/20 p-3">
                  <div className="flex items-start gap-2.5"><ShieldAlert className="mt-0.5 shrink-0 text-[var(--color-brand)]" size={19} /><div><p className="text-sm font-bold text-[var(--color-brand)]">Hành động chính</p><p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary)]">{canClaim ? "Nhận cảnh báo để bắt đầu xử lý." : "Cập nhật kết quả sau khi liên hệ và xử lý."}</p></div></div>
                  <button type="button" onClick={() => canClaim ? void onClaim(alert) : onRecordResult(alert)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold text-white hover:bg-[var(--color-brand-hover)]">
                    {canClaim ? <UserPlus size={18} /> : <CheckCircle2 size={18} />}{canClaim ? "Nhận xử lý" : "Ghi nhận kết quả"}
                  </button>
                </section>
              )}
            </div>

            <section className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-start gap-2.5"><ShieldAlert className="mt-0.5 shrink-0 text-amber-600" size={18} /><div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Lý do ưu tiên</h3><p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{getPriorityReason(alert)}</p></div></div>
            </section>

            <section className="rounded-lg border border-[var(--color-border)] p-3">
              <div className="flex items-center gap-2"><MessageSquareText size={17} className="text-[var(--color-brand)]" /><h3 className="text-sm font-black text-[var(--color-text-primary)]">Nội dung cần xử lý</h3></div>
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-sm leading-6 text-[var(--color-text-secondary)]">{alert.text || alert.comment_content || "Không có nội dung hiển thị."}</p>
              <p className="mt-2 text-[10px] font-medium text-[var(--color-text-muted)]">Phát hiện lúc {formatDate(alert.created_at)}</p>
            </section>

            <section className="rounded-lg border border-[var(--color-brand-border)] p-3">
              <div className="flex items-center gap-2"><Activity size={17} className="text-[var(--color-brand)]" /><div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Cách thức liên hệ / xử lý</h3><p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">Mở đúng nguồn hoặc xem thêm bối cảnh trước khi xử lý.</p></div></div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => onOpenSource(alert)} disabled={!alert.url || alert.url === "#"} className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-brand-border)] px-2 py-2 text-xs font-bold text-[var(--color-brand)] disabled:opacity-40"><ExternalLink size={16} /><span className="truncate">Mở nguồn</span></button>
                <button type="button" onClick={() => onTabChange("profile")} className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-2 text-xs font-bold text-[var(--color-text-primary)]"><UserRound size={16} /><span className="truncate">Xem hồ sơ</span></button>
                <button type="button" onClick={() => onTabChange("history")} className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-2 text-xs font-bold text-[var(--color-text-primary)]"><History size={16} /><span className="truncate">Xem lịch sử</span></button>
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <section className="rounded-lg border border-[var(--color-border)] p-3"><p className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Tình trạng xử lý</p><p className="mt-2 text-sm font-black text-[var(--color-text-primary)]">{getStatusLabel(alert)}</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{alert.resolution_history?.length || 0} cập nhật nghiệp vụ</p></section>
              <section className="rounded-lg border border-[var(--color-border)] p-3"><p className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Quy trình chuyên sâu</p><button type="button" onClick={() => onOpenFullDetails(alert)} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"><FileText size={16} />Liên hệ, minh chứng và escalation<ArrowUpRight size={15} /></button></section>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-3">
            <section className="grid gap-3 rounded-lg border border-[var(--color-border)] p-3 md:grid-cols-[1fr_0.8fr_1fr_auto] md:items-center">
              <div><p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Nền tảng</p><p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{alert.source || "Không rõ"}</p></div>
              <div><p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Điểm rủi ro</p><p className="mt-1 text-sm font-black text-[var(--color-brand)]">{Math.round(alert.negativity_score || 0)}/100</p></div>
              <div><p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Phạm vi tiếp cận</p><p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{(alert.reach || 0).toLocaleString("vi-VN")}</p></div>
              <button type="button" onClick={() => onOpenSource(alert)} disabled={!alert.url || alert.url === "#"} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-brand-border)] px-3 py-2 text-xs font-bold text-[var(--color-brand)] disabled:opacity-40">Mở nguồn gốc<ExternalLink size={15} /></button>
            </section>
            <div className="grid gap-3 lg:grid-cols-2">
              <InfoSection title="Thông tin cơ bản" rows={[["Tên hiển thị", alert.author || "Ẩn danh"], ["Thương hiệu", alert.brand], ["Chủ đề", alert.topic || "Chưa xác định"], ["Loại nội dung", alert.content_type || "mention"]]} />
              <InfoSection title="Thông tin xử lý" rows={[["Người phụ trách", ownerName], ["Trạng thái", getStatusLabel(alert)], ["Mức độ", String(alert.severity || "Không rõ").toUpperCase()], ["Nghiệp vụ", "Khủng hoảng"]]} />
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-3">
            <section className="grid gap-3 sm:grid-cols-3">
              <Metric icon={<Clock3 size={18} />} label="Phát hiện" value={formatDate(alert.created_at)} />
              <Metric icon={<MessageSquareText size={18} />} label="Lần liên hệ" value={String(alert.customer_contact_history?.length || 0)} />
              <Metric icon={<CheckCircle2 size={18} />} label="Trạng thái" value={getStatusLabel(alert)} />
            </section>
            <section className="rounded-lg border border-[var(--color-border)] p-3">
              <h3 className="text-sm font-black text-[var(--color-text-primary)]">Timeline xử lý</h3>
              <div className="mt-3">
                <TimelineRow time={formatDate(alert.created_at)} icon={<Activity size={12} />} title="Hệ thống phát hiện cảnh báo" detail="Nội dung được đưa vào hàng chờ xử lý khủng hoảng." />
                {(alert.resolution_history || []).map((entry, index) => <TimelineRow key={`${entry.timestamp}-${index}`} time={formatDate(entry.timestamp)} icon={<UserRound size={12} />} title={entry.resolved_by_name || getResolverName(entry.resolved_by_email) || "Nhân viên xử lý"} detail={entry.note || "Đã cập nhật trạng thái."} />)}
                {(alert.resolution_history || []).length === 0 && <p className="py-5 text-center text-xs text-[var(--color-text-muted)]">Chưa có hoạt động xử lý bổ sung.</p>}
              </div>
              <button type="button" onClick={() => onOpenFullDetails(alert)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]">Xem toàn bộ lịch sử và minh chứng<ArrowUpRight size={15} /></button>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}

function InfoSection({ title, rows }: { title: string; rows: string[][] }) {
  return <section className="rounded-lg border border-[var(--color-border)] p-3"><h3 className="text-sm font-black text-[var(--color-text-primary)]">{title}</h3><dl className="mt-3 space-y-2 text-xs">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-[var(--color-text-muted)]">{label}</dt><dd className="text-right font-bold text-[var(--color-text-primary)]">{value}</dd></div>)}</dl></section>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-lg border border-[var(--color-border)] p-3"><span className="text-[var(--color-brand)]">{icon}</span><p className="mt-2 text-[10px] font-bold uppercase text-[var(--color-text-muted)]">{label}</p><p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{value}</p></div>;
}

function TimelineRow({ time, icon, title, detail }: { time: string; icon: React.ReactNode; title: string; detail: string }) {
  return <article className="grid grid-cols-[72px_24px_minmax(0,1fr)] gap-2 border-b border-[var(--color-border)] py-3 last:border-b-0"><time className="text-[10px] font-semibold text-[var(--color-text-muted)]">{time}</time><span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">{icon}</span><div><p className="text-xs font-bold text-[var(--color-text-primary)]">{title}</p><p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-text-secondary)]">{detail}</p></div></article>;
}
