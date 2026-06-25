"use client";

/**
 * I18nProvider
 * 
 * Giải quyết Hydration Mismatch với Next.js App Router + i18next:
 * - Server luôn render bằng 'vi' (lng mặc định trong i18n.ts)
 * - Sau khi client mount xong, mới đọc localStorage và apply ngôn ngữ
 * - suppressHydrationWarning trên wrapper để React bỏ qua diff nhỏ
 */

import { useEffect, useState } from "react";
import i18n from "../../i18n";

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Chỉ chạy trên client, sau khi hydration xong
    const savedLang = localStorage.getItem("insightflow_language") || "vi";
    if (savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
    setMounted(true);
  }, []);

  // Render children ngay (không block UI)
  // suppressHydrationWarning để tránh warning về text mismatch nhỏ
  return (
    <div suppressHydrationWarning style={{ display: "contents" }}>
      {children}
    </div>
  );
}
