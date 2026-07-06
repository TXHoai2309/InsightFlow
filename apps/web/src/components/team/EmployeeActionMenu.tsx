"use client";
import React, { useState, useRef, useEffect } from "react";
import type { StaffAccount } from "./types";

interface EmployeeActionMenuProps {
  account: StaffAccount;
  onEdit: (account: StaffAccount) => void;
  onToggleStatus: (account: StaffAccount) => void;
  onResetPassword: (account: StaffAccount) => void;
}

export function EmployeeActionMenu({ account, onEdit, onToggleStatus, onResetPassword }: EmployeeActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white border border-gray-200 shadow-lg py-1 z-10 overflow-hidden">
          <button
            onClick={() => { onEdit(account); setIsOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            ✏️ Chỉnh sửa / Đổi vai trò
          </button>
          
          <button
            onClick={() => { onResetPassword(account); setIsOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            🔑 Reset mật khẩu
          </button>

          <div className="h-px bg-gray-200 my-1"></div>

          <button
            onClick={() => { onToggleStatus(account); setIsOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2 ${
              account.disabled ? "text-green-600 hover:bg-green-50" : "text-red-600 hover:bg-red-50"
            }`}
          >
            {account.disabled ? "🔓 Mở khóa tài khoản" : "🔒 Khóa tài khoản"}
          </button>
        </div>
      )}
    </div>
  );
}
