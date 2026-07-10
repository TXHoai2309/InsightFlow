"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ResponseTemplates } from "@/components/brand-settings/ResponseTemplates";

export default function BrandSettingsPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"general" | "templates">("general");

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1440px] mx-auto">
      {/* Title Card */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)]">
          Cấu hình thương hiệu
        </p>
        <h1 className="mt-2 text-[28px] font-bold text-[var(--color-text-primary)]">
          {profile?.brandName || "Thương hiệu"}
        </h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--color-text-secondary)]">
          Trang này dành cho cấu hình từ khóa, nguồn dữ liệu, phạm vi theo dõi và thiết lập các mẫu phản hồi tự động hóa bằng AI của thương hiệu.
        </p>
      </section>

      {/* Tabs */}
      <div className="border-b border-[var(--color-border)] flex gap-6">
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-3 text-[14px] font-bold transition-all relative ${
            activeTab === "general"
              ? "text-[#6C63FF]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          Thông tin chung
          {activeTab === "general" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C63FF] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 text-[14px] font-bold transition-all relative ${
            activeTab === "templates"
              ? "text-[#6C63FF]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          Mẫu phản hồi AI
          {activeTab === "templates" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C63FF] rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "general" && (
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Brand ID", value: profile?.brandId || "Chưa gán" },
            { label: "Tên thương hiệu", value: profile?.brandName || "Chưa gán" },
            { label: "Domain doanh nghiệp", value: profile?.companyDomain || "Chưa gán" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {item.label}
              </p>
              <p className="mt-2 text-[18px] font-bold text-[var(--color-text-primary)]">{item.value}</p>
            </div>
          ))}
        </section>
      )}

      {activeTab === "templates" && (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
          <ResponseTemplates />
        </section>
      )}
    </div>
  );
}
