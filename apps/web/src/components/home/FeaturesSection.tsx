"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: "ti-brain",
    emoji: "🤖",
    title: "AI Analysis",
    subtitle: "Phân tích cảm xúc",
    description: "Phân tích cảm xúc tiếng Việt chính xác đến 98% — tích cực, tiêu cực, trung lập trên mọi kênh.",
    accent: "#6D4CFF",
    bg: "#f5f3ff",
  },
  {
    icon: "ti-chart-line",
    emoji: "📊",
    title: "Real-time",
    subtitle: "Theo dõi 24/7",
    description: "Cập nhật dữ liệu mỗi 5 phút từ Facebook, TikTok, YouTube, Báo chí. Không bỏ lỡ bất kỳ tín hiệu nào.",
    accent: "#0ea5e9",
    bg: "#f0f9ff",
  },
  {
    icon: "ti-shield-exclamation",
    emoji: "🛡️",
    title: "Crisis Alert",
    subtitle: "Cảnh báo tức thì",
    description: "Phát hiện dấu hiệu khủng hoảng và gửi thông báo ngay qua Telegram/Email trước khi tình huống leo thang.",
    accent: "#ef4444",
    bg: "#fff8f8",
  },
  {
    icon: "ti-file-analytics",
    emoji: "📋",
    title: "Auto Report",
    subtitle: "Báo cáo tự động",
    description: "Xuất báo cáo định kỳ hàng ngày, hàng tuần với biểu đồ trực quan chuyên nghiệp chỉ với 1 cú nhấp.",
    accent: "#16a34a",
    bg: "#f0fdf4",
  },
];

function FeatureCard({ feature, delay }: { feature: typeof features[0]; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group p-7 bg-white border border-[#E5E7EB] rounded-[16px] flex flex-col gap-4 cursor-pointer"
      style={{
        transition: "transform 0.3s ease, box-shadow 0.3s ease, opacity 0.5s ease",
        transform: visible ? "translateY(0)" : "translateY(24px)",
        opacity: visible ? 1 : 0,
        transitionDelay: `${delay}ms`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-8px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
      }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[22px] transition-transform duration-300 group-hover:rotate-[10deg]"
        style={{ background: feature.bg }}
      >
        <i className={`ti ${feature.icon}`} style={{ color: feature.accent, fontSize: 22 }} />
      </div>

      {/* Labels */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: feature.accent }}>
          {feature.emoji} {feature.title}
        </p>
        <h3 className="text-[19px] font-bold text-[#1c1b23] leading-tight">{feature.subtitle}</h3>
      </div>

      <p className="text-[14px] leading-[22px] text-[#6B7280]">{feature.description}</p>

      {/* Learn more */}
      <div
        className="flex items-center gap-1 text-[13px] font-semibold mt-auto"
        style={{ color: feature.accent }}
      >
        Tìm hiểu thêm
        <i className="ti ti-arrow-right text-[14px] transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-[72px] px-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-widest bg-[#e4dfff] text-[#4234b6] mb-4">
          Tính năng
        </span>
        <h2 className="text-[34px] md:text-[40px] leading-tight tracking-[-0.02em] font-black text-[#1c1b23] mb-3">
          Mọi thứ bạn cần để{" "}
          <span style={{ color: "#6D4CFF" }}>làm chủ truyền thông</span>
        </h2>
        <p className="text-[15px] text-[#6B7280] max-w-xl mx-auto">
          Bộ công cụ AI toàn diện được thiết kế riêng cho doanh nghiệp F&B tại Việt Nam.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => (
          <FeatureCard key={f.title} feature={f} delay={i * 100} />
        ))}
      </div>
    </section>
  );
}
