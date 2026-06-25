"use client";

import { useIntersectionObserver, useCountUp } from "@/hooks/useIntersectionObserver";
import { useTheme } from "@/contexts/ThemeContext";

export default function IndustryBentoSection() {
  const { ref: chartRef, hasIntersected: chartVisible } = useIntersectionObserver();
  const { ref: statsRef, hasIntersected: statsVisible } = useIntersectionObserver();
  const { ref: bottomCardsRef, hasIntersected: bottomCardsVisible } = useIntersectionObserver();

  const accuracyCount = useCountUp(98, 2000, statsVisible);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className="py-[60px] px-6 max-w-[1200px] mx-auto overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .bento-card-bottom {
          background: ${isDark ? "var(--color-bg-surface-raised)" : "#FFFFFF"};
          border: 1px solid ${isDark ? "var(--color-border)" : "rgba(109,76,255,0.12)"};
          border-radius: 20px;
          box-shadow: ${isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(109,76,255,0.06)"};
          transition: all 0.3s ease;
        }
        .bento-card-bottom:hover {
          transform: translateY(-4px);
          box-shadow: ${isDark ? "0 12px 32px rgba(0,0,0,0.4)" : "0 12px 32px rgba(109,76,255,0.12)"};
        }
      `}} />
      <div className="grid grid-cols-12 gap-6">
        {/* Main data visualization card */}
        <div 
          ref={chartRef}
          className="col-span-12 md:col-span-8 rounded-3xl p-6 relative overflow-hidden h-[340px]"
          style={{ 
            background: isDark ? "var(--color-bg-surface)" : "#FFFFFF", 
            border: isDark ? "1px solid var(--color-border)" : "1px solid #E5E7EB" 
          }}
        >
          <div className="relative z-10 max-w-md">
            <h3 
              className="text-[28px] leading-[36px] tracking-[-0.02em] font-bold mb-3"
              style={{ background: isDark ? "linear-gradient(90deg, var(--color-brand), #3B82F6)" : "linear-gradient(90deg, #6D4CFF, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              Dữ liệu thông minh, Hành động kịp thời
            </h3>
            <p className="text-[14px] leading-[22px]" style={{ color: isDark ? "var(--color-text-secondary)" : "#64748B" }}>
              Hệ thống của chúng tôi thu thập hàng triệu mẩu tin mỗi ngày từ
              Facebook, TikTok, YouTube và Báo chí để đưa ra cái nhìn toàn cảnh
              nhất.
            </p>
          </div>
          {/* Decorative visualization mock */}
          <div className="absolute right-4 bottom-4 w-[60%] h-[75%] flex items-end justify-end">
            <div 
              className="w-full h-full rounded-2xl backdrop-blur-md shadow-xl flex flex-col justify-end p-4 gap-3"
              style={{ 
                background: isDark ? "rgba(37,37,48,0.7)" : "rgba(255,255,255,0.6)", 
                border: isDark ? "1px solid var(--color-border)" : "1px solid #E5E7EB" 
              }}
            >
              {/* Mock bar chart */}
              {[
                { label: "Facebook", width: 90, color: "#6D4CFF" },
                { label: "TikTok", width: 70, color: isDark ? "#A0A0B8" : "#3B82F6" },
                { label: "YouTube", width: 55, color: "#A78BFA" },
                { label: "Báo chí", width: 40, color: "#60A5FA" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-2">
                  <span className="text-[12px] font-medium w-16 text-right shrink-0" style={{ color: isDark ? "var(--color-text-muted)" : "#64748B" }}>
                    {bar.label}
                  </span>
                  <div className="flex-1 rounded-full h-6 relative overflow-hidden" style={{ background: isDark ? "var(--color-bg-surface)" : "#f3f4f6" }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out flex items-center px-2 text-[10px] font-bold text-white"
                      style={{ 
                        width: chartVisible ? `${bar.width}%` : "0%", 
                        background: bar.color 
                      }}
                    >
                      {chartVisible ? `${bar.width}%` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accuracy badge */}
        <div 
          ref={statsRef}
          className="col-span-12 md:col-span-4 rounded-3xl p-6 flex flex-col justify-center text-white relative overflow-hidden"
          style={{ background: isDark ? "linear-gradient(135deg, #4338CA, var(--color-brand), #7C3AED)" : "linear-gradient(135deg, #5B3FE8, #6D4CFF, #7C3AED)" }}
        >
          {/* Vòng tròn trang trí mờ */}
          <div 
            className="absolute top-[-20%] right-[-10%] rounded-full bg-white opacity-10 pointer-events-none"
            style={{ width: "200px", height: "200px" }}
          ></div>
          <div 
            className="absolute bottom-[-10%] left-[-20%] rounded-full bg-white opacity-10 pointer-events-none"
            style={{ width: "150px", height: "150px" }}
          ></div>

          <div className="relative z-10">
            <div className="text-[52px] leading-none font-bold mb-3">{accuracyCount}%</div>
            <h4 className="text-[18px] font-semibold mb-2">
              Độ chính xác AI Tiếng Việt
            </h4>
            <p className="text-[13px] leading-[20px] text-white/90">
              Mô hình ngôn ngữ lớn (LLM) được huấn luyện riêng cho ngữ cảnh và
              tiếng lóng của người Việt trên mạng xã hội.
            </p>
          </div>
        </div>

        {/* Nửa dưới với nền nhẹ */}
        <div 
          ref={bottomCardsRef} 
          className="col-span-12 grid grid-cols-12 gap-6 p-4 -mx-4 rounded-3xl mt-0"
          style={{ background: isDark ? "var(--color-bg-surface)" : "#f8f7ff" }}
        >
          {/* Real-time card */}
          <div className={`col-span-12 md:col-span-4 bento-card-bottom p-6 flex flex-col items-center text-center opacity-0 ${bottomCardsVisible ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: "0s" }}>
            <div 
              className="inline-flex items-center justify-center rounded-[12px] p-3 mb-4"
              style={{ background: isDark ? "var(--color-bg-surface)" : "rgba(109,76,255,0.08)", border: isDark ? "1px solid var(--color-border)" : "none" }}
            >
              <span className="material-symbols-outlined text-[28px]" style={{ color: isDark ? "var(--color-brand)" : "#6D4CFF", fontVariationSettings: "'FILL' 1" }}>
                speed
              </span>
            </div>
            <h4 className="text-[18px] font-semibold mb-2" style={{ color: isDark ? "var(--color-text-primary)" : "#1a1a2e" }}>
              Thời gian thực
            </h4>
            <p className="text-[14px] leading-[22px]" style={{ color: isDark ? "var(--color-text-secondary)" : "#64748B" }}>
              Cập nhật dữ liệu mỗi 5 phút, đảm bảo bạn không bỏ lỡ bất kỳ biến
              động nào của thị trường.
            </p>
          </div>

          {/* Scalable card */}
          <div className={`col-span-12 md:col-span-8 bento-card-bottom p-6 flex items-center gap-6 opacity-0 ${bottomCardsVisible ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: "0.1s" }}>
            {/* Icon illustration */}
            <div className="w-1/3 shrink-0 flex items-center justify-center hidden sm:flex">
              <div 
                className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-sm border"
                style={{ 
                  background: isDark ? "var(--color-bg-surface)" : "#f8f7ff", 
                  borderColor: isDark ? "var(--color-border)" : "#F1F0FF" 
                }}
              >
                <div 
                  className="inline-flex items-center justify-center rounded-[12px] p-3"
                  style={{ background: isDark ? "var(--color-bg-surface-raised)" : "rgba(109,76,255,0.08)" }}
                >
                  <span
                    className="material-symbols-outlined text-[40px]"
                    style={{ fontVariationSettings: "'FILL' 1", color: isDark ? "var(--color-brand)" : "#6D4CFF" }}
                  >
                    corporate_fare
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-[18px] font-semibold mb-2" style={{ color: isDark ? "var(--color-text-primary)" : "#1a1a2e" }}>
                Phù hợp cho mọi quy mô
              </h4>
              <p className="text-[14px] leading-[22px] mb-3" style={{ color: isDark ? "var(--color-text-secondary)" : "#64748B" }}>
                Từ doanh nghiệp Startup đến các tập đoàn đa quốc gia, InsightFlow
                cung cấp các gói dịch vụ linh hoạt theo nhu cầu thực tế.
              </p>
              <button className="font-bold text-[14px] flex items-center gap-1 hover:underline transition-all" style={{ color: isDark ? "var(--color-brand)" : "#6D4CFF" }}>
                Tìm hiểu thêm
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
