import type { Mention } from "@/types/dashboard";

interface MentionStatsProps {
  mentions: Mention[];
  isLoading: boolean;
}

const formatCount = (count: number) => count.toLocaleString("vi-VN");

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

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-3xl bg-white border border-outline-variant p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">
          Tổng đề cập
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-on-surface">
          {isLoading ? "..." : formatCount(total)}
        </h2>
      </div>
      <div className="rounded-3xl bg-white border border-outline-variant p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Tích cực</p>
        <h2 className="mt-3 text-3xl font-semibold text-emerald-600">
          {isLoading ? "..." : formatCount(positive)}
        </h2>
      </div>
      <div className="rounded-3xl bg-white border border-outline-variant p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Tiêu cực</p>
        <h2 className="mt-3 text-3xl font-semibold text-rose-600">
          {isLoading ? "..." : formatCount(negative)}
        </h2>
        <p className="mt-2 text-sm font-medium text-on-surface-variant">
          Trung lập: {isLoading ? "..." : formatCount(neutral)}
        </p>
      </div>
    </div>
  );
}
