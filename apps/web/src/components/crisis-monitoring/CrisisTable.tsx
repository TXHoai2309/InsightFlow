"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { ArrowRight, X, CheckCircle2, AlertCircle, PlayCircle, RefreshCw, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import type { Mention } from "@/types/dashboard";

// AI Response SOP Templates map
const AI_COPILOT_TEMPLATES: Record<string, string[]> = {
  quality: [
    "Chao ban, InsightFlow xin loi vi trai nghiem chat luong san pham chua dat ky vong. Chung toi da chuyen phan anh nay toi bo phan QA de ra soat va se lien he ho tro som nhat.",
    "Cam on ban da phan hoi. Chung toi ghi nhan van de ve chat luong va xin phep nhan tin rieng de xac minh don hang, chi nhanh va phuong an ho tro phu hop."
  ],
  service: [
    "Chao ban, InsightFlow rat tiec vi trai nghiem phuc vu chua tot. Chung toi da ghi nhan phan anh va se lam viec lai voi ca truc/chi nhanh lien quan de xu ly nghiem tuc.",
    "Cam on ban da gop y ve dich vu. Bo phan CSKH xin phep lien he rieng de nam ro thong tin va ho tro ban nhanh nhat."
  ],
  price: [
    "Chao ban, chung toi ghi nhan phan anh ve gia va se kiem tra lai thong tin niem yet tai chi nhanh. Xin phep lien he rieng de xac minh hoa don va xu ly ro rang.",
    "Cam on ban da phan hoi. Chung toi se ra soat chinh sach gia/khuyen mai dang ap dung va cap nhat lai thong tin chinh xac cho ban."
  ],
  other: [
    "Chao ban, chung toi da tiep nhan phan anh va dang kiem tra chi tiet. Bo phan CSKH se phan hoi lai trong thoi gian som nhat.",
    "InsightFlow rat tiec vi trai nghiem chua tron ven. Xin phep nhan tin rieng de lam ro su viec va dua ra huong xu ly phu hop."
  ]
};

const getCopilotTemplates = (topic: string | null) => {
  if (!topic) return AI_COPILOT_TEMPLATES.other;
  const t = topic.toLowerCase();
  if (t === "quality") return AI_COPILOT_TEMPLATES.quality;
  if (t === "service" || t === "staff" || t === "experience" || t === "delivery") return AI_COPILOT_TEMPLATES.service;
  if (t === "price") return AI_COPILOT_TEMPLATES.price;
  return AI_COPILOT_TEMPLATES.other;
};

export type CrisisTableAlert = {
  id: string;
  message: string;
  severity: string;
  status: string;
  created_at: string;
  assigned_to?: string | null;
};

