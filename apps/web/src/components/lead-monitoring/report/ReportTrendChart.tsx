"use client";

import React from "react";
import { LeadReportTrendPoint } from "@/lib/lead-report";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { TrendingUp } from "lucide-react";

interface ReportTrendChartProps {
  trendData: LeadReportTrendPoint[];
}

export function ReportTrendChart({ trendData }: ReportTrendChartProps) {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="bg-white dark:bg-[#13111c] border border-gray-200 dark:border-[#262338] rounded-2xl p-6 h-full shadow-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">Chưa có dữ liệu xu hướng.</p>
      </div>
    );
  }

  // Calculate insight
  const lastIdx = trendData.length - 1;
  const currentTotal = trendData[lastIdx].contacted;
  const prevTotal = lastIdx > 0 ? trendData[lastIdx - 1].contacted : 0;
  
  let insightText = "Hiệu suất xử lý ổn định trong 7 ngày qua.";
  let trendColor = "text-indigo-400";
  
  if (currentTotal > prevTotal && prevTotal > 0) {
    const increase = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
    insightText = `Hiệu suất xử lý tăng ${increase}% so với ngày trước.`;
    trendColor = "text-emerald-400";
  } else if (currentTotal < prevTotal && prevTotal > 0) {
    const decrease = Math.round(((prevTotal - currentTotal) / prevTotal) * 100);
    insightText = `Hiệu suất xử lý giảm ${decrease}% so với ngày trước.`;
    trendColor = "text-amber-400";
  }

  return (
    <div className="bg-white dark:bg-[#13111c] border border-gray-200 dark:border-[#262338] rounded-2xl p-6 h-full shadow-lg flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">Xu hướng 7 ngày</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lưu lượng lead và kết quả chuyển đổi.</p>
        </div>
        <div className={`flex items-center gap-2 bg-gray-50 dark:bg-[#1a1826] border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-xl ${trendColor}`}>
          <TrendingUp className="w-4 h-4" />
          <span className="text-[11px] font-bold tracking-wider">{insightText}</span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262338" vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1826", borderColor: "#262338", borderRadius: "12px", color: "#fff" }}
              itemStyle={{ fontSize: "13px", fontWeight: "bold" }}
              labelStyle={{ color: "#9ca3af", marginBottom: "4px" }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "13px", fontWeight: "bold" }} />
            <Line 
              type="monotone" 
              name="Lead mới"
              dataKey="created" 
              stroke="#6366f1" 
              strokeWidth={3}
              dot={{ r: 4, fill: "#13111c", stroke: "#6366f1", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff" }}
            />
            <Line 
              type="monotone" 
              name="Đã liên hệ"
              dataKey="contacted" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ r: 4, fill: "#13111c", stroke: "#10b981", strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              name="Chuyển đổi"
              dataKey="converted" 
              stroke="#ec4899" 
              strokeWidth={3}
              dot={{ r: 4, fill: "#13111c", stroke: "#ec4899", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
