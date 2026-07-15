import React from "react";

export function OpsSummaryBar() {
  const cards = [
    {
      title: "Việc cần xử lý hôm nay",
      value: "12",
      subtext: "nhiệm vụ",
      color: "text-purple-600",
      bg: "bg-purple-50",
      icon: "ti-clipboard-list",
      iconColor: "text-purple-500",
      iconBg: "bg-purple-100"
    },
    {
      title: "Công việc còn dở",
      value: "5",
      subtext: "nhiệm vụ",
      color: "text-orange-500",
      bg: "bg-orange-50",
      icon: "ti-hourglass-high",
      iconColor: "text-orange-500",
      iconBg: "bg-orange-100"
    },
    {
      title: "Khách hàng đang chờ",
      value: "18",
      subtext: "khách hàng",
      color: "text-blue-500",
      bg: "bg-blue-50",
      icon: "ti-message-circle-2",
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100"
    },
    {
      title: "Cảnh báo khủng hoảng",
      value: "3",
      subtext: "tín hiệu tiêu cực",
      color: "text-red-500",
      bg: "bg-red-50",
      icon: "ti-alert-triangle",
      iconColor: "text-red-500",
      iconBg: "bg-red-100"
    },
    {
      title: "Tín hiệu tích cực",
      value: "8",
      subtext: "xu hướng mới",
      color: "text-green-500",
      bg: "bg-green-50",
      icon: "ti-trending-up",
      iconColor: "text-green-500",
      iconBg: "bg-green-100"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="text-[13px] font-semibold text-slate-600 mb-4">{card.title}</h3>
          <div className="flex justify-between items-end">
            <div>
              <div className={`text-3xl font-bold ${card.color} leading-none mb-1`}>{card.value}</div>
              <div className="text-xs text-slate-500">{card.subtext}</div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
              <i className={`ti ${card.icon} text-xl ${card.iconColor}`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
