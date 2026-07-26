"use client";

import React from "react";
import { useTranslation } from "react-i18next";

interface BMLayoutHeaderProps {
  demoMode?: boolean;
}

export function BMLayoutHeader({ demoMode = false }: BMLayoutHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          {t("bm.workspace")}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t("bm.workspaceDesc")}
        </p>
      </div>
      {!demoMode && (
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-1.5 text-sm font-semibold text-[var(--color-brand)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-success)]" />
            {t("bm.realtimeSync")}
          </div>
        </div>
      )}
    </div>
  );
}
