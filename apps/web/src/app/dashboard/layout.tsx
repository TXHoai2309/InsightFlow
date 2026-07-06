import React from "react";
import { BMTabs } from "@/components/brand-manager";

export default function BrandManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <BMLayoutHeader />
      <BMTabs />
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}

// Tách component riêng để dùng useTranslation (client)
import { BMLayoutHeader } from "@/components/brand-manager/BMLayoutHeader";
