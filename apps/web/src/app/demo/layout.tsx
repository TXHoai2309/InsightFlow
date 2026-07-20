"use client";

import { useState } from "react";
import { DemoSidebar } from "@/components/demo/DemoSidebar";
import { useTheme } from "@/contexts/ThemeContext";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <DemoSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-col flex-1 min-w-0 md:ml-[240px]">
        {/* Demo Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 z-20 border-b" style={{ backgroundColor: "var(--color-bg-surface)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
              <i className="ti ti-menu-2 text-xl"></i>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-xs font-bold text-[#10B981]">CHẾ ĐỘ DEMO</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors border"
              style={{
                backgroundColor: "var(--color-bg-surface-raised)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              <i className={`ti ${isDark ? "ti-sun" : "ti-moon"} text-xl`}></i>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center font-bold shadow-sm">
                KH
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Khách hàng Trial</p>
                <p className="text-xs text-[#10B981] font-medium">Đang chờ duyệt</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Banner cảnh báo */}
        <div className="bg-[#10B981] text-white text-center py-2 text-[13px] font-medium shadow-md z-10 flex justify-center items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">info</span>
          Tất cả dữ liệu bạn đang xem đều là dữ liệu mô phỏng (hard-coded) để trải nghiệm tính năng.
        </div>

        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--color-bg-primary)" }}>
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
