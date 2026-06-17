"use client";

import React from "react";

/**
 * Report Center Page — Fully Mobile Responsive
 * Sử dụng Card layout cho mobile, Table cho desktop
 */

const REPORTS_DATA = [
  { name: "Daily Insights Report - May 24", id: "RPT-20240524-01", type: "Hàng ngày", date: "24/05/2024, 08:00 AM", size: "2.4 MB", typeColor: "bg-primary/10 text-primary", icon: "description", iconColor: "text-primary" },
  { name: "Weekly Performance Analysis", id: "RPT-2024WK21", type: "Hàng tuần", date: "20/05/2024, 09:00 AM", size: "5.8 MB", typeColor: "bg-secondary/10 text-secondary", icon: "calendar_view_week", iconColor: "text-secondary" },
  { name: "Daily Insights Report - May 23", id: "RPT-20240523-01", type: "Hàng ngày", date: "23/05/2024, 08:00 AM", size: "2.1 MB", typeColor: "bg-primary/10 text-primary", icon: "description", iconColor: "text-primary" },
  { name: "Daily Insights Report - May 22", id: "RPT-20240522-01", type: "Hàng ngày", date: "22/05/2024, 08:00 AM", size: "2.5 MB", typeColor: "bg-primary/10 text-primary", icon: "description", iconColor: "text-primary" },
];

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-8 mx-auto space-y-5 md:space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Trung tâm Báo cáo</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Quản lý và tải xuống các báo cáo phân tích định kỳ từ AI.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-sm w-full sm:w-auto">
          <span className="material-symbols-outlined text-xl">add_chart</span>
          Tạo báo cáo thủ công
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        <div className="glass-card p-4 md:p-6 rounded-xl relative overflow-hidden group">
          <p className="text-[10px] md:text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-2">Mentions tuần này</p>
          <p className="text-2xl md:text-3xl font-bold text-primary">12,840</p>
          <div className="flex items-center gap-1 mt-2 text-green-600">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-[10px] md:text-xs font-bold">+14.2%</span>
          </div>
          <span className="absolute -right-3 -bottom-3 material-symbols-outlined text-[80px] md:text-[100px] opacity-5 hidden sm:block">analytics</span>
        </div>

        <div className="glass-card p-4 md:p-6 rounded-xl relative overflow-hidden group border-l-4 border-secondary/30">
          <p className="text-[10px] md:text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-2">Sentiment Index</p>
          <p className="text-2xl md:text-3xl font-bold text-secondary">78/100</p>
          <div className="flex items-center gap-1 mt-2 text-primary">
            <span className="material-symbols-outlined text-sm">sentiment_satisfied</span>
            <span className="text-[10px] md:text-xs font-bold">Tích cực</span>
          </div>
          <span className="absolute -right-3 -bottom-3 material-symbols-outlined text-[80px] md:text-[100px] opacity-5 hidden sm:block">mood</span>
        </div>

        <div className="glass-card p-4 md:p-6 rounded-xl relative overflow-hidden group col-span-2 lg:col-span-1">
          <p className="text-[10px] md:text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-2">Báo cáo gần nhất</p>
          <p className="text-xl md:text-2xl font-bold text-on-surface truncate">Daily_240523</p>
          <p className="text-[10px] md:text-xs text-outline mt-2 font-medium">Đã tạo: 2 giờ trước</p>
          <span className="absolute -right-3 -bottom-3 material-symbols-outlined text-[80px] md:text-[100px] opacity-5 hidden sm:block">history</span>
        </div>
      </div>

      {/* ── Reports List ── */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-outline-variant bg-surface-bright flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto flex-1">
            <button className="px-4 py-2 rounded-lg text-sm font-bold text-primary bg-primary/10 whitespace-nowrap flex-shrink-0">
              Định kỳ
            </button>
            <button className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container transition-colors whitespace-nowrap flex-shrink-0">
              Tùy chỉnh
            </button>
            <button className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container transition-colors whitespace-nowrap flex-shrink-0">
              Lưu trữ
            </button>
          </div>
          {/* Filter */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] text-outline font-bold uppercase tracking-wider hidden sm:block">Lọc:</span>
            <select className="bg-surface-container-low border border-outline-variant rounded-lg text-xs py-2 px-3 outline-none font-bold focus:ring-2 focus:ring-primary/20 w-full sm:w-auto">
              <option>Tất cả thời gian</option>
              <option>Hôm nay</option>
              <option>Tuần này</option>
              <option>Tháng này</option>
            </select>
          </div>
        </div>

        {/* ── Mobile: Card List (hidden on md+) ── */}
        <div className="md:hidden divide-y divide-outline-variant/40">
          {REPORTS_DATA.map((rpt, index) => (
            <div key={index} className="p-4">
              {/* Row 1: icon + name + badge */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0 ${rpt.iconColor}`}>
                  <span className="material-symbols-outlined text-xl">{rpt.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface leading-snug truncate pr-2">{rpt.name}</p>
                  <p className="text-[11px] text-outline font-medium mt-0.5">ID: {rpt.id}</p>
                </div>
                <span className={`${rpt.typeColor} px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0 border border-current/10`}>
                  {rpt.type}
                </span>
              </div>

              {/* Row 2: meta info */}
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-bold mb-3 bg-surface-container-low rounded-lg px-3 py-2">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {rpt.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">data_usage</span>
                  {rpt.size}
                </span>
              </div>

              {/* Row 3: action buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  PDF
                </button>
                <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-secondary hover:text-white hover:border-secondary transition-all text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[16px]">table_chart</span>
                  Excel
                </button>
                <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                  Thêm
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Desktop: Table (hidden on mobile) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/40">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tên Báo Cáo</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant w-32">Loại</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Ngày Tạo</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Dung Lượng</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {REPORTS_DATA.map((rpt, index) => (
                <tr key={index} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center ${rpt.iconColor} flex-shrink-0`}>
                        <span className="material-symbols-outlined">{rpt.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{rpt.name}</p>
                        <p className="text-[11px] text-outline font-medium mt-0.5">ID: {rpt.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${rpt.typeColor} px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border border-current/10`}>
                      {rpt.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">{rpt.date}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">{rpt.size}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors" title="PDF">
                        <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                      </button>
                      <button className="p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-secondary/10 transition-colors" title="Excel">
                        <span className="material-symbols-outlined text-xl">table_chart</span>
                      </button>
                      <button className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors" title="Thêm">
                        <span className="material-symbols-outlined text-xl">more_vert</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 md:px-6 py-4 bg-surface-bright border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
            Hiển thị 1–4 / 120 báo cáo
          </p>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            {[1, 2, 3].map((n) => (
              <button key={n} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${n === 1 ? "bg-primary text-white" : "border border-outline-variant hover:bg-surface-container text-on-surface-variant"}`}>
                {n}
              </button>
            ))}
            <span className="text-on-surface-variant text-sm px-1">…</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Promotional Banners ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-4">
        {/* Email Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-primary-container text-on-primary-container p-6 md:p-8 flex flex-col justify-center min-h-[180px] md:min-h-[220px]">
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Tự động hóa</p>
            <h3 className="text-xl md:text-2xl font-bold mb-2">Gửi báo cáo qua Email</h3>
            <p className="text-sm opacity-80 mb-5 max-w-sm">
              Cấu hình gửi báo cáo AI tự động vào hộp thư lúc 8:00 sáng mỗi ngày.
            </p>
            <button className="bg-white text-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg active:scale-95 transition-all w-fit">
              Thiết lập ngay
            </button>
          </div>
          <span
            className="material-symbols-outlined absolute -right-6 -top-6 text-[130px] md:text-[180px] opacity-10 rotate-12 pointer-events-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            mail
          </span>
        </div>

        {/* AI Trend Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-inverse-surface text-white p-6 md:p-8 flex flex-col sm:flex-row items-center gap-5 min-h-[180px] md:min-h-[220px]">
          <div className="flex-1 relative z-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="bg-primary text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg">Mới</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2">Phân tích Xu hướng AI</h3>
            <p className="text-sm opacity-75 mb-5">
              Dùng LLM tóm tắt biến động thị trường quan trọng nhất trong tuần.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-primary-fixed-dim hover:text-white font-bold text-sm transition-colors"
            >
              Khám phá ngay
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </a>
          </div>
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 flex-shrink-0 rotate-3 hidden sm:block relative z-10">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFCABMvUN8JyM7a3E2elTgaODiz73B5O5e6t0CG4tqShjMiOpQt34ZqJsvkeVwSxzqY0Cq4Ev06YARyRjjEyW1vN2-3_33fBGzU12y6RBh0xm8_ZNFF5LAn3l7k0Yt3zdPvTj5Lmd6tlyM2dwsDzs4MIZNaXD76ohyzbXFkcNWO-hKAYON9biih5GUW4oV3RfVXy04Zc3FAfQuioapcW7o_sjM2865Oh8xGp62uIWVdNouDsgCvqGRdJihgGOCo9T26pmf4QIDXkY"
              alt="AI Visualization"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
