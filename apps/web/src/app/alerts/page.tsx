"use client";

import React, { useState } from "react";

/**
 * Alerts Page — Fully Mobile Responsive
 * Quản lý cảnh báo khủng hoảng thương hiệu real-time
 */
export default function AlertsPage() {
  const [spikeValue, setSpikeValue] = useState(70);
  const [reachValue, setReachValue] = useState(50000);

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Quản lý Cảnh báo</h1>
        <p className="text-sm text-on-surface-variant mt-1 max-w-xl">
          Giám sát chỉ số tiêu cực và phản ứng tự động để bảo vệ thương hiệu.
        </p>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
        {/* Card 1 */}
        <div className="glass-card rounded-xl p-4 md:p-6 flex flex-col gap-2">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Tổng hôm nay</span>
          <div className="flex items-end justify-between gap-2">
            <span className="text-3xl md:text-4xl font-black text-on-surface">24</span>
            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
              <span className="material-symbols-outlined text-sm">trending_down</span>
              −12%
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card rounded-xl p-4 md:p-6 flex flex-col gap-2 border-l-4 border-error">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Khẩn cấp</span>
          <div className="flex items-end justify-between gap-2">
            <span className="text-3xl md:text-4xl font-black text-error">03</span>
            <span className="bg-error-container text-on-error-container text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
              Xử lý ngay
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card rounded-xl p-4 md:p-6 flex flex-col gap-2 border-l-4 border-green-500 col-span-2 md:col-span-1">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">SLA phản hồi</span>
          <div className="flex items-end justify-between gap-2">
            <span className="text-3xl md:text-4xl font-black text-on-surface">1m 45s</span>
            <span className="text-green-600 bg-green-50 text-[9px] px-2 py-1 rounded-full font-bold border border-green-200">
              Đạt chuẩn
            </span>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="glass-card rounded-xl p-3 md:p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          <select className="col-span-2 lg:col-span-1 w-full bg-surface-container-low border border-outline-variant rounded-xl text-xs md:text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium">
            <option>Workspace: Highlands Coffee</option>
            <option>Phúc Long Coffee &amp; Tea</option>
            <option>The Coffee House</option>
          </select>
          <select className="w-full bg-surface-container-low border border-outline-variant rounded-xl text-xs md:text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium">
            <option>Trạng thái: Mới</option>
            <option>Đã xác nhận</option>
            <option>Đã xử lý</option>
          </select>
          <select className="w-full bg-surface-container-low border border-outline-variant rounded-xl text-xs md:text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium">
            <option>Mức độ: Tất cả</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select className="w-full bg-surface-container-low border border-outline-variant rounded-xl text-xs md:text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium">
            <option>Tín hiệu: Tất cả</option>
            <option>Spike mentions</option>
            <option>High-reach</option>
            <option>Sensitive topic</option>
          </select>
        </div>
      </div>

      {/* ── Alert Cards ── */}
      <div className="space-y-4 md:space-y-5">

        {/* Alert 1 — CRITICAL */}
        <div className="glass-card rounded-2xl overflow-hidden border-l-4 border-error hover:shadow-lg transition-shadow">
          <div className="p-4 md:p-6">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-error text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">
                    🚨 CRITICAL
                  </span>
                  <span className="text-sm font-bold text-on-surface">Highlands Coffee</span>
                  <div className="flex gap-1">
                    <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded">FB</span>
                    <span className="bg-pink-100 text-pink-700 text-[9px] font-bold px-1.5 py-0.5 rounded">TT</span>
                  </div>
                </div>
                <h2 className="text-base md:text-xl font-bold text-on-surface leading-snug">
                  Đột biến nhắc đến tiêu cực: Tăng 4.5× trong 15 phút
                </h2>
              </div>
              <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-xl flex-shrink-0 w-fit">
                2 phút trước
              </span>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              Phát hiện gia tăng đột ngột của bài đăng phàn nàn về vệ sinh tại chi nhánh Quận 1. Tiếp cận 45k+ người.
            </p>

            {/* Evidence box */}
            <div className="bg-surface-container-low/60 rounded-xl p-3 md:p-4 mb-4 border border-outline-variant/30 space-y-3">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/40 pb-2">
                <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
                Top 3 nội dung tiêu biểu
              </p>
              {[
                { icon: 'public',  text: '"Vừa đi Highlands ở chi nhánh X thấy chuột chạy qua bàn..."' },
                { icon: 'movie',   text: 'Video TikTok @ReviewFood phê bình thái độ nhân viên...' },
                { icon: 'group',   text: 'Thảo luận trong group "Hội Review Đồ Uống" (120 bình luận)...' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[16px] flex-shrink-0 mt-0.5">{item.icon}</span>
                  <p className="flex-1 text-xs text-on-surface font-medium line-clamp-1">{item.text}</p>
                  <a href="#" className="text-primary font-bold text-[10px] bg-primary/8 px-2 py-0.5 rounded-lg flex-shrink-0 hover:bg-primary/15 transition-colors">XEM</a>
                </div>
              ))}
            </div>

            {/* Footer row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-outline-variant/30">
              {/* Notification channels */}
              <div className="flex items-center gap-3 overflow-x-auto">
                {[
                  { label: 'Telegram', icon: 'send', ok: true },
                  { label: 'Email',    icon: 'mail', ok: true },
                  { label: 'Zalo',     icon: 'chat', ok: false },
                ].map((ch) => (
                  <div key={ch.label} className={`flex items-center gap-1 flex-shrink-0 ${ch.ok ? 'text-green-600' : 'text-outline opacity-50'}`}>
                    <span className="material-symbols-outlined text-[14px]">{ch.icon}</span>
                    <span className="text-[10px] font-bold uppercase">{ch.label}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 sm:flex gap-2">
                <button className="px-3 py-2.5 rounded-xl border border-outline-variant text-[11px] font-bold text-on-surface hover:bg-surface-container-low transition-all">
                  Xác nhận
                </button>
                <button className="px-3 py-2.5 rounded-xl border border-primary/30 text-primary text-[11px] font-bold hover:bg-primary/5 transition-all">
                  Xu hướng
                </button>
                <button className="px-3 py-2.5 rounded-xl bg-primary text-white text-[11px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
                  Giải quyết
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alert 2 — HIGH */}
        <div className="glass-card rounded-2xl overflow-hidden border-l-4 border-amber-500 hover:shadow-lg transition-shadow">
          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-amber-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">
                    ⚠️ HIGH
                  </span>
                  <span className="text-sm font-bold text-on-surface">Phúc Long Tea</span>
                  <span className="bg-pink-100 text-pink-700 text-[9px] font-bold px-1.5 py-0.5 rounded">TikTok</span>
                </div>
                <h2 className="text-base md:text-xl font-bold text-on-surface leading-snug">
                  KOL @HoangMedia chia sẻ nội dung so sánh tiêu cực: Tiếp cận 150k+
                </h2>
              </div>
              <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-xl flex-shrink-0 w-fit">
                45 phút trước
              </span>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              Video có tính lan truyền cao, share đạt 1.2k lượt trong 1 giờ. Cần theo dõi sát và chuẩn bị phương án đính chính.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-green-600">
                  <span className="material-symbols-outlined text-[14px]">send</span>
                  <span className="text-[10px] font-bold uppercase">Telegram</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2">
                <button className="px-4 py-2.5 rounded-xl border border-outline-variant text-[11px] font-bold text-on-surface hover:bg-surface-container-low transition-all">
                  Xác nhận
                </button>
                <button className="px-4 py-2.5 rounded-xl bg-primary text-white text-[11px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
                  Giải quyết
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Thresholds & Configuration ── */}
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined">tune</span>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-on-surface">Cấu hình Ngưỡng &amp; Phản ứng</h2>
            <p className="text-xs text-on-surface-variant font-medium hidden sm:block">Thiết lập điều kiện kích hoạt và kênh gửi cảnh báo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">

          {/* Triggers */}
          <div className="glass-card rounded-2xl p-5 md:p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 flex-shrink-0">
                <span className="material-symbols-outlined text-xl">bolt</span>
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm md:text-base">Quy tắc Kích hoạt</p>
                <p className="text-xs text-on-surface-variant font-medium">Phát hiện biến động bất thường</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Spike slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-on-surface">Đột biến Spike (%)</p>
                  <span className="text-sm font-black text-primary bg-primary/8 px-2.5 py-0.5 rounded-lg">{spikeValue}%</span>
                </div>
                <input
                  type="range" min="0" max="100"
                  value={spikeValue}
                  onChange={(e) => setSpikeValue(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-surface-container accent-primary cursor-pointer"
                />
                <p className="text-[11px] text-on-surface-variant italic font-medium">
                  Cảnh báo khi thảo luận tiêu cực tăng &gt;{spikeValue}% so với trung bình.
                </p>
              </div>

              {/* Reach slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-on-surface">Tiếp cận tối thiểu</p>
                  <span className="text-sm font-black text-primary bg-primary/8 px-2.5 py-0.5 rounded-lg">
                    {reachValue >= 1000 ? `${(reachValue / 1000).toFixed(0)}k` : reachValue}
                  </span>
                </div>
                <input
                  type="range" min="0" max="500000" step="5000"
                  value={reachValue}
                  onChange={(e) => setReachValue(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-surface-container accent-primary cursor-pointer"
                />
                <p className="text-[11px] text-on-surface-variant italic font-medium">
                  Chỉ cảnh báo bài đăng có tiếp cận dự kiến &gt;{reachValue.toLocaleString("vi-VN")} người.
                </p>
              </div>

              {/* Sensitive keywords */}
              <div className="pt-4 border-t border-outline-variant/40">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black text-on-surface uppercase tracking-wider">Từ khóa nhạy cảm</p>
                  <button className="text-[10px] font-black text-primary border border-primary/20 px-2.5 py-1 rounded-lg hover:bg-primary/5 transition-colors">
                    + THÊM
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Ngộ độc', 'Biểu tình', 'Tẩy chay', 'Chất lượng'].map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1.5 rounded-xl bg-surface-bright px-3 py-1.5 text-xs font-bold border border-outline-variant shadow-sm">
                      {kw}
                      <span className="material-symbols-outlined text-[13px] cursor-pointer hover:text-error transition-colors">close</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Channels */}
          <div className="glass-card rounded-2xl p-5 md:p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 flex-shrink-0">
                <span className="material-symbols-outlined text-xl">hub</span>
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm md:text-base">Kênh Thông báo</p>
                <p className="text-xs text-on-surface-variant font-medium">Nơi nhận cảnh báo real-time</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Telegram Bot',    status: 'Đang hoạt động • @IF_Bot', enabled: true,  icon: 'send',          color: 'text-[#0088cc]' },
                { name: 'Zalo Business',   status: 'Chưa liên kết tài khoản',  enabled: false, icon: 'chat',          color: 'text-[#0068ff]' },
                { name: 'Email Digest',    status: 'Tự động: mỗi 1 giờ',       enabled: true,  icon: 'mail',          color: 'text-primary' },
                { name: 'Mobile Push',     status: 'Đã bật trên 2 thiết bị',   enabled: true,  icon: 'notifications', color: 'text-amber-500' },
              ].map((ch) => (
                <div key={ch.name} className="flex items-center justify-between gap-3 p-3 md:p-4 rounded-2xl border border-outline-variant bg-surface-bright hover:bg-surface-container-low transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-surface-container flex items-center justify-center flex-shrink-0 ${ch.color}`}>
                      <span className="material-symbols-outlined text-xl">{ch.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-on-surface truncate">{ch.name}</p>
                      <p className="text-[11px] text-on-surface-variant font-medium truncate">{ch.status}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" defaultChecked={ch.enabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-outline-variant rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 shadow-inner" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save/Cancel buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
          <button className="w-full sm:w-auto px-8 py-3 rounded-2xl font-bold text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-all order-2 sm:order-1">
            Hủy bỏ
          </button>
          <button className="w-full sm:w-auto px-8 py-3 rounded-2xl font-bold text-sm bg-primary text-white shadow-lg hover:opacity-90 active:scale-95 transition-all order-1 sm:order-2">
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
}
