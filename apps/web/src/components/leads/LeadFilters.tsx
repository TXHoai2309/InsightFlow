"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { PLATFORM_META } from "@/lib/services/dashboard";
import {
  countActiveLeadFilters,
  type LeadWorkbenchFilters,
} from "@/lib/lead-filters";
import type { Platform, Workspace } from "@/types/dashboard";

interface StaffOption {
  uid: string;
  displayName?: string;
  email?: string;
}

interface LeadFiltersProps {
  workspaces: Workspace[];
  value: LeadWorkbenchFilters;
  activeViewLabel: string;
  resultCount: number;
  brandLocked?: boolean;
  brandLabel?: string;
  staffList?: StaffOption[];
  canSelectStaff?: boolean;
  onChange: (next: LeadWorkbenchFilters) => void;
  onReset: () => void;
}

const PLATFORM_ORDER: Platform[] = [
  "facebook",
  "tiktok",
  "youtube",
  "thread",
  "be",
  "google_maps",
  "news",
];

const selectClassName =
  "select-app w-full cursor-pointer appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] py-2 pl-3 pr-9 text-sm text-[var(--color-text-primary)] outline-none transition-all focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]";

function SelectChevron() {
  return (
    <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-base text-[var(--color-text-muted)]">
      keyboard_arrow_down
    </span>
  );
}

