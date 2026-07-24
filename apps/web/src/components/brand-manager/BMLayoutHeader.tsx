"use client";

import Link from "next/link";
import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
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
      <div className="flex w-full items-center gap-3 sm:w-auto">
        {demoMode ? (
          <Link
            href="/#consultation"
            aria-label={t("bm.tryNowAria")}
            className="group inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6D5EF6] to-[#5B4FE0] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(91,79,224,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(91,79,224,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF6] focus-visible:ring-offset-2 active:translate-y-0 sm:w-auto"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{t("bm.tryNow")}</span>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-1.5 text-sm font-semibold text-[var(--color-brand)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-success)]" />
            {t("bm.realtimeSync")}
          </div>
        )}
      </div>
    </div>
  );
}
