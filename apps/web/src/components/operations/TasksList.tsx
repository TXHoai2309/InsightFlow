import React, { useState } from "react";
import { TaskCard } from "./TaskCard";
import type { OpsCase, Priority } from "./mockData";

interface TasksListProps {
  cases: OpsCase[];
}

type FilterType = "Tất cả" | Priority;

export function TasksList({ cases }: TasksListProps) {
  const [filter, setFilter] = useState<FilterType>("Tất cả");

  const todayCases = cases.filter(c => c.isToday && (filter === "Tất cả" || c.priority === filter));
  const yesterdayCases = cases.filter(c => !c.isToday); // Not filtering yesterday cases in screenshot

  return (
    <div className="flex flex-col gap-6">
      
      {/* Việc hôm nay */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Header & Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[17px] font-bold text-slate-800">Việc cần xử lý hôm nay</h2>
            <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2.5 py-0.5 rounded-md">
              {todayCases.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-50 rounded-lg border border-slate-200">
              <button 
                onClick={() => setFilter("Tất cả")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === "Tất cả" ? "bg-white text-purple-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              >
                <i className="ti ti-folders mr-1"></i> Tất cả
              </button>
              <button 
                onClick={() => setFilter("Khẩn cấp")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === "Khẩn cấp" ? "bg-white text-red-500 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              >
                <i className="ti ti-star mr-1"></i> Khẩn cấp
              </button>
              <button 
                onClick={() => setFilter("Cao")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === "Cao" ? "bg-white text-orange-500 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              >
                <i className="ti ti-arrow-up mr-1"></i> Cao
              </button>
              <button 
                onClick={() => setFilter("Trung bình")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === "Trung bình" ? "bg-white text-blue-500 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              >
                <i className="ti ti-minus mr-1"></i> Trung bình
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 ml-4">
              <span className="text-xs text-slate-500 font-medium">Sắp xếp:</span>
              <button className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 min-w-[140px] hover:bg-slate-50">
                Ưu tiên cao nhất <i className="ti ti-chevron-down"></i>
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
                <i className="ti ti-list"></i>
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col">
          {todayCases.length > 0 ? (
            todayCases.map(c => <TaskCard key={c.id} data={c} />)
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">Không có công việc nào phù hợp.</div>
          )}
        </div>

        {/* Footer */}
        {todayCases.length > 0 && (
          <div className="p-4 text-center border-t border-slate-100">
            <button className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
              Xem tất cả {todayCases.length} công việc <i className="ti ti-chevron-down ml-1"></i>
            </button>
          </div>
        )}
      </div>

      {/* Việc hôm qua */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <h2 className="text-[17px] font-bold text-slate-800">Công việc từ hôm qua</h2>
          <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2.5 py-0.5 rounded-md">
            {yesterdayCases.length}
          </span>
        </div>
        
        <div className="flex flex-col">
          {yesterdayCases.map(c => <TaskCard key={c.id} data={c} />)}
        </div>

        <div className="p-4 text-center border-t border-slate-100">
          <button className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
            Xem tất cả các công việc còn dở <i className="ti ti-chevron-down ml-1"></i>
          </button>
        </div>
      </div>

    </div>
  );
}
