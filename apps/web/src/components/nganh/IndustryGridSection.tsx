"use client";

const industries = [
  {
    icon: "shopping_basket",
    title: "Bán lẻ & Thương mại điện tử",
    badge: { label: "Phổ biến", color: "bg-[#645efb] text-white" },
    description:
      "Theo dõi phản hồi khách hàng đa kênh, nắm bắt xu hướng tiêu dùng nhanh chóng và quản lý khủng hoảng truyền thông trong các đợt Sale lớn.",
    features: [
      "Phân tích đối thủ",
      "Phát hiện phàn nàn",
      "Hiệu quả KOL/KOC",
      "Đánh giá sản phẩm",
    ],
    testimonial: {
      quote:
        '"Nhờ InsightFlow, chúng tôi đã giảm 40% thời gian xử lý khiếu nại trên mạng xã hội trong chiến dịch Mega Sale 11.11."',
      author: "Giám đốc Marketing, Chuỗi bán lẻ top 3 Việt Nam",
      borderColor: "border-[#4648d4]",
      headingColor: "text-[#4648d4]",
    },
  },
  {
    icon: "account_balance",
    title: "Tài chính & Ngân hàng",
    badge: { label: "Bảo mật cao", color: "bg-[#ffdcc5] text-[#301400]" },
    description:
      "Giám sát các tin đồn tài chính, tin giả ảnh hưởng đến uy tín hệ thống và phân tích mức độ hài lòng của người dùng về dịch vụ số.",
    features: [
      "Cảnh báo tin giả 24/7",
      "Lắng nghe người dùng",
      "Phân tích rủi ro",
      "Thống kê thị phần",
    ],
    testimonial: {
      quote:
        '"Hệ thống cảnh báo sớm giúp chúng tôi ngăn chặn một chiến dịch bôi nhọ thương hiệu chỉ trong vòng 2 tiếng kể từ khi phát sinh."',
      author: "Trưởng phòng PR, Ngân hàng TMCP Quốc tế",
      borderColor: "border-[#4b41e1]",
      headingColor: "text-[#4b41e1]",
    },
  },
  {
    icon: "apartment",
    title: "Bất động sản",
    badge: null,
    description:
      "Nắm bắt tâm lý nhà đầu tư, theo dõi sức nóng của các dự án và quản lý thông tin đa chiều về thị trường bất động sản nghỉ dưỡng/nhà ở.",
    features: [
      "Phân tích dự án",
      "Xu hướng đầu tư",
      "Báo cáo thị trường",
      "Quản lý Sale Agency",
    ],
    testimonial: {
      quote:
        '"InsightFlow giúp chúng tôi điều chỉnh thông điệp truyền thông cho dự án mới dựa trên đúng những gì nhà đầu tư đang lo ngại."',
      author: "CMO, Tập đoàn BĐS hàng đầu",
      borderColor: "border-[#904900]",
      headingColor: "text-[#904900]",
    },
  },
  {
    icon: "restaurant",
    title: "F&B - Ẩm thực & Đồ uống",
    badge: null,
    description:
      "Giám sát chất lượng dịch vụ qua đánh giá của thực khách, bắt kịp các \"trend\" ăn uống của giới trẻ và quản lý uy tín chuỗi cửa hàng.",
    features: [
      "Lắng nghe Food Reviewer",
      "Cảnh báo vệ sinh ATTP",
      "Theo dõi độ phủ",
      "Tâm lý thực khách",
    ],
    testimonial: {
      quote:
        '"Chúng tôi phát hiện ra món mới đang gây bão trên TikTok và kịp thời đưa vào menu chỉ sau 3 ngày nhờ phân tích xu hướng của AI."',
      author: "Brand Manager, Chuỗi Coffee Store",
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
