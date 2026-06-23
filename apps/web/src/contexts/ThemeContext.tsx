"use client";

/**
 * ThemeContext — Quản lý trạng thái Light/Dark Mode toàn cục.
 *
 * - Persist sang localStorage với key "insightflow-theme"
 * - Đồng bộ class "dark" trên <html> để Tailwind + CSS Variables hoạt động
 * - Tương thích SSR: chỉ đọc localStorage ở client (useEffect)
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "insightflow-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Khởi tạo từ localStorage nếu đã có, fallback về "light"
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // Đọc preference từ localStorage sau khi mount (client-only)
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme = saved === "dark" ? "dark" : "light";
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme phải được dùng bên trong <ThemeProvider>");
  }
  return ctx;
}
