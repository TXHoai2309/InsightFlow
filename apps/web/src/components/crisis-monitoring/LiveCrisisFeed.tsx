"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, ExternalLink, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import type { Mention } from "@/types/dashboard";

const TOPIC_LABELS: Record<string, string> = {
  service: "Dịch vụ",
  quality: "Chất lượng",
  price: "Giá cả",
  location: "Chi nhánh",
  promotion: "Khuyến mãi",
  delivery: "Giao hàng",
  staff: "Nhân viên",
  hygiene: "Vệ sinh",
  other: "Khác",
};

function getTopicLabel(topic?: string | null) {
  const key = String(topic || "other").toLowerCase();
  return TOPIC_LABELS[key] || key.replace(/_/g, " ") || "Khác";
}

function getRiskScore(incident: any) {
  const contentLength = String(incident.content || "").length;
  const topicBoost = ["service", "quality", "hygiene", "staff"].includes(String(incident.topic || "")) ? 12 : 4;
  return Math.min(98, 58 + topicBoost + Math.min(18, Math.round(contentLength / 18)));
}

function formatRelativeTime(dateValue?: string) {
  const time = new Date(dateValue || "").getTime();
  if (!Number.isFinite(time)) return "mới cập nhật";
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000));
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.round(hours / 24)} ngày trước`;
}

export function LiveCrisisFeed({ mentions }: { mentions: Mention[] }) {
  const liveIncidents = useMemo(() => {
    return mentions
      .filter((mention) => mention.sentiment === "negative")
      .slice()
      .sort((a, b) => new Date(b.posted_at || b.created_at || "").getTime() - new Date(a.posted_at || a.created_at || "").getTime())
      .slice(0, 6);
  }, [mentions]);

  return (
    <Card className="min-h-[620px] rounded-lg border-[#DDD9E8] bg-white shadow-[0_8px_24px_rgba(30,31,36,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#EEEAF6] px-5 py-4">
        <div>
          <CardTitle className="text-sm font-black uppercase text-[#1A1B20]">Dòng rủi ro realtime</CardTitle>
          <div className="mt-1 text-xs font-semibold text-[#6E6A7C]">{liveIncidents.length} đề cập mới nhất</div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase text-[#BA1A1A]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#BA1A1A]" />
          Live
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-3">
          {liveIncidents.map((incident: any, index: number) => {
            const riskScore = getRiskScore(incident);
            return (
              <motion.article
                key={incident.id || index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-lg border border-[#EEEAF6] bg-[#FBFAFE] p-4 transition-colors hover:border-[#D7D0EA] hover:bg-white"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <PlatformLogo platform={incident.platform || "unknown"} size="xs" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-[#1A1B20]">{incident.author || "Người dùng"}</div>
                      <div className="mt-0.5 text-xs font-semibold text-[#7A7688]">{formatRelativeTime(incident.posted_at || incident.created_at)}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-[#F1B7B2] bg-white text-[#BA1A1A]">
                    {riskScore}/100
                  </Badge>
                </div>

                <p className="line-clamp-3 text-sm font-semibold leading-6 text-[#1A1B20]">
                  {incident.content || "Không có nội dung hiển thị"}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge className="bg-red-50 text-[#BA1A1A] hover:bg-red-50">{getTopicLabel(incident.topic)}</Badge>
                  <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#DDD9E8] bg-white px-2.5 text-xs font-bold text-[#474554] hover:border-[#4234B6] hover:text-[#4234B6]">
                    <UserPlus className="h-3.5 w-3.5" />
                    Giao xử lý
                  </button>
                  <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#DDD9E8] bg-white px-2.5 text-xs font-bold text-[#474554] hover:border-emerald-500 hover:text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Xong
                  </button>
                  {incident.url && (
                    <a href={incident.url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#DDD9E8] bg-white px-2.5 text-xs font-bold text-[#474554] hover:border-[#4234B6] hover:text-[#4234B6]">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Nguồn
                    </a>
                  )}
                </div>
              </motion.article>
            );
          })}

          {liveIncidents.length === 0 && (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-[#DDD9E8] bg-[#FBFAFE] p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <div className="mt-3 text-sm font-black text-[#1A1B20]">Không có đề cập tiêu cực mới</div>
              <div className="mt-1 text-xs font-semibold text-[#6E6A7C]">Bộ lọc hiện tại đang an toàn.</div>
            </div>
          )}
        </div>

        {liveIncidents.length > 0 && (
          <button type="button" className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#4234B6] px-4 text-sm font-black text-white hover:bg-[#332892]">
            Xem toàn bộ rủi ro
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}
