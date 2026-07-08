import React from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export function AISummaryCard() {
  return (
    <Card className="bg-[#F8F9FE] border-none shadow-sm dark:bg-[#5B5CEB]/10 rounded-2xl">
      <CardContent className="flex items-start p-6">
        <div className="mr-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#A5A6F6]/40 text-[#5B5CEB] shadow-sm">
          <Sparkles className="h-7 w-7" />
        </div>
        <div>
          <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
            Tóm tắt Thông minh từ AI
          </h3>
          <p className="text-[14px] leading-relaxed text-gray-600 dark:text-gray-300">
            Hệ thống ghi nhận <strong className="text-[#5B5CEB]">12 khách hàng tiềm năng mới</strong> trong 24 giờ qua. Tỉ lệ phản hồi trung bình đã cải thiện đáng kể, đạt mức <strong className="text-[#5B5CEB]">4 phút/tin nhắn</strong>. TikTok hiện là nguồn dẫn chính chiếm 50% lưu lượng. Lưu ý: có 2 khách hàng đang hỏi về giá sỉ với điểm tiềm năng cao (trên 90), cần ưu tiên giám sát quá trình tư vấn của đội Sale.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
