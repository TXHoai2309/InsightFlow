"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function FinalCTASection() {
  const { user, loading } = useAuth();

  return (
    <section className="py-[60px] px-6">
      <div
        className="max-w-[1000px] mx-auto p-8 md:p-14 text-center relative overflow-hidden shadow-[0_12px_40px_-10px_rgba(108,99,255,0.3)]"
        style={{
          background: "linear-gradient(135deg, #6157e8 0%, #8C82FF 100%)",
          borderRadius: "24px",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-white opacity-10 rounded-full blur-[60px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[200px] h-[200px] bg-[#38B2AC] opacity-20 rounded-full blur-[60px] pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-bold text-white text-[28px] md:text-[36px] leading-tight tracking-[-0.01em]">
            Sẵn sàng để làm chủ thông tin thương hiệu?
          </h2>
          <p className="max-w-xl mx-auto text-white/90 text-[16px] md:text-[18px] leading-relaxed font-light">
            Bắt đầu theo dõi thương hiệu của bạn ngay hôm nay với AI và dữ liệu thời gian thực.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            {!loading && user ? (
              <Link
                href="/dashboard"
                className="bg-white text-[#6157e8] px-8 py-3.5 rounded-[12px] text-[16px] font-bold hover:shadow-[0_4px_16px_rgba(255,255,255,0.25)] active:scale-95 transition-all flex items-center justify-center min-w-[160px]"
              >
                Vào Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-white text-[#6157e8] px-8 py-3.5 rounded-[12px] text-[16px] font-bold hover:shadow-[0_4px_16px_rgba(255,255,255,0.25)] active:scale-95 transition-all flex items-center justify-center min-w-[160px]"
              >
                Bắt đầu ngay
              </Link>
            )}
            <button className="bg-transparent border-[1.5px] border-white/40 text-white px-8 py-3.5 rounded-[12px] text-[16px] font-bold hover:bg-white/10 hover:border-white transition-all min-w-[160px]">
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
