const features = [
  {
    icon: "psychology",
    title: "Sentiment Analysis",
    description:
      "Phân tích sắc thái ngôn ngữ tiếng Việt (Tích cực, Tiêu cực, Trung lập) với độ chính xác >90%.",
  },
  {
    icon: "notification_important",
    title: "Cảnh báo sớm",
    description:
      "Hệ thống gửi thông báo ngay lập tức qua Telegram/Email khi có dấu hiệu khủng hoảng truyền thông.",
  },
  {
    icon: "auto_graph",
    title: "Báo cáo tự động",
    description:
      "Xuất báo cáo định kỳ hàng ngày, hàng tuần chỉ với một cú nhấp chuột, đầy đủ biểu đồ trực quan.",
  },
  {
    icon: "dashboard_customize",
    title: "Dashboard tổng quan",
    description:
      "Giao diện tập trung, theo dõi tất cả các kênh (Facebook, YouTube, TikTok, Báo chí) trên một màn hình.",
  },
  {
    icon: "compare_arrows",
    title: "Multi-brand",
    description:
      "So sánh chỉ số sức khỏe thương hiệu của bạn với đối thủ cạnh tranh trực tiếp trong cùng phân khúc.",
  },
  {
    icon: "hub",
    title: "Ngành chuyên sâu",
    description:
      "Dữ liệu được phân loại theo ngành hàng cụ thể: F&B, Bất động sản, Tài chính, Bán lẻ...",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-[80px] px-6 max-w-[1200px] mx-auto">
      <div className="text-center mb-16">
        <p className="text-[#4234b6] font-semibold text-[14px] uppercase tracking-widest mb-2">
          Dành riêng cho doanh nghiệp tại Việt Nam
        </p>
        <h2 className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#1c1b23]">
          Tính năng vượt trội
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="p-6 border border-[#c8c4d6] rounded-2xl hover:bg-[#f6f2fd] transition-colors group"
          >
            <div className="w-12 h-12 rounded-lg bg-[#e4dfff] flex items-center justify-center text-[#4234b6] mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">
                {feature.icon}
              </span>
            </div>
            <h4 className="text-[20px] leading-[28px] font-semibold text-[#1c1b23] mb-2">
              {feature.title}
            </h4>
            <p className="text-[14px] leading-[20px] font-normal text-[#474554]">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
