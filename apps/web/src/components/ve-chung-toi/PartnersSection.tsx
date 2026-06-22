"use client";

const partners = [
  "VINAGROUP",
  "TECH-SOL",
  "VIETCOM",
  "GLOBAL-AI",
  "SMART-RETAIL",
];

export default function PartnersSection() {
  return (
    <section className="px-6 md:px-10 py-20 border-y border-[#c7c4d7]">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <p className="text-[14px] font-medium text-[#464554] mb-10 opacity-70 uppercase tracking-widest text-center">
          Đối tác chiến lược &amp; Khách hàng tiêu biểu
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60">
          {partners.map((partner) => (
            <div
              key={partner}
              className="text-[20px] font-bold text-[#111c2d] grayscale hover:grayscale-0 hover:text-[#4648d4] transition-all cursor-pointer"
            >
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
