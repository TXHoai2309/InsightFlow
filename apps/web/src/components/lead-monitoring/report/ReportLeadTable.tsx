"use client";

import React from "react";
import { LeadReportDetailRow, formatMinutes } from "@/lib/lead-report";
import Link from "next/link";
import { ExternalLink, Edit2, History, MessageCircle } from "lucide-react";

interface ReportLeadTableProps {
  detailRows: LeadReportDetailRow[];
}

const getIntentBadge = (intent: string) => {
  switch (intent.toLowerCase()) {
    case "hot":
      return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">Hot</span>;
    case "warm":
      return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">Warm</span>;
    case "cold":
      return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">Cold</span>;
    default:
      return <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">None</span>;
  }
};

const getSlaBadge = (sla: string) => {
  if (sla.includes("Quá hạn") || sla.includes("Trễ")) {
    return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>{sla}</span>;
  }
  if (sla.includes("Chờ")) {
    return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>{sla}</span>;
  }
  if (sla.includes("Trong SLA") || sla.includes("Đúng")) {
    return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{sla}</span>;
  }
  return <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>{sla}</span>;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "new":
      return <span className="text-orange-400 font-bold text-xs uppercase tracking-wider">Mới</span>;
    case "processing":
      return <span className="text-blue-400 font-bold text-xs uppercase tracking-wider">Đang xử lý</span>;
    case "completed":
      return <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Hoàn thành</span>;
    case "skipped":
      return <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Bỏ qua</span>;
    default:
      return <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">{status}</span>;
  }
}

export function ReportLeadTable({ detailRows }: ReportLeadTableProps) {
  return (
    <div className="bg-white dark:bg-[#13111c] border border-gray-200 dark:border-[#262338] rounded-2xl shadow-lg overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-[#262338] flex justify-between items-center bg-gray-50/50 dark:bg-[#1a1826]/50">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">Chi tiết khách hàng</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Danh sách {detailRows.length} lead trong phạm vi báo cáo.</p>
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-[#1a1826] sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">Khách hàng</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">Nguồn</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">Intent</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">Trạng thái</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">Kết quả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#262338]/50">
            {detailRows.slice(0, 50).map((row) => {
              const avatarFallback = row.customer.charAt(0).toUpperCase();
              
              return (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex flex-shrink-0 items-center justify-center text-white font-bold text-sm shadow-inner ring-2 ring-indigo-500/20">
                        {avatarFallback}
                      </div>
                      <div className="min-w-0 max-w-[200px]">
                        <p className="font-bold text-gray-900 dark:text-gray-200 truncate">{row.customer}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5" title={row.content}>{row.content}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{row.platform}</span>
                  </td>
                  <td className="px-5 py-3">
                    {getIntentBadge(row.intent)}
                  </td>
                  <td className="px-5 py-3">
                    {getStatusBadge(row.status)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {row.resultType || "Đang xử lý"}
                    </span>
                  </td>
                </tr>
              );
            })}
            
            {detailRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <MessageCircle className="w-8 h-8 text-gray-600" />
                    <p>Không có khách hàng nào trong phạm vi báo cáo.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {detailRows.length > 50 && (
        <div className="p-4 border-t border-gray-200 dark:border-[#262338] text-center bg-gray-50/50 dark:bg-[#1a1826]/30">
          <p className="text-xs text-gray-500">Hiển thị 50 kết quả đầu tiên.</p>
        </div>
      )}
    </div>
  );
}
