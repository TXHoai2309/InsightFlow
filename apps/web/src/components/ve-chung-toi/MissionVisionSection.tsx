"use client";

export default function MissionVisionSection() {
  return (
    <section id="mission-vision" className="px-6 md:px-10 py-20 bg-[#f0f3ff] scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-[32px] leading-[40px] tracking-[-0.02em] font-bold text-[#111c2d]">
            Tầm nhìn &amp; Sứ mệnh
          </h2>
          <p className="text-[16px] leading-[24px] text-[#464554] max-w-2xl mx-auto">
            Chúng tôi không chỉ cung cấp công cụ, chúng tôi xây dựng nền tảng
            để doanh nghiệp Việt dẫn đầu bằng dữ liệu.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[420px]">
          {/* Mission - large card */}
          <div className="md:col-span-8 glass-card rounded-3xl p-10 flex flex-col justify-end relative overflow-hidden group">
            {/* Gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#dee8ff] via-[#f0f3ff] to-white opacity-60 group-hover:opacity-80 transition-opacity" />
            {/* Decorative circle */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#4648d4]/8 rounded-full blur-3xl" />

            <div className="relative z-10 space-y-4">
              <span className="p-3 bg-[#645efb] text-white rounded-xl inline-block">
                <span className="material-symbols-outlined">rocket_launch</span>
              </span>
              <h3 className="text-[24px] leading-[32px] font-semibold text-[#111c2d]">
                Sứ mệnh
              </h3>
              <p className="text-[18px] leading-[28px] text-[#464554] max-w-lg">
                Giải phóng sức mạnh của dữ liệu thô, biến chúng thành những
                hành động kinh doanh thực tế thông qua trí tuệ nhân tạo chuyên
                sâu cho ngôn ngữ tiếng Việt.
              </p>
            </div>
          </div>

          {/* Vision 2030 - small card */}
          <div className="md:col-span-4 bg-[#4648d4] text-white rounded-3xl p-10 flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-lg">
            <h3 className="text-[24px] leading-[32px] font-semibold">
              Tầm nhìn 2030
            </h3>
            <p className="text-[16px] leading-[24px] opacity-90">
              Trở thành nền tảng Social Listening &amp; AI Branding hàng đầu
              Đông Nam Á, nơi công nghệ Việt vươn tầm quốc tế.
            </p>
            <div className="flex items-center gap-2 font-bold text-[20px]">
              Hơn cả một công cụ
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
