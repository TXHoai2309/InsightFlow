"use client";

import React, { useMemo } from "react";
import type { UserRoleProfile } from "@/lib/rbac";
import type { Lead } from "@/types/dashboard";
import {
  getLeadWorkbenchMeta,
  matchesLeadWorkbenchView,
  type LeadWorkbenchView,
} from "@/lib/lead-workbench";

interface LeadStatsProps {
  leads: Lead[];
  isLoading: boolean;
  profile?: UserRoleProfile | null;
  onSelectView?: (view: LeadWorkbenchView) => void;
}

function getOwnerScope(lead: Lead, profile?: UserRoleProfile | null) {
  const ownerId = (lead.owner_id || "").trim();
  if (!ownerId) return "unassigned";
  if (profile?.uid && ownerId === profile.uid) return "mine";
  return "other";
}

export function LeadStats({ leads, isLoading, profile, onSelectView }: LeadStatsProps) {
  const stats = useMemo(() => {
    const nowMs = Date.now();
    const splitView = (view: LeadWorkbenchView) => {
      const matched = leads.filter((lead) =>
        matchesLeadWorkbenchView(lead, view, nowMs, profile),
      );

      return {
        total: matched.length,
        mine: matched.filter((lead) => getOwnerScope(lead, profile) === "mine").length,
        unassigned: matched.filter(
          (lead) => getOwnerScope(lead, profile) === "unassigned",
        ).length,
      };
    };

    const immediate = splitView("priority");
    const urgent = splitView("urgent");
    const followUp = splitView("follow_up");
    const needResult = splitView("need_result");
    const hotPending = leads.filter(
      (lead) =>
        lead.intent === "hot" &&
        matchesLeadWorkbenchView(lead, "priority", nowMs, profile) &&
        getLeadWorkbenchMeta(lead, nowMs).isPending,
    ).length;

    return { immediate, urgent, followUp, needResult, hotPending };
  }, [leads, profile]);

  const scopeSub = (item: { mine: number; unassigned: number }) =>
    `${item.mine} của tôi · ${item.unassigned} chưa ai nhận`;

  const cards =
    profile?.role === "lead_employee"
      ? [
          {
            title: "Cần xử lý ngay",
            value: stats.immediate.total,
            sub: scopeSub(stats.immediate),
            icon: "bolt",
            color: "var(--color-error)",
            bg: "var(--color-error-subtle)",
            view: "priority" as const,
          },
          {
            title: "Sắp quá hạn",
            value: stats.urgent.total,
            sub: scopeSub(stats.urgent),
            icon: "timer",
            color: "var(--color-warning)",
            bg: "var(--color-warning-subtle)",
            view: "urgent" as const,
          },
          {
            title: "Follow-up hôm nay",
            value: stats.followUp.total,
            sub: scopeSub(stats.followUp),
            icon: "event",
            color: "var(--color-info)",
            bg: "var(--color-info-subtle)",
            view: "follow_up" as const,
          },
        ]
      : [
          {
            title: "Cần xử lý ngay",
            value: stats.immediate.total,
            sub:
              stats.needResult.total > 0
                ? `${stats.needResult.total} lead cần ghi nhận`
                : `${stats.hotPending} hot đang chờ`,
            icon: "bolt",
            color: "var(--color-error)",
            bg: "var(--color-error-subtle)",
            view: "priority" as const,
          },
          {
            title: "Sắp quá hạn",
            value: stats.urgent.total,
            sub: "Theo SLA hiện tại",
            icon: "timer",
            color: "var(--color-warning)",
            bg: "var(--color-warning-subtle)",
            view: "urgent" as const,
          },
          {
            title: "Follow-up hôm nay",
            value: stats.followUp.total,
            sub: "Cần quay lại đúng hẹn",
            icon: "event",
            color: "var(--color-info)",
            bg: "var(--color-info-subtle)",
            view: "follow_up" as const,
          },
        ];

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-[88px] animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3"
          >
            <div className="h-4 w-1/2 rounded bg-[var(--color-bg-surface-raised)]" />
            <div className="mt-3 h-7 w-16 rounded bg-[var(--color-bg-surface-high)]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <button
          key={card.title}
          type="button"
          onClick={() => onSelectView?.(card.view)}
          className="group grid min-h-[92px] grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 text-left shadow-sm transition hover:border-[var(--color-brand-border)] hover:shadow-md"
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: card.bg, color: card.color }}
          >
            <span className="material-symbols-outlined">{card.icon}</span>
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {card.title}
            </p>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">
              {card.sub}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-3xl font-bold tabular-nums" style={{ color: card.color }}>
              {card.value}
            </span>
            <span className="material-symbols-outlined text-[var(--color-text-muted)] transition group-hover:translate-x-0.5">
              chevron_right
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
