"use client";

import Link from "next/link";
import type { Mention } from "@/types/dashboard";
import { useMentionReassign } from "@/hooks/useMentionReassign";
import { MentionReassignModal } from "./MentionReassignModal";

interface MentionTableProps {
  mentions: Mention[];
  isLoading: boolean;
}

const platformIconMap: Record<
  Mention["platform"],
  { icon: string; color: string }
> = {
  facebook: { icon: "face", color: "text-blue-600" },
  tiktok: { icon: "music_video", color: "text-pink-600" },
  news: { icon: "newspaper", color: "text-slate-600" },
  youtube: { icon: "play_circle", color: "text-red-600" },
};

const sentimentMap: Record<
  Mention["sentiment"],
  { label: string; icon: string; className: string }
> = {
  positive: {
    label: "Tích cực",
    icon: "sentiment_satisfied",
    className: "bg-green-100 text-green-700",
  },
  negative: {
    label: "Tiêu cực",
    icon: "sentiment_very_dissatisfied",
    className: "bg-red-100 text-red-700",
  },
  neutral: {
    label: "Trung lập",
    icon: "sentiment_neutral",
    className: "bg-blue-100 text-blue-700",
  },
};

// Sample tags/hashtags based on topic
const topicTags: Record<Mention["topic"], string[]> = {
  quality: ["#UX/UI", "#Recommend"],
  price: ["#Price", "#Value"],
  service: ["#Performance", "#Support"],
  staff: ["#Team", "#Culture"],
  delivery: ["#Logistics", "#Timing"],
  experience: ["#Experience", "#Feedback"],
  legal: ["#Legal", "#Compliance"],
  operation: ["#Operation", "#Process"],
  competitor: ["#Competitor", "#Market"],
  other: ["#Other"],
};

export function MentionTable({ mentions, isLoading }: MentionTableProps) {
  const {
    isOpen,
    selectedMention,
    isLoading: isReassigning,
    openReassignModal,
    closeReassignModal,
    submitReassign,
  } = useMentionReassign();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    const timeStr = date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });

    let relativeTime = "Vừa xong";
    if (diffHours === 1) relativeTime = "1 giờ trước";
    else if (diffHours > 1) relativeTime = `${diffHours} giờ trước`;
    else if (diffHours === 0) relativeTime = "Vừa xong";

    return { timeStr, relativeTime };
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-24">
                  Nguồn
                </th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-24">
                  Độ tin cậy
                </th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center">
                  Nội dung tóm tắt
                </th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-32">
                  Sắc thái
                </th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-32">
                  Chủ đề
                </th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-40">
                  Thời gian
                </th>
                <th className="px-4 py-4 font-semibold text-outline uppercase tracking-wider text-center w-32">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-20 text-center text-on-surface-variant"
                  >
                    Đang tải dữ liệu mentions...
                  </td>
                </tr>
              ) : mentions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-20 text-center text-on-surface-variant"
                  >
                    Không tìm thấy mention phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                mentions.map((mention) => {
                  const { timeStr, relativeTime } = formatTime(
                    mention.created_at,
                  );
                  const tags = topicTags[mention.topic] || [];

                  return (
                    <tr
                      key={mention.id}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      {/* Platform */}
                      <td className="px-4 py-4 align-top text-center">
                        <div className="flex items-center justify-center">
                          <span
                            className={`material-symbols-outlined ${platformIconMap[mention.platform].color}`}
                          >
                            {platformIconMap[mention.platform].icon}
                          </span>
                        </div>
                      </td>

                      {/* Credibility Score with Progress Bar */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <span className="font-bold text-on-surface text-center">
                            {Math.round(mention.credibility_score * 100)}%
                          </span>
                          <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{
                                width: `${mention.credibility_score * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Content */}
                      <td className="px-4 py-4 align-top">
                        <Link
                          href={mention.url || "#"}
                          target="_blank"
                          className="text-sm leading-relaxed line-clamp-2 text-on-surface hover:text-primary"
                        >
                          "{mention.content}"
                        </Link>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-surface-container text-outline rounded text-xs font-bold uppercase"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Sentiment */}
                      <td className="px-4 py-4 align-top text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${sentimentMap[mention.sentiment].className}`}
                        >
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: '"FILL" 1' }}
                          >
                            {sentimentMap[mention.sentiment].icon}
                          </span>
                          {sentimentMap[mention.sentiment].label}
                        </span>
                      </td>

                      {/* Topic */}
                      <td className="px-4 py-4 align-top text-center">
                        <span className="px-2 py-1 bg-primary/5 text-primary rounded text-xs font-bold uppercase border border-primary/10">
                          {mention.topic}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <div className="flex flex-col text-center">
                          <span className="font-medium text-on-surface text-sm">
                            {timeStr}
                          </span>
                          <span className="text-xs text-outline">
                            {relativeTime}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 align-top text-center">
                        <button
                          onClick={() => openReassignModal(mention)}
                          className="px-3 py-2 border border-primary text-primary hover:bg-primary hover:text-white transition-all rounded-lg font-semibold whitespace-nowrap text-xs"
                        >
                          Gán lại
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-4 bg-surface-bright flex items-center justify-between border-t border-outline-variant">
          <span className="text-xs text-outline font-medium">
            Hiển thị 1-{Math.min(mentions.length, 4)} trên tổng số{" "}
            {mentions.length} đề cập
          </span>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-lg">
                chevron_left
              </span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white font-medium text-sm">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors font-medium text-sm">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors font-medium text-sm">
              3
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-lg">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      <MentionReassignModal
        mention={selectedMention}
        isOpen={isOpen}
        onClose={closeReassignModal}
        onSubmit={submitReassign}
        isLoading={isReassigning}
      />
    </>
  );
}
