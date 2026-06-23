"use client";

import Link from "next/link";

export default function MissionVisionSection() {
  return (
    <section id="mission-vision" className="px-6 md:px-10 py-20 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-[32px] leading-[40px] tracking-[-0.02em] font-bold text-[#1a1a2e]">
            Tầm nhìn & Sứ mệnh
          </h2>
          <p className="text-[16px] leading-[24px] text-[#64748B] max-w-2xl mx-auto">
            Chúng tôi không chỉ cung cấp công cụ, chúng tôi xây dựng nền tảng
            để doanh nghiệp Việt dẫn đầu bằng dữ liệu.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[420px]">
          {/* Mission - large card */}
          <div 
            className="md:col-span-7 rounded-[24px] p-10 flex flex-col justify-between relative overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, #f8f7ff, #eef4ff)",
              border: "1px solid rgba(109,76,255,0.15)"
            }}
          >
            {/* Decorative Quote Mark */}
            <span 
              className="absolute top-4 right-6 text-[160px] font-serif leading-none pointer-events-none"
              style={{ color: "rgba(109,76,255,0.08)" }}
            >
              "
            </span>

            <div className="relative z-10 mb-8">
              <span 
                className="material-symbols-outlined text-[48px]"
                style={{ color: "#6D4CFF", fontVariationSettings: "'FILL' 1" }}
              >
                rocket_launch
              </span>
            </div>
            
            <div className="relative z-10 space-y-4">
              <h3 className="text-[28px] leading-[36px] font-bold text-[#1a1a2e]">
                Sứ mệnh
              </h3>
              <div className="text-[16px] md:text-[18px] leading-[1.6] text-[#64748B] max-w-lg space-y-4">
                <p>
                  InsightFlow được xây dựng với một niềm tin: mọi doanh nghiệp Việt Nam — dù lớn hay nhỏ — đều xứng đáng có được sức mạnh của AI để hiểu khách hàng thật sự.
                </p>
                <p>
                  Chúng tôi không chỉ cung cấp dữ liệu. Chúng tôi trao cho bạn góc nhìn — để mỗi quyết định truyền thông đều dựa trên sự thật, không phải cảm tính.
                </p>
              </div>
            </div>
          </div>

          {/* Vision 2030 - small card */}
          <div 
            className="md:col-span-5 rounded-[24px] p-10 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-lg"
            style={{
              background: "linear-gradient(135deg, #5B3FE8, #6D4CFF, #4F46E5)"
            }}
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

            <div className="relative z-10 mb-8">
              <span 
                className="material-symbols-outlined text-[48px] text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                public
              </span>
            </div>

            <div className="relative z-10 space-y-4">
              <h3 className="text-[28px] leading-[36px] font-bold text-white">
                Tầm nhìn 2030
              </h3>
              <p className="text-[16px] md:text-[18px] leading-[1.6] text-white/90">
                Trở thành nền tảng Social Intelligence hàng đầu Đông Nam Á — nơi AI thuần Việt hiểu ngôn ngữ, văn hóa và con người Việt sâu sắc hơn bất kỳ công nghệ ngoại nhập nào.
              </p>
              
              <Link href="#" className="inline-flex items-center gap-2 font-bold text-[18px] text-white mt-4 hover:underline">
                Hơn cả một công cụ
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
