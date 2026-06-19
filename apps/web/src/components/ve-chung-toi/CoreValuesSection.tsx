"use client";

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
  return (
    <section className="px-6 md:px-10 py-24 max-w-7xl mx-auto">
      {/* Header row */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
        <div className="max-w-xl space-y-4">
          <h2 className="text-[32px] leading-[40px] tracking-[-0.02em] font-bold text-[#111c2d]">
            Giá trị cốt lõi
          </h2>
          <p className="text-[16px] leading-[24px] text-[#464554]">
            Văn hóa tại InsightFlow được xây dựng dựa trên sự cam kết mang lại
            giá trị thực chất cho khách hàng.
          </p>
        </div>
        {/* Navigation arrows (decorative) */}
        <div className="flex gap-4">
          <button className="w-12 h-12 rounded-full border border-[#767586] flex items-center justify-center hover:bg-[#e7eeff] transition-all">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-12 h-12 rounded-full border border-[#767586] flex items-center justify-center hover:bg-[#e7eeff] transition-all">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {values.map((v) => (
          <div
            key={v.title}
            className="p-8 rounded-3xl border border-[#c7c4d7] hover:border-[#4648d4] hover:shadow-xl transition-all group cursor-default"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#dee8ff] flex items-center justify-center mb-8 group-hover:bg-[#6063ee] transition-colors">
              <span className="material-symbols-outlined text-[#4648d4] text-[30px] group-hover:text-white transition-colors">
                {v.icon}
              </span>
            </div>
            <h4 className="text-[20px] leading-[28px] font-semibold text-[#111c2d] mb-4">
              {v.title}
            </h4>
            <p className="text-[16px] leading-[24px] text-[#464554]">
              {v.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
