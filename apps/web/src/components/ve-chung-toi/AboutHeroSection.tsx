"use client";

import Link from "next/link";

export default function AboutHeroSection() {
  return (
    <section
      className="px-6 md:px-10 py-16 md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16"
      style={{
        background:
          "radial-gradient(circle at 80% 20%, rgba(73, 75, 214, 0.05) 0%, transparent 50%)",
      }}
    >
      {/* Left Content */}
      <div className="w-full md:w-1/2 space-y-6">
        <span className="inline-block px-4 py-1.5 bg-[#e1e0ff] text-[#2f2ebe] rounded-full text-[12px] font-semibold uppercase tracking-wider">
          Hành trình của chúng tôi
        </span>
        <h1 className="text-[40px] leading-[48px] tracking-[-0.02em] font-bold text-[#111c2d]">
          Biến dữ liệu mạng xã hội thành{" "}
          <span className="text-[#4648d4]">lợi thế cạnh tranh</span> cho doanh
          nghiệp Việt.
        </h1>
        <p className="text-[18px] leading-[28px] text-[#464554] max-w-xl">
          InsightFlow ra đời với sứ mệnh mang sức mạnh của AI hiện đại nhất để
          giúp các thương hiệu Việt Nam hiểu thấu khách hàng và làm chủ mọi xu
          hướng thảo luận.
        </p>
        <div className="flex gap-4 flex-wrap">
          <a
            href="#mission-vision"
            className="bg-[#4648d4] text-white px-8 py-4 rounded-xl text-[20px] font-semibold hover:shadow-lg transition-all active:scale-95 inline-block"
          >
            Tìm hiểu thêm
          </a>
          <a
            href="#team"
            className="border border-[#767586] text-[#111c2d] px-8 py-4 rounded-xl text-[20px] font-semibold hover:bg-[#e7eeff] transition-all inline-block"
          >
            Xem đội ngũ
          </a>
        </div>
      </div>

      {/* Right: Image Card */}
      <div className="w-full md:w-1/2 relative">
        {/* Glow blob */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#4648d4]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 bg-white/70 backdrop-blur-lg border border-slate-200/50 p-6 rounded-3xl shadow-xl">
          {/* Illustration - office / team */}
          <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-[#dee8ff] to-[#e7eeff] flex items-center justify-center">
            <div className="text-center space-y-3">
              <span
                className="material-symbols-outlined text-[72px] text-[#4648d4]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                groups
              </span>
              <p className="text-[#464554] font-semibold text-[16px]">
                Đội ngũ InsightFlow
              </p>
            </div>
          </div>

          {/* Floating stat badge */}
          <div className="absolute -bottom-6 -right-6 bg-white/80 backdrop-blur-md border border-[#4648d4]/20 p-4 rounded-2xl shadow-lg flex items-center gap-4">
            <div className="p-3 bg-[#6063ee] rounded-xl">
              <span className="material-symbols-outlined text-white text-[20px]">
                trending_up
              </span>
            </div>
            <div>
              <div className="text-[20px] font-semibold text-[#111c2d]">
                500+
              </div>
              <div className="text-[12px] text-[#464554]">
                Doanh nghiệp tin dùng
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
