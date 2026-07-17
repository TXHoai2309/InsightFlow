"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";

type ViewMode = "list" | "crisis_mode";

interface MockContact {
  id: string;
  author: string;
  source: string;
  platform: string;
  type: "crisis" | "lead" | "regular";
  status: "new" | "processing" | "resolved" | "escalated";
  priority: "critical" | "high" | "medium" | "low";
  assignee: string | null;
  createdAt: string;
  lastReplyAt: string;
  content: string;
  slaLimit: number; // in minutes
  slaElapsed: number; // in minutes
}

const MOCK_CONTACTS: MockContact[] = [
  { id: "c1", author: "Trần Nhất Minh", source: "Bài viết Facebook nhóm Cộng đồng ABC", platform: "facebook", type: "crisis", status: "escalated", priority: "critical", assignee: "s1", createdAt: "2026-07-05T09:00:00Z", lastReplyAt: "2026-07-05T09:15:00Z", content: "Sản phẩm lỗi gây nguy hiểm, thái độ CSKH quá tệ. Sẽ tẩy chay và báo báo chí!", slaLimit: 30, slaElapsed: 45 },
  { id: "c2", author: "Hương Nguyễn", source: "Comment Tiktok", platform: "tiktok", type: "lead", status: "processing", priority: "medium", assignee: "s2", createdAt: "2026-07-05T10:00:00Z", lastReplyAt: "2026-07-05T10:10:00Z", content: "Dịch vụ bên mình có gói cho doanh nghiệp 50 người không ạ? Cho mình xin báo giá.", slaLimit: 120, slaElapsed: 30 },
  { id: "c3", author: "Lê Hoàng", source: "Review Google Maps", platform: "google_maps", type: "crisis", status: "new", priority: "high", assignee: null, createdAt: "2026-07-05T11:45:00Z", lastReplyAt: "2026-07-05T11:45:00Z", content: "Quán phục vụ quá chậm, đợi 1 tiếng đồng hồ không có đồ ăn.", slaLimit: 60, slaElapsed: 15 },
  { id: "c4", author: "Bùi Thị Lan", source: "Mention Threads", platform: "thread", type: "regular", status: "resolved", priority: "low", assignee: "s3", createdAt: "2026-07-04T15:00:00Z", lastReplyAt: "2026-07-04T15:30:00Z", content: "Mới mua thử trải nghiệm, đóng gói đẹp nhưng vị hơi ngọt.", slaLimit: 240, slaElapsed: 30 },
  { id: "c5", author: "Tài khoản ẩn danh", source: "Bài viết Website Báo điện tử", platform: "news", type: "crisis", status: "processing", priority: "critical", assignee: "s1", createdAt: "2026-07-05T08:00:00Z", lastReplyAt: "2026-07-05T08:30:00Z", content: "Nghi vấn thương hiệu XYZ sử dụng nguyên liệu không rõ nguồn gốc.", slaLimit: 30, slaElapsed: 20 },
];

const MOCK_TEAM: Record<string, string> = {
  "s1": "Nguyễn Văn A (Crisis)",
  "s2": "Trần Thị B (Lead)",
  "s3": "Lê Văn C (Mod)",
};

const MOCK_TIMELINE = [
  { id: 1, type: "created", time: "09:00", text: "Contact được hệ thống thu thập từ Facebook.", user: "Hệ thống" },
  { id: 2, type: "assigned", time: "09:05", text: "Tự động phân công cho Nguyễn Văn A do từ khóa khẩn cấp.", user: "Hệ thống" },
  { id: 3, type: "note", time: "09:10", text: "Đã liên hệ với chi nhánh để xác minh sự cố.", user: "Nguyễn Văn A" },
  { id: 4, type: "status", time: "09:12", text: "Đổi trạng thái từ Mới sang Đang xử lý.", user: "Nguyễn Văn A" },
  { id: 5, type: "escalated", time: "09:15", text: "Chi nhánh xác nhận có sự cố. Cần Giám đốc truyền thông phê duyệt phương án bồi thường.", user: "Nguyễn Văn A" },
];

