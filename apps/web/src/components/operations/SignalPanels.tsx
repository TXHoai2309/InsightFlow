import React from "react";

export function SignalPanels() {
  const positiveSignals = [
    { title: "500+ bình luận tích cực về sản phẩm mới", desc: "Tăng 35% so với hôm qua", time: "Trong 24 giờ" },
    { title: "Video review sản phẩm đạt 2M lượt xem", desc: "Trên TikTok trong 24 giờ", time: "Trong 24 giờ" },
    { title: "Tỷ lệ hài lòng của khách hàng tăng 15%", desc: "Trong tuần này", time: "Trong tuần này" }
  ];

  const negativeSignals = [
    { title: "Hashtag #phan_nan tăng đột biến", desc: "Tăng 280% trong 3 giờ qua", time: "3 giờ qua" },
    { title: "120 khách hàng phàn nàn về giao hàng", desc: "Chủ yếu tại khu vực Hà Nội", time: "Hôm nay" },
    { title: "Bài đăng tiêu cực lan truyền nhanh", desc: "Đã tiếp cận 50K người dùng", time: "1 giờ qua" }
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Tín hiệu tích cực */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-slate-800">Tín hiệu tích cực</h2>
          <button className="text-xs text-purple-600 font-semibold hover:underline">Xem tất cả</button>
        </div>
        
        <div className="flex flex-col gap-4">
          {positiveSignals.map((sig, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <i className="ti ti-arrow-up-right text-green-500 font-bold"></i>
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-slate-800 leading-tight mb-0.5">{sig.title}</h4>
                <p className="text-[11px] text-slate-500">{sig.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tín hiệu tiêu cực */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-slate-800">Tín hiệu tiêu cực</h2>
          <button className="text-xs text-purple-600 font-semibold hover:underline">Xem tất cả</button>
        </div>
        
        <div className="flex flex-col gap-4">
          {negativeSignals.map((sig, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <i className="ti ti-arrow-down-right text-red-500 font-bold"></i>
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-slate-800 leading-tight mb-0.5">{sig.title}</h4>
                <p className="text-[11px] text-slate-500">{sig.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
