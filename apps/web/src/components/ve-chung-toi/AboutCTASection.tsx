"use client";

import Link from "next/link";

export default function AboutCTASection() {
  return (
    <section className="px-6 md:px-10 py-24">
      <div className="max-w-5xl mx-auto bg-[#4648d4] rounded-[40px] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <h2 className="text-[40px] leading-[48px] tracking-[-0.02em] font-bold">
            Sẵn sàng đưa thương hiệu của bạn vươn xa?
          </h2>
          <p className="text-[18px] leading-[28px] opacity-90 max-w-2xl mx-auto">
            Gia nhập cùng 500+ doanh nghiệp hàng đầu đã tin tưởng InsightFlow
            để tối ưu hóa chiến lược truyền thông xã hội.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="bg-white text-[#4648d4] px-10 py-5 rounded-2xl text-[20px] font-semibold hover:bg-[#e7eeff] transition-all w-full sm:w-auto shadow-lg active:scale-95 text-center"
            >
              Tham gia cùng chúng tôi
            </Link>
            <button className="border border-white/30 text-white px-10 py-5 rounded-2xl text-[20px] font-semibold hover:bg-white/10 transition-all w-full sm:w-auto">
              Đặt lịch tư vấn (Miễn phí)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
