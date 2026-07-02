"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";

export default function BrandSettingsPage() {
  const { profile } = useAuth();

  return (
    <div className="p-4 md:p-8 space-y-6">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)]">
          Cau hinh thuong hieu
        </p>
        <h1 className="mt-2 text-[28px] font-bold text-[var(--color-text-primary)]">
          {profile?.brandName || "Thuong hieu"}
        </h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--color-text-secondary)]">
          Trang nay danh cho cau hinh tu khoa, nguon du lieu va pham vi theo doi cua thuong hieu. Du lieu hien thi
          duoc gioi han theo thuong hieu gan voi tai khoan dang nhap.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Brand ID", value: profile?.brandId || "Chua gan" },
          { label: "Ten thuong hieu", value: profile?.brandName || "Chua gan" },
          { label: "Domain", value: profile?.companyDomain || "Chua gan" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {item.label}
            </p>
            <p className="mt-2 text-[18px] font-bold text-[var(--color-text-primary)]">{item.value}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

