const checkItems = [
  "Theo dõi Share of Voice của thương hiệu so với thị trường.",
  "Định vị các nguồn thảo luận chính (KOLs, Groups, Fanpages).",
  "Phân tích hành vi và nhân khẩu học của khách hàng mục tiêu.",
];

export default function DashboardPreviewSection() {
  return (
    <section className="py-[80px] px-6 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left — Dashboard Screenshot */}
        <div className="md:col-span-6 order-2 md:order-1">
          <div className="bg-white rounded-2xl soft-shadow border border-[#c8c4d6] overflow-hidden max-w-[560px] max-h-[380px]">
            <img
              className="w-full h-full object-contain"
              alt="InsightFlow Dashboard Screenshot"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0QYJ2vPuJ2GnfAkSPvHCpUEr7j9ab9id8AbduQIl1iXSyNiH2xujVlY_Ara9-Pb-lMECjk5qTeq9wiyVmJnumQhTCbpFOG8q3H3PWyOfECHWzBFXbMg6CiwpNoDVuh12Vx88qtaWML-rLoWhv3rWVQr36sd8KowXWsrvTtwVb4YhGH5Eq6QeIveAC7woPnZV4161I-EHvbb5_K9vS1LQZhAnERzTNO3bjwLE7zr-zZ-byEuzQ4gFKdesU1dMr-HCC3ryxFsD_P4k"
            />
          </div>
        </div>

        {/* Right — Text Content */}
        <div className="md:col-span-6 order-1 md:order-2 space-y-6">
          <h2 className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#1c1b23]">
            Trải nghiệm quản trị thương hiệu toàn diện
          </h2>
          <p className="text-[18px] leading-[28px] font-normal text-[#474554]">
            InsightFlow cung cấp cái nhìn 360 độ về mọi khía cạnh của thương
            hiệu trên không gian số.
          </p>
          <ul className="space-y-4">
            {checkItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#4234b6] mt-0.5 flex-shrink-0">
                  check_circle
                </span>
                <span className="text-[16px] leading-[24px] font-normal text-[#1c1b23]">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
