import React, { useState, useRef, useEffect } from "react";

export interface CustomSelectOption {
  value: string;
  label: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  className?: string;
  minWidth?: string;
  icon?: React.ReactNode;
}

export function CustomSelect({ value, onChange, options, className = "", minWidth = "160px", icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef} style={{ minWidth }}>
      <div
        className={`flex items-center justify-between pl-4 pr-3 py-2.5 rounded-lg text-[13px] font-medium bg-white dark:bg-[#1a1b1e] border cursor-pointer transition-colors ${isOpen ? 'border-[#6D5FFD] ring-1 ring-[#6D5FFD]' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate pr-4 text-[#2A2B2F] dark:text-white">
          {icon}
          <span className="truncate">{selectedOption?.label}</span>
        </div>
        <i className={`ti ti-chevron-down text-[14px] text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}></i>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full z-50 bg-white dark:bg-[#1a1b1e] border border-gray-100 dark:border-gray-800 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-[280px] overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  className={`flex items-center mx-1.5 px-3 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#6D5FFD]/10 text-[#6D5FFD] dark:bg-[#6D5FFD]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <i className="ti ti-check ml-auto text-[14px]"></i>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
