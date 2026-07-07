"use client";

import React from "react";
import { useTranslation } from "react-i18next";

export function BMLayoutHeader() {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          {t("bm.workspace")}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t("bm.workspaceDesc")}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-lg bg-[var(--color-brand-subtle)] border border-[var(--color-brand-border)] text-[var(--color-brand)] text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse"></span>
          {t("bm.realtimeSync")}
        </div>
      </div>
    </div>
  );
}
