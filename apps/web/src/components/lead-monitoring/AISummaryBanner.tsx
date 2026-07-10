import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export function AISummaryBanner() {
  const actions = [
    "2 lead hỏi giá sỉ điểm cao chưa được phản hồi",
    "TikTok tạo nhiều lead nhất nhưng SLA đang chậm hơn Facebook",
    "6 lead chưa gán nhân sự, nên chia tự động trước giờ cao điểm",
  ];

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E9E7EE] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#5B4FCF] shadow-sm">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-['Hanken_Grotesk'] text-[18px] font-bold text-[#1A1B20]">
              AI đề xuất xử lý
            </p>
            <p className="mt-1 max-w-3xl text-[14px] leading-6 text-[#474554]">
              Hệ thống ghi nhận <strong className="font-bold text-[#4234B6]">12 lead mới</strong> trong 24 giờ qua. Ưu tiên hiện tại là giảm lead quá SLA, gán owner cho lead nóng và kiểm tra nguồn TikTok đang tăng nhanh.
            </p>
          </div>
        </div>

        <div className="grid min-w-0 flex-1 gap-2 lg:max-w-[620px]">
          {actions.map((action, index) => (
            <div
              key={action}
              className="flex items-center gap-3 rounded-[10px] border border-[#EEEDF4] bg-[#FAF8FF] px-3 py-2 text-[13px] font-semibold text-[#1A1B20]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#4234B6] shadow-sm">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{action}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#787585]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
