import { useState, useEffect } from "react";
import Link from "next/link";
import type { Mention } from "@/types/dashboard";

interface MentionTableProps {
  mentions: Mention[];
  isLoading: boolean;
}

const platformIconMap: Record<
  string,
  { icon: string; color: string }
> = {
  facebook: { icon: "face", color: "text-blue-600" },
  tiktok: { icon: "music_video", color: "text-pink-600" },
  news: { icon: "newspaper", color: "text-slate-600" },
  youtube: { icon: "play_circle", color: "text-red-600" },
  google_maps: { icon: "location_on", color: "text-green-600" },
};

const getPlatformIcon = (platformStr: string) => {
  return platformIconMap[platformStr.toLowerCase()] || { icon: "public", color: "text-gray-600" };
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Reset page when mentions change (e.g. filters applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [mentions]);

  const totalPages = Math.ceil(mentions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, mentions.length);
  const currentMentions = mentions.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

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
        {/* Mobile View: Card List */}
        <div className="md:hidden divide-y divide-outline-variant/30">
          {isLoading ? (
            <div className="py-20 text-center text-on-surface-variant">
              Đang tải dữ liệu mentions...
            </div>
          ) : currentMentions.length === 0 ? (
            <div className="py-20 text-center text-on-surface-variant">
              Không tìm thấy mention phù hợp với bộ lọc.
            </div>
          ) : (
            currentMentions.map((mention) => {
              const { timeStr, relativeTime } = formatTime(mention.created_at);
              const tags = topicTags[mention.topic] || [];

              return (
                <div key={mention.id} className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined ${getPlatformIcon(mention.platform).color}`}
                      >
                        {getPlatformIcon(mention.platform).icon}
                      </span>
                      <span className="text-xs font-bold text-outline uppercase tracking-wider">
                        {mention.platform}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sentimentMap[mention.sentiment].className}`}
                    >
                      {sentimentMap[mention.sentiment].label}
                    </span>
                  </div>

                  <Link
                    href={mention.url || "#"}
                    target="_blank"
                    className="text-sm leading-relaxed text-on-surface hover:text-primary line-clamp-3"
                  >
                    "{mention.content}"
                  </Link>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-primary/5 text-primary rounded text-[10px] font-bold uppercase border border-primary/10">
                      {mention.topic}
                    </span>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-surface-container text-outline rounded text-[10px] font-bold uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-outline-variant/30">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-on-surface">
                        {timeStr}
                      </span>
                      <span className="text-[10px] text-outline">
                        {relativeTime}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-20 text-center text-on-surface-variant"
                  >
                    Đang tải dữ liệu mentions...
                  </td>
                </tr>
              ) : currentMentions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-20 text-center text-on-surface-variant"
                  >
                    Không tìm thấy mention phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                currentMentions.map((mention) => {
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
                            className={`material-symbols-outlined ${getPlatformIcon(mention.platform).color}`}
                          >
                            {getPlatformIcon(mention.platform).icon}
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {mentions.length > 0 && (
          <div className="px-4 py-4 bg-surface-bright flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-outline-variant">
            <span className="text-xs text-outline font-medium">
              Hiển thị {startIndex + 1}-{endIndex} trên tổng số{" "}
              {mentions.length} đề cập
            </span>
            <div className="flex gap-2">
              <button 
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded border border-outline-variant transition-colors ${currentPage === 1 ? 'text-outline-variant cursor-not-allowed' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                <span className="material-symbols-outlined text-lg">
                  chevron_left
                </span>
              </button>
              
              {/* Show simple pagination numbers (e.g. up to 5 visible) */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Calculate which page numbers to show to keep the current page roughly in the middle
                let startPage = Math.max(1, currentPage - 2);
                if (startPage + 4 > totalPages) startPage = Math.max(1, totalPages - 4);
                const pageNum = startPage + i;
                
                if (pageNum > totalPages) return null;
                
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded font-medium text-sm transition-colors ${currentPage === pageNum ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded border border-outline-variant transition-colors ${currentPage === totalPages ? 'text-outline-variant cursor-not-allowed' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                <span className="material-symbols-outlined text-lg">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
