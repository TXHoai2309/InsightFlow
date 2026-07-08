import React from "react";
import { Sparkles } from "lucide-react";

export function AISummaryBanner() {
  return (
    <div className="relative overflow-hidden rounded-[16px] bg-white/70 backdrop-blur-[12px] border border-[#E9E7EE] p-6 shadow-sm group">
      {/* Background Blob decoration */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#5B4FCF] opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20 pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#B0A2FF] shadow-sm">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="mb-2 font-['Hanken_Grotesk'] text-[18px] font-bold text-[#1A1B20]">
            Tóm tắt Thông minh từ AI
          </h2>
          <p className="text-[16px] leading-relaxed text-[#474554] font-['Inter']">
            Hệ thống ghi nhận <strong className="font-bold text-[#4234B6]">12 khách hàng tiềm năng mới</strong> trong 24 giờ qua. 
            Tỉ lệ phản hồi trung bình đã cải thiện đáng kể, đạt mức <strong className="font-bold text-[#4234B6]">4 phút/tin nhắn</strong>. 
            TikTok hiện là nguồn dẫn chính chiếm 50% lưu lượng. Lưu ý: có 2 khách hàng đang hỏi về giá sỉ với điểm tiềm năng cao (trên 90), 
            cần ưu tiên giám sát quá trình tư vấn của đội Sale.
          </p>
        </div>
      </div>
    </div>
  );
}
