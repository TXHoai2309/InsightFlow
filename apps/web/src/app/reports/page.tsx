"use client";

import React from "react";

/**
 * Report Center Page
 * Quản lý và tải xuống các báo cáo phân tích định kỳ từ AI.
 */
export default function ReportsPage() {
  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-headline-lg text-on-surface font-bold">Trung tâm Báo cáo</h2>
          <p className="text-body-md text-on-surface-variant">
            Quản lý và tải xuống các báo cáo phân tích định kỳ từ AI của bạn.
          </p>
        </div>
        <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md flex items-center gap-2 hover:bg-primary-container transition-all shadow-sm">
          <span className="material-symbols-outlined">add_chart</span>
          Tạo Báo Cáo Thủ Công
        </button>
      </div>

      {/* Bento Grid Stats Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-label-md text-on-surface-variant mb-1">Tổng Mentions Tuần này</p>
            <h4 className="text-headline-lg text-primary font-bold">12,840</h4>
            <div className="flex items-center gap-1 mt-2 text-tertiary">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              <span className="text-label-sm font-bold">+14.2% so với tuần trước</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-[120px]">analytics</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-label-md text-on-surface-variant mb-1">Sentiment Index</p>
            <h4 className="text-headline-lg text-secondary font-bold">78/100</h4>
            <div className="flex items-center gap-1 mt-2 text-primary">
              <span className="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
              <span className="text-label-sm font-bold">Trạng thái: Tích cực</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-[120px]">mood</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-label-md text-on-surface-variant mb-1">Báo cáo gần nhất</p>
            <h4 className="text-headline-lg text-on-surface font-bold">Daily_240523</h4>
            <p className="text-label-sm text-outline mt-2">Đã tạo: 2 giờ trước</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-[120px]">history</span>
          </div>
        </div>
      </div>

      {/* Reports List Section */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div className="flex gap-6">
            <button className="text-label-md text-primary border-b-2 border-primary pb-2 px-1 font-bold">
              Báo cáo Định kỳ
            </button>
            <button className="text-label-md text-on-surface-variant px-1 hover:text-on-surface transition-colors">
              Yêu cầu Tùy chỉnh
            </button>
            <button className="text-label-md text-on-surface-variant px-1 hover:text-on-surface transition-colors">
              Lưu trữ (Archive)
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-sm text-outline font-medium">Lọc theo:</span>
            <select className="bg-transparent border border-outline-variant rounded-lg text-label-sm py-1 px-2 focus:ring-primary outline-none">
              <option>Tất cả thời gian</option>
              <option>Hôm nay</option>
              <option>Tuần này</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant text-on-surface-variant bg-surface-container-low/30">
                <th className="px-6 py-4 text-label-md font-bold">Tên Báo Cáo</th>
                <th className="px-6 py-4 text-label-md font-bold w-32">Loại</th>
                <th className="px-6 py-4 text-label-md font-bold">Ngày Tạo</th>
                <th className="px-6 py-4 text-label-md font-bold">Dung Lượng</th>
                <th className="px-6 py-4 text-label-md font-bold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {[
                { name: "Daily Insights Report - May 24", id: "RPT-20240524-01", type: "Hàng ngày", date: "24/05/2024, 08:00 AM", size: "2.4 MB", typeColor: "bg-primary-fixed text-on-primary-fixed-variant", icon: "description", iconColor: "text-primary" },
                { name: "Weekly Performance Analysis", id: "RPT-2024WK21", type: "Hàng tuần", date: "20/05/2024, 09:00 AM", size: "5.8 MB", typeColor: "bg-tertiary-fixed text-on-tertiary-fixed-variant", icon: "calendar_view_week", iconColor: "text-secondary" },
                { name: "Daily Insights Report - May 23", id: "RPT-20240523-01", type: "Hàng ngày", date: "23/05/2024, 08:00 AM", size: "2.1 MB", typeColor: "bg-primary-fixed text-on-primary-fixed-variant", icon: "description", iconColor: "text-primary" },
                { name: "Daily Insights Report - May 22", id: "RPT-20240522-01", type: "Hàng ngày", date: "22/05/2024, 08:00 AM", size: "2.5 MB", typeColor: "bg-primary-fixed text-on-primary-fixed-variant", icon: "description", iconColor: "text-primary" },
              ].map((rpt, index) => (
                <tr key={index} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center ${rpt.iconColor}`}>
                        <span className="material-symbols-outlined">{rpt.icon}</span>
                      </div>
                      <div>
                        <p className="text-body-md font-bold text-on-surface">{rpt.name}</p>
                        <p className="text-[12px] text-outline">ID: {rpt.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${rpt.typeColor} px-3 py-1 rounded-full text-[12px] font-bold whitespace-nowrap`}>
                      {rpt.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant font-medium">{rpt.date}</td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant font-medium">{rpt.size}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-on-surface-variant hover:text-primary transition-colors" title="Download PDF">
                        <span className="material-symbols-outlined">picture_as_pdf</span>
                      </button>
                      <button className="p-2 text-on-surface-variant hover:text-secondary transition-colors" title="Download Excel">
                        <span className="material-symbols-outlined">table_chart</span>
                      </button>
                      <button className="p-2 text-on-surface-variant hover:text-on-surface transition-colors" title="More Options">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-surface-bright border-t border-outline-variant flex justify-between items-center">
          <p className="text-label-sm text-on-surface-variant font-medium">Hiển thị 1 - 4 của 120 báo cáo</p>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-label-sm font-bold">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors text-label-sm font-bold">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors text-label-sm font-bold">3</button>
            <span className="px-1 text-outline">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Insight Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <div className="bg-primary-container p-8 rounded-2xl text-on-primary-container relative overflow-hidden flex flex-col justify-center shadow-soft">
          <h5 className="text-headline-md font-bold mb-2">Gửi báo cáo qua Email?</h5>
          <p className="text-body-md opacity-90 mb-6 max-w-[80%]">
            Cấu hình tự động gửi báo cáo phân tích sâu tới hộp thư của bạn vào mỗi sáng lúc 8:00.
          </p>
          <button className="bg-white text-primary px-6 py-2.5 rounded-lg font-bold text-sm w-fit hover:shadow-lg transition-all">
            Thiết lập ngay
          </button>
          <div className="absolute -right-12 -top-12 opacity-20 transform rotate-12 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
          </div>
        </div>

        <div className="bg-inverse-surface p-8 rounded-2xl text-white relative flex items-center gap-6 shadow-soft">
          <div className="flex-1">
            <h5 className="text-headline-md font-bold mb-2">Phân tích Xu hướng AI</h5>
            <p className="text-body-md opacity-80 mb-6">
              Tính năng mới: Sử dụng mô hình LLM để tóm tắt các biến động thị trường quan trọng nhất trong tuần.
            </p>
            <div className="flex items-center gap-4">
              <span className="bg-primary px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider">Mới</span>
              <a className="text-primary-fixed-dim hover:underline font-bold text-sm" href="#">
                Khám phá ngay →
              </a>
            </div>
          </div>
          <div className="w-32 h-32 hidden lg:block rounded-xl overflow-hidden shadow-2xl rotate-3 flex-shrink-0">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFCABMvUN8JyM7a3E2elTgaODiz73B5O5e6t0CG4tqShjMiOpQt34ZqJsvkeVwSxzqY0Cq4Ev06YARyRjjEyW1vN2-3_33fBGzU12y6RBh0xm8_ZNFF5LAn3l7k0Yt3zdPvTj5Lmd6tlyM2dwsDzs4MIZNaXD76ohyzbXFkcNWO-hKAYON9biih5GUW4oV3RfVXy04Zc3FAfQuioapcW7o_sjM2865Oh8xGp62uIWVdNouDsgCvqGRdJihgGOCo9T26pmf4QIDXkY" 
              alt="AI Data Visualization"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