export function LeadFilters({
  workspaces,
  value,
  activeViewLabel,
  resultCount,
  brandLocked = false,
  brandLabel,
  staffList = [],
  canSelectStaff = false,
  onChange,
  onReset,
}: LeadFiltersProps) {
  const { t } = useTranslation();
  const activeCount = countActiveLeadFilters(value, !brandLocked);
  const selectedPlatform =
    value.platform === "all" ? "" : PLATFORM_META[value.platform]?.label || value.platform;

  const patchValue = (patch: Partial<LeadWorkbenchFilters>) => {
    onChange({ ...value, ...patch });
  };

  const ownershipValue =
    value.ownership === "staff" && value.ownerId
      ? `staff:${value.ownerId}`
      : value.ownership;

  const chips: Array<{
    key: string;
    label: string;
    clear: () => void;
  }> = [];

  if (value.query.trim()) {
    chips.push({
      key: "query",
      label: `Từ khóa: ${value.query.trim()}`,
      clear: () => patchValue({ query: "" }),
    });
  }
  if (!brandLocked && value.workspaceId !== "all") {
    const workspace = workspaces.find((item) => item.id === value.workspaceId);
    chips.push({
      key: "workspace",
      label: workspace?.brand_name || value.workspaceId,
      clear: () => patchValue({ workspaceId: "all" }),
    });
  }
  if (selectedPlatform) {
    chips.push({
      key: "platform",
      label: selectedPlatform,
      clear: () => patchValue({ platform: "all" }),
    });
  }
  if (value.priority !== "all") {
    chips.push({
      key: "priority",
      label: value.priority.toUpperCase(),
      clear: () => patchValue({ priority: "all" }),
    });
  }
  if (value.sla !== "all") {
    const labels = {
      on_time: "Trong hạn",
      due_soon: "Sắp đến hạn",
      overdue: "Quá hạn",
      unknown: "Chưa xác định SLA",
    } as const;
    chips.push({
      key: "sla",
      label: labels[value.sla],
      clear: () => patchValue({ sla: "all" }),
    });
  }
  if (value.ownership !== "all") {
    const selectedStaff = staffList.find((staff) => staff.uid === value.ownerId);
    const ownershipLabel =
      value.ownership === "mine"
        ? "Của tôi"
        : value.ownership === "unassigned"
          ? "Chưa phân công"
          : selectedStaff?.displayName || selectedStaff?.email || "Nhân viên phụ trách";
    chips.push({
      key: "ownership",
      label: ownershipLabel,
      clear: () => patchValue({ ownership: "all", ownerId: undefined }),
    });
  }
  if (value.updatedRange !== "all") {
    const labels = {
      today: "Cập nhật hôm nay",
      "7d": "Cập nhật trong 7 ngày",
      "30d": "Cập nhật trong 30 ngày",
    } as const;
    chips.push({
      key: "updatedRange",
      label: labels[value.updatedRange],
      clear: () => patchValue({ updatedRange: "all" }),
    });
  }

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 shadow-sm">
      <div className="flex flex-col gap-3">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                {t("leads.filters.listTitle", { defaultValue: "Bộ lọc danh sách" })}
              </h3>
              {activeCount > 0 && (
                <span className="rounded-full bg-[var(--color-brand-subtle)] px-2 py-0.5 text-[11px] font-black text-[var(--color-brand)]">
                  {activeCount} điều kiện
                </span>
              )}
            </div>
            <p className="mt-0.5 max-w-2xl text-xs text-[var(--color-text-secondary)]">
              Thu hẹp khách hàng trong nhóm “{activeViewLabel}” theo từ khóa, nền tảng,
              mức ưu tiên và SLA.
            </p>
          </div>

          {brandLocked && brandLabel && (
            <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--color-bg-surface-raised)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
              <span className="material-symbols-outlined text-base text-[var(--color-brand)]">
                verified_user
              </span>
              <span>Thương hiệu:</span>
              <strong className="text-[var(--color-text-primary)]">{brandLabel}</strong>
            </div>
          )}
        </header>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          <div className="md:col-span-2 xl:col-span-2">
            <label htmlFor="lead-filter-query" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Tìm kiếm
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-[var(--color-text-muted)]">
                search
              </span>
              <input
                id="lead-filter-query"
                type="search"
                value={value.query}
                onChange={(event) => patchValue({ query: event.target.value })}
                placeholder="Tên khách hàng hoặc nội dung"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
              />
            </div>
          </div>

          {!brandLocked && (
            <div>
              <label htmlFor="lead-filter-workspace" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {t("leads.filters.brand")}
              </label>
              <div className="relative">
                <select
                  id="lead-filter-workspace"
                  value={value.workspaceId}
                  onChange={(event) => patchValue({ workspaceId: event.target.value })}
                  className={selectClassName}
                >
                  <option value="all">{t("leads.filters.brandAll")}</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.brand_name}
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="lead-filter-platform" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              {t("leads.filters.platform")}
            </label>
            <div className="relative">
              <select
                id="lead-filter-platform"
                value={value.platform}
                onChange={(event) => patchValue({ platform: event.target.value })}
                className={selectClassName}
              >
                <option value="all">{t("leads.filters.platformAll")}</option>
                {PLATFORM_ORDER.map((platform) => (
                  <option key={platform} value={platform}>
                    {t(`dashboard.filters.${platform}`, {
                      defaultValue: PLATFORM_META[platform].label,
                    })}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </div>

          <div>
            <label htmlFor="lead-filter-priority" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Mức ưu tiên
            </label>
            <div className="relative">
              <select
                id="lead-filter-priority"
                value={value.priority}
                onChange={(event) => patchValue({ priority: event.target.value as LeadWorkbenchFilters["priority"] })}
                className={selectClassName}
              >
                <option value="all">Tất cả mức ưu tiên</option>
                <option value="hot">HOT</option>
                <option value="warm">WARM</option>
                <option value="cold">COLD</option>
              </select>
              <SelectChevron />
            </div>
          </div>

          <div>
            <label htmlFor="lead-filter-sla" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Tình trạng SLA
            </label>
            <div className="relative">
              <select
                id="lead-filter-sla"
                value={value.sla}
                onChange={(event) => patchValue({ sla: event.target.value as LeadWorkbenchFilters["sla"] })}
                className={selectClassName}
              >
                <option value="all">Tất cả SLA</option>
                <option value="on_time">Trong hạn</option>
                <option value="due_soon">Sắp đến hạn</option>
                <option value="overdue">Quá hạn</option>
                <option value="unknown">Chưa xác định SLA</option>
              </select>
              <SelectChevron />
            </div>
          </div>

          <div>
            <label htmlFor="lead-filter-owner" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Người phụ trách
            </label>
            <div className="relative">
              <select
                id="lead-filter-owner"
                value={ownershipValue}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (nextValue.startsWith("staff:")) {
                    patchValue({ ownership: "staff", ownerId: nextValue.slice(6) });
                  } else {
                    patchValue({
                      ownership: nextValue as LeadWorkbenchFilters["ownership"],
                      ownerId: undefined,
                    });
                  }
                }}
                className={selectClassName}
              >
                <option value="all">Tất cả người phụ trách</option>
                <option value="mine">Của tôi</option>
                <option value="unassigned">Chưa phân công</option>
                {canSelectStaff && staffList.length > 0 && (
                  <optgroup label="Nhân viên">
                    {staffList.map((staff) => (
                      <option key={staff.uid} value={`staff:${staff.uid}`}>
                        {staff.displayName || staff.email || "Nhân viên xử lý"}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <SelectChevron />
            </div>
          </div>

          <div>
            <label htmlFor="lead-filter-updated" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Cập nhật gần nhất
            </label>
            <div className="relative">
              <select
                id="lead-filter-updated"
                value={value.updatedRange}
                onChange={(event) => patchValue({ updatedRange: event.target.value as LeadWorkbenchFilters["updatedRange"] })}
                className={selectClassName}
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="7d">7 ngày gần nhất</option>
                <option value="30d">30 ngày gần nhất</option>
              </select>
              <SelectChevron />
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold text-[var(--color-text-secondary)]">
              {resultCount} kết quả
            </span>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.clear}
                title={`Bỏ điều kiện ${chip.label}`}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-2 py-1 text-xs font-semibold text-[var(--color-brand)] hover:opacity-80"
              >
                <span className="max-w-56 truncate">{chip.label}</span>
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            ))}
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex w-fit items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]"
            >
              <span className="material-symbols-outlined text-base">filter_alt_off</span>
              Xóa bộ lọc
            </button>
          )}
        </footer>
      </div>
    </section>
  );
}
