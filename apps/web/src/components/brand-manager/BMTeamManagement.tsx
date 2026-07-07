"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";

type ViewMode = "list" | "kanban";

interface MockStaff {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "online" | "offline" | "busy";
  permissions: string[];
  avatarUrl?: string;
  stats: {
    activeContacts: number;
    completedToday: number;
    avgResponseTime: string;
    onTimeRate: number;
    qualityScore: number;
  };
}

const MOCK_TEAM: MockStaff[] = [
  { id: "s1", name: "Nguyễn Văn A", email: "nva@insightflow.com", role: "Crisis Handler", status: "online", permissions: ["alerts", "mentions"], stats: { activeContacts: 12, completedToday: 8, avgResponseTime: "15m", onTimeRate: 98, qualityScore: 4.8 } },
  { id: "s2", name: "Trần Thị B", email: "ttb@insightflow.com", role: "Lead Handler", status: "busy", permissions: ["leads", "mentions"], stats: { activeContacts: 25, completedToday: 42, avgResponseTime: "5m", onTimeRate: 95, qualityScore: 4.9 } },
  { id: "s3", name: "Lê Văn C", email: "lvc@insightflow.com", role: "Moderator", status: "offline", permissions: ["mentions", "reports"], stats: { activeContacts: 0, completedToday: 150, avgResponseTime: "2m", onTimeRate: 100, qualityScore: 4.7 } },
];

