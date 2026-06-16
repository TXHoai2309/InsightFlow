const stats = [
  {
    value: "10,000+",
    label: "Thảo luận được xử lý mỗi ngày",
  },
  {
    value: "9 Thương hiệu",
    label: "Chuyên sâu F&B: Highlands, Phúc Long, KATINAT...",
    bordered: true,
  },
  {
    value: "<30 Phút",
    label: "Tốc độ cập nhật dữ liệu liên tục",
  },
];

export default function StatsBarSection() {
  return (
    <section className="bg-[#5b4fcf] py-12">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={stat.bordered ? "md:border-x border-white/20" : ""}
          >
            <div className="text-[40px] font-bold leading-tight">
              {stat.value}
            </div>
            <p className="text-[14px] font-semibold leading-[20px] opacity-90 mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
