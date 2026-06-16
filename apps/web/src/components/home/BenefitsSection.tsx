const benefits = [
  "Dữ liệu Local 100% tiếng Việt",
  "Đội ngũ hỗ trợ chuyên gia 24/7",
  "Tùy chỉnh linh hoạt theo ngành",
  "Chi phí tối ưu cho SME Việt",
  "Bảo mật dữ liệu chuẩn Enterprise",
  "Hỗ trợ API kết nối hệ thống CRM",
];

export default function BenefitsSection() {
  return (
    <section className="py-[80px] px-6 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left — Checklist */}
        <div className="md:col-span-7">
          <h2 className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#1c1b23] mb-8">
            Tại sao chọn InsightFlow?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-[#4234b6]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span className="text-[14px] leading-[20px] font-semibold text-[#1c1b23]">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — AI Insight Card */}
        <div className="md:col-span-5">
          <div className="ai-accent p-8 rounded-2xl soft-shadow border border-[#c8c4d6]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-[#4234b6] rounded-lg text-white">
                <span className="material-symbols-outlined">neurology</span>
              </div>
              <span className="text-[14px] font-semibold text-[#4234b6]">
                Insight AI Engine
              </span>
            </div>
            <p className="text-[14px] leading-[20px] font-normal italic text-[#474554] mb-4">
              &quot;Hệ thống tự động tóm tắt 2,000 thảo luận tiêu cực về dòng
              sản phẩm mới của bạn trong sáng nay. Nguyên nhân chính: Lỗi vận
              chuyển chậm.&quot;
            </p>
            <div className="h-1 bg-[#c8c4d6] rounded-full overflow-hidden">
              <div className="h-full bg-[#4234b6] w-[85%]"></div>
            </div>
            <p className="text-[12px] leading-[16px] font-medium mt-2 text-right text-[#474554]">
              Phân tích hoàn tất 85%
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
