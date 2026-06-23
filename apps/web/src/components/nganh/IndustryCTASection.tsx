"use client";

import Link from "next/link";

export default function IndustryCTASection() {
  return (
    <section className="py-[60px] px-6 max-w-[1200px] mx-auto">
      <div 
        className="relative rounded-3xl py-[60px] px-6 text-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6D4CFF, #3B82F6)" }}
      >
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            backgroundImage: "radial-gradient(#ffffff 2px, transparent 2px)", 
            backgroundSize: "24px 24px", 
            opacity: 0.05 
          }}
        ></div>

        <div className="relative z-10">
          <h2 className="text-[28px] md:text-[36px] leading-[1.2] tracking-tight font-bold text-white mb-4">
            Sẵn sàng nâng tầm thương hiệu của bạn?
          </h2>
          <p className="text-[16px] leading-[26px] text-white/90 mb-8 max-w-2xl mx-auto">
            Tham gia cùng 500+ doanh nghiệp hàng đầu tại Việt Nam đang sử dụng
            InsightFlow để làm chủ truyền thông.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="bg-white px-8 py-3 rounded-xl text-[16px] font-bold transition-all shadow-lg text-center"
              style={{ color: "#6D4CFF" }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
              }}
            >
              Bắt đầu miễn phí
            </Link>
            <button 
              className="bg-transparent border-2 px-8 py-3 rounded-xl text-[16px] font-bold text-white transition-all w-full sm:w-auto"
              style={{ borderColor: "rgba(255,255,255,0.6)" }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Yêu cầu Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
