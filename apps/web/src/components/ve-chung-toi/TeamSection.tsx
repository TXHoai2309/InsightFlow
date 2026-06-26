"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";

const team = [
  {
    name: "TS. Nguyễn Thành Nam",
    role: "Chief AI Officer",
    image: "/team_nguyen_thanh_nam.png",
    desc: "AI Research · 15+ năm",
  },
  {
    name: "Lê Thu Thủy",
    role: "Head of Data Science",
    image: "/team_le_thu_thuy.png",
    desc: "Data Analytics · 10+ năm",
  },
  {
    name: "Trần Hoàng Long",
    role: "CTO",
    image: "/team_tran_hoang_long.png",
    desc: "System Arch · 12+ năm",
  },
  {
    name: "Phạm Minh Đức",
    role: "Product Director",
    image: "/team_pham_minh_duc.png",
    desc: "Product Strategy · 8+ năm",
  },
];

export default function TeamSection() {
  const { t } = useTranslation();

  return (
    <section id="team" className="px-6 md:px-10 py-24 scroll-mt-16" style={{ background: isDark ? "var(--color-bg-primary)" : "#ffffff" }}>
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-[32px] md:text-[36px] leading-[1.2] font-bold text-[#1a1a2e] mb-4">
          {t("about.team.title")}<span style={{ background: "linear-gradient(90deg, #6D4CFF, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t("about.team.titleHighlight")}</span>
        </h2>
        <p className="text-[16px] md:text-[18px] text-[#64748B] mb-12">
          {t("about.team.subtitle")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {team.map((member) => (
            <div 
              key={member.name} 
              className="group rounded-[20px] p-4 transition-all duration-300 hover:-translate-y-[6px]"
              style={{ 
                background: isDark ? "var(--color-bg-surface)" : "#ffffff", 
                border: `1px solid ${isDark ? "var(--color-border)" : "#F1F5F9"}`,
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(109,76,255,0.06)"
              }}
            >
              {/* Avatar Wrapper */}
              <div className="aspect-square rounded-[20px] overflow-hidden relative mb-4">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-400 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/90 via-[#1a1a2e]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="flex items-center justify-between text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-[14px] font-medium">{member.desc}</span>
                    <a href="#" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764.784-1.764 1.75-1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="text-left px-2">
                <div className="text-[18px] font-bold mb-1" style={{ color: isDark ? "var(--color-text-primary)" : "#1a1a2e" }}>
                  {member.name}
                </div>
                <div className="text-[14px] font-medium" style={{ color: isDark ? "var(--color-brand)" : "#6D4CFF" }}>
                  {member.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

