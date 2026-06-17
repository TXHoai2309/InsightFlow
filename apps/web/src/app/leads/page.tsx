"use client";

import React, { useState, useEffect } from "react";

/**
 * Lead Management Page
 * Theo dõi và chuyển đổi Lead từ các tín hiệu mạng xã hội
 */
export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<"hot" | "warm" | "cold">("hot");
  
  // Timers state for mock countdowns
  const [timers, setTimers] = useState({
    "timer-1": 1455, // 24m 15s
    "timer-2": 724,  // 12m 04s
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        if (next["timer-1"] > 0) next["timer-1"] -= 1;
        if (next["timer-2"] > 0) next["timer-2"] -= 1;
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" + s : s}s`;
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-headline-lg text-on-surface font-bold">Quản lý Khách hàng Tiềm năng</h2>
          <p className="text-body-md text-on-surface-variant">
            Theo dõi và chuyển đổi Lead từ các tín hiệu mạng xã hội
          </p>
        </div>
        <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant">
          {(["hot", "warm", "cold"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2 rounded-lg font-label-md transition-all ${
                activeTab === tab
                  ? "bg-white text-primary shadow-sm ring-1 ring-outline-variant/20 font-bold"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {tab === "hot" ? "🔥 Hot" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-xl flex flex-col gap-1">
          <span className="text-on-surface-variant text-label-sm font-medium">Tổng Lead mới</span>
          <span className="text-headline-sm font-bold text-on-surface">1,284</span>
          <span className="text-primary text-label-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span> +12% hôm nay
          </span>
        </div>
        <div className="glass-card p-6 rounded-xl flex flex-col gap-1">
          <span className="text-on-surface-variant text-label-sm font-medium">Tỉ lệ phản hồi</span>
          <span className="text-headline-sm font-bold text-on-surface">92.4%</span>
          <span className="text-secondary text-label-sm font-bold">Trung bình: 14m</span>
        </div>
        <div className="glass-card p-6 rounded-xl flex flex-col gap-1 border-l-4 border-error">
          <span className="text-on-surface-variant text-label-sm font-medium">Lead sắp hết hạn</span>
          <span className="text-headline-sm font-bold text-error">08</span>
          <span className="text-on-surface-variant text-label-sm italic">Cần ưu tiên xử lý</span>
        </div>
        <div className="glass-card p-6 rounded-xl flex flex-col gap-1">
          <span className="text-on-surface-variant text-label-sm font-medium">Hôm nay đã xử lý</span>
          <span className="text-headline-sm font-bold text-on-surface">156</span>
          <span className="text-on-surface-variant text-label-sm font-medium">Mục tiêu: 200</span>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {/* Lead Item 1 */}
        <div className="glass-card rounded-xl overflow-hidden hover:shadow-md transition-all group border-l-4 border-error">
          <div className="p-6 grid grid-cols-12 gap-6 items-center">
            <div className="col-span-3 flex gap-4 items-center">
              <div className="relative">
                <img 
                  alt="Lead Avatar" 
                  className="w-12 h-12 rounded-full border border-outline-variant" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAg0xd4yIS0U-dYEghTj-m6V_9NEcCYLRAZYBOPPRcixk4ZNlmk5EUAKft04J7dAJq6K_LeGFkV6z1xu4Iy3zaLox7Oz3B1jZLH9DpRNlC5Ah-S1C_1UtoIP_dG5_9YkcKCnVIHw8xTIG9hbkYB1fzkhhbg9QBrb9ZAXkFsL6KmIGgZdUXs_H6IJ_Me8xQGkOTkeCajxvL0iBT8TVbcWLGijbAK9KW2z-hzXuumh5PeJmgvqSmTXxl_KrvcAhf8AFFdpdSduCdgYg4" 
                />
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full border border-outline-variant">
                  <span className="material-symbols-outlined text-[14px] text-[#25D366]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                </div>
              </div>
              <div>
                <h4 className="text-label-md text-on-surface font-bold">Nguyễn Văn An</h4>
                <div className="flex items-center gap-1 animate-pulse">
                  <span className="material-symbols-outlined text-error text-[16px]">timer</span>
                  <span className="text-error font-bold text-label-sm">{formatTime(timers["timer-1"])}</span>
                </div>
              </div>
            </div>
            <div className="col-span-4 flex flex-wrap gap-2">
              <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">local_fire_department</span> Ý định mua cao
              </span>
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-bold">So sánh giá</span>
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-bold">Comment "Ib"</span>
            </div>
            <div className="col-span-2">
              <span className="inline-flex items-center gap-2 px-4 py-1 bg-primary-container/10 text-primary border border-primary/20 rounded-full text-label-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-primary"></span> Mới
              </span>
            </div>
            <div className="col-span-3 flex justify-end gap-3">
              <button className="p-2 rounded-full border border-outline-variant hover:bg-surface-container transition-all" title="WhatsApp">
                <span className="material-symbols-outlined text-on-surface-variant">chat</span>
              </button>
              <button className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md font-bold hover:shadow-lg transition-all active:scale-95">
                <span className="material-symbols-outlined text-lg">call</span> Gửi ngay
              </button>
            </div>
          </div>
        </div>

        {/* Lead Item 2 */}
        <div className="glass-card rounded-xl overflow-hidden hover:shadow-md transition-all group border-l-4 border-error">
          <div className="p-6 grid grid-cols-12 gap-6 items-center">
            <div className="col-span-3 flex gap-4 items-center">
              <div className="relative">
                <img 
                  alt="Lead Avatar" 
                  className="w-12 h-12 rounded-full border border-outline-variant" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBR3C2yRo2gu7Il0zvutCcjm5-6z7awi4rt3TlEjypiU3gNZOS9C9q6lNGIM8ZoDMib3oNFMXi6Nji4NPOvcAXW8n2ROvJkxVjCBq4jsalmIeJe8UysbNcMGr_WGQsYJVgckpSgIbQ2ZwUMy4WNGdVm_xM0Hkn_BhWXV9zY79xId9_pVCsfALmR14hjC3-GCfwUsjK7yRKuOO-M3D28TtsDEVftmXJXM6xGhGSYrFKEjZmauEEtQLXRtKVpb_eP_MxwGzRvJhLwb4E" 
                />
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full border border-outline-variant">
                  <span className="material-symbols-outlined text-[14px] text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>face_nod</span>
                </div>
              </div>
              <div>
                <h4 className="text-label-md text-on-surface font-bold">Lê Minh Tú</h4>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-error text-[16px]">timer</span>
                  <span className="text-error font-bold text-label-sm">{formatTime(timers["timer-2"])}</span>
                </div>
              </div>
            </div>
            <div className="col-span-4 flex flex-wrap gap-2">
              <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span> Khách cũ
              </span>
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-bold">Hỏi về kho</span>
            </div>
            <div className="col-span-2">
              <span className="inline-flex items-center gap-2 px-4 py-1 bg-tertiary-container/10 text-tertiary border border-tertiary/20 rounded-full text-label-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span> Đang xử lý
              </span>
            </div>
            <div className="col-span-3 flex justify-end gap-3">
              <button className="p-2 rounded-full border border-outline-variant hover:bg-surface-container transition-all" title="Zalo">
                <span className="material-symbols-outlined text-on-surface-variant">alternate_email</span>
              </button>
              <button className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md font-bold hover:shadow-lg transition-all active:scale-95">
                <span className="material-symbols-outlined text-lg">call</span> Gửi ngay
              </button>
            </div>
          </div>
        </div>

        {/* Lead Item 3 - Done */}
        <div className="glass-card rounded-xl overflow-hidden hover:shadow-sm transition-all opacity-75 grayscale-[0.2]">
          <div className="p-6 grid grid-cols-12 gap-6 items-center">
            <div className="col-span-3 flex gap-4 items-center">
              <div className="relative">
                <img 
                  alt="Lead Avatar" 
                  className="w-12 h-12 rounded-full border border-outline-variant" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxp_hSxx_hY33CU35fLvGvCRePeV4Sr54yN5KR9zlxnM58lG0VBAena1KoFwTSBFob45rduTJzI3kxiq9M9gd5RehJfZXsZMpVAeZMpxMqL-GpQyPR_Ct2b2E7HpWOBnVuTkQD3RtgrRQz3ifU4Kb0PLSvGpcG_AjqAKpge-2lKDwZXU67MVdno6OfCF8zJgVu6yFjZCPQgNhX9OcjnSa8FKEZQyuWxTX0dsN834ni1FrAdarykkucYXzJm8FpTtjkkf2NKNwsDZc" 
                />
              </div>
              <div>
                <h4 className="text-label-md text-on-surface font-bold">Phan Hoàng Anh</h4>
                <span className="text-on-surface-variant text-label-sm font-medium">Đã kết thúc lúc 09:30</span>
              </div>
            </div>
            <div className="col-span-4 flex flex-wrap gap-2">
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-bold">Đơn hàng thành công</span>
            </div>
            <div className="col-span-2">
              <span className="inline-flex items-center gap-2 px-4 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-label-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-green-600"></span> Đã xử lý
              </span>
            </div>
            <div className="col-span-3 flex justify-end gap-3">
              <button className="text-primary text-label-md font-bold px-4 py-2 hover:underline">Xem chi tiết</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
