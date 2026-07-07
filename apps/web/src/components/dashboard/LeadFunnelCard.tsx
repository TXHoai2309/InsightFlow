import React from "react";
import { useTranslation } from "react-i18next";

interface LeadFunnelProps {
  funnelData: {
    new: number;
    qualified: number;
    contacted: number;
    negotiating: number;
    won: number;
  };
}

export function LeadFunnelCard({ funnelData }: LeadFunnelProps) {
  const { t } = useTranslation();
  
  const max = Math.max(funnelData.new, 1); // Use 'new' as 100% since it's the top of funnel
  
  const getWidth = (val: number) => `${Math.max(15, (val / max) * 100)}%`;
  
  const calcRate = (current: number, prev: number) => {
    if (prev === 0) return 0;
    return Math.round((current / prev) * 100);
  };

  const steps = [
    { key: "new", label: t("dashboard.funnel.new", "Mới"), value: funnelData.new, color: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" },
    { key: "qualified", label: t("dashboard.funnel.qualified", "Tiềm năng"), value: funnelData.qualified, color: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300" },
    { key: "contacted", label: t("dashboard.funnel.contacted", "Đã liên hệ"), value: funnelData.contacted, color: "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300" },
    { key: "negotiating", label: t("dashboard.funnel.negotiating", "Thương lượng"), value: funnelData.negotiating, color: "bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300" },
    { key: "won", label: t("dashboard.funnel.won", "Thành công"), value: funnelData.won, color: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300" },
  ];

  return (
    <div className="bg-white dark:bg-[#1a1b1e] rounded-[16px] border border-[var(--color-border)] shadow-sm flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center">
          <span className="material-symbols-outlined mr-2 text-orange-500">filter_alt</span>
          {t("dashboard.funnel.title", "Phễu chuyển đổi Lead")}
        </h3>
        <button className="text-sm font-semibold text-primary hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors">
          {t("dashboard.funnel.openCrm", "Mở CRM")}
        </button>
      </div>
      
      <div className="p-6 flex-1 flex flex-col justify-center space-y-1 relative">
        {steps.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const prevValue = isFirst ? 0 : steps[index - 1].value;
          const rate = isFirst ? 0 : calcRate(step.value, prevValue);

          return (
            <React.Fragment key={step.key}>
              {/* Conversion Rate Arrow connecting previous to this (except for first item) */}
              {!isFirst && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 my-0.5">
                    <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                    <span>{rate}%</span>
                  </div>
                </div>
              )}
              
              {/* Funnel Bar */}
              <div className="flex flex-col items-center w-full relative">
                <div 
                  className={`w-full py-2.5 px-4 flex justify-between items-center relative z-10`}
                >
                  <span className={`text-xs font-bold uppercase tracking-wider ${step.color.split(' ')[2]}`}>{step.label}</span>
                  <span className={`font-bold ${step.color.split(' ')[2]}`}>{step.value}</span>
                </div>
                {/* Background Fill */}
                <div 
                  className={`absolute top-0 left-1/2 -translate-x-1/2 h-full ${step.color.split(' ')[0]} ${step.color.split(' ')[1]} transition-all duration-500 z-0
                    ${isFirst ? "rounded-t-xl" : ""}
                    ${isLast ? "rounded-b-xl" : "rounded-sm"}
                  `}
                  style={{ width: getWidth(step.value) }}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
