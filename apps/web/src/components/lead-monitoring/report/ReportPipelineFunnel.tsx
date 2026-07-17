"use client";

import React from "react";
import { LeadReportBucket } from "@/lib/lead-report";
import { ArrowDown } from "lucide-react";

interface ReportPipelineFunnelProps {
  pipeline: LeadReportBucket[];
}

export function ReportPipelineFunnel({ pipeline }: ReportPipelineFunnelProps) {
  // Filter out 'skipped' for the main funnel, keep the success path
  const funnelSteps = pipeline.filter(p => p.key !== "skipped");
  const maxCount = Math.max(1, ...funnelSteps.map(p => p.count));

  return (
    <div className="bg-white dark:bg-[#13111c] border border-gray-200 dark:border-[#262338] rounded-2xl p-6 h-full shadow-lg flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-black text-gray-900 dark:text-white">Pipeline xử lý</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dòng chảy chuyển đổi và tỷ lệ rớt.</p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-2 relative">
        {funnelSteps.map((step, index) => {
          const width = Math.max(15, (step.count / maxCount) * 100);
          const nextStep = funnelSteps[index + 1];
          let dropOff = 0;
          if (nextStep && step.count > 0) {
            dropOff = Math.round(((step.count - nextStep.count) / step.count) * 100);
          }

          return (
            <React.Fragment key={step.key}>
              <div className="relative group">
                <div 
                  className="h-14 rounded-xl flex items-center justify-between px-4 transition-all duration-300 relative z-10"
                  style={{
                    width: `${width}%`,
                    backgroundColor: step.color,
                    boxShadow: `0 4px 20px ${step.color}40`,
                    minWidth: '200px'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black text-white">
                      {index + 1}
                    </div>
                    <span className="font-bold text-white text-sm whitespace-nowrap">{step.label}</span>
                  </div>
                  <span className="font-black text-white text-lg bg-black/20 px-3 py-1 rounded-lg">
                    {step.count}
                  </span>
                </div>
                
                {/* Background track for the bar */}
                <div className="absolute inset-0 w-full h-14 bg-gray-100 dark:bg-[#1a1826] rounded-xl z-0 border border-black/5 dark:border-white/5"></div>
              </div>

              {/* Connecting arrow & dropoff */}
              {index < funnelSteps.length - 1 && (
                <div className="h-10 flex items-center gap-4 ml-[100px] relative z-20">
                  <div className="w-10 h-10 border-l-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center relative">
                     <ArrowDown className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute -bottom-2 -left-[9px]" />
                  </div>
                  {dropOff > 0 && (
                     <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                       Rớt {dropOff}%
                     </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
