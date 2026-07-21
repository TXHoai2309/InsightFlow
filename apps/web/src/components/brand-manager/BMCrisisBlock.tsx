"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/types/dashboard";
import { LineChart, Line, ResponsiveContainer } from "recharts";

// Extended Alert interface to match our derived data
interface ExtendedAlert extends Alert {
  venue_name?: string;
  original_content?: string;
}

interface BMCrisisBlockProps {
  alerts: ExtendedAlert[];
}

const STAFF_LIST = [
  { id: "s1", name: "Nguyễn Văn A", role: "Nhân viên xử lý khủng hoảng", status: "online" },
  { id: "s2", name: "Trần Thị B", role: "Nhân viên xử lý khủng hoảng", status: "busy" },
  { id: "s3", name: "Lê Văn C", role: "Quản lý ca", status: "offline" },
];

export function BMCrisisBlock({ alerts }: BMCrisisBlockProps) {
  const { t } = useTranslation();
  
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [assignModalOpen, setAssignModalOpen] = useState<string | null>(null);
  
  // Mock audit logs state: map of alertId -> array of log strings
  const [auditLogs, setAuditLogs] = useState<Record<string, string[]>>({});
  // Mock local status
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});

  const handleStatusChange = (alertId: string, newStatus: string) => {
    setLocalStatus(prev => ({ ...prev, [alertId]: newStatus }));
    const log = `Đã đổi sang "${newStatus === 'resolved' ? 'Đã xử lý' : newStatus === 'acknowledged' ? 'Đang xử lý' : 'Mới'}" bởi You lúc ${new Date().toLocaleTimeString('vi-VN')}`;
    setAuditLogs(prev => ({
      ...prev,
      [alertId]: [log, ...(prev[alertId] || [])]
    }));
  };

  const filteredAlerts = alerts.filter(a => severityFilter === "all" || a.severity === severityFilter);

  // Colors: Thấp (vàng), Trung bình (cam), Cao/Nghiêm trọng (đỏ)
  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-red-50 text-red-600 border-red-100";
      case "medium":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "low":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getSeverityLabel = (sev: string) => {
    switch (sev) {
      case "critical": return "Nghiêm trọng";
      case "high": return "Cao";
      case "medium": return "Trung bình";
      case "low": return "Thấp";
      default: return sev;
    }
  };

  // Mock mini sparkline data
  const sparklineData = Array.from({ length: 7 }).map((_, i) => ({
    name: `Ngày ${i + 1}`,
    value: Math.floor(Math.random() * 5) + (i > 4 ? 2 : 0)
  }));

  const totalHigh = alerts.filter(a => a.severity === "high" || a.severity === "critical").length;

  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 relative">
      <div className="absolute top-4 right-6 text-[11px] text-[var(--color-text-muted)] font-medium">
        Cập nhật lúc: {new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Header */}
      <div className="mb-6 mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--color-text-primary)]">
            <i className="ti ti-alert-triangle text-red-500 mr-2 text-[20px] align-middle"></i>
            {t("bm.crisis.title")}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
            {t("bm.crisis.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-[12px] border border-[var(--color-border)] bg-transparent rounded-lg px-2 py-1.5 outline-none font-medium"
          >
            <option value="all">Mọi mức độ</option>
            <option value="critical">Nghiêm trọng</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[24px] font-bold text-[var(--color-text-primary)] leading-none">
                {totalHigh}
              </div>
              <div className="text-[11px] font-medium text-red-500">cảnh báo cao</div>
            </div>
            <div className="h-10 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center">
            <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <i className="ti ti-check text-3xl text-green-500"></i>
            </div>
            <h3 className="text-[16px] font-bold text-[var(--color-text-primary)] mb-1">An toàn tuyệt đối! 🎉</h3>
            <p className="text-[13px] text-[var(--color-text-secondary)]">Không có cảnh báo nào trong khoảng thời gian này.</p>
          </div>
        ) : (
          <table className="w-full min-w-[600px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="pb-3 font-semibold text-[var(--color-text-secondary)] w-1/3">Cảnh báo & Nội dung gốc</th>
                <th className="pb-3 font-semibold text-[var(--color-text-secondary)]">Chi nhánh</th>
                <th className="pb-3 font-semibold text-[var(--color-text-secondary)]">Mức độ</th>
                <th className="pb-3 font-semibold text-[var(--color-text-secondary)]">Trạng thái</th>
                <th className="pb-3 font-semibold text-[var(--color-text-secondary)]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredAlerts.map((alert) => {
                const currentStatus = localStatus[alert.id] || alert.status;
                const logs = auditLogs[alert.id] || [];
                return (
                  <tr key={alert.id}>
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-[var(--color-text-primary)] mb-1">{alert.message}</div>
                      {alert.original_content && (
                        <div className="text-[12px] text-[var(--color-text-muted)] italic line-clamp-2 bg-[var(--color-bg-surface-raised)] p-2 rounded-md border border-[var(--color-border)]">
                          “{alert.original_content}”
                        </div>
                      )}
                    </td>
                    <td className="py-4 font-medium text-[var(--color-text-primary)]">
                      {alert.venue_name || "Chưa rõ"}
                    </td>
                    <td className="py-4">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${getSeverityStyle(alert.severity)}`}>
                        {getSeverityLabel(alert.severity)}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="relative group/status">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(alert.id, e.target.value)}
                          className="bg-transparent border border-[var(--color-border)] rounded px-2 py-1 outline-none font-medium cursor-pointer"
                        >
                          <option value="new">Mới</option>
                          <option value="acknowledged">Đang xử lý</option>
                          <option value="resolved">Đã xử lý</option>
                        </select>
                        
                        {logs.length > 0 && (
                          <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all">
                            <h4 className="text-[11px] font-bold text-[var(--color-text-primary)] mb-2 uppercase tracking-wider">Lịch sử cập nhật</h4>
                            <ul className="space-y-1.5 max-h-[150px] overflow-y-auto">
                              {logs.map((log, i) => (
                                <li key={i} className="text-[11px] text-[var(--color-text-secondary)] flex items-start gap-1.5">
                                  <i className="ti ti-history text-[13px] mt-0.5"></i> {log}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => setAssignModalOpen(alert.id)}
                        className="rounded-lg bg-[var(--color-brand-subtle)] px-3 py-1.5 font-semibold text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white"
                      >
                        Giao xử lý
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[450px] max-w-[90vw] rounded-xl bg-[var(--color-bg-surface)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-[18px] font-bold text-[var(--color-text-primary)]">
                Phân công nhân sự
              </h3>
              <button onClick={() => setAssignModalOpen(null)} className="text-[var(--color-text-muted)] hover:text-red-500 transition">
                <i className="ti ti-x text-xl"></i>
              </button>
            </div>
            
            <p className="text-[13px] text-[var(--color-text-secondary)] mb-4">
              Chọn nhân viên để xử lý cảnh báo này. Danh sách hiển thị các nhân sự có nghiệp vụ “Xử lý khủng hoảng”.
            </p>

            <div className="space-y-2 mb-6">
              {STAFF_LIST.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-lg hover:border-[var(--color-brand)]/50 cursor-pointer transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center font-bold">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[14px] text-[var(--color-text-primary)] flex items-center gap-2">
                        {staff.name}
                        {staff.status === "online" && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                        {staff.status === "busy" && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                      </div>
                      <div className="text-[12px] text-[var(--color-text-muted)]">{staff.role}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      alert(`Đã giao cho ${staff.name}!`);
                      setAssignModalOpen(null);
                    }}
                    className="text-[12px] font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-brand)] hover:text-white transition"
                  >
                    Chọn
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button onClick={() => setAssignModalOpen(null)} className="px-4 py-2 font-semibold text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
