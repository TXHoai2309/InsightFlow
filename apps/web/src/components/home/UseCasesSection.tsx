const useCases = [
  {
    title: "Marketing & Brand",
    description:
      "Đo lường hiệu quả chiến dịch, theo dõi sức khỏe thương hiệu và thấu hiểu Insights người dùng.",
  },
  {
    title: "CSKH & Vận hành",
    description:
      "Phản hồi nhanh chóng các khiếu nại, nâng cao chất lượng dịch vụ và quản trị rủi ro vận hành.",
  },
  {
    title: "Phân tích thị trường",
    description:
      "Nắm bắt xu hướng ngành mới nhất, phân tích đối thủ cạnh tranh để tối ưu chiến lược sản phẩm.",
  },
];

export default function UseCasesSection() {
  return (
    <section id="usecases" className="py-[80px] bg-[#f6f2fd] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#1c1b23]">
            Phù hợp cho mọi bộ phận
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="bg-white p-8 rounded-2xl border border-[#c8c4d6] hover-shadow transition-all group"
            >
              <h3 className="text-[20px] leading-[28px] font-semibold mb-4 text-[#4234b6]">
                {useCase.title}
              </h3>
              <p className="text-[16px] leading-[24px] font-normal text-[#474554]">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