export function BMContactCrisis() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeContact, setActiveContact] = useState<MockContact | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const displayContacts = useMemo(() => {
    let filtered = MOCK_CONTACTS;
    if (filterType !== "all") filtered = filtered.filter(c => c.type === filterType);
    if (filterStatus !== "all") filtered = filtered.filter(c => c.status === filterStatus);
    return filtered;
  }, [filterType, filterStatus]);

  const crisisContacts = useMemo(() => MOCK_CONTACTS.filter(c => c.type === "crisis"), []);
  
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 relative h-full">
      
      {/* TOOLBAR */}
      <div className="glass-card rounded-2xl p-4 bg-[var(--color-bg-surface)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[var(--color-bg-surface-raised)] p-1 rounded-xl border border-[var(--color-border)]">
          <button 
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === "list" ? "bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand-subtle)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)]"}`}
          >
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            {t("bm.contact.viewList")}
          </button>
          <button 
            onClick={() => setViewMode("crisis_mode")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all relative overflow-hidden ${viewMode === "crisis_mode" ? "bg-[var(--color-error)] text-white shadow-md shadow-[var(--color-error-subtle)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-error-subtle)] hover:text-[var(--color-error)]"}`}
          >
            <span className="absolute inset-0 bg-red-500 opacity-20 animate-pulse pointer-events-none"></span>
            <span className="material-symbols-outlined text-[18px] relative z-10">warning</span>
            <span className="relative z-10">{t("bm.contact.viewCrisis")}</span>
          </button>
        </div>

        {viewMode === "list" && (
          <div className="flex items-center gap-3">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-sm focus:border-[var(--color-brand)] outline-none">
              <option value="all">{t("bm.contact.filterType")}</option>
              <option value="crisis">{t("bm.contact.type.crisis")}</option>
              <option value="lead">{t("bm.contact.type.lead")}</option>
              <option value="regular">{t("bm.contact.type.regular")}</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-sm focus:border-[var(--color-brand)] outline-none">
              <option value="all">{t("bm.contact.filterStatus")}</option>
              <option value="new">{t("bm.contact.status.new")}</option>
              <option value="processing">{t("bm.contact.status.processing")}</option>
              <option value="escalated">{t("bm.contact.status.escalated")}</option>
              <option value="resolved">{t("bm.contact.status.resolved")}</option>
            </select>
            <button className="px-4 py-2 rounded-lg bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-semibold hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">download</span>
              {t("bm.contact.export")}
            </button>
          </div>
        )}
      </div>

      {/* CHẾ ĐỘ 1: DANH SÁCH TỔNG HỢP (LIST VIEW) */}
      {viewMode === "list" && (
        <div className="glass-card rounded-2xl overflow-hidden bg-[var(--color-bg-surface)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg-surface-raised)] border-b border-[var(--color-border)]">
                  <th className="py-4 px-6 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider w-[300px]">{t("bm.contact.col.source")}</th>
                  <th className="py-4 px-6 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{t("bm.contact.col.type")}</th>
                  <th className="py-4 px-6 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{t("bm.contact.col.status")}</th>
                  <th className="py-4 px-6 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{t("bm.contact.col.assignee")}</th>
                  <th className="py-4 px-6 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{t("bm.contact.col.lastReply")}</th>
                  <th className="py-4 px-6 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-right">{t("bm.contact.col.detail")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {displayContacts.map(contact => (
                  <tr key={contact.id} onClick={() => setActiveContact(contact)} className={`cursor-pointer transition-colors ${activeContact?.id === contact.id ? "bg-[var(--color-brand-subtle)]" : "hover:bg-[var(--color-bg-surface-raised)]"}`}>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                          <span className={`px-2 py-0.5 rounded capitalize bg-[var(--color-bg-surface-high)] border border-[var(--color-border)]`}>
                            {contact.platform}
                          </span>
                          <span className="truncate max-w-[150px]" title={contact.author}>{contact.author}</span>
                        </div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-2 mt-1">"{contact.content}"</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                          contact.type === 'crisis' ? 'bg-[var(--color-error-subtle)] text-[var(--color-error)]' :
                          contact.type === 'lead' ? 'bg-[var(--color-info-subtle)] text-[var(--color-info)]' :
                          'bg-[var(--color-bg-surface-high)] text-[var(--color-text-secondary)]'
                        }`}>
                          {contact.type}
                        </span>
                        {contact.type === 'crisis' && (
                          <div className={`flex items-center gap-1 text-[10px] font-bold ${contact.priority === 'critical' ? 'text-[var(--color-error)]' : 'text-[var(--color-warning)]'}`}>
                            <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                            {contact.priority}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          contact.status === 'new' ? 'bg-[var(--color-info)] animate-pulse' :
                          contact.status === 'processing' ? 'bg-[var(--color-warning)]' :
                          contact.status === 'escalated' ? 'bg-[var(--color-error)] animate-bounce' :
                          'bg-[var(--color-success)]'
                        }`}></div>
                        <span className="text-xs font-bold text-[var(--color-text-primary)] capitalize">{contact.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {contact.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#9B8FF8] flex items-center justify-center text-[10px] text-white font-bold">
                            {MOCK_TEAM[contact.assignee].charAt(0)}
                          </div>
                          <span className="text-xs font-semibold text-[var(--color-text-secondary)] truncate max-w-[100px]">{MOCK_TEAM[contact.assignee]}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-[var(--color-warning)] bg-[var(--color-warning-subtle)] px-2 py-1 rounded">{t("bm.contact.unassigned")}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-[var(--color-text-secondary)]">
                      {new Date(contact.lastReplyAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="w-8 h-8 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] transition-colors inline-flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 2: GIÁM SÁT KHỦNG HOẢNG (CRISIS MODE) */}
      {viewMode === "crisis_mode" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crisisContacts.map(crisis => {
            const isCritical = crisis.priority === "critical";
            const isEscalated = crisis.status === "escalated";
            const slaPct = Math.min(100, (crisis.slaElapsed / crisis.slaLimit) * 100);
            
            return (
              <div key={crisis.id} onClick={() => setActiveContact(crisis)} className={`glass-card rounded-2xl overflow-hidden border-2 cursor-pointer transition-transform hover:-translate-y-1 ${isEscalated ? "border-[var(--color-error)] shadow-[0_0_15px_rgba(255,59,48,0.2)]" : isCritical ? "border-[var(--color-error)]" : "border-[var(--color-warning)]"}`}>
                
                {/* Header Card */}
                <div className={`p-3 ${isEscalated ? "bg-[var(--color-error)] text-white" : isCritical ? "bg-[var(--color-error-subtle)] text-[var(--color-error)]" : "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"} flex items-center justify-between`}>
                  <div className="flex items-center gap-2 font-bold text-sm uppercase">
                    <span className="material-symbols-outlined text-[18px]">
                      {isEscalated ? "campaign" : isCritical ? "local_fire_department" : "warning"}
                    </span>
                    {isEscalated ? t("bm.contact.escalated") : crisis.priority}
                  </div>
                  <span className="text-xs font-bold opacity-80">{new Date(crisis.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                {/* Body Card */}
                <div className="p-5 bg-[var(--color-bg-surface)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-bg-surface-high)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">{crisis.platform}</span>
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">{crisis.author}</span>
                  </div>
                  <p className="text-sm text-[var(--color-text-primary)] font-medium line-clamp-3 mb-4">
                    "{crisis.content}"
                  </p>
                  
                  {/* SLA Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-[var(--color-text-muted)]">{t("bm.contact.sla")}</span>
                      <span className={`${slaPct > 80 ? "text-[var(--color-error)]" : "text-[var(--color-text-secondary)]"}`}>{crisis.slaElapsed}m / {crisis.slaLimit}m</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--color-bg-surface-raised)] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${slaPct > 80 ? "bg-[var(--color-error)]" : slaPct > 50 ? "bg-[var(--color-warning)]" : "bg-[var(--color-success)]"}`} style={{ width: `${slaPct}%` }}></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {crisis.assignee ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-[10px] text-white font-bold">{MOCK_TEAM[crisis.assignee].charAt(0)}</div>
                          <span className="text-xs font-semibold text-[var(--color-text-secondary)] truncate max-w-[80px]">{MOCK_TEAM[crisis.assignee]}</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-[var(--color-error)]">Unassigned</span>
                      )}
                    </div>
                    
                    {/* Brand Manager Interventions */}
                    <div className="flex items-center gap-1">
                      <button className="w-8 h-8 rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center hover:bg-[var(--color-brand)] hover:text-white transition-colors" title="Reassign">
                        <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-[var(--color-error-subtle)] text-[var(--color-error)] flex items-center justify-center hover:bg-[var(--color-error)] hover:text-white transition-colors" title="Comment Khẩn">
                        <span className="material-symbols-outlined text-[16px]">add_comment</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHI TIẾT CONTACT SLIDER (Hiển thị khi chọn 1 contact) */}
      <div className={`fixed inset-y-0 right-0 w-[500px] bg-[var(--color-bg-surface)] shadow-2xl border-l border-[var(--color-border)] z-50 transform transition-transform duration-300 ease-in-out ${activeContact ? "translate-x-0" : "translate-x-full"}`}>
        {activeContact && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t("bm.contact.detail.title")}</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">ID: {activeContact.id.toUpperCase()} • {t("bm.contact.detail.source")} {activeContact.source}</p>
              </div>
              <button onClick={() => setActiveContact(null)} className="w-8 h-8 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors border border-[var(--color-border)]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Box Rủi ro & Ưu tiên */}
              {activeContact.type === "crisis" && (
                <div className="p-4 rounded-xl border border-[var(--color-error-border,rgba(255,59,48,0.3))] bg-[var(--color-error-subtle)]">
                  <div className="flex items-center gap-2 mb-2 text-[var(--color-error)] font-bold text-sm">
                    <span className="material-symbols-outlined">warning</span>
                    {t("bm.contact.riskTitle")}
                  </div>
                  <p className="text-xs text-[var(--color-error)] opacity-80 leading-relaxed">
                    Contact này chứa các từ khóa nhạy cảm: "Tẩy chay", "Báo chí", "Nguy hiểm". Tốc độ lan truyền cao trên nền tảng. Yêu cầu ưu tiên phản hồi trong vòng 30 phút.
                  </p>
                </div>
              )}

              {/* Thông tin Contact */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-[var(--color-text-muted)]">account_circle</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)]">{activeContact.author}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">{activeContact.platform} User</p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${activeContact.type === 'crisis' ? 'bg-[var(--color-error-subtle)] text-[var(--color-error)]' : 'bg-[var(--color-info-subtle)] text-[var(--color-info)]'}`}>{activeContact.type}</span>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${activeContact.status === 'escalated' ? 'bg-[var(--color-error)] text-white' : 'bg-[var(--color-bg-surface-high)] text-[var(--color-text-secondary)]'}`}>{activeContact.status}</span>
                  </div>
                </div>
                
                <div className="p-4 bg-[var(--color-bg-surface-raised)] rounded-xl border border-[var(--color-border)]">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] italic leading-relaxed">
                    "{activeContact.content}"
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-2">{t("bm.contact.detail.created")} {new Date(activeContact.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <hr className="border-[var(--color-border)]" />

              {/* Timeline / Lịch sử tương tác */}
              <div>
                <h3 className="font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[var(--color-brand)]">history</span>
                  {t("bm.contact.timeline.title")}
                </h3>
                
                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--color-border)] before:to-transparent">
                  {MOCK_TIMELINE.map((event, index) => (
                    <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-6">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--color-bg-surface)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
                        event.type === 'created' ? 'bg-[var(--color-info)] text-white' : 
                        event.type === 'escalated' ? 'bg-[var(--color-error)] text-white' : 
                        event.type === 'note' ? 'bg-[var(--color-warning)] text-white' : 
                        'bg-[var(--color-brand)] text-white'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {event.type === 'created' ? 'add' : event.type === 'escalated' ? 'campaign' : event.type === 'note' ? 'edit_note' : 'autorenew'}
                        </span>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[var(--color-text-primary)]">{event.user}</span>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-sans">{event.time}</span>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)]">{event.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment Box (Khu vực ghi chú/thảo luận nội bộ) */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center text-xs font-bold shrink-0">BM</div>
                <div className="flex-1">
                  <textarea 
                    placeholder={t("bm.contact.comment.placeholder")}
                    className="w-full h-20 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-sm focus:border-[var(--color-brand)] outline-none resize-none"
                  ></textarea>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-2">
                      <button className="w-7 h-7 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)] flex items-center justify-center"><span className="material-symbols-outlined text-[16px]">attach_file</span></button>
                      <button className="w-7 h-7 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)] flex items-center justify-center"><span className="material-symbols-outlined text-[16px]">alternate_email</span></button>
                    </div>
                    <button className="px-4 py-1.5 bg-[var(--color-brand)] text-white text-xs font-bold rounded-lg hover:opacity-90 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">send</span> {t("bm.contact.comment.send")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
