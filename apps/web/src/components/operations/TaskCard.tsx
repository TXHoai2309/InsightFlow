import React from "react";
import type { OpsCase } from "./mockData";
import { PRIORITY_COLORS, STATUS_COLORS, PLATFORM_ICONS } from "./mockData";

interface TaskCardProps {
  data: OpsCase;
}

export function TaskCard({ data }: TaskCardProps) {
  const pColor = PRIORITY_COLORS[data.priority];
  const sColor = STATUS_COLORS[data.status];
  const iconClass = PLATFORM_ICONS[data.platform] || "ti-brand-chrome";

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors group last:border-b-0">
      
      {/* Checkbox & Platform */}
      <div className="flex items-center gap-4 w-[40px] shrink-0">
        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer" />
      </div>

      {/* Main Info */}
      <div className="flex items-center gap-3 flex-1 min-w-[200px]">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          data.platform === 'tiktok' ? 'bg-black text-white' :
          data.platform === 'facebook' ? 'bg-blue-500 text-white' :
          data.platform === 'threads' ? 'bg-slate-900 text-white' :
          'bg-slate-200 text-slate-600'
        }`}>
          <i className={`ti ${iconClass} text-lg`}></i>
        </div>
        <div className="overflow-hidden">
          <h4 className="text-sm font-semibold text-slate-800 truncate">{data.title}</h4>
          <p className="text-xs text-slate-500 truncate">{data.description}</p>
        </div>
      </div>

      {/* Brand */}
      <div className="flex items-center gap-2 w-[160px] shrink-0">
        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
          {data.brandLogo}
        </div>
        <span className="text-sm font-medium text-slate-700 truncate">{data.brand}</span>
      </div>

      {/* Priority */}
      <div className="w-[100px] shrink-0 flex justify-center">
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${pColor.text} ${pColor.bg} ${pColor.border}`}>
          {data.priority}
        </span>
      </div>

      {/* Time */}
      <div className="w-[80px] shrink-0 text-center">
        <span className="text-sm font-medium text-slate-600">{data.time}</span>
      </div>

      {/* Assignee */}
      <div className="w-[60px] shrink-0 flex justify-center">
        <img src={data.assignee} alt="Assignee" className="w-7 h-7 rounded-full border-2 border-white shadow-sm" />
      </div>

      {/* Status */}
      <div className="w-[120px] shrink-0 flex justify-center">
        {data.isToday ? (
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${sColor.text} ${sColor.bg} ${sColor.border}`}>
            {data.status}
          </span>
        ) : (
          <button className="text-xs font-bold px-4 py-1.5 rounded-lg border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors w-full text-center">
            Tiếp tục xử lý
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="w-[40px] shrink-0 flex justify-end">
        <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors">
          <i className="ti ti-dots-vertical"></i>
        </button>
      </div>

    </div>
  );
}
