"use client";

import { useCountUp } from "@/hooks/useIntersectionObserver";
import { useTranslation } from "react-i18next";

export default function IndustryHeroSection() {
  const { t } = useTranslation();
  const kpiDoanhNghiep = useCountUp(500, 2000, true);
  const kpiReview = useCountUp(2, 2000, true);
  const kpiAccuracy = useCountUp(98, 2000, true);

  return (
    <section 
      className="relative py-[60px] md:py-[80px] px-6 text-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f8f7ff 0%, #eef4ff 100%)" }}
    >
      {/* Decorative Blobs */}
      <div 
        className="absolute top-0 right-0 rounded-full blur-[80px] pointer-events-none"
        style={{ width: "400px", height: "400px", background: "#6D4CFF", opacity: 0.08, transform: "translate(30%, -30%)" }}
      ></div>
      <div 
        className="absolute bottom-0 left-0 rounded-full blur-[80px] pointer-events-none"
        style={{ width: "300px", height: "300px", background: "#3B82F6", opacity: 0.06, transform: "translate(-30%, 30%)" }}
      ></div>

      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Badge */}
        <div 
          className="inline-flex items-center px-4 py-2 rounded-full text-[14px] font-semibold mb-6 gap-2"
          style={{ 
            background: "rgba(109,76,255,0.08)", 
            border: "1px solid rgba(109,76,255,0.2)",
            color: "#6D4CFF"
          }}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          {t("industries.hero.badge")}
        </div>

        {/* Headline */}
        <h1 className="text-[32px] md:text-[44px] leading-[1.2] tracking-tight font-[800] text-[#1a1a2e] mb-4 max-w-4xl mx-auto">
          {t("industries.hero.title1")} <span style={{ background: "linear-gradient(90deg, #6D4CFF, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t("industries.hero.titleHighlight")}</span>
        </h1>

        {/* Subtext */}
        <p className="text-[16px] md:text-[18px] leading-[1.6] font-normal text-[#64748B] max-w-2xl mx-auto mb-8">
          {t("industries.hero.subtitle")}
        </p>

        {/* KPI Strip */}
        <div className="flex flex-wrap justify-center items-center gap-3 text-[14px] md:text-[16px] font-medium">
          <div className="flex items-center gap-2">
            <span className="text-[#6D4CFF] font-bold text-[18px]">{kpiDoanhNghiep}+</span>
            <span className="text-[#64748B]">{t("industries.hero.kpiDoanhNghiep")}</span>
          </div>
          <span className="text-[#CBD5E1] hidden sm:block">•</span>
          <div className="flex items-center gap-2">
            <span className="text-[#6D4CFF] font-bold text-[18px]">{kpiReview}M+</span>
            <span className="text-[#64748B]">{t("industries.hero.kpiReview")}</span>
          </div>
          <span className="text-[#CBD5E1] hidden sm:block">•</span>
          <div className="flex items-center gap-2">
            <span className="text-[#6D4CFF] font-bold text-[18px]">{kpiAccuracy}%</span>
            <span className="text-[#64748B]">{t("industries.hero.kpiAccuracy")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
