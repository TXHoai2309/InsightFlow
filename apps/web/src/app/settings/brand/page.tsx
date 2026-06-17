"use client";

import React, { useState } from "react";
import { Workspace } from "@/types/dashboard";

/**
 * Brand Management Page
 * Cho phép người dùng quản lý các thương hiệu (workspace), cấu hình từ khóa và theo dõi trạng thái dữ liệu.
 */
export default function BrandManagementPage() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("1");
  const [isAiSuggestEnabled, setIsAiSuggestEnabled] = useState(true);

  // Mock data cho danh sách thương hiệu
  const workspaces: (Workspace & { logo: string; keywordCount: number; region: string; status?: string })[] = [
    {
      id: "1",
      brand_name: "Highlands Coffee",
      scale: "large",
      keywords: ["Highlands Coffee", "Cà phê Highlands"],
      synonyms: ["PhinDi", "Freeze", "trà sen vàng", "bánh mì Highlands"],
      priority: true,
      created_at: new Date().toISOString(),
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvIqD73Dqthp8F5i213Hn-0FmMftvJ5cF4JSWZBw6SjjUmJtFnwd6C2lMunjy5ic_1s2fVRFqxagRSMrJvoGJ4nk9XhxrsJKDgz7jx0OSMp4bDJ5LwsZJ2TkRp5BKqPT04Y0ivjV9cumaupuFopWXrN2GNc5s83tgDLslaUQKFTBWe6TVne_s6FtmWe8G2Nc3P3X9pOrIm1qOG-VReNkIybssPHpTr8-TI41cTZaJlZbxEUyRKLFntSx2tjio7v4GZpXLfsuBbCN4",
      keywordCount: 128,
      region: "Toàn quốc",
    },
    {
      id: "2",
      brand_name: "Phúc Long Tea",
      scale: "medium",
      keywords: ["Phúc Long", "Phúc Long Tea"],
      synonyms: ["Trà Phúc Long", "Trà sữa Phúc Long"],
      priority: false,
      created_at: new Date().toISOString(),
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIA43BR0U4cUOUji2nVO3r_QA-xk0qVSKCiS-ieRXBXJ2uixfSiAN0-btIs8_8W86VWhyBtSQ8dvNGr8gOajXKpLAvHK3ZbQ1oqKJcljL3u15QSL-FOyWWhpSHDHRRCGIt6yoMbZNE9M_UhQfxx03KQjec9XthSQVB_gsG4LpGsAbZVbBGt_HsxOfq9hiDmjjWZhTbXGOH0D8nPBQHTLqE-9_m4cxu4v069n6MPDR5FCDX2eyVJYxlncQtt4GvvVWY_De4oxzSGnI",
      keywordCount: 85,
      region: "Miền Nam",
    },
    {
      id: "3",
      brand_name: "Trung Nguyên Legend",
      scale: "large",
      keywords: ["Trung Nguyên", "Trung Nguyên Legend"],
      synonyms: ["G7", "Cà phê Trung Nguyên"],
      priority: false,
      created_at: new Date().toISOString(),
      logo: "", // Empty for icon placeholder
      keywordCount: 42,
      region: "Đang tạm dừng",
      status: "paused",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-headline-lg text-on-surface font-bold">Quản lý Thương hiệu</h2>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Workspace List (Left Column) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-headline-sm mb-4 text-on-surface font-bold">Danh sách Thương hiệu</h3>
            <div className="space-y-3">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => setSelectedWorkspace(ws.id)}
                  className={`p-4 rounded-lg flex items-center justify-between cursor-pointer transition-all border ${
                    selectedWorkspace === ws.id
                      ? "bg-primary-fixed-dim border-primary/20"
                      : "hover:bg-surface-container border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white p-1 flex items-center justify-center border border-outline-variant">
                      {ws.logo ? (
                        <img src={ws.logo} alt={ws.brand_name} className="max-h-full" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant text-2xl">
                          store
                        </span>
                      )}
                    </div>
                    <div>
                      <p className={`text-label-md font-bold ${selectedWorkspace === ws.id ? "text-primary" : "text-on-surface"}`}>
                        {ws.brand_name}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {ws.keywordCount} từ khóa • {ws.region}
                      </p>
                    </div>
                  </div>
                  {selectedWorkspace === ws.id ? (
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Source Health Card */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-headline-sm mb-4 text-on-surface font-bold">Trạng thái Nguồn dữ liệu</h3>
            <div className="space-y-3">
              {[
                { name: "Facebook Ads/API", icon: "face_nod", color: "#1877F2", status: "healthy" },
                { name: "TikTok Shop", icon: "video_library", color: "#000000", status: "error" },
                { name: "YouTube Mentions", icon: "movie", color: "#FF0000", status: "healthy" },
              ].map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" style={{ color: source.color }}>{source.icon}</span>
                    <span className="text-label-md">{source.name}</span>
                  </div>
                  <span className={`flex items-center gap-1 text-label-sm font-bold ${source.status === 'healthy' ? 'text-primary' : 'text-error'}`}>
                    <span className={`w-2 h-2 rounded-full ${source.status === 'healthy' ? 'bg-primary animate-pulse' : 'bg-error'}`}></span>
                    {source.status === 'healthy' ? 'Khỏe mạnh' : 'Lỗi kết nối'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Keyword Configuration Form (Right Column) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="glass-card rounded-xl p-8 relative overflow-hidden">
            {/* Abstract decoration */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-headline-md text-on-surface font-bold">Cấu hình Từ khóa Theo dõi</h3>
                <p className="text-body-sm text-on-surface-variant">
                  Thiết lập bộ lọc AI để thu thập dữ liệu chính xác nhất cho <strong>Highlands Coffee</strong>.
                </p>
              </div>
              <div className="flex gap-2">
                <button className="px-6 py-2 border border-outline-variant rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container transition-colors">
                  Hủy
                </button>      
                <button className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-md shadow-sm hover:shadow-md transition-all">
                  Lưu cấu hình
                </button>
              </div>
            </div>

            <form className="space-y-8 relative z-10">
              {/* Primary Keywords */}
              <div className="space-y-2">
                <label className="text-label-md text-on-surface block font-bold">Từ khóa chính (Primary Keywords)</label>
                <div className="p-2 bg-white border border-outline-variant rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all flex flex-wrap gap-2">
                  {["Highlands Coffee", "Cà phê Highlands"].map((tag, i) => (
                    <span key={i} className="bg-primary-fixed-dim text-on-primary-fixed-variant px-3 py-1 rounded-full text-label-sm flex items-center gap-1 group hover:-translate-y-0.5 transition-transform">
                      {tag} <span className="material-symbols-outlined text-[14px] cursor-pointer">close</span>
                    </span>
                  ))}
                  <input className="border-none focus:ring-0 text-body-sm p-1 flex-1 min-w-[120px] outline-none" placeholder="Thêm từ khóa..." type="text" />
                </div>
                <p className="text-label-sm text-on-surface-variant">Các từ khóa định danh thương hiệu chính của bạn.</p>
              </div>

              {/* Synonyms/LSI */}
              <div className="space-y-2">
                <label className="text-label-md text-on-surface block font-bold">Từ đồng nghĩa & Liên quan</label>
                <textarea 
                  className="w-full bg-white border border-outline-variant rounded-lg p-4 text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" 
                  placeholder="Ví dụ: PhinDi, Freeze, trà sen vàng, bánh mì Highlands..." 
                  rows={3}
                ></textarea>
                <p className="text-label-sm text-on-surface-variant">Giúp AI mở rộng phạm vi thu thập nhưng vẫn giữ đúng ngữ cảnh.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Exclusion Keywords */}
                <div className="space-y-2">
                  <label className="text-label-md text-on-surface block font-bold">Từ khóa loại trừ (Negative)</label>
                  <div className="p-2 bg-white border border-outline-variant rounded-lg flex flex-wrap gap-2 min-h-[100px] content-start">
                    {["tuyển dụng", "việc làm"].map((tag, i) => (
                      <span key={i} className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-label-sm flex items-center gap-1">
                        {tag} <span className="material-symbols-outlined text-[14px] cursor-pointer">close</span>
                      </span>
                    ))}
                    <input className="border-none focus:ring-0 text-body-sm p-1 w-full outline-none" placeholder="Loại trừ..." type="text" />
                  </div>
                </div>

                {/* Platform Selection */}
                <div className="space-y-2">
                  <label className="text-label-md text-on-surface block font-bold">Phạm vi theo dõi</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "Facebook", checked: true },
                      { name: "TikTok", checked: true },
                      { name: "Báo chí Online", checked: false },
                      { name: "YouTube", checked: true },
                    ].map((platform, i) => (
                      <label key={i} className="flex items-center gap-2 p-3 border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container transition-colors">
                        <input type="checkbox" checked={platform.checked} readOnly className="rounded text-primary focus:ring-primary" />
                        <span className="text-label-md">{platform.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <div className="pt-6 border-t border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_fix_high</span>
                  <span className="font-label-md text-on-surface font-bold">Tự động gợi ý từ khóa bằng AI</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isAiSuggestEnabled}
                    onChange={() => setIsAiSuggestEnabled(!isAiSuggestEnabled)}
                  />
                  <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </form>
          </div>

          {/* Usage Statistics Card */}
          <div className="grid grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-label-sm text-on-surface-variant mb-2">Data Usage</p>
              <h4 className="text-headline-md text-primary font-bold">74%</h4>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-3">
                <div className="bg-primary h-full rounded-full" style={{ width: "74%" }}></div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-label-sm text-on-surface-variant mb-2">Active Alerts</p>
              <h4 className="text-headline-md text-on-surface font-bold">12</h4>
              <p className="text-[10px] text-primary mt-2 font-bold">+2 so với tuần trước</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-label-sm text-on-surface-variant mb-2">Keywords</p>
              <h4 className="text-headline-md text-on-surface font-bold">128/500</h4>
              <p className="text-[10px] text-on-surface-variant mt-2">Hạng mức Pro Plan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
