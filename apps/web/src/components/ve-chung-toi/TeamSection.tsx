"use client";

import Image from "next/image";

const team = [
  {
    name: "TS. Nguyễn Thành Nam",
    role: "Chief AI Officer",
    image: "/team_nguyen_thanh_nam.png",
  },
  {
    name: "Lê Thu Thủy",
    role: "Head of Data Science",
    image: "/team_le_thu_thuy.png",
  },
  {
    name: "Trần Hoàng Long",
    role: "CTO",
    image: "/team_tran_hoang_long.png",
  },
  {
    name: "Phạm Minh Đức",
    role: "Product Director",
    image: "/team_pham_minh_duc.png",
  },
];

export default function TeamSection() {
  return (
    <section id="team" className="px-6 md:px-10 py-24 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-[32px] leading-[40px] tracking-[-0.02em] font-bold text-[#111c2d] mb-12">
          Đội ngũ chuyên gia AI hàng đầu
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {team.map((member) => (
            <div key={member.name} className="space-y-4 group">
              {/* Avatar */}
              <div className="aspect-square rounded-3xl overflow-hidden shadow-md relative">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              {/* Info */}
              <div>
                <div className="text-[18px] leading-[26px] font-semibold text-[#111c2d]">
                  {member.name}
                </div>
                <div className="text-[14px] font-medium text-[#4648d4]">
                  {member.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
