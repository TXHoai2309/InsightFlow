"use client";
import React from "react";

interface EmployeeEmptyStateProps {
  onAddClick: () => void;
}

export function EmployeeEmptyState({ onAddClick }: EmployeeEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
      {/* SVG Illustration */}
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6 opacity-80">
        <circle cx="60" cy="60" r="50" fill="#F3F4F6"/>
        <circle cx="60" cy="45" r="15" fill="#E5E7EB"/>
        <path d="M30 90C30 73.4315 43.4315 60 60 60C76.5685 60 90 73.4315 90 90V95H30V90Z" fill="#E5E7EB"/>
        <circle cx="85" cy="85" r="20" fill="#6C5CE7"/>
        <path d="M79 85H91M85 79V91" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      
      <h3 className="text-[20px] font-bold text-gray-900 mb-2">Chưa có nhân viên nào</h3>
      <p className="text-[14px] text-gray-500 text-center max-w-sm mb-6 leading-relaxed">
        Hãy tạo tài khoản đầu tiên để bắt đầu phân quyền và quản lý đội ngũ của Brand.
      </p>
      
      <button
        onClick={onAddClick}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6C5CE7] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#5a4cdb] active:scale-[0.98] shadow-sm"
      >
        <span>➕</span> Thêm nhân viên
      </button>
    </div>
  );
}
