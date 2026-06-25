"use client";

import React, { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const hasDark = root.classList.contains("dark");
    if (hasDark) {
      root.classList.remove("dark");
    }
    return () => {
      const savedTheme = localStorage.getItem("insightflow-theme");
      if (savedTheme === "dark") {
        root.classList.add("dark");
      }
    };
  }, []);

  return (
    <div className="auth-container">
      {children}
    </div>
  );
}

