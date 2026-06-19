"use client";

import Link from "next/link";

export default function IndustryCTASection() {
  return (
    <section className="py-[80px] px-6 max-w-[1200px] mx-auto">
      <div className="bg-[#e7eeff] rounded-3xl py-[80px] px-8 text-center">
        <h2 className="text-[32px] leading-[40px] tracking-[-0.02em] font-bold text-[#111c2d] mb-6">
          Sẵn sàng nâng tầm thương hiệu của bạn?
        </h2>
        <p className="text-[18px] leading-[28px] text-[#464554] mb-10 max-w-2xl mx-auto">
          Tham gia cùng 500+ doanh nghiệp hàng đầu tại Việt Nam đang sử dụng
          InsightFlow để làm chủ truyền thông.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-[#4648d4] text-white px-10 py-4 rounded-xl text-[20px] font-semibold hover:bg-[#6063ee] transition-all shadow-lg text-center"
          >
            Bắt đầu miễn phí
          </Link>
          <button className="bg-white text-[#4648d4] border-2 border-[#4648d4] px-10 py-4 rounded-xl text-[20px] font-semibold hover:bg-[#dee8ff] transition-all">
            Yêu cầu Demo
          </button>
        </div>
      </div>
    </section>
  );
}
