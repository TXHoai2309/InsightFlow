export default function HeroSection() {
  return (
    <section className="py-[80px] px-6 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Content */}
        <div className="md:col-span-7 space-y-6">
          <span className="inline-block px-3 py-1 bg-[#e4dfff] text-[#140067] font-medium text-[12px] rounded-full tracking-wider uppercase">
            AI Brand Monitoring Platform
          </span>

          <h1 className="text-[48px] leading-[56px] tracking-[-0.02em] font-bold text-[#1c1b23] md:text-[48px] text-[24px]">
            Theo dõi thương hiệu thông minh hơn với AI
          </h1>

          <p className="text-[18px] leading-[28px] font-normal text-[#474554] max-w-lg">
            Giải pháp tối ưu cho doanh nghiệp Việt: Lắng nghe mạng xã hội,
            phân tích cảm xúc và cảnh báo khủng hoảng truyền thông trong
            thời gian thực.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button className="bg-[#4234b6] text-white px-8 py-3.5 rounded-[10px] font-semibold text-[14px] soft-shadow hover:opacity-90 transition-all">
              Bắt đầu miễn phí
            </button>
            <button className="border-2 border-[#4234b6] text-[#4234b6] px-8 py-3.5 rounded-[10px] font-semibold text-[14px] hover:bg-[#f6f2fd] transition-all">
              Xem demo
            </button>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-[#c8c4d6] w-fit">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-[#b0a2ff]"></div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-[#ffdcc5]"></div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-[#c5c0ff]"></div>
            </div>
            <p className="text-[12px] leading-[16px] font-medium text-[#474554]">
              Tham gia cùng 500+ doanh nghiệp hàng đầu tại Việt Nam
            </p>
          </div>
        </div>

        {/* Right — Dashboard Preview Image */}
        <div className="md:col-span-5 relative">
          <div className="absolute inset-0 bg-[#4234b6] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="relative bg-white rounded-2xl soft-shadow border border-[#c8c4d6] p-2 max-w-[520px] mx-auto aspect-[16/10] overflow-hidden">
            <img
              className="w-full h-full object-cover rounded-xl"
              alt="InsightFlow Dashboard Preview"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfs1taXYlBN3FhBZ9nqRna5TDswgyQwOu64r6W0EM-nSkxzIWrcyIDCW6rk2dP-6Sb9Qt8ywnS87Lijp4L8dthQOhxVu37_OT6b-vyrtjlwiaHMZvMpPuYYnVS5yu0_UDSV1vPu3Dm2wEt0-T3IE3tGhab2SC_slY8REgG9rVfvayNYjAyhPXB3HrEQcH4DLKSui9qUoLTOImVFsf2jIpnGFQ8roZS-NGBon1D8lXepkm9a13km5u4hlY6PgbfTQgAgTA2h_mHwUY"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
