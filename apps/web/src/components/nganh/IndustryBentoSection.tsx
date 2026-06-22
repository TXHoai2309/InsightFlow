"use client";

export default function IndustryBentoSection() {
  return (
    <section className="py-[80px] px-6 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-12 gap-6">
        {/* Main data visualization card */}
        <div className="col-span-12 md:col-span-8 bg-[#dee8ff] rounded-3xl p-8 relative overflow-hidden h-[400px]">
          <div className="relative z-10 max-w-md">
            <h3 className="text-[32px] leading-[40px] tracking-[-0.02em] font-bold text-[#4648d4] mb-4">
              Dữ liệu thông minh, Hành động kịp thời
            </h3>
            <p className="text-[16px] leading-[24px] text-[#464554]">
              Hệ thống của chúng tôi thu thập hàng triệu mẩu tin mỗi ngày từ
              Facebook, TikTok, YouTube và Báo chí để đưa ra cái nhìn toàn cảnh
              nhất.
            </p>
          </div>
          {/* Decorative visualization mock */}
          <div className="absolute right-6 bottom-6 w-[55%] h-[75%] flex items-end justify-end">
            <div className="w-full h-full rounded-2xl bg-white/60 backdrop-blur-md border border-white shadow-xl flex flex-col justify-end p-4 gap-2">
              {/* Mock bar chart */}
              {[
                { label: "Facebook", width: "w-[90%]", color: "bg-[#4648d4]" },
                { label: "TikTok", width: "w-[70%]", color: "bg-[#6063ee]" },
                { label: "YouTube", width: "w-[55%]", color: "bg-[#c0c1ff]" },
                { label: "Báo chí", width: "w-[40%]", color: "bg-[#e1e0ff]" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-2">
                  <span className="text-[11px] text-[#464554] w-14 text-right shrink-0">
                    {bar.label}
                  </span>
                  <div
                    className={`h-5 ${bar.width} ${bar.color} rounded-full transition-all duration-700`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accuracy badge */}
        <div className="col-span-12 md:col-span-4 bg-[#4648d4] rounded-3xl p-8 flex flex-col justify-center text-white">
          <div className="text-[64px] leading-none font-bold mb-4">98%</div>
          <h4 className="text-[20px] font-semibold mb-2">
            Độ chính xác AI Tiếng Việt
          </h4>
          <p className="text-[14px] leading-[20px] opacity-90">
            Mô hình ngôn ngữ lớn (LLM) được huấn luyện riêng cho ngữ cảnh và
            tiếng lóng của người Việt trên mạng xã hội.
          </p>
        </div>

        {/* Real-time card */}
        <div className="col-span-12 md:col-span-4 bg-[#d8e3fb] rounded-3xl p-8 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-[48px] text-[#4648d4] mb-4">
            speed
          </span>
          <h4 className="text-[20px] font-semibold text-[#111c2d] mb-2">
            Thời gian thực
          </h4>
          <p className="text-[14px] leading-[20px] text-[#464554]">
            Cập nhật dữ liệu mỗi 5 phút, đảm bảo bạn không bỏ lỡ bất kỳ biến
            động nào của thị trường.
          </p>
        </div>

        {/* Scalable card */}
        <div className="col-span-12 md:col-span-8 bg-[#d8e3fb] rounded-3xl p-8 flex items-center gap-8">
          {/* Icon illustration */}
          <div className="w-1/3 shrink-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-2xl bg-white/70 flex items-center justify-center shadow-md">
              <span
                className="material-symbols-outlined text-[56px] text-[#4648d4]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                corporate_fare
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-[20px] font-semibold text-[#111c2d] mb-2">
              Phù hợp cho mọi quy mô
            </h4>
            <p className="text-[14px] leading-[20px] text-[#464554] mb-4">
              Từ doanh nghiệp Startup đến các tập đoàn đa quốc gia, InsightFlow
              cung cấp các gói dịch vụ linh hoạt theo nhu cầu thực tế.
            </p>
            <button className="text-[#4648d4] font-bold text-[14px] flex items-center gap-1 hover:underline transition-all">
              Tìm hiểu thêm
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
