"use client";

import { useIntersectionObserver, useCountUp } from "@/hooks/useIntersectionObserver";
import { useTranslation } from "react-i18next";

export default function IndustryBentoSection() {
  const { t } = useTranslation();
  const { ref: chartRef, hasIntersected: chartVisible } = useIntersectionObserver();
  const { ref: statsRef, hasIntersected: statsVisible } = useIntersectionObserver();
  const { ref: bottomCardsRef, hasIntersected: bottomCardsVisible } = useIntersectionObserver();

  const accuracyCount = useCountUp(98, 2000, statsVisible);

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
          background: #FFFFFF;
          border: 1px solid rgba(109,76,255,0.12);
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(109,76,255,0.06);
          transition: all 0.3s ease;
        }
        .bento-card-bottom:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(109,76,255,0.12);
        }
      `}} />
      <div className="grid grid-cols-12 gap-6">
        {/* Main data visualization card */}
        <div 
          ref={chartRef}
          className="col-span-12 md:col-span-8 bg-white rounded-3xl p-6 relative overflow-hidden h-[340px]"
          style={{ border: "1px solid #E5E7EB" }}
        >
          <div className="relative z-10 max-w-md">
            <h3 
              className="text-[28px] leading-[36px] tracking-[-0.02em] font-bold mb-3"
              style={{ background: "linear-gradient(90deg, #6D4CFF, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              {t("industries.bento.chartTitle")}
            </h3>
            <p className="text-[14px] leading-[22px] text-[#64748B]">
              {t("industries.bento.chartDesc")}
            </p>
          </div>
          {/* Decorative visualization mock */}
          <div className="absolute right-4 bottom-4 w-[60%] h-[75%] flex items-end justify-end">
            <div className="w-full h-full rounded-2xl bg-white/60 backdrop-blur-md border border-[#E5E7EB] shadow-xl flex flex-col justify-end p-4 gap-3">
              {/* Mock bar chart */}
              {[
                { label: t("dashboard.filters.facebook"), width: 90, color: "#6D4CFF" },
                { label: t("dashboard.filters.tiktok"), width: 70, color: "#3B82F6" },
                { label: t("dashboard.filters.youtube"), width: 55, color: "#A78BFA" },
                { label: t("dashboard.filters.news"), width: 40, color: "#60A5FA" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-[#64748B] w-16 text-right shrink-0">
                    {bar.label}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
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
          style={{ background: "linear-gradient(135deg, #5B3FE8, #6D4CFF, #7C3AED)" }}
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
              {t("industries.bento.accuracyTitle")}
            </h4>
            <p className="text-[13px] leading-[20px] text-white/90">
              {t("industries.bento.accuracyDesc")}
            </p>
          </div>
        </div>

        {/* Nửa dưới với nền nhẹ */}
        <div ref={bottomCardsRef} className="col-span-12 grid grid-cols-12 gap-6 p-4 -mx-4 bg-[#f8f7ff] rounded-3xl mt-0">
          {/* Real-time card */}
          <div className={`col-span-12 md:col-span-4 bento-card-bottom p-6 flex flex-col items-center text-center opacity-0 ${bottomCardsVisible ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: "0s" }}>
            <div 
              className="inline-flex items-center justify-center rounded-[12px] p-3 mb-4"
              style={{ background: "rgba(109,76,255,0.08)" }}
            >
              <span className="material-symbols-outlined text-[28px]" style={{ color: "#6D4CFF", fontVariationSettings: "'FILL' 1" }}>
                speed
              </span>
            </div>
            <h4 className="text-[18px] font-semibold text-[#1a1a2e] mb-2">
              {t("industries.bento.realtimeTitle")}
            </h4>
            <p className="text-[14px] leading-[22px] text-[#64748B]">
              {t("industries.bento.realtimeDesc")}
            </p>
          </div>

          {/* Scalable card */}
          <div className={`col-span-12 md:col-span-8 bento-card-bottom p-6 flex items-center gap-6 opacity-0 ${bottomCardsVisible ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: "0.1s" }}>
            {/* Icon illustration */}
            <div className="w-1/3 shrink-0 flex items-center justify-center hidden sm:flex">
              <div className="w-24 h-24 rounded-2xl bg-[#f8f7ff] flex items-center justify-center shadow-sm border border-gray-100">
                <div 
                  className="inline-flex items-center justify-center rounded-[12px] p-3"
                  style={{ background: "rgba(109,76,255,0.08)" }}
                >
                  <span
                    className="material-symbols-outlined text-[40px]"
                    style={{ fontVariationSettings: "'FILL' 1", color: "#6D4CFF" }}
                  >
                    corporate_fare
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-[18px] font-semibold text-[#1a1a2e] mb-2">
                {t("industries.bento.scaleTitle")}
              </h4>
              <p className="text-[14px] leading-[22px] text-[#64748B] mb-3">
                {t("industries.bento.scaleDesc")}
              </p>
              <button className="font-bold text-[14px] flex items-center gap-1 hover:underline transition-all" style={{ color: "#6D4CFF" }}>
                {t("industries.bento.learnMore")}
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
