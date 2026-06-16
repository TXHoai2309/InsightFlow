const testimonials = [
  {
    quote:
      "Công cụ không thể thiếu để chúng tôi quản trị thương hiệu trên MXH. Tốc độ cảnh báo cực nhanh.",
    name: "Nguyễn Văn A",
    role: "Marketing Director, VinFast",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAMzXYs5TvqMHBNvYpFUQ8p5n_6CeNYt_tu4tZFD3WwYteQgvyguoo_bNhb3MSrdJh5wyXBzdh3jGYf5_0B1jZ3u9DG1Cshvdh-NpXeGww4MM3Zmi-ZbCSNGwoLSQMKA3wmThO24zmdwFvLtboB-ry53akDXxjTA3qbE6O4OB94Qa0_pxSu058ihgJgeKnySiknJEA24q_x1c58tjTCEjY9f3zoIc_IswPhU0CYMULEyd8vnP4o2b3Q1r3fspLmMkO6uEpV0l2SiKg",
  },
  {
    quote:
      "Insights về hành vi người dùng Việt của InsightFlow rất sâu sắc và thực tế cho chiến dịch.",
    name: "Lê Thị B",
    role: "Brand Manager, Highlands Coffee",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCcXmZVzrsGg_5DV7YnCq2CIjF06vwhxxvyPNm4SfTyFW9NROcZX05qAXzVpej_pikZL2b3Wgu8V8j4PGSRHLEGAul_tUh8wv3tWvy-nkveI-twVMUZTP80EMPEBycu4Mf-un3z6q2x-1JtmckUekhwJ8CG8dfPQ-XS0JmznApMCC7hV1OZxScxw5Afx53kR-rPnlmNxQHO0XUgkPmSBx2duT4r-NtSbk19o1ziIfEE5mazZ2AC-LrTtPhwpZsJYeo1jtG5SJ3VwU",
  },
  {
    quote:
      "Độ chính xác trong việc phân tích cảm xúc tiếng Việt là điều khiến chúng tôi gắn bó lâu dài.",
    name: "Trần Văn C",
    role: "Head of Data, Tiki",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCSrH1wmLeSyoshhBu94mE8dbn7eW31fcP75ASZBM9UzD6Spi9I6DmFOzC-s6-q34K-FZaCIzYklExM4CqwJ6ICtc15DOliRC11h6cqE8NkAeIUSAQuTWlPdBHmtGw5MZapCPugZcBueoGWJEOGWpmJaiPlI8eY8bW3JduSS1ble2sCXM-_-AIhKKuGCEH9l0ttux-1cg1HKFSOgyA1COWmYmX2InqZYRCbhjSwJukvLgAa3uR5YdlOPEmuO0y1_q2B7y-3Nuamltg",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-[80px] bg-[#f6f2fd] px-6">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#1c1b23] text-center mb-12">
          Chia sẻ từ chuyên gia
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white p-6 rounded-2xl soft-shadow border border-[#c8c4d6]"
            >
              <p className="text-[16px] leading-[24px] font-normal text-[#474554] mb-6 italic">
                &quot;{t.quote}&quot;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#dcd8e3] overflow-hidden flex-shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    alt={t.name}
                    src={t.avatarSrc}
                  />
                </div>
                <div>
                  <h5 className="text-[14px] leading-[20px] font-semibold text-[#1c1b23]">
                    {t.name}
                  </h5>
                  <p className="text-[12px] leading-[16px] font-medium text-[#474554]">
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
