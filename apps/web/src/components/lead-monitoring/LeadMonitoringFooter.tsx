import React from "react";
import { BarChart2 } from "lucide-react";

export function LeadMonitoringFooter() {
  return (
    <footer className="bg-[#24106B] px-10 py-12 text-[#FAF8FF]">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:justify-between">
        
        {/* Left Column */}
        <div className="flex max-w-[320px] flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5B4FCF]">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-sans text-[20px] font-bold text-white tracking-tight">
              InsightFlow
            </span>
          </div>
          <p className="text-[14px] leading-relaxed text-[#C8C4D6]">
            Nền tảng giám sát thương hiệu và quản lý tiềm năng ứng dụng AI hàng đầu cho doanh nghiệp hiện đại.
          </p>
        </div>

        {/* Links Columns */}
        <div className="flex flex-wrap gap-16 lg:gap-24">
          <div className="flex flex-col gap-4">
            <h4 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#C8C4D6] opacity-70">
              Sản phẩm
            </h4>
            <div className="flex flex-col gap-3 text-[14px] font-medium text-[#FAF8FF]">
              <a href="#" className="hover:text-[#B0A2FF] transition-colors">Tính năng AI</a>
              <a href="#" className="hover:text-[#B0A2FF] transition-colors">Bảng giá</a>
              <a href="#" className="hover:text-[#B0A2FF] transition-colors">Bảo mật</a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#C8C4D6] opacity-70">
              Hỗ trợ
            </h4>
            <div className="flex flex-col gap-3 text-[14px] font-medium text-[#FAF8FF]">
              <a href="#" className="hover:text-[#B0A2FF] transition-colors">Trung tâm trợ giúp</a>
              <a href="#" className="hover:text-[#B0A2FF] transition-colors">Tài liệu API</a>
              <a href="#" className="hover:text-[#B0A2FF] transition-colors">Cộng đồng</a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#C8C4D6] opacity-70">
              Pháp lý
            </h4>
            <div className="flex flex-col gap-3 text-[14px] font-medium text-[#FAF8FF]">
              <a href="#" className="hover:text-[#B0A2FF] transition-colors">Điều khoản</a>
              <a href="#" className="hover:text-[#B0A2FF] transition-colors">Quyền riêng tư</a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-[13px] text-[#C8C4D6] sm:flex-row">
        <p>© 2024 InsightFlow Analytics. All Rights Reserved.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">Facebook</a>
        </div>
      </div>
    </footer>
  );
}
