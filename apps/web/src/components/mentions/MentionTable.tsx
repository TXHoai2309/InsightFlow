"use client";

import Link from "next/link";
import type { Mention } from "@/types/dashboard";

interface MentionTableProps {
  mentions: Mention[];
  isLoading: boolean;
}

const platformMap: Record<
  Mention["platform"],
  { label: string; color: string }
> = {
  facebook: { label: "Facebook", color: "bg-blue-100 text-blue-700" },
  tiktok: { label: "TikTok", color: "bg-pink-100 text-pink-700" },
  news: { label: "Báo chí", color: "bg-slate-100 text-slate-700" },
  youtube: { label: "YouTube", color: "bg-red-100 text-red-700" },
};

const sentimentMap: Record<
  Mention["sentiment"],
  { label: string; className: string }
> = {
  positive: { label: "Tích cực", className: "bg-emerald-100 text-emerald-700" },
  negative: { label: "Tiêu cực", className: "bg-rose-100 text-rose-700" },
  neutral: { label: "Trung lập", className: "bg-slate-100 text-slate-700" },
};

export function MentionTable({ mentions, isLoading }: MentionTableProps) {
  return (
    <section className="rounded-3xl bg-white border border-outline-variant p-6 shadow-sm overflow-hidden">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">
            Danh sách mentions
          </h2>
          <p className="text-sm text-on-surface-variant">
            Xem, lọc và relabel nhanh các đề cập quan trọng.
          </p>
        </div>
        <div className="text-sm text-on-surface-variant">
          Hiển thị {mentions.length} kết quả
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant text-sm uppercase tracking-wide text-on-surface-variant">
              <th className="py-4 pr-4">Nguồn</th>
              <th className="py-4 pr-4">Nội dung</th>
              <th className="py-4 pr-4">Cảm xúc</th>
              <th className="py-4 pr-4">Chủ đề</th>
              <th className="py-4 pr-4">Độ tin cậy</th>
              <th className="py-4 pr-4">Thời gian</th>
              <th className="py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/60">
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-20 text-center text-sm text-on-surface-variant"
                >
                  Đang tải dữ liệu mentions...
                </td>
              </tr>
            ) : mentions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-20 text-center text-sm text-on-surface-variant"
                >
                  Không tìm thấy mention phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              mentions.map((mention) => (
                <tr
                  key={mention.id}
                  className="hover:bg-surface-container-low transition-colors"
                >
                  <td className="py-4 pr-4 align-top">
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                      <span
                        className={
                          platformMap[mention.platform].color +
                          " rounded-full px-2 py-1"
                        }
                      >
                        {platformMap[mention.platform].label}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 align-top max-w-[360px]">
                    <Link
                      href={mention.url || "#"}
                      target="_blank"
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {mention.author}
                    </Link>
                    <p className="mt-2 text-sm text-on-surface-variant line-clamp-2">
                      {mention.content}
                    </p>
                  </td>
                  <td className="py-4 pr-4 align-top">
                    <span
                      className={
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold " +
                        sentimentMap[mention.sentiment].className
                      }
                    >
                      {sentimentMap[mention.sentiment].label}
                    </span>
                  </td>
                  <td className="py-4 pr-4 align-top text-sm text-on-surface">
                    {mention.topic}
                  </td>
                  <td className="py-4 pr-4 align-top text-sm text-on-surface">
                    {Math.round(mention.credibility_score * 100)}%
                  </td>
                  <td className="py-4 pr-4 align-top text-sm text-on-surface-variant">
                    {new Date(mention.created_at).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </td>
                  <td className="py-4 align-top text-right">
                    <button className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10">
                      Relabel
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
