import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mention } from "@/types/dashboard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MOCK_VENUES } from "./BMInsightsFilterBar";

interface BMOpportunityBlockProps {
  currentMentions: Mention[];
  previousMentions: Mention[];
}

// Topic translation map
const TOPIC_LABELS: Record<string, string> = {
  quality: "Chất lượng sản phẩm", service: "Phục vụ & CSKH",
  price: "Giá cả", delivery: "Giao hàng", staff: "Thái độ nhân viên",
  legal: "Pháp lý", operation: "Vận hành", marketing: "Marketing",
  experience: "Trải nghiệm không gian", competitor: "Đối thủ", other: "Chủ đề khác",
};

export function BMOpportunityBlock({ currentMentions, previousMentions }: BMOpportunityBlockProps) {
  const { t } = useTranslation();
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  // Filter positive mentions
  const posCurrent = currentMentions.filter((m) => m.sentiment === "positive");
  const posPrev = previousMentions.filter((m) => m.sentiment === "positive");

  const trend = posPrev.length === 0 ? 0 : Math.round(((posCurrent.length - posPrev.length) / posPrev.length) * 100);
  const isUp = trend >= 0;

  const topVenues = useMemo(() => {
    const venueData: Record<string, { count: number; prevCount: number; topics: Record<string, number> }> = {};
    MOCK_VENUES.forEach(v => venueData[v] = { count: 0, prevCount: 0, topics: {} });

    posCurrent.forEach((m) => {
      const idx = (m.id.charCodeAt(m.id.length - 1) || 0) % 5;
      const venueName = MOCK_VENUES[idx];
      venueData[venueName].count++;
      const topic = m.topic || "other";
      venueData[venueName].topics[topic] = (venueData[venueName].topics[topic] || 0) + 1;
    });

    posPrev.forEach((m) => {
      const idx = (m.id.charCodeAt(m.id.length - 1) || 0) % 5;
      const venueName = MOCK_VENUES[idx];
      venueData[venueName].prevCount++;
    });

    return Object.entries(venueData)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => {
        const topTopicKey = Object.keys(data.topics).sort((a, b) => data.topics[b] - data.topics[a])[0];
        // Mock rating between 4.0 and 5.0
        const rating = (4.0 + (data.count % 10) / 10).toFixed(1);
        const prevRating = (parseFloat(rating) - (data.prevCount > data.count ? 0.2 : -0.1)).toFixed(1);
        const ratingTrend = (parseFloat(rating) - parseFloat(prevRating)).toFixed(1);
        
        return {
          name,
          count: data.count,
          trend: data.count - data.prevCount,
          rating,
          ratingTrend: parseFloat(ratingTrend),
          topTopic: TOPIC_LABELS[topTopicKey] || topTopicKey,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [posCurrent, posPrev]);

  // Topic trend (mock data from positive topics)
  const chartData = useMemo(() => {
    const topicCounts: Record<string, number> = {};
    posCurrent.forEach((m) => {
      const topic = m.topic || "other";
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(t => t[0]);

    if (topTopics.length === 0) return [];

    // Mock trend over 7 points
    return Array.from({ length: 7 }).map((_, i) => {
      const point: any = { name: `Day ${i + 1}` };
      topTopics.forEach((topic, tIdx) => {
        // Just some random-ish data based on count
        point[topic] = Math.max(0, Math.floor((topicCounts[topic] / 7) * (1 + Math.sin(i + tIdx))));
      });
      return point;
    });
  }, [posCurrent]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 relative">
      <div className="absolute top-4 right-6 text-[11px] text-[var(--color-text-muted)] font-medium">
        Cập nhật lúc: {new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
      </div>
      
      {/* Header */}
      <div className="mb-6 mt-2 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--color-text-primary)]">
            <i className="ti ti-trending-up text-green-500 mr-2 text-[20px] align-middle"></i>
            {t("bm.opportunity.title")}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
            {t("bm.opportunity.subtitle")}
          </p>
        </div>
        <div className="text-right flex items-center gap-4">
          <button 
            onClick={() => alert("Đã tải xuống Báo cáo Cơ hội (PDF)!")}
            className="hidden md:flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] transition"
          >
            <i className="ti ti-download"></i> Xuất báo cáo
          </button>
          <div>
            <div className="text-[24px] font-bold text-[var(--color-text-primary)]">
              {topVenues.length}
            </div>
            <div className={`text-[12px] font-medium ${isUp ? "text-green-600" : "text-red-500"}`}>
              <i className={`ti ti-arrow-${isUp ? "up" : "down"} mr-1`}></i>
              {Math.abs(trend)} địa điểm tăng trưởng
            </div>
          </div>
        </div>
      </div>

      {/* Action Recommendation */}
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-[13px] text-green-800">
          <strong>{t("bm.opportunity.actionLabel")}</strong> {t("bm.opportunity.actionDesc")}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-6 xl:flex-row">
        {/* Venues List */}
        <div className="flex-1 space-y-4">
          <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            {t("bm.opportunity.topVenues")}
          </h3>
          <ul className="space-y-3">
            {topVenues.length === 0 ? (
              <li className="text-[13px] text-[var(--color-text-secondary)]">Không có dữ liệu tích cực</li>
            ) : (
              topVenues.map((venue, i) => (
                <li 
                  key={i} 
                  onClick={() => setSelectedVenue(venue.name)}
                  className="cursor-pointer rounded-lg p-2 transition hover:bg-[var(--color-brand-subtle)] group border border-transparent hover:border-[var(--color-brand)]/20"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand)] transition-colors">{venue.name}</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                      +{venue.count} reviews
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                      <span className="text-yellow-500">⭐ {venue.rating}</span>
                      <span className={venue.ratingTrend >= 0 ? "text-green-600" : "text-red-500"}>
                        ({venue.ratingTrend > 0 ? "+" : ""}{venue.ratingTrend})
                      </span>
                    </div>
                    <span className="text-[var(--color-text-muted)] max-w-[150px] truncate" title={venue.topTopic}>Khen: {venue.topTopic}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Chart */}
        <div className="flex-1">
          <h3 className="mb-4 text-[14px] font-semibold text-[var(--color-text-primary)]">
            {t("bm.opportunity.topTopics")}
          </h3>
          <div className="h-[220px] w-full mt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--color-border)", boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.1)" }} 
                    itemStyle={{ fontSize: 12, fontWeight: 600 }}
                    labelStyle={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  {Object.keys(chartData[0] || {})
                    .filter(k => k !== "name")
                    .map((key, idx) => (
                      <Area
                        key={key}
                        name={TOPIC_LABELS[key] || key}
                        type="monotone"
                        dataKey={key}
                        stroke={["#22c55e", "#3b82f6", "#f59e0b"][idx % 3]}
                        fill={["#22c55e", "#3b82f6", "#f59e0b"][idx % 3]}
                        strokeWidth={2}
                        fillOpacity={0.15}
                      />
                    ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border)] rounded-lg">
                Chưa đủ dữ liệu biểu đồ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal Mock */}
      {selectedVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[500px] max-w-[90vw] rounded-xl bg-[var(--color-bg-surface)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--color-text-primary)]">
                Review tích cực: {selectedVenue}
              </h3>
              <button onClick={() => setSelectedVenue(null)} className="text-[var(--color-text-muted)] hover:text-red-500">
                <i className="ti ti-x text-xl"></i>
              </button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {posCurrent
                .filter(m => {
                  const idx = (m.id.charCodeAt(m.id.length - 1) || 0) % 5;
                  return MOCK_VENUES[idx] === selectedVenue;
                })
                .slice(0, 5)
                .map((m, i) => (
                  <div key={i} className="rounded-lg border border-[var(--color-border)] p-3 text-[13px]">
                    <div className="flex justify-between text-[var(--color-text-muted)] text-[11px] mb-1">
                      <span>{m.author} • {new Date(m.created_at).toLocaleDateString()}</span>
                      <span className="text-green-600 font-bold">5 ⭐</span>
                    </div>
                    <p className="text-[var(--color-text-primary)]">{m.content}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
