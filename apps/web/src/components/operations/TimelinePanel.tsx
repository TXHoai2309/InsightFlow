import React from "react";

export function TimelinePanel() {
  const events = [
    { time: "08:15", text: "Khách hàng để lại bình luận tiêu cực", icon: "ti-brand-facebook", iconColor: "text-blue-500", dotColor: "bg-purple-500" },
    { time: "09:30", text: "AI phát hiện rủi ro và cảnh báo", icon: "ti-robot", iconColor: "text-purple-500", dotColor: "bg-purple-500" },
    { time: "10:05", text: "Đã chuyển cho đội CSKH xử lý", icon: "ti-user", iconColor: "text-slate-500", dotColor: "bg-green-500" },
    { time: "11:00", text: "Đã phản hồi khách hàng", icon: "ti-check", iconColor: "text-white bg-green-500 rounded-full text-[10px] w-4 h-4 flex items-center justify-center", dotColor: "bg-green-500", isLast: true }
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[15px] font-bold text-slate-800">Timeline hoạt động</h2>
        <button className="text-xs text-purple-600 font-semibold hover:underline">Xem tất cả</button>
      </div>
      
      <div className="relative border-l-2 border-slate-100 ml-2 space-y-6">
        {events.map((evt, idx) => (
          <div key={idx} className="relative pl-6 flex items-center justify-between">
            {/* Timeline Dot */}
            <span className={`absolute -left-[5px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full ${evt.dotColor} shadow-[0_0_0_4px_white]`}></span>
            
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 w-10">{evt.time}</span>
              <p className="text-[12px] font-medium text-slate-700">{evt.text}</p>
            </div>

            <div className="shrink-0 ml-2">
              {evt.icon.includes('bg-') ? (
                <div className={evt.iconColor}><i className={`ti ${evt.icon}`}></i></div>
              ) : (
                <i className={`ti ${evt.icon} text-base ${evt.iconColor}`}></i>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
