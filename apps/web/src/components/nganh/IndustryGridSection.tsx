"use client";

import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

export default function IndustryGridSection() {
  const { t } = useTranslation();
  const { ref, hasIntersected } = useIntersectionObserver();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const industries = [
    {
      icon: "storefront",
      title: t("industries.grid.card1Title"),
      badge: { label: t("industries.grid.popularBadge"), style: { background: "#6D4CFF", color: "#FFFFFF" } },
      description: t("industries.grid.card1Desc"),
      features: [
        t("industries.grid.card1Feat1"),
        t("industries.grid.card1Feat2"),
        t("industries.grid.card1Feat3"),
        t("industries.grid.card1Feat4"),
      ],
      testimonial: {
        quote: t("industries.grid.card1Quote"),
        author: t("industries.grid.card1Author"),
      },
    },
    {
      icon: "fastfood",
      title: t("industries.grid.card2Title"),
      badge: { label: t("industries.grid.speedBadge"), style: { background: "#3B82F6", color: "#FFFFFF" } },
      description: t("industries.grid.card2Desc"),
      features: [
        t("industries.grid.card2Feat1"),
        t("industries.grid.card2Feat2"),
        t("industries.grid.card2Feat3"),
        t("industries.grid.card2Feat4"),
      ],
      testimonial: {
        quote: t("industries.grid.card2Quote"),
        author: t("industries.grid.card2Author"),
      },
    },
    {
      icon: "restaurant",
      title: t("industries.grid.card3Title"),
      badge: null,
      description: t("industries.grid.card3Desc"),
      features: [
        t("industries.grid.card3Feat1"),
        t("industries.grid.card3Feat2"),
        t("industries.grid.card3Feat3"),
        t("industries.grid.card3Feat4"),
      ],
      testimonial: {
        quote: t("industries.grid.card3Quote"),
        author: t("industries.grid.card3Author"),
      },
    },
    {
      icon: "delivery_dining",
      title: t("industries.grid.card4Title"),
      badge: null,
      description: t("industries.grid.card4Desc"),
      features: [
        t("industries.grid.card4Feat1"),
        t("industries.grid.card4Feat2"),
        t("industries.grid.card4Feat3"),
        t("industries.grid.card4Feat4"),
      ],
      testimonial: {
        quote: t("industries.grid.card4Quote"),
        author: t("industries.grid.card4Author"),
      },
    },
  ];

  return (
    <section className="pb-[60px] px-6 max-w-[1200px] mx-auto overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .industry-card {
          background: ${isDark ? "var(--color-bg-surface)" : "#FFFFFF"};
          border: 1px solid ${isDark ? "var(--color-border)" : "#E5E7EB"};
          border-radius: 20px;
          box-shadow: ${isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(109,76,255,0.06)"};
          transition: all 0.3s ease;
        }
        .industry-card:hover {
          transform: translateY(-6px);
          box-shadow: ${isDark ? "0 16px 48px rgba(0,0,0,0.4)" : "0 16px 48px rgba(109,76,255,0.14)"};
          border-color: var(--color-brand);
        }
        @media (prefers-reduced-motion: reduce) { 
          * { animation: none !important; transition: none !important; } 
        }
      `}} />
      <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {industries.map((industry, index) => (
          <div
            key={industry.title}
            className={`industry-card p-6 flex flex-col h-full opacity-0 ${hasIntersected ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div 
                  className="inline-flex items-center justify-center rounded-[10px] p-2 mb-3"
                  style={{ background: isDark ? "var(--color-bg-surface-raised)" : "rgba(109,76,255,0.08)" }}
                >
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: "'FILL' 1", color: isDark ? "var(--color-brand)" : "#6D4CFF" }}
                  >
                    {industry.icon}
                  </span>
                </div>
                <h2 className="text-[20px] leading-[28px] font-semibold" style={{ color: isDark ? "var(--color-text-primary)" : "#1a1a2e" }}>
                  {industry.title}
                </h2>
              </div>
              {industry.badge && (
                <span
                  style={{
                    ...industry.badge.style,
                    borderRadius: "20px",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "4px 8px",
                  }}
                  className="uppercase tracking-wider whitespace-nowrap ml-3 mt-1"
                >
                  {industry.badge.label}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-[14px] leading-[22px] mb-6" style={{ color: isDark ? "var(--color-text-secondary)" : "#64748B" }}>
              {industry.description}
            </p>

            {/* Feature List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {industry.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]" style={{ color: isDark ? "var(--color-brand)" : "#6D4CFF" }}>
                    check
                  </span>
                  <span className="text-[13px] font-medium" style={{ color: isDark ? "var(--color-text-primary)" : "#374151" }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div
              className="mt-auto p-4"
              style={{
                background: isDark ? "var(--color-bg-surface-raised)" : "linear-gradient(135deg, rgba(109,76,255,0.04), rgba(59,130,246,0.04))",
                borderLeft: `3px solid ${isDark ? "var(--color-brand)" : "#6D4CFF"}`,
                borderRadius: "12px",
              }}
            >
              <h4 className="text-[14px] font-semibold mb-2" style={{ color: "#6D4CFF" }}>
                {t("industries.grid.successStory")}
              </h4>
              <p className="text-[14px] leading-[20px] italic" style={{ color: isDark ? "var(--color-text-primary)" : "#374151" }}>
                {industry.testimonial.quote}{" "}
                <strong style={{ color: isDark ? "var(--color-brand)" : "#6D4CFF", fontWeight: 600 }}>- {industry.testimonial.author}</strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
