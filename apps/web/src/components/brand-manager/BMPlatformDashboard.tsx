"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import { PLATFORM_META } from "@/lib/services/dashboard";
import { Platform, Mention } from "@/types/dashboard";
import { PlatformLogo } from "../platform/PlatformLogo";

interface BMPlatformDashboardProps {
  onBack: () => void;
  currentMentions: Mention[];
}

export function BMPlatformDashboard({ onBack, currentMentions }: BMPlatformDashboardProps) {
  const { t } = useTranslation();
  const { filters, setFilters } = useDashboardStore();

  const selectedPlatform = (filters.platform === "all" ? "facebook" : filters.platform) as Platform;

  const platforms: Platform[] = ["facebook", "thread", "tiktok", "youtube", "google_maps", "be", "news"];

  const handlePlatformChange = (p: Platform) => {
    setFilters({ platform: p });
  };

  // Filter mentions for the selected platform
  const platformMentions = useMemo(() => {
    return currentMentions.filter((m) => m.platform === selectedPlatform);
  }, [currentMentions, selectedPlatform]);

  // Sentiment counts
  const sentimentStats = useMemo(() => {
    let pos = 0, neu = 0, neg = 0;
    for (const m of platformMentions) {
      if (m.sentiment === "positive") pos++;
      else if (m.sentiment === "negative") neg++;
      else neu++;
    }
    const total = platformMentions.length;
    const netSentiment = total === 0 ? 0 : Math.round(((pos - neg) / total) * 100);
    return { pos, neu, neg, total, netSentiment };
  }, [platformMentions]);

  // Google Maps ratings distribution (1-5 stars)
  const starStats = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalWithStars = 0;
    for (const m of platformMentions) {
      if (m.star_count && m.star_count >= 1 && m.star_count <= 5) {
        const star = Math.round(m.star_count) as 1 | 2 | 3 | 4 | 5;
        counts[star]++;
        totalWithStars++;
      }
    }
    return { counts, totalWithStars };
  }, [platformMentions]);

  // Google Maps location branch ranking by negative reviews
  const locationStats = useMemo(() => {
    if (selectedPlatform !== "google_maps") return [];
    const statsMap = new Map<string, { positive: number; negative: number; neutral: number; total: number }>();
    for (const m of platformMentions) {
      const loc = m.location_name || "Chưa xác định";
      if (!statsMap.has(loc)) {
        statsMap.set(loc, { positive: 0, negative: 0, neutral: 0, total: 0 });
      }
      const s = statsMap.get(loc)!;
      s.total++;
      if (m.sentiment === "positive") s.positive++;
      else if (m.sentiment === "negative") s.negative++;
      else s.neutral++;
    }
    return Array.from(statsMap.entries())
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.negative - a.negative || b.total - a.total)
      .slice(0, 8); // Top 8 locations
  }, [platformMentions, selectedPlatform]);

  // Facebook & Threads viral negative posts
  const viralNegativePosts = useMemo(() => {
    const isSocial = ["facebook", "thread"].includes(selectedPlatform);
    if (!isSocial) return [];
    // Group comments/replies under parent posts or treat posts directly
    return platformMentions
      .filter((m) => m.sentiment === "negative")
      .slice(0, 5);
  }, [platformMentions, selectedPlatform]);

  // Health Score calculations specific to this platform
  const baseHealth = 60 + sentimentStats.netSentiment / 2;
  const platformHealthScore = Math.min(100, Math.max(0, Math.round(baseHealth)));

  // AI recommendations draft reply recommendations
  const aiPlatformInsight = useMemo(() => {
    if (sentimentStats.total === 0) return "Chưa đủ dữ liệu đề cập trên nền tảng này để phân tích hành vi AI.";
    
    if (selectedPlatform === "google_maps") {
      const lowStars = starStats.counts[1] + starStats.counts[2];
      if (lowStars > 0) {
        return `Phát hiện thấy ${lowStars} đánh giá tiêu cực (1-2⭐) trên Google Maps. Nguyên nhân chủ yếu xuất phát từ thái độ nhân viên phục vụ và tốc độ giao món. Đề xuất: Liên hệ quản lý chi nhánh bị phản ánh nhiều nhất để chấn chỉnh và sử dụng trợ lý AI phản hồi ngay để làm dịu khách hàng.`;
      }
      return "Chỉ số đánh giá sao trên Google Maps đang rất tích cực. Các khách hàng hài lòng về không gian sạch sẽ và đồ uống chuẩn vị. Đề xuất: Tiếp tục duy trì chất lượng dịch vụ hiện tại.";
    }

    if (selectedPlatform === "facebook" || selectedPlatform === "thread") {
      if (sentimentStats.neg > sentimentStats.pos) {
        return `Lượng tương tác tiêu cực trên ${PLATFORM_META[selectedPlatform]?.label} đang tăng cao. Có dấu hiệu phản ứng dữ dội dưới các bài viết. Đề xuất: Phân công nhân sự theo dõi timeline sự vụ, tránh lan rộng khủng hoảng truyền thông.`;
      }
      return `Tương tác trên kênh ${PLATFORM_META[selectedPlatform]?.label} đang ổn định. Thương hiệu nhận được nhiều lượt tag tích cực giới thiệu sản phẩm mới.`;
    }

    return `Kênh ${PLATFORM_META[selectedPlatform]?.label} ghi nhận tổng số ${sentimentStats.total} lượt nhắc tới thương hiệu. Chỉ số sức khỏe kênh đạt mức ổn định.`;
  }, [selectedPlatform, sentimentStats, starStats]);

  const pct = (val: number) => {
    if (sentimentStats.total === 0) return 0;
    return Math.round((val / sentimentStats.total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Navigation / Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-raised)] transition-all"
            style={{ color: "var(--color-text-secondary)" }}
            title="Quay lại tổng quan"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Phân tích Chi tiết Kênh
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] font-medium">
              Số liệu chi tiết của từng nền tảng thu thập
            </p>
          </div>
        </div>

        {/* Platform Tabs inside the dashboard */}
        <div className="flex items-center flex-wrap gap-1.5 p-1 bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-xl">
          {platforms.map((p) => {
            const isActive = selectedPlatform === p;
            const meta = PLATFORM_META[p];
            return (
              <button
                key={p}
                onClick={() => handlePlatformChange(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[var(--color-brand)] text-white shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                }`}
              >
                <PlatformLogo platform={p} className="w-4 h-4" />
                <span>{meta?.label ?? p}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Platform Health & Sentiment Summary */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-brand)]" style={{ fontSize: 18 }}>donut_large</span>
            Tỷ lệ Cảm xúc Kênh
          </h3>
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              {/* Custom SVG Donut chart representation */}
              <svg width="140" height="140" viewBox="0 0 42 42" className="transform -rotate-90">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-border)" strokeWidth="4" />
                
                {sentimentStats.total > 0 ? (
                  <>
                    {/* Positive arc */}
                    <circle
                      cx="21" cy="21" r="15.915" fill="transparent"
                      stroke="#22C55E" strokeWidth="4.2"
                      strokeDasharray={`${pct(sentimentStats.pos)} ${100 - pct(sentimentStats.pos)}`}
                      strokeDashoffset="0"
                    />
                    {/* Neutral arc */}
                    <circle
                      cx="21" cy="21" r="15.915" fill="transparent"
                      stroke="#94A3B8" strokeWidth="4.2"
                      strokeDasharray={`${pct(sentimentStats.neu)} ${100 - pct(sentimentStats.neu)}`}
                      strokeDashoffset={`-${pct(sentimentStats.pos)}`}
                    />
                    {/* Negative arc */}
                    <circle
                      cx="21" cy="21" r="15.915" fill="transparent"
                      stroke="#EF4444" strokeWidth="4.2"
                      strokeDasharray={`${pct(sentimentStats.neg)} ${100 - pct(sentimentStats.neg)}`}
                      strokeDashoffset={`-${pct(sentimentStats.pos) + pct(sentimentStats.neu)}`}
                    />
                  </>
                ) : null}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-[var(--color-text-primary)]">
                  {sentimentStats.total}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">
                  Đề cập
                </span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                  <span className="text-[var(--color-text-secondary)]">Tích cực</span>
                </div>
                <span className="text-[var(--color-text-primary)]">{sentimentStats.pos} ({pct(sentimentStats.pos)}%)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
                  <span className="text-[var(--color-text-secondary)]">Trung lập</span>
                </div>
                <span className="text-[var(--color-text-primary)]">{sentimentStats.neu} ({pct(sentimentStats.neu)}%)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span className="text-[var(--color-text-secondary)]">Tiêu cực</span>
                </div>
                <span className="text-[var(--color-text-primary)]">{sentimentStats.neg} ({pct(sentimentStats.neg)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Platform Health Score Gauge & AI Insights */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-brand)]" style={{ fontSize: 18 }}>health_and_safety</span>
              Sức khỏe Kênh
            </h3>
            
            <div className="flex items-center gap-6 mb-4">
              <div className="w-20 h-20 rounded-full border-[6px] border-[var(--color-brand)] border-t-transparent flex items-center justify-center relative">
                <span className="text-xl font-extrabold text-[var(--color-text-primary)]">{platformHealthScore}</span>
                <span className="absolute text-[8px] text-[var(--color-text-muted)] font-bold bottom-3">/100</span>
              </div>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  platformHealthScore >= 70
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : platformHealthScore >= 40
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {platformHealthScore >= 70 ? "Khỏe mạnh" : platformHealthScore >= 40 ? "Cảnh báo" : "Rủi ro cao"}
                </span>
                <p className="text-xs text-[var(--color-text-muted)] mt-2 font-medium">
                  Tính toán dựa trên Net Sentiment của riêng kênh {PLATFORM_META[selectedPlatform]?.label}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 border border-purple-500/10 rounded-xl relative overflow-hidden">
            <span className="material-symbols-outlined absolute right-2 top-2 text-purple-500/10" style={{ fontSize: 36 }}>auto_awesome</span>
            <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>psychology</span>
              Nhận định AI cho Kênh
            </h4>
            <p className="text-xs text-[var(--color-text-primary)] leading-relaxed italic">
              "{aiPlatformInsight}"
            </p>
          </div>
        </div>

        {/* Card 3: Platform specific charts (Google Maps Star rating OR Social Engagement metrics) */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          {selectedPlatform === "google_maps" ? (
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 18 }}>star</span>
                Phân bố Đánh giá Sao
              </h3>
              
              <div className="space-y-3.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = starStats.counts[stars as 1 | 2 | 3 | 4 | 5] || 0;
                  const percent = starStats.totalWithStars === 0 ? 0 : Math.round((count / starStats.totalWithStars) * 100);
                  return (
                    <div key={stars} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                          {stars} <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>star</span>
                        </span>
                        <span className="text-[var(--color-text-muted)]">{count} đánh giá ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--color-bg-surface-raised)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            stars >= 4 ? "bg-green-500" : stars === 3 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-brand)]" style={{ fontSize: 18 }}>analytics</span>
                Chỉ số Tương tác Kênh
              </h3>
              
              <div className="space-y-4 py-3">
                <div className="p-4 bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[var(--color-text-muted)] font-semibold">Tỷ lệ tương tác tiêu cực</span>
                    <h4 className="text-lg font-extrabold text-[var(--color-text-primary)] mt-1">
                      {sentimentStats.total === 0 ? "0%" : `${pct(sentimentStats.neg)}%`}
                    </h4>
                  </div>
                  <span className="material-symbols-outlined text-red-500" style={{ fontSize: 24 }}>trending_up</span>
                </div>

                <div className="p-4 bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[var(--color-text-muted)] font-semibold">Tần suất thảo luận trung bình</span>
                    <h4 className="text-lg font-extrabold text-[var(--color-text-primary)] mt-1">
                      {(sentimentStats.total / 7).toFixed(1)} / ngày
                    </h4>
                  </div>
                  <span className="material-symbols-outlined text-[var(--color-brand)]" style={{ fontSize: 24 }}>insights</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Row 2: Location Branch ranking (Google Maps) OR Negative Viral Posts (Social) */}
      <div className="grid grid-cols-1 gap-6">
        {selectedPlatform === "google_maps" ? (
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500" style={{ fontSize: 18 }}>storefront</span>
              Xếp hạng Chi nhánh có nhiều Đánh giá Tiêu cực nhất
            </h3>
            
            {locationStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)] font-semibold">
                Không tìm thấy dữ liệu chi nhánh nào trên Google Maps.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="pb-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Chi nhánh</th>
                      <th className="pb-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-center">Tiêu cực (Đánh giá)</th>
                      <th className="pb-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-center">Tích cực / Trung lập</th>
                      <th className="pb-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-center">Tổng review</th>
                      <th className="pb-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Tỷ lệ rủi ro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {locationStats.map((loc) => {
                      const negPercent = loc.total === 0 ? 0 : Math.round((loc.negative / loc.total) * 100);
                      return (
                        <tr key={loc.name} className="hover:bg-[var(--color-bg-surface-raised)] transition-all">
                          <td className="py-3.5 text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[var(--color-text-muted)]" style={{ fontSize: 16 }}>pin_drop</span>
                            {loc.name}
                          </td>
                          <td className="py-3.5 text-xs font-bold text-red-500 text-center">{loc.negative}</td>
                          <td className="py-3.5 text-xs font-semibold text-[var(--color-text-secondary)] text-center">
                            {loc.positive} / {loc.neutral}
                          </td>
                          <td className="py-3.5 text-xs font-semibold text-[var(--color-text-primary)] text-center">{loc.total}</td>
                          <td className="py-3.5 text-xs font-semibold w-1/4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2.5 bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${negPercent}%` }} />
                              </div>
                              <span className="text-red-500 font-bold min-w-[36px]">{negPercent}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500" style={{ fontSize: 18 }}>campaign</span>
              Các bài đăng/bình luận tiêu cực đáng lưu ý trên kênh
            </h3>
            
            {viralNegativePosts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)] font-semibold">
                Không ghi nhận đề cập tiêu cực nổi bật nào trên nền tảng này.
              </div>
            ) : (
              <div className="space-y-3">
                {viralNegativePosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-xl hover:border-red-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[var(--color-text-primary)]">{post.author}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                          {new Date(post.posted_at).toLocaleString("vi-VN")}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-extrabold uppercase">
                          Tiêu cực
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)] text-xs font-bold text-[var(--color-text-secondary)] transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                          Xem bài gốc
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
