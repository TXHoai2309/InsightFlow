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
    <footer className="bg-[#24106B] text-[#C9C6F2]">
      <div className="max-w-[1200px] mx-auto px-8 py-[80px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="text-[20px] font-bold text-white">InsightFlow</div>
            <p className="text-[14px] leading-[20px] font-normal">
              Nền tảng AI theo dõi dữ liệu thương hiệu và cảnh báo sớm cho
              doanh nghiệp F&B tại Việt Nam.
            </p>
          </div>

          {/* Link Columns */}
          {footerLinks.map((col) => (
            <div key={col.heading} className="space-y-4">
              <h6 className="text-white font-semibold text-[14px]">
                {col.heading}
              </h6>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[14px] leading-[20px] font-normal hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10">
          <div className="py-8">
            <p className="text-[12px] leading-[16px] font-medium">
              © 2025 InsightFlow. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
