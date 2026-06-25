"use client";

import { useTheme } from "@/contexts/ThemeContext";

const values = [
  {
    icon: "lightbulb",
    title: "Đổi mới (Innovation)",
    description:
      "Chúng tôi liên tục cập nhật các mô hình AI mới nhất như GPT-4, Llama 3 và các mô hình NLP tiếng Việt độc quyền để mang lại độ chính xác tối ưu.",
  },
  {
    icon: "visibility",
    title: "Minh bạch (Transparency)",
    description:
      "Dữ liệu được thu thập và xử lý tuân thủ nghiêm ngặt các quy định về bảo mật. Mọi chỉ số phân tích đều có nguồn gốc rõ ràng, khách quan.",
  },
  {
    icon: "handshake",
    title: "Đồng hành (Partnership)",
    description:
      "Sự thành công của doanh nghiệp là thước đo cho giá trị của chúng tôi. InsightFlow luôn sát cánh hỗ trợ 24/7 trong mọi tình huống.",
  },
];

export default function CoreValuesSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section 
      className="px-6 md:px-10 py-24"
      style={{ background: isDark ? "linear-gradient(180deg, var(--color-bg-surface) 0%, var(--color-bg-primary) 100%)" : "linear-gradient(180deg, #ffffff 0%, #f8f7ff 100%)" }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .core-value-card {
          background: ${isDark ? "var(--color-bg-surface-raised)" : "#ffffff"};
          border-top: 3px solid transparent;
          border-radius: 20px;
          padding: 32px;
          box-shadow: ${isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(109,76,255,0.06)"};
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        .core-value-card::before {
          content: "";
          position: absolute;
          top: -3px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--color-brand);
          opacity: 0;
          transition: all 0.4s ease;
        }
        .core-value-card:hover {
          transform: translateY(-8px);
          box-shadow: ${isDark ? "0 20px 48px rgba(0,0,0,0.4)" : "0 20px 48px rgba(109,76,255,0.14)"};
        }
        .core-value-card:hover::before {
          opacity: 1;
          box-shadow: 0 -2px 12px var(--color-brand-border);
        }
        .core-value-card:hover .core-value-icon {
          transform: rotate(10deg);
        }
        .core-value-card:hover .core-value-arrow {
          opacity: 1;
          transform: translateX(0);
        }
        .core-value-arrow {
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
          color: var(--color-brand);
        }
        .core-value-icon {
          transition: transform 0.4s ease;
        }
      `}} />
      <div className="max-w-7xl mx-auto">
        {/* Header row */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-xl space-y-4">
            <h2 className="text-[32px] md:text-[36px] leading-[1.2] tracking-tight font-bold" style={{ color: isDark ? "var(--color-text-primary)" : "#1a1a2e" }}>
              Giá trị cốt lõi
            </h2>
            <p className="text-[16px] md:text-[18px] leading-[1.6]" style={{ color: isDark ? "var(--color-text-secondary)" : "#64748B" }}>
              Văn hóa tại InsightFlow được xây dựng dựa trên sự cam kết mang lại
              giá trị thực chất cho khách hàng.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((v) => (
            <div
              key={v.title}
              className="core-value-card group cursor-default flex flex-col"
              style={{ border: isDark ? "1px solid var(--color-border)" : "none" }}
            >
              <div 
                className="w-[72px] h-[72px] rounded-[16px] flex items-center justify-center mb-8"
                style={{ background: isDark ? "var(--color-bg-surface)" : "rgba(109,76,255,0.08)", border: isDark ? "1px solid var(--color-border)" : "none" }}
              >
                <span 
                  className="core-value-icon material-symbols-outlined text-[48px]"
                  style={{ color: isDark ? "var(--color-brand)" : "#6D4CFF", fontVariationSettings: "'FILL' 1" }}
                >
                  {v.icon}
                </span>
              </div>
              <h4 className="text-[20px] md:text-[22px] font-bold mb-4" style={{ color: isDark ? "var(--color-text-primary)" : "#1a1a2e" }}>
                {v.title}
              </h4>
              <p className="text-[15px] md:text-[16px] leading-[1.6] mb-8 flex-1" style={{ color: isDark ? "var(--color-text-secondary)" : "#64748B" }}>
                {v.description}
              </p>
              
              <div className="mt-auto flex justify-end">
                <span className="core-value-arrow material-symbols-outlined text-[24px]">
                  arrow_forward
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

