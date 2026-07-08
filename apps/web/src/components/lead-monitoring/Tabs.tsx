import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex space-x-1 border-b border-gray-200 dark:border-gray-800", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-4 py-4 text-sm font-semibold transition-colors focus:outline-none",
              isActive ? "text-[#5B5CEB]" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            )}
          >
            <div className="flex items-center space-x-2">
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "ml-1.5 text-sm",
                    isActive ? "text-[#5B5CEB]" : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  ({tab.count})
                </span>
              )}
            </div>
            {isActive && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B5CEB]"
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
