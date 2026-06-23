"use client";

export default function IndustryHeroSection() {
  return (
    <section className="py-[80px] px-6 text-center max-w-[1200px] mx-auto">
      {/* Badge */}
      <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#dee8ff] text-[#4648d4] text-[14px] font-medium mb-6 gap-2">
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        Giải pháp AI theo ngành đặc thù
      </div>

      {/* Headline */}
      <h1 className="text-[40px] leading-[48px] tracking-[-0.02em] font-bold text-[#111c2d] mb-6 max-w-4xl mx-auto">
        Tối ưu hóa hiệu suất truyền thông cho ngành F&B
      </h1>

      {/* Subtext */}
      <p className="text-[18px] leading-[28px] font-normal text-[#464554] max-w-2xl mx-auto">
        Hệ thống AI của InsightFlow được tinh chỉnh để thấu hiểu ngôn ngữ, review ẩm thực và
        hành vi của thực khách trên mạng xã hội tại Việt Nam.
      </p>
    </section>
  );
}
