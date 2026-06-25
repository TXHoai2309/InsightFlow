"use client";

import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useTheme } from "@/contexts/ThemeContext";

const logoCards = [
  {
    icon: "waves",
    title: "Đường sóng dữ liệu",
    description: "Hai chữ I và F được cách điệu thành đường sóng liên tục — tượng trưng cho dòng chảy dữ liệu không ngừng từ mạng xã hội vào hệ thống phân tích.",
  },
  {
    icon: "psychology",
    title: "Trí tuệ & Công nghệ",
    description: "Tím là màu của trí tuệ, sáng tạo và công nghệ tiên tiến. Đây cũng là màu của sự tin tưởng — giá trị cốt lõi mà InsightFlow mang đến.",
  },
  {
    icon: "lightbulb",
    title: "Insight + Flow",
    description: '"Insight" — những hiểu biết sâu sắc ẩn trong dữ liệu. "Flow" — dòng chảy tự nhiên, liên tục và không gián đoạn. Cùng nhau: biến data thành hành động thông minh.',
  },
];

export default function AboutLogoSection() {
  const { ref, hasIntersected } = useIntersectionObserver();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section 
      className="py-20 md:py-24 border-y"
      style={{ 
        background: isDark ? "var(--color-bg-surface)" : "#ffffff",
        borderColor: isDark ? "var(--color-border)" : "#F1F0FF" 
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .logo-card {
          background: ${isDark ? "var(--color-bg-surface-raised)" : "#ffffff"};
          border: 1px solid ${isDark ? "var(--color-border)" : "rgba(109,76,255,0.12)"};
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
        }
        .logo-card:hover {
          transform: translateY(-4px);
          box-shadow: ${isDark ? "0 12px 32px rgba(0,0,0,0.3)" : "0 12px 32px rgba(109,76,255,0.12)"};
          border-color: var(--color-brand);
        }
        @media (prefers-reduced-motion: reduce) { 
          * { animation: none !important; transition: none !important; } 
        }
      `}} />

      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-16">
          <h2 className="text-[32px] md:text-[36px] font-bold mb-4" style={{ color: isDark ? "var(--color-text-primary)" : "#1a1a2e" }}>
            Câu chuyện đằng sau logo
          </h2>
          <p className="text-[16px] md:text-[18px]" style={{ color: isDark ? "var(--color-text-secondary)" : "#64748B" }}>
            Mỗi đường nét đều mang một ý nghĩa
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center" ref={ref}>
          {/* Cột TRÁI: Logo (40%) */}
          <div className="w-full lg:w-[40%]">
            <div 
              className="relative rounded-[24px] p-[60px] flex items-center justify-center overflow-hidden h-[400px]"
              style={{ background: isDark ? "linear-gradient(135deg, var(--color-brand), var(--color-bg-surface-high))" : "linear-gradient(135deg, #6D4CFF, #3B82F6)" }}
            >
              {/* Decorative SVG Connections */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 0 100 Q 100 50 200 150 T 400 100" fill="transparent" stroke="#ffffff" strokeWidth="2" opacity="0.5"/>
                  <path d="M 0 200 Q 150 100 250 250 T 500 200" fill="transparent" stroke="#ffffff" strokeWidth="2" opacity="0.3"/>
                  <path d="M 0 300 Q 200 150 300 350 T 600 300" fill="transparent" stroke="#ffffff" strokeWidth="2" opacity="0.4"/>
                  <circle cx="200" cy="150" r="4" fill="#ffffff" />
                  <circle cx="250" cy="250" r="4" fill="#ffffff" />
                  <circle cx="300" cy="350" r="4" fill="#ffffff" />
                </svg>
              </div>

              {/* Logo Image */}
              <div 
                className="relative z-10 bg-white rounded-[24px] shadow-2xl flex items-center justify-center overflow-hidden w-full h-full max-w-[340px] max-h-[200px]"
                style={{ 
                  filter: isDark ? "drop-shadow(0 20px 40px rgba(0,0,0,0.5))" : "drop-shadow(0 20px 40px rgba(109,76,255,0.3))" 
                }}
              >
                <img 
                  src={isDark ? "/logo-dark.png" : "/logo.png"} 
                  alt="InsightFlow Logo" 
                  className={`w-full h-full object-cover pointer-events-none ${isDark ? "" : "mix-blend-multiply"}`} 
                />
              </div>
            </div>
          </div>

          {/* Cột PHẢI: 3 Card (60%) */}
          <div className="w-full lg:w-[60%] flex flex-col gap-6">
            {logoCards.map((card, index) => (
              <div 
                key={index} 
                className={`logo-card flex items-start gap-6 opacity-0 ${hasIntersected ? 'animate-fade-in-up' : ''}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div 
                  className="shrink-0 w-[56px] h-[56px] rounded-[16px] flex items-center justify-center"
                  style={{ background: isDark ? "var(--color-bg-surface)" : "rgba(109,76,255,0.08)", border: isDark ? "1px solid var(--color-border)" : "none" }}
                >
                  <span 
                    className="material-symbols-outlined text-[32px]"
                    style={{ color: isDark ? "var(--color-brand)" : "#6D4CFF" }}
                  >
                    {card.icon}
                  </span>
                </div>
                <div>
                  <h4 className="text-[20px] font-bold mb-2" style={{ color: isDark ? "var(--color-text-primary)" : "#1a1a2e" }}>
                    {card.title}
                  </h4>
                  <p className="text-[15px] leading-[1.7]" style={{ color: isDark ? "var(--color-text-secondary)" : "#64748B" }}>
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
