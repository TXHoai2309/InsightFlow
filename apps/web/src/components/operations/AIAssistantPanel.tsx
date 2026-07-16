import React from "react";

export function AIAssistantPanel() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-[0_4px_20px_rgba(109,93,246,0.08)] relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      <div className="flex items-center gap-3 mb-4">
        <i className="ti ti-sparkles text-purple-600 text-xl"></i>
        <h2 className="text-lg font-bold text-slate-800">AI Assistant</h2>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-end mb-3">
          <p className="text-sm font-semibold text-slate-700">Hôm nay có 3 vấn đề cần ưu tiên xử lý:</p>
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl -mt-4 relative z-10 shadow-sm border border-white">
            🤖
          </div>
        </div>
        
        <ul className="space-y-2 text-[13px] text-slate-600">
          <li className="flex items-start gap-2">
            <span className="font-bold text-purple-600 w-3 shrink-0">1.</span>
            <span>Video TikTok tiêu cực về Mixue đang tăng nhanh</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-purple-600 w-3 shrink-0">2.</span>
            <span>18 khách hàng chưa nhận phản hồi</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-purple-600 w-3 shrink-0">3.</span>
            <span>1 khách hàng tiềm năng đang có ý định mua</span>
          </li>
        </ul>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button className="flex-1 border border-purple-200 text-purple-600 hover:bg-purple-50 font-semibold text-xs py-2 rounded-lg transition-colors">
          Xem chi tiết
        </button>
        <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2 rounded-lg transition-colors shadow-sm shadow-purple-600/30">
          Đề xuất hành động
        </button>
      </div>
    </div>
  );
}
