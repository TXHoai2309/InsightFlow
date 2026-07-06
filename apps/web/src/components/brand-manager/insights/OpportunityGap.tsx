"use client";

import React from "react";

const MOCK_GAP = [
  { topic: "Matcha Latte", us: "+45%", them: "-12%", status: "lead", message: "Highlands đang dẫn đầu" },
  { topic: "Trà Đào Cam Sả", us: "+10%", them: "+35%", status: "lag", message: "Đối thủ vượt lên" },
  { topic: "Không gian làm việc", us: "-5%", them: "+20%", status: "lag", message: "Cần cải thiện ngay" },
];

export function OpportunityGap() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <span>⚔️</span> So sánh với đối thủ
        </h3>
        <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Phase 2</span>
      </div>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">
        Opportunity Gap — so sánh tốc độ tăng trưởng thảo luận trên cùng một chủ đề.
      </p>

      <div className="space-y-3 opacity-70 pointer-events-none">
        {MOCK_GAP.map((item, i) => (
          <div key={i} className="flex flex-col gap-1.5 py-2 border-b border-[var(--color-border)] last:border-0">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{item.topic}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${item.status === 'lead' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {item.message}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[12px]">
              <span className="text-[var(--color-text-muted)]">Mình: <span className={item.us.startsWith('+') ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{item.us}</span></span>
              <span className="text-[var(--color-text-muted)]">Họ: <span className={item.them.startsWith('+') ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{item.them}</span></span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center">
        <span className="text-[11px] text-[var(--color-text-muted)] italic">⚙️ Dữ liệu Social Listening đối thủ sẽ có ở Phase 2</span>
      </div>
    </div>
  );
}
