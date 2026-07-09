"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, GripHorizontal } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard.store";

export function LeadTable() {
  const { getFilteredLeads } = useDashboardStore();
  const rawLeads = getFilteredLeads();
  
  // Phân trang đơn giản (10 leads / trang)
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(rawLeads.length / itemsPerPage);
  
  const leads = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return rawLeads.slice(start, start + itemsPerPage);
  }, [rawLeads, page]);

  const getAvatarInitials = (name?: string) => {
    if (!name) return "KH";
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarBg = (id: string) => {
    const charCode = id.charCodeAt(id.length - 1) || 0;
    if (charCode % 3 === 0) return "bg-[#B0A2FF] text-[#1A1B20]";
    if (charCode % 3 === 1) return "bg-[#C8C4D6] text-[#1A1B20]";
    return "bg-[#EEEDF4] text-[#474554]";
  };

  const getScoreInfo = (intent: string) => {
    switch (intent) {
      case "hot":
        return { score: 95, color: "text-[#BA1A1A]", bg: "#BA1A1A", tag: "KHÁCH NÓNG", tagStyle: "bg-[#FFDAD6] text-[#410002]" };
      case "warm":
        return { score: 65, color: "text-[#4234B6]", bg: "#4234B6", tag: "ĐANG QUAN TÂM", tagStyle: "bg-[#E2DFFF] text-[#0F0069]" };
      default:
        return { score: 35, color: "text-[#5F52A8]", bg: "#5F52A8", tag: "THU THẬP THÊM", tagStyle: "bg-[#EEEDF4] text-[#474554]" };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "new": return { label: "Mới tiếp nhận", dot: "bg-[#BA1A1A]", ping: true, text: "text-[#1A1B20]" };
      case "processing": return { label: "Đang tư vấn", dot: "bg-[#4234B6]", ping: true, text: "text-[#1A1B20]" };
      case "completed": return { label: "Đã chốt", dot: "bg-[#22C55E]", ping: false, text: "text-[#474554]" };
      case "skipped": return { label: "Bỏ qua", dot: "bg-[#787585]", ping: false, text: "text-[#474554]" };
      default: return { label: "Chưa rõ", dot: "bg-[#787585]", ping: false, text: "text-[#474554]" };
    }
  };

  const calculateResponseTime = (created: string, firstContacted?: string) => {
    if (!firstContacted) return null;
    const diff = new Date(firstContacted).getTime() - new Date(created).getTime();
    if (diff < 0) return "0 phút";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút`;
    return `${Math.floor(mins / 60)} giờ`;
  };

  return (
    <div className="flex flex-col rounded-[16px] border border-[#E9E7EE] bg-[#FFFFFF] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9E7EE] px-6 py-5">
        <h2 className="font-['Hanken_Grotesk'] text-[16px] font-bold text-[#1A1B20]">
          Danh sách khách hàng tiềm năng gần đây ({rawLeads.length})
        </h2>
        <span className="text-[12px] italic text-[#787585]">
          Chế độ giám sát (Chỉ đọc)
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-['Inter'] min-w-[800px]">
          <thead className="bg-[#F4F3FA]">
            <tr>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#474554]">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#474554] w-[280px]">
                Nội dung / Nguồn
              </th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#474554]">
                Điểm / Nhãn
              </th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#474554]">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#474554]">
                Nhân sự phụ trách
              </th>
              <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#474554]">
                Phản hồi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E7EE]">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#787585]">
                  Không có dữ liệu phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const scoreInfo = getScoreInfo(lead.intent);
                const statusInfo = getStatusInfo(lead.status);
                const responseTime = calculateResponseTime(lead.created_at, lead.first_contacted_at);

                return (
                  <tr 
                    key={lead.id} 
                    className="group transition-colors duration-200 hover:bg-[#F4F3FA]"
                  >
                    {/* Khách hàng */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${getAvatarBg(lead.id)}`}>
                          {getAvatarInitials(lead.author)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-[#1A1B20]">{lead.author}</span>
                          <span className="text-[12px] text-[#787585] mt-0.5" title={lead.id}>Lead ID: {lead.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Nội dung / Nguồn */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex max-w-[280px] flex-col gap-1.5">
                        <span className="text-[14px] text-[#1A1B20] italic line-clamp-3">"{lead.content}"</span>
                        <div className="flex items-center gap-1.5 text-[12px] text-[#787585] mt-1 capitalize">
                          {lead.platform === "facebook" ? (
                            <GripHorizontal className="h-3.5 w-3.5" />
                          ) : (
                            <MessageSquare className="h-3.5 w-3.5" />
                          )}
                          <span>{lead.platform}</span>
                        </div>
                      </div>
                    </td>

                    {/* Điểm / Nhãn */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[14px] font-bold ${scoreInfo.color}`}>
                            {scoreInfo.score}/100
                          </span>
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#EEEDF4]">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${scoreInfo.score}%`, 
                                backgroundColor: scoreInfo.bg
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${scoreInfo.tagStyle}`}>
                            {scoreInfo.tag}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2 mt-1">
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          {statusInfo.ping && (
                            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusInfo.dot} opacity-75`}></span>
                          )}
                          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${statusInfo.dot}`}></span>
                        </span>
                        <span className={`text-[13px] font-semibold ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </td>

                    {/* Nhân sự phụ trách */}
                    <td className="px-6 py-4 align-top">
                      <div className="mt-1 flex items-center gap-2">
                        {lead.owner_name ? (
                          <>
                            <img 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(lead.owner_name)}&background=E9E7EE&color=4234B6`} 
                              alt={lead.owner_name}
                              className="h-6 w-6 rounded-full"
                            />
                            <span className="text-[14px] font-medium text-[#1A1B20]">{lead.owner_name}</span>
                          </>
                        ) : (
                          <span className="text-[13px] italic text-[#787585]">Chưa phân bổ</span>
                        )}
                      </div>
                    </td>

                    {/* Phản hồi */}
                    <td className="px-6 py-4 align-top">
                      <div className="mt-1">
                        {responseTime ? (
                          <span className="text-[14px] font-medium text-[#4234B6]">{responseTime}</span>
                        ) : (
                          <span className="text-[14px] text-[#787585]">--</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="flex items-center justify-between border-t border-[#E9E7EE] px-6 py-4">
        <span className="text-[13px] text-[#787585]">
          Hiển thị {leads.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} đến {Math.min(page * itemsPerPage, rawLeads.length)} trong {rawLeads.length}
        </span>
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#474554] transition-colors hover:bg-[#EEEDF4] hover:text-[#1A1B20] disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button 
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#474554] transition-colors hover:bg-[#EEEDF4] hover:text-[#1A1B20] disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
