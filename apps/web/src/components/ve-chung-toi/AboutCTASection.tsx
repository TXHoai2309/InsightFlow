"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function AboutCTASection() {
  const { t } = useTranslation();

  return (
    <section className="px-6 md:px-10 py-24">
      <div 
        className="max-w-5xl mx-auto rounded-[32px] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(135deg, #5B3FE8, #6D4CFF, #3B82F6)" }}
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at center, rgba(109,76,255,0.8) 0%, transparent 60%)" }}
        ></div>

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            backgroundImage: "radial-gradient(#ffffff 2px, transparent 2px)", 
            backgroundSize: "32px 32px", 
            opacity: 0.04 
          }}
        ></div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-[32px] md:text-[40px] leading-[1.2] tracking-tight font-bold text-white max-w-2xl mx-auto">
            {t("about.cta.title")}
          </h2>
          <p className="text-[18px] md:text-[20px] leading-[28px] opacity-90 max-w-2xl mx-auto pb-4">
            {t("about.cta.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="bg-white px-8 py-4 rounded-xl text-[16px] md:text-[18px] font-bold transition-all w-full sm:w-auto shadow-md text-center"
              style={{ color: "#6D4CFF" }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 0 24px rgba(255,255,255,0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
              }}
            >
              {t("about.cta.start")}
            </Link>
            <button 
              className="bg-transparent border-2 px-8 py-4 rounded-xl text-[16px] md:text-[18px] font-bold text-white transition-all w-full sm:w-auto"
              style={{ borderColor: "rgba(255,255,255,0.5)" }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {t("about.cta.demo")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