export function CrisisTable({ alerts, mentions }: { alerts: CrisisTableAlert[]; mentions: Mention[] }) {

  // Local state for interactive mockup updates
  const [staffList, setStaffList] = useState<any[]>([]);
  const [alertStatuses, setAlertStatuses] = useState<Record<string, string>>({});
  const [alertAssignees, setAlertAssignees] = useState<Record<string, string>>({});
  const [selectedRow, setSelectedRow] = useState<any>(null);
  
  // Local state for dynamic resolution logs
  const [alertLogs, setAlertLogs] = useState<Record<string, Array<{ time: string; user: string; text: string }>>>({});
  
  // Local state for copying templates
  const [copiedTemplateIndex, setCopiedTemplateIndex] = useState<number | null>(null);

  // Fetch staff for assignment dropdown
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/staff", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setStaffList(data.data || []);
        }
      } catch (e) {
        console.warn("Failed to fetch staff list:", e);
      }
    };
    fetchStaff();
  }, []);

  // Initialize and add log helper
  const getLogsForAlert = (alertId: string, alertCreatedAt: string) => {
    if (alertLogs[alertId]) return alertLogs[alertId];
    
    // Default initial log
    const detectTime = new Date(alertCreatedAt);
    const timeStr = detectTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return [
      {
        time: timeStr,
        user: "Hệ thống AI",
        text: "Phát hiện sự vụ tiêu cực có độ rủi ro cao"
      }
    ];
  };

  const addLog = (alertId: string, user: string, text: string) => {
    const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    setAlertLogs(prev => {
      const current = prev[alertId] || [];
      const baseLogs = current.length > 0 ? current : [
        {
          time: new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          user: "Hệ thống AI",
          text: "Phát hiện sự vụ tiêu cực có độ rủi ro cao"
        }
      ];
      return {
        ...prev,
        [alertId]: [
          { time: timeStr, user, text },
          ...baseLogs
        ]
      };
    });
  };

  // Sync selected row details if data changes
  const activeSelectedRow = useMemo(() => {
    if (!selectedRow) return null;
    const currentStatus = alertStatuses[selectedRow.id] || selectedRow.status || "new";
    const currentAssigneeUid = alertAssignees[selectedRow.id] || null;
    return {
      ...selectedRow,
      status: currentStatus,
      statusLabel: currentStatus === "new" ? "Chưa xử lý" : currentStatus === "acknowledged" ? "Đang xử lý" : "Đã giải quyết",
      assignedStaffUid: currentAssigneeUid
    };
  }, [selectedRow, alertStatuses, alertAssignees]);

  // Find mentions belonging to this alert topic
  const matchedMentions = useMemo(() => {
    if (!selectedRow) return [];
    const id = selectedRow.id;
    const topic = id.startsWith("derived-") ? id.split("-")[1] : null;
    
    // Get all negative mentions
    const negMentions = mentions.filter(m => m.sentiment === "negative");
    if (!topic || topic === "other") {
      return negMentions.filter(m => !m.topic || m.topic === "other");
    }
    return negMentions.filter(m => m.topic === topic);
  }, [selectedRow, mentions]);

  // Transform alerts to display format
  const data = useMemo(() => {
    return alerts.map(alert => {
      const riskScore = alert.severity === "critical" ? 95 : alert.severity === "high" ? 85 : alert.severity === "medium" ? 65 : 45;
      
      const createdTime = new Date(alert.created_at).getTime();
      const now = Date.now();
      const diffMins = Math.floor((now - createdTime) / 60000);
      const limitMins = alert.severity === "critical" ? 60 : alert.severity === "high" ? 120 : 240;

      const currentStatus = alertStatuses[alert.id] || alert.status || "new";
      const currentAssigneeUid = alertAssignees[alert.id] || null;
      const assignedStaffName = currentAssigneeUid 
        ? staffList.find(s => s.uid === currentAssigneeUid)?.displayName || "Nội bộ"
        : null;

      return {
        id: alert.id,
        title: alert.message,
        platform: "Đa nền tảng",
        riskScore,
        slaUsedMinutes: diffMins,
        slaLimitMinutes: limitMins,
        status: currentStatus,
      statusLabel: currentStatus === "new" ? "Chưa xử lý" : currentStatus === "acknowledged" ? "Đang xử lý" : "Đã giải quyết",
        assignedStaff: assignedStaffName,
        rawAlert: alert
      };
    });
  }, [alerts, alertStatuses, alertAssignees, staffList]);

  // Calculate velocity and reach based on risk score
  const velocityAndReach = useMemo(() => {
    if (!activeSelectedRow) return { velocity: "+0%", reach: "0" };
    const score = activeSelectedRow.riskScore;
    if (score >= 90) {
      return { velocity: "+155% / 1h", reach: "85,400" };
    } else if (score >= 80) {
      return { velocity: "+90% / 1h", reach: "42,800" };
    } else if (score >= 60) {
      return { velocity: "+35% / 1h", reach: "18,200" };
    } else {
      return { velocity: "+12% / 1h", reach: "4,500" };
    }
  }, [activeSelectedRow]);

  const activeLogs = useMemo(() => {
    if (!activeSelectedRow) return [];
    return getLogsForAlert(activeSelectedRow.id, activeSelectedRow.rawAlert.created_at);
  }, [activeSelectedRow, alertLogs]);

  const copilotTemplates = useMemo(() => {
    if (!activeSelectedRow) return [];
    const id = activeSelectedRow.id;
    const topic = id.startsWith("derived-") ? id.split("-")[1] : null;
    return getCopilotTemplates(topic);
  }, [activeSelectedRow]);

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
        const gradientClass = isExceeded 
          ? "bg-gradient-to-r from-red-400 to-red-600" 
          : (percent > 60 ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-gradient-to-r from-emerald-400 to-emerald-500");
        const textClass = isExceeded ? "text-[#BA1A1A]" : (percent > 60 ? "text-amber-600" : "text-emerald-600");

        return (
          <div className="flex flex-col space-y-1.5 w-[140px]">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className={textClass}>{slaUsedMinutes}m used</span>
              <span className="text-[#C8C4D6]">-</span>
              <span className="text-[#767586]">{slaLimitMinutes}m limit</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEEDF4]">
              <div
                className={cn("h-full rounded-full transition-all duration-500", gradientClass)}
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
        const isResolved = status === "resolved";
        
        return (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2 shrink-0">
                {isAcknowledged && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4234B6] opacity-75"></span>
                )}
                <span className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  isResolved ? "bg-emerald-500" : (isAcknowledged ? "bg-[#4234B6]" : "bg-[#BA1A1A]")
                )}></span>
              </span>
              <span className={cn(
                "text-[13px] font-bold",
                isResolved ? "text-emerald-600" : (isAcknowledged ? "text-[#4234B6]" : "text-[#BA1A1A]")
              )}>
                {statusLabel}
              </span>
            </div>
            <div className="pl-4">
              <span className={cn("text-[12px]", assignedStaff ? "text-[#4234B6] font-semibold" : "text-[#767586] italic")}>
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

  const handleUpdateStatus = (rowId: string, nextStatus: string) => {
    setAlertStatuses(prev => ({ ...prev, [rowId]: nextStatus }));
    
    let logText = "";
    if (nextStatus === "acknowledged") {
      logText = "Đã ghi nhận sự vụ và đang tiến hành xử lý";
    } else if (nextStatus === "resolved") {
      logText = "Đã giải quyết xong sự vụ tiêu cực";
    } else if (nextStatus === "new") {
      logText = "Đã mở lại sự vụ rủi ro";
    }
    
    addLog(rowId, "Quản lý thương hiệu", logText);
  };

  const handleAssignStaff = (rowId: string, staffUid: string) => {
    setAlertAssignees(prev => ({ ...prev, [rowId]: staffUid }));
    
    const staffName = staffList.find(s => s.uid === staffUid)?.displayName || "Nội bộ";
    const logText = staffUid 
      ? `Đã phân công sự vụ cho nhân sự: ${staffName}`
      : "Đã hủy phân công nhân sự";
      
    addLog(rowId, "Quản lý thương hiệu", logText);
  };

  const handleCopyTemplate = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTemplateIndex(index);
      setTimeout(() => setCopiedTemplateIndex(null), 2000);
    } catch (e) {
      console.warn("Failed to copy template", e);
    }
  };

  const handleOpenUrl = (url: string) => {
    if (url && url !== "#") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <Card className="overflow-hidden shadow-[0px_4px_25px_rgba(0,0,0,0.04)] border-[#C8C4D6]/70 rounded-xl bg-white/70 backdrop-blur-md">
        <div className="border-b border-[#EEEDF4] p-6 bg-white dark:bg-[#1a1b1e]">
          <h2 className="text-[16px] font-sans font-bold text-[#1A1B20] dark:text-gray-100">
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
                    onClick={() => setSelectedRow(row.original)}
                    className="transition-all duration-300 hover:bg-red-50/30 hover:-translate-y-[1.5px] hover:shadow-[0_4px_15px_rgba(0,0,0,0.015)] dark:hover:bg-gray-900/50 cursor-pointer"
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

      {/* Slide-over Drawer for incident details */}
      <AnimatePresence>
        {activeSelectedRow && (
          <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSelectedRow(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />
            {/* Drawer Body */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[530px] bg-white/85 dark:bg-[#1a1b1e]/85 backdrop-blur-xl h-full shadow-[0_0_50px_rgba(0,0,0,0.12)] flex flex-col z-10 border-l border-[#EEEDF4]/60"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#EEEDF4]/60 flex items-start justify-between bg-white/40 backdrop-blur-md dark:bg-[#1a1b1e]/40">
                <div className="space-y-2 max-w-[85%]">
                  <Badge variant="outline" className={cn(
                    "border-none text-[10px] font-bold px-2.5 py-0.5 shadow-sm",
                    activeSelectedRow.riskScore >= 80 ? "bg-[#FFDAD6] text-[#BA1A1A]" : "bg-orange-100 text-orange-700"
                  )}>
                    Risk Score: {activeSelectedRow.riskScore}/100
                  </Badge>
                  <h3 className="text-[16px] font-bold text-[#1A1B20] dark:text-white leading-tight">
                    {activeSelectedRow.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Virality & Velocity Metrics Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-[#EEEDF4] bg-[#FAF8FF] flex flex-col">
                    <span className="text-[10px] font-bold text-[#767586] uppercase tracking-wide">
                      Tốc độ bùng phát
                    </span>
                    <span className="text-[16px] font-extrabold text-[#BA1A1A] mt-1">
                      {velocityAndReach.velocity}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#EEEDF4] bg-[#FAF8FF] flex flex-col">
                    <span className="text-[10px] font-bold text-[#767586] uppercase tracking-wide">
                      Lượt tiếp cận ước tính
                    </span>
                    <span className="text-[16px] font-extrabold text-[#1A1B20] mt-1">
                      {velocityAndReach.reach} lượt
                    </span>
                  </div>
                </div>

                {/* 2. Status & Actions Section */}
                <div className="p-4 rounded-xl border border-[#EEEDF4] bg-[#FAF8FF] space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#767586] uppercase tracking-wide">Trạng thái</span>
                    <span className={cn(
                      "font-black px-2.5 py-1 rounded-full shadow-xs",
                      activeSelectedRow.status === "resolved" ? "bg-green-50 text-emerald-600" : 
                      (activeSelectedRow.status === "acknowledged" ? "bg-[#FAF8FF] text-[#4234B6] border border-[#EEEDF4]" : "bg-red-50 text-[#BA1A1A]")
                    )}>
                      {activeSelectedRow.statusLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {activeSelectedRow.status === "new" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(activeSelectedRow.id, "acknowledged")}
                          className="flex-1 min-w-[120px] py-2 px-3 rounded-lg bg-[#4234B6] hover:bg-[#2A1F80] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>Ghi nhận xử lý</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(activeSelectedRow.id, "resolved")}
                          className="flex-1 min-w-[120px] py-2 px-3 rounded-lg border border-[#EEEDF4] hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Giải quyết luôn</span>
                        </button>
                      </>
                    )}
                    {activeSelectedRow.status === "acknowledged" && (
                      <button
                        onClick={() => handleUpdateStatus(activeSelectedRow.id, "resolved")}
                        className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đánh dấu đã giải quyết</span>
                      </button>
                    )}
                    {activeSelectedRow.status === "resolved" && (
                      <button
                        onClick={() => handleUpdateStatus(activeSelectedRow.id, "new")}
                        className="w-full py-2 px-4 rounded-lg border border-red-200 hover:bg-red-50 text-[#BA1A1A] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Mở lại sự vụ</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Assignment Section */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#767586] uppercase tracking-wide block">
                    Nhân sự phụ trách
                  </label>
                  <select
                    value={activeSelectedRow.assignedStaffUid || ""}
                    onChange={(e) => handleAssignStaff(activeSelectedRow.id, e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#C8C4D6] text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#4234B6]/20 cursor-pointer"
                  >
                    <option value="">-- Chưa phân bổ nhân sự --</option>
                    {staffList.map((staff) => (
                      <option key={staff.uid} value={staff.uid}>
                        {staff.displayName} ({staff.role === "crisis_employee" || staff.role === "crisis_staff" ? "Crisis Staff" : "Lead Staff"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. AI Response Copilot Section */}
                <div className="space-y-3">
                  <span className="text-[12px] font-bold text-[#767586] uppercase tracking-wide block">
                    Trợ lý phản hồi AI Copilot (SOP Draft)
                  </span>
                  <div className="space-y-2.5">
                    {copilotTemplates.map((template, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/20 flex flex-col space-y-2.5 relative group">
                        <p className="text-[12.5px] text-[#474554] leading-relaxed italic">
                          “{template}”
                        </p>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleCopyTemplate(template, idx)}
                            className="py-1 px-2.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10.5px] font-bold transition-all flex items-center gap-1 border border-indigo-100"
                          >
                            {copiedTemplateIndex === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Đã copy</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy kịch bản</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Resolution Audit Log Section */}
                <div className="space-y-3">
                  <span className="text-[12px] font-bold text-[#767586] uppercase tracking-wide block">
                    Nhật ký xử lý tác chiến
                  </span>
                  <div className="relative pl-5 border-l border-slate-200 dark:border-slate-800 space-y-4 ml-1 pt-1">
                    {activeLogs.map((log, index) => (
                      <div key={index} className="relative text-xs animate-fade-in">
                        {/* Dot on line */}
                        <span className="absolute -left-[25.5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white dark:border-[#1a1b1e] shadow-sm" />
                        
                        <div className="flex items-center gap-2 text-[#767586] font-bold mb-0.5">
                          <span>{log.time}</span>
                          <span>•</span>
                          <span className="text-[#1A1B20] dark:text-white">{log.user}</span>
                        </div>
                        <p className="text-[#474554]">{log.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Evidence / Comments Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#767586] uppercase tracking-wide">
                      Bình luận & Bằng chứng liên quan
                    </span>
                    <Badge variant="outline" className="bg-[#FAF8FF] text-slate-600 border-[#EEEDF4] text-[10px] font-bold px-2 py-0.5">
                      {matchedMentions.length} bình luận
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {matchedMentions.length > 0 ? (
                      matchedMentions.map((mention, index) => (
                        <div
                          key={mention.id || index}
                          className="p-4 rounded-xl border border-[#EEEDF4] bg-[#FAF8FF] space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <PlatformLogo platform={mention.platform} size="xs" />
                              <span className="text-[12px] font-bold text-[#1A1B20]">
                                {mention.author || "Ẩn danh"}
                              </span>
                            </div>
                            <span className="text-[11px] font-medium text-[#767586]">
                              {new Date(mention.posted_at || mention.created_at).toLocaleDateString("vi-VN")}
                            </span>
                          </div>

                          <p className="text-[13px] text-[#474554] leading-relaxed">
                            {mention.content}
                          </p>

                          {mention.url && mention.url !== "#" && (
                            <button
                              onClick={() => mention.url && handleOpenUrl(mention.url)}
                              className="text-xs font-bold text-[#4234B6] hover:text-[#2A1F80] flex items-center gap-1 mt-1.5"
                            >
                              <span>Xem bình luận gốc</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#767586] italic text-center py-4">
                        Không tìm thấy bình luận chi tiết cho chủ đề này.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

