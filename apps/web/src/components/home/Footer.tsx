const footerLinks = [
  {
    heading: "Sản phẩm",
    links: ["Tính năng", "Bảng giá", "Cập nhật"],
  },
  {
    heading: "Công ty",
    links: ["Về chúng tôi", "Blog", "Liên hệ"],
  },
  {
    heading: "Pháp lý",
    links: ["Điều khoản", "Bảo mật", "Cookie"],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#24106b] text-white pt-[48px] px-[24px] md:px-[60px] pb-[32px] mt-auto font-sans">
      <div className="max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-[32px] md:gap-[60px] mb-[48px]">
          {/* Brand Column */}
          <div className="space-y-[12px]">
            <h3 className="text-[18px] font-bold text-white">
              InsightFlow
            </h3>
            <p className="text-[14px] text-white/80 max-w-[220px] leading-relaxed">
              Nền tảng AI theo dõi dữ liệu thương hiệu và cảnh báo sớm cho doanh nghiệp F&B tại Việt Nam.
            </p>
          </div>

          {/* Link Columns */}
          {footerLinks.map((col) => (
            <div key={col.heading} className="space-y-[16px]">
              <h6 className="text-white font-bold text-[12px] uppercase tracking-[0.08em]">
                {col.heading}
              </h6>
              <ul className="flex flex-col gap-[12px]">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[14px] text-white/80 hover:text-white hover:underline transition-all duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.08] pt-[32px] text-center">
          <p className="text-[13px] text-white/60">
            © {new Date().getFullYear()} InsightFlow. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}
