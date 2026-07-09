import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface CrisisTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function CrisisTabs({ tabs, activeTab, onChange }: CrisisTabsProps) {
  return (
    <div className="flex w-full items-center space-x-1 border-b border-[#C8C4D6] dark:border-gray-800">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        // Crisis tab has special red styling when active
        const isCrisisTab = tab.id === "crisis-monitoring";
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-4 py-4 text-sm transition-colors focus:outline-none flex items-center space-x-2",
              isActive 
                ? (isCrisisTab ? "text-[#BA1A1A] font-bold" : "text-[#4234B6] font-bold")
                : "text-[#474554] font-medium hover:text-[#1A1B20] dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "ml-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                  isActive 
                    ? (isCrisisTab ? "bg-[#BA1A1A] text-white" : "text-[#4234B6]")
                    : "bg-[#EEEDF4] text-[#474554] dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                {isActive && !isCrisisTab ? `(${tab.count})` : tab.count}
              </span>
            )}
            
            {isActive && (
              <motion.div
                layoutId="crisis-tab-indicator"
                className={cn(
                  "absolute bottom-[-1px] left-0 right-0 h-[2px]",
                  isCrisisTab ? "bg-[#BA1A1A]" : "bg-[#4234B6]"
                )}
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