export function BMTeamManagement() {
  const { t } = useTranslation();
  const { alerts, leads, filters } = useDashboardStore();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("all");
  
  // Modal States
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeStaff, setActiveStaff] = useState<MockStaff | null>(null);

  const displayTeam = useMemo(() => {
    return MOCK_TEAM.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  // Giả lập Tasks cho Kanban & Assignment
  const mockTasks = useMemo(() => {
    return [
      { id: "t1", title: "Cảnh báo bùng phát thảo luận tiêu cực", status: "new", assignee: null, type: "crisis" },
      { id: "t2", title: "Khách hàng hỏi giá sản phẩm", status: "processing", assignee: "s2", type: "lead" },
      { id: "t3", title: "Review 1 sao về thái độ phục vụ", status: "pending", assignee: "s1", type: "crisis" },
      { id: "t4", title: "Bài đăng viral phàn nàn chất lượng", status: "overdue", assignee: "s1", type: "crisis" },
      { id: "t5", title: "Khách hàng muốn đặt bàn số lượng lớn", status: "completed", assignee: "s2", type: "lead" },
    ];
  }, []);

  const filteredTasks = useMemo(() => {
    if (selectedStaffFilter === "all") return mockTasks;
    if (selectedStaffFilter === "unassigned") return mockTasks.filter(t => !t.assignee);
    return mockTasks.filter(t => t.assignee === selectedStaffFilter);
  }, [mockTasks, selectedStaffFilter]);

  const columns = [
    { id: "new", label: t("bm.team.kanban.new"), color: "var(--color-info)" },
    { id: "processing", label: t("bm.team.kanban.processing"), color: "var(--color-brand)" },
    { id: "pending", label: t("bm.team.kanban.pending"), color: "var(--color-warning)" },
    { id: "completed", label: t("bm.team.kanban.completed"), color: "var(--color-success)" },
    { id: "overdue", label: t("bm.team.kanban.overdue"), color: "var(--color-error)" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* TOOLBAR */}
      <div className="glass-card rounded-2xl p-4 bg-[var(--color-bg-surface)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[var(--color-bg-surface-raised)] p-1 rounded-xl border border-[var(--color-border)]">
          <button 
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "list" ? "bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand-subtle)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)]"}`}
          >
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            {t("bm.team.viewList")}
          </button>
          <button 
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "kanban" ? "bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand-subtle)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)]"}`}
          >
            <span className="material-symbols-outlined text-[18px]">view_kanban</span>
            {t("bm.team.viewKanban")}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === "kanban" && (
            <select 
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-sm focus:border-[var(--color-brand)] outline-none"
            >
              <option value="all">{t("bm.team.filterAll")}</option>
              <option value="unassigned">{t("bm.team.filterUnassigned")}</option>
              {MOCK_TEAM.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}

          {viewMode === "list" && (
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-[18px]">search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("bm.team.search")}
                className="pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-sm focus:border-[var(--color-brand)] outline-none w-[200px]"
              />
            </div>
          )}

          <button 
            onClick={() => { setActiveStaff(null); setShowStaffModal(true); }}
            className="px-4 py-2 rounded-lg bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-semibold hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            {t("bm.team.addStaff")}
          </button>
        </div>
      </div>

      {/* VIEW: LIST */}
      {viewMode === "list" && (
        <div className="glass-card rounded-2xl overflow-hidden bg-[var(--color-bg-surface)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg-surface-raised)] border-b border-[var(--color-border)]">
                  <th className="py-4 px-6 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{t("bm.team.col.staff")}</th>
                  <th className="py-4 px-6 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{t("bm.team.col.role")}</th>
                  <th className="py-4 px-6 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider w-[250px]">{t("bm.team.col.workload")}</th>
                  <th className="py-4 px-6 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{t("bm.team.col.perf")}</th>
                  <th className="py-4 px-6 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-right">{t("bm.team.col.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {displayTeam.map(staff => (
                  <tr key={staff.id} className="hover:bg-[var(--color-bg-surface-raised)] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#9B8FF8] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {staff.name.charAt(0)}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--color-bg-surface)] ${
                            staff.status === "online" ? "bg-[var(--color-success)]" :
                            staff.status === "busy" ? "bg-[var(--color-warning)]" : "bg-gray-400"
                          }`}></span>
                        </div>
                        <div>
                          <div className="font-bold text-[var(--color-text-primary)]">{staff.name}</div>
                          <div className="text-xs text-[var(--color-text-secondary)]">{staff.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-sm text-[var(--color-text-primary)] mb-1">{staff.role}</div>
                      <div className="flex gap-1 flex-wrap max-w-[150px]">
                        {staff.permissions.map(p => (
                          <span key={p} className="px-2 py-0.5 bg-[var(--color-bg-surface-high)] rounded border border-[var(--color-border)] text-[10px] uppercase font-bold text-[var(--color-text-muted)]">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-full">
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-[var(--color-text-secondary)]">{t("bm.team.active")}: <strong className="text-[var(--color-brand)]">{staff.stats.activeContacts} cases</strong></span>
                          <span className="text-[var(--color-text-secondary)]">{staff.stats.completedToday} {t("bm.team.done")}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--color-brand)] rounded-full" style={{ width: `${Math.min(100, (staff.stats.activeContacts / 30) * 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--color-text-muted)]">{t("bm.team.response")}</span>
                          <span className="font-bold text-[var(--color-text-primary)]">{staff.stats.avgResponseTime}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--color-text-muted)]">{t("bm.team.ontime")}</span>
                          <span className="font-bold text-[var(--color-success)]">{staff.stats.onTimeRate}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--color-text-muted)]">{t("bm.team.quality")}</span>
                          <span className="font-bold text-amber-500 flex items-center gap-0.5"><i className="ti ti-star-filled text-[10px]"></i>{staff.stats.qualityScore}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setActiveStaff(staff); setShowAssignModal(true); }}
                          className="px-3 py-1.5 rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-brand)] text-xs font-bold hover:bg-[var(--color-brand)] hover:text-white transition-colors"
                        >
                          {t("bm.team.assign")}
                        </button>
                        <button 
                          onClick={() => { setActiveStaff(staff); setShowStaffModal(true); }}
                          className="w-7 h-7 flex items-center justify-center rounded bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded bg-[var(--color-error-subtle)] text-[var(--color-error)] transition-colors">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: KANBAN */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="flex flex-col gap-3 min-w-[280px]">
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: `2px solid ${col.color}` }}>
                  <h3 className="font-bold text-[var(--color-text-primary)] text-sm">{col.label}</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]">
                    {colTasks.length}
                  </span>
                </div>
                
                <div className="flex flex-col gap-3 min-h-[300px] p-2 bg-[var(--color-bg-surface)] bg-opacity-50 rounded-xl border border-[var(--color-border)] border-dashed">
                  {colTasks.map(task => (
                    <div key={task.id} className="glass-card rounded-xl p-3 bg-[var(--color-bg-surface)] cursor-grab hover:shadow-lg transition-all border-l-4" style={{ borderLeftColor: col.color }}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${task.type === "crisis" ? "bg-[var(--color-error-subtle)] text-[var(--color-error)]" : "bg-[var(--color-info-subtle)] text-[var(--color-info)]"}`}>
                          {task.type}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug line-clamp-2">{task.title}</p>
                      <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5" title={MOCK_TEAM.find(s => s.id === task.assignee)?.name}>
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#9B8FF8] flex items-center justify-center text-[8px] text-white font-bold">
                              {MOCK_TEAM.find(s => s.id === task.assignee)?.name.charAt(0)}
                            </div>
                            <span className="text-[10px] font-medium text-[var(--color-text-secondary)] truncate max-w-[80px]">
                              {MOCK_TEAM.find(s => s.id === task.assignee)?.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-[var(--color-warning)] bg-[var(--color-warning-subtle)] px-2 py-0.5 rounded-full">Unassigned</span>
                        )}
                        <span 
                          onClick={() => { setActiveStaff(MOCK_TEAM.find(s => s.id === task.assignee) || null); setShowAssignModal(true); }}
                          className="material-symbols-outlined text-[14px] text-[var(--color-text-muted)] hover:text-[var(--color-brand)] cursor-pointer"
                        >
                          assignment_ind
                        </span>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && <p className="text-center text-xs text-[var(--color-text-muted)] py-4 opacity-50">{t("bm.team.kanban.dragHint")}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Thêm/Sửa Nhân sự & Phân quyền */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card bg-[var(--color-bg-surface)] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">
              {activeStaff ? t("bm.team.modal.editTitle") : t("bm.team.modal.addTitle")}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-1.5">{t("bm.team.modal.fullName")}</label>
                <input type="text" defaultValue={activeStaff?.name} className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]" placeholder={t("bm.team.modal.fullName")} />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-1.5">{t("bm.team.modal.email")}</label>
                <input type="email" defaultValue={activeStaff?.email} className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]" placeholder="email@insightflow.com" />
              </div>

              <div>
                <label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-1.5">{t("bm.team.modal.role")}</label>
                <select defaultValue={activeStaff?.role || "Crisis Handler"} className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]">
                  <option value="Crisis Handler">{t("bm.team.role.crisis")}</option>
                  <option value="Lead Handler">{t("bm.team.role.lead")}</option>
                  <option value="Moderator">{t("bm.team.role.mod")}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-2">{t("bm.team.modal.permissions")}</label>
                <div className="grid grid-cols-2 gap-3 bg-[var(--color-bg-surface-raised)] p-3 rounded-xl border border-[var(--color-border)]">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)]">
                    <input type="checkbox" defaultChecked={activeStaff?.permissions.includes("alerts")} className="accent-[var(--color-brand)] w-4 h-4" />
                    {t("bm.team.modal.perm.alerts")}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)]">
                    <input type="checkbox" defaultChecked={activeStaff?.permissions.includes("leads")} className="accent-[var(--color-brand)] w-4 h-4" />
                    {t("bm.team.modal.perm.leads")}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)]">
                    <input type="checkbox" defaultChecked={activeStaff?.permissions.includes("mentions")} className="accent-[var(--color-brand)] w-4 h-4" />
                    {t("bm.team.modal.perm.mentions")}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)]">
                    <input type="checkbox" defaultChecked={activeStaff?.permissions.includes("reports")} className="accent-[var(--color-brand)] w-4 h-4" />
                    {t("bm.team.modal.perm.reports")}
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowStaffModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] transition-colors">
                {t("bm.team.modal.cancel")}
              </button>
              <button onClick={() => setShowStaffModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-brand)] text-white hover:bg-[#5a52d5] shadow-lg shadow-[var(--color-brand-subtle)] transition-all">
                {t("bm.team.modal.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Phân công công việc (Assignment) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card bg-[var(--color-bg-surface)] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{t("bm.team.assign.title")}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">{t("bm.team.assign.desc")}</p>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-1.5">{t("bm.team.assign.selectCase")}</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]">
                  <option value="">{t("bm.team.assign.selectCaseDefault") || "-- Chọn công việc --"}</option>
                  {mockTasks.filter(t => !t.assignee || activeStaff).map(t => (
                    <option key={t.id} value={t.id}>[{t.type.toUpperCase()}] {t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-1.5">{t("bm.team.assign.selectStaff")}</label>
                <select defaultValue={activeStaff?.id || ""} className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]">
                  <option value="">{t("bm.team.assign.selectStaffDefault") || "-- Chọn nhân sự --"}</option>
                  {MOCK_TEAM.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              {/* Auto-suggest Box */}
              <div className="bg-[var(--color-info-subtle)] border border-[var(--color-info)] border-opacity-30 p-3 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-[var(--color-info)] text-[20px] mt-0.5">lightbulb</span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-info)] mb-1">{t("bm.team.assign.aiSuggest")}</p>
                  <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                    {t("bm.team.assign.aiSuggestDesc") || "Nên giao việc này cho Lê Văn C. Hiện tại Lê Văn C đang có tải công việc thấp nhất (0 active cases) và có đủ thẩm quyền xử lý."}
                  </p>
                  <button className="mt-2 text-xs font-bold text-white bg-[var(--color-info)] px-3 py-1 rounded hover:bg-opacity-80 transition">
                    {t("bm.team.assign.aiSuggestAction") || "Gán cho Lê Văn C"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] transition-colors">
                {t("bm.team.modal.cancel")}
              </button>
              <button onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-brand)] text-white hover:bg-[#5a52d5] shadow-lg shadow-[var(--color-brand-subtle)] transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check</span>
                {t("bm.team.assign.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
