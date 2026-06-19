import type { Mention } from "@/types/dashboard";

interface MentionStatsProps {
  mentions: Mention[];
  isLoading: boolean;
}

export function MentionStats({ mentions, isLoading }: MentionStatsProps) {
  const total = mentions.length;
  const positive = mentions.filter(
    (mention) => mention.sentiment === "positive",
  ).length;
  const negative = mentions.filter(
    (mention) => mention.sentiment === "negative",
  ).length;
  const neutral = mentions.filter(
    (mention) => mention.sentiment === "neutral",
  ).length;

  const positivePct = total ? Math.round((positive / total) * 100) : 0;
  const negativePct = total ? Math.round((negative / total) * 100) : 0;
  const neutralPct = total ? Math.round((neutral / total) * 100) : 0;
  const netSentiment = total
    ? Math.round(((positive - negative) / total) * 100)
    : 0;

  return (
    <div className="relative md:h-64 rounded-3xl overflow-hidden shadow-sm border border-outline-variant bg-white p-6 md:p-8 group">
      <div className="relative z-10 flex flex-col h-full justify-between gap-6 md:gap-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-on-surface">
              Phân tích sắc thái tổng thể
            </h3>
            <p className="text-xs md:text-sm text-on-surface-variant mt-1">
              Dựa trên {isLoading ? "..." : total.toLocaleString("vi-VN")} đề
              cập trong 7 ngày qua
            </p>
          </div>
          <div className="bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant">
            <span className="text-xs md:text-sm font-bold text-primary">
              {isLoading
                ? "..."
                : `${netSentiment > 0 ? "+" : ""}${netSentiment}%`}{" "}
              so với tuần trước
            </span>
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="space-y-4 md:space-y-6">
          <div className="flex h-10 md:h-12 w-full rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
            <div
              className="bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs md:text-base"
              style={{ width: `${positivePct}%` }}
            >
              {positivePct > 5 && `${positivePct}%`}
            </div>
            <div
              className="bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs md:text-base"
              style={{ width: `${neutralPct}%` }}
            >
              {neutralPct > 5 && `${neutralPct}%`}
            </div>
            <div
              className="bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs md:text-base"
              style={{ width: `${negativePct}%` }}
            >
              {negativePct > 5 && `${negativePct}%`}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-600 flex-shrink-0"></span>
              <span className="text-xs md:text-sm text-on-surface-variant">
                Tích cực ({positive.toLocaleString("vi-VN")})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-700 flex-shrink-0"></span>
              <span className="text-xs md:text-sm text-on-surface-variant">
                Trung lập ({neutral.toLocaleString("vi-VN")})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></span>
              <span className="text-xs md:text-sm text-on-surface-variant">
                Tiêu cực ({negative.toLocaleString("vi-VN")})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Background Blob */}
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
    </div>
  );
}
