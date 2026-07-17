"use client";

import React, { useState } from "react";
import { OpsSummaryBar } from "./OpsSummaryBar";
import { TasksList } from "./TasksList";
import { AIAssistantPanel } from "./AIAssistantPanel";
import { SignalPanels } from "./SignalPanels";
import { TimelinePanel } from "./TimelinePanel";
import { cases as allCases } from "./mockData";

export function OperationsDashboard() {
  const [cases] = useState(allCases);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto p-6">
        
        {/* KPI Row */}
        <OpsSummaryBar />

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start mt-6">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <TasksList cases={cases} />
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            <AIAssistantPanel />
            <SignalPanels />
            <TimelinePanel />
          </div>
          
        </div>
      </div>
    </div>
  );
}
