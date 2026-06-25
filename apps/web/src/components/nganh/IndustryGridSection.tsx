"use client";

import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useTheme } from "@/contexts/ThemeContext";

const industries = [
  {
    icon: "storefront",
    title: "Chuỗi Nhà hàng & Cafe",
    badge: { label: "PHỔ BIẾN NHẤT", style: { background: "#6D4CFF", color: "#FFFFFF" } },
    description:
      "Giám sát chất lượng dịch vụ trên quy mô lớn, đánh giá hiệu quả từng cơ sở và theo dõi phản hồi thực khách về các món mới.",
    features: [
      "Quản lý review đa cơ sở",
      "Phát hiện phàn nàn",
      "Theo dõi trend đồ uống",
      "Đánh giá chất lượng phục vụ",
    ],
    testimonial: {
      quote:
        '"InsightFlow giúp chúng tôi phát hiện và xử lý ngay lập tức những phàn nàn về thái độ phục vụ tại chi nhánh mới, tránh được khủng hoảng truyền thông."',
      author: "COO, Chuỗi 50+ Coffee Shop",
    },
  },
  {
    icon: "fastfood",
    title: "Đồ ăn nhanh & Nhượng quyền",
    badge: { label: "TỐC ĐỘ", style: { background: "#3B82F6", color: "#FFFFFF" } },
    description:
      "Theo dõi mức độ lan truyền của các chiến dịch khuyến mãi (Flash Sale, Combo), và giám sát chất lượng đồng đều giữa các đại lý nhượng quyền.",
    features: [
      "Đo lường chiến dịch Flash Sale",
      "Kiểm soát vệ sinh ATTP",
      "Phân tích phản hồi về giá",
      "Báo cáo hiệu suất đại lý",
    ],
    testimonial: {
      quote:
        '"Hệ thống đã giúp chúng tôi đo lường chính xác hiệu ứng viral của chiến dịch ra mắt món Gà rán vị mới chỉ sau 24 giờ."',
      author: "Marketing Manager, Chuỗi Fastfood",
    },
  },
  {
    icon: "restaurant",
    title: "Nhà hàng Fine Dining",
    badge: null,
    description:
      "Nắm bắt chi tiết trải nghiệm khách hàng cao cấp, từ không gian ẩm thực, thái độ nhân viên đến hương vị đặc trưng của từng món ăn.",
    features: [
      "Lắng nghe Food Blogger/Reviewer",
      "Phân tích cảm xúc trải nghiệm",
      "Theo dõi check-in VIP",
      "Quản lý danh tiếng thương hiệu",
    ],
    testimonial: {
      quote:
        '"Khách hàng của chúng tôi yêu cầu sự hoàn hảo. AI giúp chúng tôi thấu hiểu từng chi tiết nhỏ nhất trong trải nghiệm của họ qua các bài review dài."',
      author: "Chủ đầu tư, Tổ hợp Fine Dining",
    },
  },
  {
    icon: "delivery_dining",
    title: "Nền tảng Giao đồ ăn & Booking",
    badge: null,
    description:
      "Quản lý đối tác nhà hàng, theo dõi phản hồi về tốc độ giao hàng, thái độ shipper và chất lượng ứng dụng trên mọi mặt trận mạng xã hội.",
    features: [
      "Review tốc độ giao hàng",
      "Phàn nàn về Shipper/App",
      "Chất lượng đồ ăn khi giao",
      "Cạnh tranh khuyến mãi",
    ],
    testimonial: {
      quote:
        '"Chúng tôi có thể theo sát nhất cử nhất động các chương trình khuyến mãi của đối thủ nhờ vào khả năng cập nhật theo thời gian thực."',
      author: "Giám đốc Phát triển kinh doanh, Food Delivery App",
    },
  },
];

export default function IndustryGridSection() {
  const { ref, hasIntersected } = useIntersectionObserver();
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
              <h4 className="text-[14px] font-semibold mb-2" style={{ color: isDark ? "var(--color-brand)" : "#6D4CFF" }}>
                Câu chuyện thành công
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
