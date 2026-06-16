"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function FinalCTASection() {
  const { user, loading } = useAuth();

  return (
    <section className="py-[80px] px-6">
      <div
        className="max-w-[1200px] mx-auto p-12 md:p-20 text-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgb(46, 42, 79) 0%, rgb(59, 54, 95) 50%, rgb(38, 35, 63) 100%)",
          borderRadius: "24px",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4234b6] opacity-20 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5f52a8] opacity-10 blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 space-y-8">
          <h2
            className="font-bold text-white"
            style={{ fontSize: "36px", lineHeight: "44px" }}
          >
            Sẵn sàng để làm chủ thông tin thương hiệu?
          </h2>
          <p
            className="max-w-2xl mx-auto"
            style={{ color: "rgb(217, 216, 243)", fontSize: "16px", lineHeight: "24px" }}
          >
            Bắt đầu theo dõi thương hiệu của bạn ngay hôm nay với AI và dữ
            liệu thời gian thực.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!loading && user ? (
              <Link
                href="/dashboard"
                className="bg-[#5b4fcf] text-white px-10 py-4 rounded-xl text-[20px] font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
              >
                Vào Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-[#5b4fcf] text-white px-10 py-4 rounded-xl text-[20px] font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
              >
                Bắt đầu ngay
              </Link>
            )}
            <button className="bg-transparent border border-white/35 text-white px-10 py-4 rounded-xl text-[20px] font-semibold hover:bg-white/10 transition-all">
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
