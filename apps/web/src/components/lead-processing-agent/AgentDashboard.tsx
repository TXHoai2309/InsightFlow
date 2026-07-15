"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { AgentStatsBar } from "./AgentStatsBar";
import { AgentProgressSection } from "./AgentProgressSection";
import { AgentKanbanBoard } from "./AgentKanbanBoard";
import { AgentNotifications } from "./AgentNotifications";

export function AgentDashboard() {
  const { t } = useTranslation();

  return (
    <div className="w-full min-h-screen -m-6 p-6 space-y-6 pb-10 bg-[#ffffff] dark:bg-[#0B0914] text-slate-900 dark:text-gray-100 transition-colors duration-200">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 border-b border-gray-100 dark:border-[#262338] pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-purple-800 dark:from-indigo-400 dark:to-purple-400">
              {t("agentDashboard.title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1.5 font-medium">
              {t("agentDashboard.subtitle")}
            </p>
          </div>
        </div>

        {/* Stats Bar (Row 1) */}
        <section>
          <AgentStatsBar />
        </section>

        {/* Progress Section (Row 2) */}
        <section>
          <AgentProgressSection />
        </section>

        {/* Main Content Grid (Row 3) - Kanban vs Sidebar */}
        <section className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* Left Column - Kanban Board */}
          <div className="xl:col-span-3 min-h-[800px]">
            <AgentKanbanBoard />
          </div>

          {/* Right Column - Side Panel */}
          <div className="xl:col-span-1 space-y-6 flex flex-col max-h-[800px] overflow-y-auto custom-scrollbar pr-1">
            

            {/* Notifications */}
            <div className="shrink-0">
              <AgentNotifications />
            </div>
            
          </div>
          
        </section>
      </div>
    </div>
  );
}
