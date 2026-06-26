"use client";

/**
 * LanguageContext — Quản lý trạng thái ngôn ngữ EN/VI toàn cục.
 *
 * - Persist sang localStorage với key "insightflow-lang"
 * - Đồng bộ với i18next instance để toàn bộ UI phản ánh ngôn ngữ mới
 * - Tương thích SSR: chỉ đọc localStorage ở client (useEffect)
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import i18n from "../i18n";

type Language = "vi" | "en";

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "insightflow-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    // Đọc preference từ localStorage sau khi mount (client-only)
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    const initial: Language = saved === "en" ? "en" : "vi";
    setLanguageState(initial);
    i18n.changeLanguage(initial);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    i18n.changeLanguage(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: Language = prev === "vi" ? "en" : "vi";
      localStorage.setItem(STORAGE_KEY, next);
      i18n.changeLanguage(next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage phải được dùng bên trong <LanguageProvider>");
  }
  return ctx;
}
