"use client";

import React, { useMemo } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import type { Mention } from "@/types/dashboard";

// Engine
import {
  computeTopicDeltas,
  getEmergingOpportunities,
  getCrisisSignals,
  computeVenueRisks,
} from "./insights/insightEngine";

// Text generator (rule-based, LLM-ready)
import { generateAIInsightSummary } from "./insights/generateInsightSummary";

// Full-width
import { AIInsightBanner }   from "./insights/AIInsightBanner";
import { InsightConclusion } from "./insights/InsightConclusion";

// Left column — Tiềm năng
import { OpportunityHighlights } from "./insights/OpportunityHighlights";
import { GrowingTopics }         from "./insights/GrowingTopics";
import { CustomerTopInsight }    from "./insights/CustomerTopInsight";
import { MarketingOpportunity }  from "./insights/MarketingOpportunity";
import { GrowthForecast }        from "./insights/GrowthForecast";

// Right column — Khủng hoảng
import { AnomalySignals }   from "./insights/AnomalySignals";
import { RiskTopics }       from "./insights/RiskTopics";
import { SpreadLikelihood } from "./insights/SpreadLikelihood";
import { BranchesAtRisk }   from "./insights/BranchesAtRisk";
import { CrisisTimeline }   from "./insights/CrisisTimeline";
import { RiskForecast }     from "./insights/RiskForecast";

// Time filter
import { TimeRangeFilter } from "./insights/TimeRangeFilter";

const TIME_LABEL: Record<string, string> = { "24h": "24 giờ", "7d": "7 ngày", "30d": "30 ngày", "all": "90 ngày" };

export function BrandManagerInsights() {
  const { mentions, filters } = useDashboardStore();

  /* ── Current window ───────────────────────────────────────── */
  const currentMentions = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    let cutoff: number | null = null;
    if (filters.time_range === "24h") {
      cutoff = startOfTodayMs;
    } else if (filters.time_range === "7d") {
      cutoff = startOfTodayMs - 6 * 24 * 60 * 60 * 1000;
    } else if (filters.time_range === "30d") {
      cutoff = startOfTodayMs - 29 * 24 * 60 * 60 * 1000;
    }

    return mentions.filter((m: Mention) => {
      if (filters.platform !== "all" && m.platform !== filters.platform) return false;
      if (cutoff) {
        const t = new Date(m.posted_at).getTime();
        if (!isFinite(t) || t < cutoff || t > Date.now()) return false;
      }
      return true;
    });
  }, [mentions, filters.time_range, filters.platform]);

  /* ── Previous window ──────────────────────────────────────── */
  const prevMentions = useMemo(() => {
    if (filters.time_range === "all") return [];
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    let cutoff: number | null = null;
    let durationMs = 0;
    if (filters.time_range === "24h") {
      cutoff = startOfTodayMs;
      durationMs = Date.now() - startOfTodayMs;
    } else if (filters.time_range === "7d") {
      cutoff = startOfTodayMs - 6 * 24 * 60 * 60 * 1000;
      durationMs = 7 * 24 * 60 * 60 * 1000;
    } else if (filters.time_range === "30d") {
      cutoff = startOfTodayMs - 29 * 24 * 60 * 60 * 1000;
      durationMs = 30 * 24 * 60 * 60 * 1000;
    }

    if (cutoff === null) return [];

    const currentCutoff = cutoff;
    const previousCutoff = cutoff - durationMs;

    return mentions.filter((m: Mention) => {
      if (filters.platform !== "all" && m.platform !== filters.platform) return false;
      const t = new Date(m.posted_at).getTime();
      return t >= previousCutoff && t < currentCutoff;
    });
  }, [mentions, filters.time_range, filters.platform]);

  /* ── Derived insight data ─────────────────────────────────── */
  const deltas        = useMemo(() => computeTopicDeltas(currentMentions, prevMentions), [currentMentions, prevMentions]);
  const opportunities = useMemo(() => getEmergingOpportunities(deltas), [deltas]);
  const crisisSignals = useMemo(() => getCrisisSignals(deltas, currentMentions), [deltas, currentMentions]);
  const { venues: venueRisks, systemAvgNegRatio } = useMemo(
    () => computeVenueRisks(currentMentions),
    [currentMentions]
  );

  // For AI text generator: top venue risks
  const topRiskVenues = useMemo(
    () => venueRisks.filter(v => v.negRatio > 1.2).sort((a, b) => b.negRatio - a.negRatio).slice(0, 2),
    [venueRisks]
  );

  /* ── Text summary ─────────────────────────────────────────── */
  const summary = useMemo(
    () => generateAIInsightSummary(opportunities, crisisSignals, currentMentions.length, topRiskVenues),
    [opportunities, crisisSignals, currentMentions.length, topRiskVenues]
  );

  const timeLabel = TIME_LABEL[filters.time_range] || "kỳ này";

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 pb-16">

      {/* ── Time filter bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">Tiềm năng & Khủng hoảng</h2>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
            Phát hiện bất thường · Dự báo xu hướng · Phân tích nguyên nhân
          </p>
        </div>
        <TimeRangeFilter />
      </div>

      {/* ── Row 0: AI Insight Banner (full width) ───────────── */}
      <AIInsightBanner
        summary={summary}
        oppCount={opportunities.length}
        riskCount={crisisSignals.length}
      />

      {/*
        ── 2-column body ─────────────────────────────────────
        Mobile order: Crisis (order-1) → Opportunity (order-2)
        Desktop: Opportunity left, Crisis right
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* LEFT: Tiềm năng — mobile order-2 */}
        <div className="flex flex-col gap-5 order-2 lg:order-1">
          <OpportunityHighlights opportunities={opportunities} timeLabel={timeLabel} />
          <GrowingTopics deltas={deltas} />
          <CustomerTopInsight mentions={currentMentions} />
          <MarketingOpportunity mentions={currentMentions} />
          <GrowthForecast opportunities={opportunities} />
        </div>

        {/* RIGHT: Khủng hoảng — mobile order-1 (shown first!) */}
        <div className="flex flex-col gap-5 order-1 lg:order-2">
          <AnomalySignals signals={crisisSignals} />
          <RiskTopics signals={crisisSignals} />
          <SpreadLikelihood signals={crisisSignals} />
          <BranchesAtRisk venues={venueRisks} systemAvgNegRatio={systemAvgNegRatio} />
          <CrisisTimeline mentions={currentMentions} />
          <RiskForecast signals={crisisSignals} />
        </div>
      </div>

      {/* ── Kết luận (full width, bottom) ───────────────────── */}
      <InsightConclusion summary={summary} />
    </div>
  );
}
