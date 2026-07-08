"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboard.store";

export function CrisisTable() {
  const { getFilteredAlerts } = useDashboardStore();
  const alerts = getFilteredAlerts();

  // Chuyển đổi Alert thật sang format hiển thị
  const data = useMemo(() => {
    return alerts.map(alert => {
      // Giả lập Risk Score từ severity
      const riskScore = alert.severity === "critical" ? 95 : alert.severity === "high" ? 85 : alert.severity === "medium" ? 65 : 45;
      
      // Giả lập SLA progress từ thời gian tạo
      const createdTime = new Date(alert.created_at).getTime();
      const now = Date.now();
      const diffMins = Math.floor((now - createdTime) / 60000);
      const limitMins = alert.severity === "critical" ? 60 : alert.severity === "high" ? 120 : 240;

      return {
        id: alert.id,
        title: alert.message,
        platform: "Đa nền tảng",
        riskScore,
        slaUsedMinutes: diffMins,
        slaLimitMinutes: limitMins,
        status: alert.status,
        statusLabel: alert.status === "new" ? "Chưa xử lý" : alert.status === "acknowledged" ? "Đang xử lý" : "Đã giải quyết",
        assignedStaff: null
      };
    });
  }, [alerts]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "SỰ VỤ & NỘI DUNG",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col space-y-1.5 max-w-[320px]">
            <span className="text-[14px] font-bold text-[#1A1B20] leading-tight line-clamp-2">
              {item.title}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "platform",
      header: "NỀN TẢNG",
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white bg-[#4234B6]">
              IF
            </div>
            <span className="text-[13px] font-semibold text-[#1A1B20]">
              InsightFlow AI
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "riskScore",
      header: "RISK SCORE",
      cell: ({ row }) => {
        const score = row.original.riskScore;
        const isHighRisk = score >= 80;
        
        return (
          <Badge
            variant="outline"
            className={cn(
              "border-none px-2.5 py-1 text-[13px] font-bold",
              isHighRisk ? "bg-[#FFDAD6] text-[#BA1A1A]" : "bg-orange-100 text-orange-700"
            )}
          >
            {score}/100
          </Badge>
        );
      },
    },
    {
      id: "slaProgress",
      header: "SLA PROGRESS",
      cell: ({ row }) => {
        const { slaUsedMinutes, slaLimitMinutes } = row.original;
        const percent = Math.min((slaUsedMinutes / slaLimitMinutes) * 100, 100);
        const isExceeded = percent >= 100;
        const colorClass = isExceeded ? "bg-[#BA1A1A]" : (percent > 60 ? "bg-orange-500" : "bg-[#10B981]");
        const textClass = isExceeded ? "text-[#BA1A1A]" : (percent > 60 ? "text-orange-600" : "text-[#10B981]");

        return (
          <div className="flex flex-col space-y-1.5 w-[140px]">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className={textClass}>{slaUsedMinutes}m used</span>
              <span className="text-[#C8C4D6]">—</span>
              <span className="text-[#767586]">{slaLimitMinutes}m limit</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEEDF4]">
              <div
                className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "TRẠNG THÁI",
      cell: ({ row }) => {
        const { status, statusLabel, assignedStaff } = row.original;
        const isAcknowledged = status === "acknowledged";
        
        return (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2 shrink-0">
                {isAcknowledged && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4234B6] opacity-75"></span>
                )}
                <span className={cn("relative inline-flex h-2 w-2 rounded-full", isAcknowledged ? "bg-[#4234B6]" : "bg-[#767586]")}></span>
              </span>
              <span className={cn("text-[13px] font-bold", isAcknowledged ? "text-[#1A1B20]" : "text-[#474554]")}>
                {statusLabel}
              </span>
            </div>
            <div className="pl-4">
              <span className={cn("text-[12px]", isAcknowledged ? "text-[#4234B6] font-semibold" : "text-[#767586] italic")}>
                {assignedStaff ? `- ${assignedStaff}` : "- Chưa phân bổ"}
              </span>
            </div>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="overflow-hidden shadow-[0px_4px_20px_rgba(30,31,36,0.08)] transition-all duration-300 hover:shadow-[0px_8px_30px_rgba(30,31,36,0.12)] border-[#C8C4D6] rounded-xl">
      <div className="border-b border-[#EEEDF4] p-6 bg-white dark:bg-[#1a1b1e]">
        <h2 className="text-[16px] font-['Hanken_Grotesk'] font-bold text-[#1A1B20] dark:text-gray-100">
          Danh sách sự vụ khẩn cấp
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#FAF8FF] text-[#474554] border-b border-[#EEEDF4] dark:bg-[#1a1b1e] dark:border-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap px-6 py-4 text-[11px] font-bold uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[#EEEDF4] bg-white dark:bg-[#1a1b1e] dark:divide-gray-800">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-[#F4F3FA] dark:hover:bg-gray-900/50"
                >
                  {row.getVisibleCells().map((cell) => (
                     <td key={cell.id} className="px-6 py-5 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-[#767586]">
                  Không có sự vụ nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[#EEEDF4] bg-white dark:bg-[#1a1b1e]">
        <button className="flex w-full items-center justify-center space-x-2 px-6 py-4 text-[13px] font-bold text-[#4234B6] transition-colors hover:bg-[#F4F3FA]">
          <span>Xem tất cả báo cáo rủi ro</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
