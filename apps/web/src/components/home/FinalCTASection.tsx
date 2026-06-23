"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const particles = [
  { top: "18%", left: "7%", size: 4, dur: "4s", delay: "0s", opacity: 0.12 },
  { top: "70%", left: "12%", size: 3, dur: "5.5s", delay: "0.8s", opacity: 0.1 },
  { top: "25%", left: "87%", size: 5, dur: "3.5s", delay: "0.3s", opacity: 0.13 },
  { top: "78%", left: "78%", size: 3, dur: "6s", delay: "1.2s", opacity: 0.1 },
  { top: "50%", left: "4%", size: 4, dur: "4.8s", delay: "0.5s", opacity: 0.11 },
  { top: "60%", left: "44%", size: 5, dur: "3.8s", delay: "0.2s", opacity: 0.12 },
  { top: "85%", left: "28%", size: 4, dur: "4.3s", delay: "1.8s", opacity: 0.1 },
];

export default function FinalCTASection() {
  const { user, loading } = useAuth();

  return (
    <section className="px-6 md:px-10 py-12">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gradientShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes floatP {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-10px); }
        }
        .cta-box {
          background: linear-gradient(135deg,#4338CA 0%,#6366F1 50%,#8B5CF6 100%);
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }
        .cta-btn-primary {
          background:#fff; color:#4338CA; font-weight:700; font-size:15px;
          padding:13px 28px; border-radius:14px;
          box-shadow:0 6px 20px rgba(0,0,0,0.13);
          transition:all .25s ease; display:flex; align-items:center; gap:6px;
        }
        .cta-btn-primary:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(0,0,0,0.18); }
        .cta-btn-ghost {
          background:transparent; border:1.5px solid rgba(255,255,255,0.45);
          color:#fff; font-weight:600; font-size:15px;
          padding:13px 28px; border-radius:14px;
          backdrop-filter:blur(8px); transition:all .25s ease;
        }
        .cta-btn-ghost:hover { background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.8); transform:translateY(-2px); }
        @media(prefers-reduced-motion:reduce){
          .cta-box,.cta-particle{ animation:none!important; }
          .cta-btn-primary,.cta-btn-ghost{ transition:none!important; }
        }
      `}} />

      <div
        className="cta-box max-w-[1200px] mx-auto relative overflow-hidden text-center"
        style={{ padding: "56px 64px", borderRadius: "28px", boxShadow: "0 24px 64px rgba(99,102,241,0.32)" }}
      >
        {/* Dot-grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px,transparent 1px)",
          backgroundSize: "20px 20px", opacity: 0.04
        }} />

        {/* Mini stat card */}
        <div className="absolute top-6 right-6 pointer-events-none hidden md:block" style={{
          background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)",
          borderRadius: "10px", padding: "10px 14px", opacity: 0.55,
          transform: "rotate(-8deg)", border: "1px solid rgba(255,255,255,0.15)"
        }}>
          <div className="text-white font-bold text-[13px]">📈 +240%</div>
          <div className="text-white/60 text-[11px]">Mentions</div>
        </div>

        {/* Dots connector */}
        <div className="absolute bottom-6 left-6 pointer-events-none hidden md:block">
          <svg width="88" height="16" viewBox="0 0 88 16">
            <circle cx="8" cy="8" r="4" fill="none" stroke="white" strokeWidth="1.5" opacity="0.2" />
            <line x1="12" y1="8" x2="40" y2="8" stroke="white" strokeWidth="1.2" opacity="0.15" />
            <circle cx="44" cy="8" r="4" fill="none" stroke="white" strokeWidth="1.5" opacity="0.2" />
            <line x1="48" y1="8" x2="76" y2="8" stroke="white" strokeWidth="1.2" opacity="0.15" />
            <circle cx="80" cy="8" r="4" fill="none" stroke="white" strokeWidth="1.5" opacity="0.2" />
          </svg>
        </div>

        {/* Particles */}
        {particles.map((p, i) => (
          <div key={i} className="cta-particle absolute rounded-full pointer-events-none" style={{
            top: p.top, left: p.left, width: p.size, height: p.size,
            background: "white", opacity: p.opacity,
            animation: `floatP ${p.dur} ease-in-out ${p.delay} infinite`
          }} />
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center mb-5" style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "100px", padding: "5px 14px"
          }}>
            <span className="text-white font-bold text-[11px] tracking-[1.5px]">✨ AI SOCIAL LISTENING</span>
          </div>

          {/* Heading */}
          <h2 className="font-extrabold text-white max-w-[560px]" style={{
            fontSize: "clamp(22px,5vw,33px)", lineHeight: 1.2,
            textShadow: "0 2px 16px rgba(0,0,0,0.15)", marginBottom: "12px"
          }}>
            Biến hàng triệu cuộc trò chuyện thành insight kinh doanh
          </h2>

          {/* Subtags */}
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "15px", marginBottom: "32px" }}>
            Theo dõi thương hiệu&nbsp;•&nbsp;Phân tích cảm xúc&nbsp;•&nbsp;Phát hiện xu hướng
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {!loading && user ? (
              <Link href="/dashboard" className="cta-btn-primary justify-center">🚀 Vào Dashboard</Link>
            ) : (
              <Link href="/dashboard" className="cta-btn-primary justify-center">🚀 Trải nghiệm Dashboard</Link>
            )}
            <button className="cta-btn-ghost">Xem Demo</button>
          </div>

          {/* Trust */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <div style={{ color: "rgba(255,255,255,0.78)", fontSize: "13px" }}>
              ⭐⭐⭐⭐⭐&nbsp;&nbsp;4.9/5 đánh giá từ khách hàng
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1" style={{ fontSize: "12px" }}>
              <span><span className="text-white font-bold">500+</span><span style={{ color: "rgba(255,255,255,0.6)" }}> Doanh nghiệp</span></span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
              <span><span className="text-white font-bold">2M+</span><span style={{ color: "rgba(255,255,255,0.6)" }}> Bài phân tích/ngày</span></span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
              <span><span className="text-white font-bold">98%</span><span style={{ color: "rgba(255,255,255,0.6)" }}> Độ chính xác</span></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
