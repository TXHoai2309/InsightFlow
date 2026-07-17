import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface BrandHealthScoreProps {
  score: number;
  trend: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export function BrandHealthScore({ score, trend, sentiment }: BrandHealthScoreProps) {
  const { t } = useTranslation();

  const isHealthy = score >= 70;
  const isWarning = score < 70 && score >= 40;

  const total = sentiment.positive + sentiment.neutral + sentiment.negative || 1;
  const posPct = Math.round((sentiment.positive / total) * 100);
  const neuPct = Math.round((sentiment.neutral / total) * 100);
  const negPct = Math.round((sentiment.negative / total) * 100);

  // Generate a mock AI summary based on the sentiment
  const aiSummary = 
    isHealthy ? t("dashboard.aiSummary.healthy", "Tâm lý khách hàng đang ổn định. Nên duy trì các chiến dịch quảng bá hiện tại.") :
    isWarning ? t("dashboard.aiSummary.warning", "Cảnh báo: Cảm xúc tiêu cực đang tăng. Cần kiểm tra ngay chất lượng dịch vụ ở cửa hàng.") :
    t("dashboard.aiSummary.critical", "Nguy hiểm: Lượng bài viết tiêu cực tăng đột biến! Cần duyệt và phân công xử lý các bài viết trên TikTok ngay lập tức.");

  const riskLevel = isHealthy ? t("dashboard.risk.low", "Thấp") : isWarning ? t("dashboard.risk.medium", "Trung bình") : t("dashboard.risk.high", "Cao");

  return (
    <div className="bg-white dark:bg-[#1a1b1e] rounded-[20px] border border-[var(--color-border)] shadow-sm p-8 lg:p-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-10">
      
      {/* Left Column: Score */}
      <div className="flex flex-col flex-shrink-0">
        <h2 className="text-gray-500 dark:text-gray-400 font-semibold text-sm uppercase tracking-wider mb-2">
          {t("dashboard.brandHealth.title", "Sức khỏe Thương hiệu")}
        </h2>
        <div className="flex items-end gap-4">
          <div className="text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">
            {score}<span className="text-3xl text-gray-400 dark:text-gray-500 font-medium">/100</span>
          </div>
          <div className="flex flex-col pb-2 gap-1">
            <span className={`text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full border w-fit ${
              isHealthy ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400" : 
              isWarning ? "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-400" : 
              "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400"
            }`}>
              {isHealthy ? t("dashboard.status.healthy", "Tốt") : isWarning ? t("dashboard.status.warning", "Cảnh báo") : t("dashboard.status.critical", "Nguy hiểm")}
            </span>
            <span className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-300">
              <span className={`material-symbols-outlined text-[18px] mr-1 ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
                {trend >= 0 ? "arrow_upward" : "arrow_downward"}
              </span>
              {trend >= 0 ? "+" : ""}{trend} {t("dashboard.brandHealth.vsYesterday", "so với hôm qua")}
            </span>
          </div>
        </div>

        {/* Sentiment Progress Bar */}
        <div className="mt-8 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span>{t("dashboard.sentiment.positive", "Tích cực")} {posPct}%</span>
            <span>{t("dashboard.sentiment.neutral", "Trung tính")} {neuPct}%</span>
            <span>{t("dashboard.sentiment.negative", "Tiêu cực")} {negPct}%</span>
          </div>
          <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden flex">
            <div style={{ width: `${posPct}%` }} className="h-full bg-green-500 transition-all duration-500"></div>
            <div style={{ width: `${neuPct}%` }} className="h-full bg-gray-400 dark:bg-gray-500 transition-all duration-500"></div>
            <div style={{ width: `${negPct}%` }} className="h-full bg-red-500 transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* Right Column: AI Insight */}
      <div className="flex-1 lg:pl-10 lg:border-l border-[var(--color-border)] flex flex-col justify-center">
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              {t("dashboard.risk.title", "Mức độ rủi ro")}
            </span>
            <span className={`text-lg font-bold ${
              isHealthy ? "text-green-600 dark:text-green-400" : 
              isWarning ? "text-yellow-600 dark:text-yellow-400" : 
              "text-red-600 dark:text-red-400"
            }`}>
              {riskLevel}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              {t("dashboard.trend.title", "Xu hướng 7 ngày")}
            </span>
            <div className="flex items-center text-lg font-bold text-gray-900 dark:text-white">
              <svg width="60" height="20" viewBox="0 0 60 20" className="mr-2">
                <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,15 10,12 20,18 30,8 40,10 50,2 60,5" className={isHealthy ? "text-green-500" : "text-gray-400"} />
              </svg>
              {isHealthy ? "Tích cực" : isWarning ? "Ổn định" : "Bất ổn"}
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-50/50 dark:bg-indigo-500/10 rounded-xl p-5 border border-indigo-100 dark:border-indigo-500/20 relative">
          <span className="material-symbols-outlined absolute top-4 right-4 text-indigo-200 dark:text-indigo-500/30 text-4xl">auto_awesome</span>
          <h3 className="text-indigo-800 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center">
            <span className="material-symbols-outlined text-[16px] mr-1.5">psychology</span>
            {t("dashboard.aiInsight.title", "Phân tích AI")}
          </h3>
          <p className="text-gray-800 dark:text-gray-200 text-sm md:text-base leading-relaxed font-medium relative z-10 mb-3">
            “{aiSummary}”
          </p>
          <Link href="/mentions" className="inline-flex items-center text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:underline relative z-10">
            {t("dashboard.aiInsight.action", "Xem chi tiết nguyên nhân")} &rarr;
          </Link>
        </div>
      </div>
      
    </div>
  );
}
