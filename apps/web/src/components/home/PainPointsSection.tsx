const painPoints = [
  {
    icon: "timer_off",
    iconColor: "text-[#4234b6]",
    title: "Theo dõi thủ công",
    description:
      "Tốn hàng giờ mỗi ngày để tổng hợp dữ liệu từ nhiều nguồn mà vẫn bỏ sót thảo luận quan trọng.",
  },
  {
    icon: "warning",
    iconColor: "text-[#ba1a1a]",
    title: "Khủng hoảng bất ngờ",
    description:
      "Chỉ phát hiện ra vấn đề khi nó đã lan rộng trên mạng xã hội, không kịp có phương án xử lý.",
  },
  {
    icon: "analytics",
    iconColor: "text-[#763b00]",
    title: "Không đủ dữ liệu",
    description:
      "Thiếu cái nhìn tổng quát về ngành và đối thủ, dẫn đến những quyết định kinh doanh cảm tính.",
  },
];

export default function PainPointsSection() {
  return (
    <section className="py-[80px] bg-[#f6f2fd] px-6">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#1c1b23] text-center mb-12">
          Bạn đang bỏ lỡ điều gì?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {painPoints.map((item) => (
            <div
              key={item.title}
              className="bg-white p-8 rounded-2xl soft-shadow hover-shadow transition-all border border-[#c8c4d6]"
            >
              <span
                className={`material-symbols-outlined ${item.iconColor} text-[40px] mb-4 block`}
              >
                {item.icon}
              </span>
              <h3 className="text-[20px] leading-[28px] font-semibold text-[#1c1b23] mb-2">
                {item.title}
              </h3>
              <p className="text-[16px] leading-[24px] font-normal text-[#474554]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
