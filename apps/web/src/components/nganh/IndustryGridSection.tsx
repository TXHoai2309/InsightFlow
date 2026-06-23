"use client";

const industries = [
  {
    icon: "storefront",
    title: "Chuỗi Nhà hàng & Cafe",
    badge: { label: "Phổ biến nhất", color: "bg-[#645efb] text-white" },
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
      borderColor: "border-[#4648d4]",
      headingColor: "text-[#4648d4]",
    },
  },
  {
    icon: "fastfood",
    title: "Đồ ăn nhanh & Nhượng quyền",
    badge: { label: "Tốc độ", color: "bg-[#ffdcc5] text-[#301400]" },
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
      borderColor: "border-[#4b41e1]",
      headingColor: "text-[#4b41e1]",
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
      borderColor: "border-[#904900]",
      headingColor: "text-[#904900]",
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
      borderColor: "border-[#6063ee]",
      headingColor: "text-[#6063ee]",
    },
  },
];

export default function IndustryGridSection() {
  return (
    <section className="pb-[80px] px-6 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {industries.map((industry) => (
          <div
            key={industry.title}
            className="glass-card p-8 rounded-2xl flex flex-col h-full hover-lift"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span
                  className="material-symbols-outlined text-[40px] text-[#4648d4] mb-4 block"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {industry.icon}
                </span>
                <h2 className="text-[24px] leading-[32px] font-semibold text-[#111c2d]">
                  {industry.title}
                </h2>
              </div>
              {industry.badge && (
                <span
                  className={`${industry.badge.color} px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wider whitespace-nowrap ml-4`}
                >
                  {industry.badge.label}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-[16px] leading-[24px] text-[#464554] mb-8 leading-relaxed">
              {industry.description}
            </p>

            {/* Feature List */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {industry.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4648d4] text-[18px]">
                    check_circle
                  </span>
                  <span className="text-[14px] font-medium text-[#111c2d]">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div
              className={`mt-auto bg-[#f0f3ff] p-6 rounded-xl border-l-4 ${industry.testimonial.borderColor}`}
            >
              <h4
                className={`text-[14px] font-semibold ${industry.testimonial.headingColor} mb-2`}
              >
                Câu chuyện thành công
              </h4>
              <p className="text-[14px] leading-[20px] italic text-[#111c2d]">
                {industry.testimonial.quote}{" "}
                <strong>- {industry.testimonial.author}</strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
