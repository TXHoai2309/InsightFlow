"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Database, RefreshCw, ShieldAlert, Target } from "lucide-react";
import { AgentStatsBar } from "./AgentStatsBar";
import { AgentProgressSection } from "./AgentProgressSection";
import { AgentKanbanBoard } from "./AgentKanbanBoard";
import { AgentNotifications } from "./AgentNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboardData";
import { getScopedBrandKey } from "@/lib/brandScope";
import {
  buildEmployeeOperationsData,
  type EmployeeOperationsRole,
} from "@/lib/employee-operations";
import { canPerformAction } from "@/lib/rbac";
import { useAlertStore } from "@/stores/alert.store";
import { useDashboardStore } from "@/stores/dashboard.store";

export function AgentDashboard() {
  const { t } = useTranslation();
  const { profile, loading: authLoading } = useAuth();
  const role = profile?.role;
  const isEmployee = role === "crisis_employee" || role === "lead_employee";
  const canViewCrisis = isEmployee && canPerformAction(profile, "view_crisis_queue");
  const canViewLead = isEmployee && canPerformAction(profile, "view_leads");
  const defaultOperationRole: EmployeeOperationsRole =
    role === "lead_employee" && canViewLead
      ? "lead_employee"
      : canViewCrisis
        ? "crisis_employee"
        : "lead_employee";
  const [viewSelection, setViewSelection] = useState<{
    uid: string;
    role: EmployeeOperationsRole;
  } | null>(null);
  const selectedOperationRole =
    viewSelection && viewSelection.uid === profile?.uid ? viewSelection.role : null;
  const activeOperationRole =
    selectedOperationRole &&
    ((selectedOperationRole === "crisis_employee" && canViewCrisis) ||
      (selectedOperationRole === "lead_employee" && canViewLead))
      ? selectedOperationRole
      : defaultOperationRole;
  const isCrisisView = activeOperationRole === "crisis_employee";
  const isLeadView = activeOperationRole === "lead_employee";
  const hasDualOperations = canViewCrisis && canViewLead;
  const brandKey = getScopedBrandKey(profile) || "global";
  const dashboardScopeKey = `${brandKey}:${profile?.uid || profile?.role || "anonymous"}`;

  const { refetch: refetchDashboard } = useDashboard({
    autoFetch: canViewLead,
    refetchInterval: 30 * 60 * 1000,
  });

  const leads = useDashboardStore((state) => state.leads);
  const dashboardLoading = useDashboardStore((state) => state.isLoading);
  const dashboardError = useDashboardStore((state) => state.error);
  const dashboardLastFetched = useDashboardStore(
    (state) => state.lastFetchedAtMap[dashboardScopeKey] || 0,
  );

  const alerts = useAlertStore((state) => state.rawAlerts);
  const alertLoading = useAlertStore((state) => state.isLoading);
  const alertError = useAlertStore((state) => state.error);
  const alertLastFetched = useAlertStore((state) => state.lastFetchedAt);
  const fetchAlerts = useAlertStore((state) => state.fetchAlerts);

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canViewCrisis || authLoading || !profile) return;
    void fetchAlerts(brandKey === "global" ? null : brandKey);
  }, [authLoading, brandKey, canViewCrisis, fetchAlerts, profile]);

  const data = useMemo(() => {
    if (!profile || (!canViewCrisis && !canViewLead)) return null;
    return buildEmployeeOperationsData({
      profile,
      role: activeOperationRole,
      alerts: isCrisisView ? alerts : [],
      leads: isLeadView ? leads : [],
      nowMs,
    });
  }, [activeOperationRole, alerts, canViewCrisis, canViewLead, isCrisisView, isLeadView, leads, nowMs, profile]);

  const handleRefresh = useCallback(async () => {
    if (!profile) return;
    setIsRefreshing(true);
    try {
      if (isCrisisView) {
        await fetchAlerts(brandKey === "global" ? null : brandKey, true);
      } else if (isLeadView) {
        await refetchDashboard(true);
      }
      setNowMs(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  }, [brandKey, fetchAlerts, isCrisisView, isLeadView, profile, refetchDashboard]);

  if (authLoading || !data) {
    if (!authLoading && !canViewCrisis && !canViewLead) {
      return (
        <div className="flex min-h-[420px] items-center justify-center p-6">
          <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            <ShieldAlert className="mx-auto mb-3 h-8 w-8" />
            <p className="font-semibold">
              {t("agentDashboard.accessDenied", {
                defaultValue: "Trang tổng quan này chỉ dành cho nhân viên cảnh báo và nhân viên tiềm năng.",
              })}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-[420px] items-center justify-center p-6 text-sm font-medium text-slate-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        {t("common.loading", { defaultValue: "Đang tải dữ liệu..." })}
      </div>
    );
  }

  const isLoading = isCrisisView ? alertLoading : dashboardLoading;
  const error = isCrisisView ? alertError : dashboardError;
  const lastFetchedAt = isCrisisView ? alertLastFetched : dashboardLastFetched;
  const detailsHref = isCrisisView ? "/alerts" : "/leads";
  const pageTitle = isCrisisView
    ? t("agentDashboard.crisisTitle", { defaultValue: "Tổng quan xử lý cảnh báo" })
    : t("agentDashboard.leadTitle", { defaultValue: "Tổng quan khách hàng tiềm năng" });
  const pageSubtitle = isCrisisView
    ? t("agentDashboard.crisisSubtitle", {
        defaultValue: "Cảnh báo chưa phân công và công việc bạn đang phụ trách.",
      })
    : t("agentDashboard.leadSubtitle", {
        defaultValue: "Lead chưa phân công và khách hàng được giao cho bạn.",
      });

  return (
    <div className="min-h-screen w-full space-y-6 bg-white pb-10 text-slate-900 transition-colors duration-200 dark:bg-[#0B0914] dark:text-gray-100">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <header className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 dark:border-[#262338] md:flex-row md:items-end">
          <div>
            <h1 className="bg-gradient-to-r from-indigo-800 to-purple-800 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent dark:from-indigo-400 dark:to-purple-400">
              {pageTitle}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-gray-400">
              {pageSubtitle}
              {profile?.brandName ? ` · ${profile.brandName}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasDualOperations && profile && (
              <div
                className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-[#262338] dark:bg-[#13111C]"
                role="tablist"
                aria-label="Chuyển tổng quan nghiệp vụ"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={isCrisisView}
                  onClick={() => setViewSelection({ uid: profile.uid, role: "crisis_employee" })}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                    isCrisisView
                      ? "bg-white text-rose-600 shadow-sm dark:bg-[#262338] dark:text-rose-400"
                      : "text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Khủng hoảng
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isLeadView}
                  onClick={() => setViewSelection({ uid: profile.uid, role: "lead_employee" })}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                    isLeadView
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-[#262338] dark:text-indigo-400"
                      : "text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <Target className="h-3.5 w-3.5" />
                  Tiềm năng
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-[#262338] dark:bg-[#13111C] dark:text-gray-400">
              <Database className="h-3.5 w-3.5 text-emerald-500" />
              {lastFetchedAt > 0
                ? t("agentDashboard.lastSync", {
                    time: new Date(lastFetchedAt).toLocaleString("vi-VN"),
                    defaultValue: `Supabase: ${new Date(lastFetchedAt).toLocaleString("vi-VN")}`,
                  })
                : t("agentDashboard.waitingSync", { defaultValue: "Đang chờ đồng bộ Supabase" })}
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? "animate-spin" : ""}`} />
              {t("common.refresh", { defaultValue: "Làm mới" })}
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={handleRefresh} className="shrink-0 font-bold underline">
              {t("common.retry", { defaultValue: "Thử lại" })}
            </button>
          </div>
        )}

        <AgentStatsBar stats={data.stats} />

        <AgentProgressSection
          completed={data.stats.completedToday}
          total={data.stats.totalToday}
          detailsHref={detailsHref}
        />

        <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-4">
          <div className="min-h-[560px] xl:col-span-3">
            <AgentKanbanBoard tasks={data.tasks} />
          </div>
          <div className="xl:col-span-1">
            <AgentNotifications notifications={data.notifications} />
          </div>
        </section>
      </div>
    </div>
  );
}
