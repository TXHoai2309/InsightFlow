"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useDashboardStore } from "@/stores/dashboard.store";

export function AngryTopicsCard() {
  const [isMounted, setIsMounted] = useState(false);
  const { getFilteredMentions } = useDashboardStore();
  const mentions = getFilteredMentions();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const angryTopics = useMemo(() => {
    // Lọc các mention tiêu cực
    const negativeMentions = mentions.filter(m => m.sentiment === "negative");
    const totalNegative = negativeMentions.length || 1;
    
    // Đếm theo topic
    const topicCounts: Record<string, number> = {};
    negativeMentions.forEach(m => {
      const t = m.topic || "other";
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    });

    // Sắp xếp và lấy top 3
    const sorted = Object.entries(topicCounts)
      .map(([topic, count]) => ({
        label: mapTopicName(topic),
        value: Math.round((count / totalNegative) * 100),
        count,
        color: count > totalNegative * 0.4 ? "error" : count > totalNegative * 0.2 ? "orange" : "neutral"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Nếu không có đủ 3, điền thêm rỗng
    while (sorted.length < 3) {
      sorted.push({ label: "---", value: 0, count: 0, color: "neutral" });
    }

    return sorted;
  }, [mentions]);

  function mapTopicName(t: string) {
    const map: Record<string, string> = {
      price: "Giá cả",
      quality: "Chất lượng",
      service: "Dịch vụ",
      staff: "Nhân viên",
      delivery: "Giao hàng",
      experience: "Trải nghiệm",
      legal: "Pháp lý",
      operation: "Vận hành",
      marketing: "Marketing",
      competitor: "Đối thủ",
      other: "Khác",
    };
    return map[t] || t;
  }

  const getGradient = (colorStr: string) => {
    switch (colorStr) {
      case "error":
        return "linear-gradient(90deg, #F87171 0%, #BA1A1A 100%)";
      case "orange":
        return "linear-gradient(90deg, #FBBF24 0%, #F97316 100%)";
      case "neutral":
      default:
        return "linear-gradient(90deg, #E2E8F0 0%, #94A3B8 100%)";
    }
  };

  const getTopicEmoji = (label: string) => {
    switch (label) {
      case "Giá cả": return "💰";
      case "Chất lượng": return "📦";
      case "Dịch vụ": return "🛎️";
      case "Nhân viên": return "👤";
      case "Giao hàng": return "🚚";
      case "Trải nghiệm": return "⭐";
      case "Pháp lý": return "⚖️";
      case "Vận hành": return "⚙️";
      case "Marketing": return "📢";
      case "Đối thủ": return "⚔️";
      case "Khác": return "💬";
      default: return "🔥";
    }
  };

  return (
    <Card className="flex h-[260px] flex-col rounded-xl shadow-[0px_4px_20px_rgba(30,31,36,0.08)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0px_8px_30px_rgba(30,31,36,0.12)] border-[#C8C4D6] bg-white/70 backdrop-blur-md">
      <CardHeader className="pb-2 pt-6 px-6">
        <CardTitle className="text-[14px] font-bold uppercase text-[#1A1B20] font-sans tracking-wide leading-tight">
          Chủ đề gây phẫn nộ
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-6 px-6 pt-4">
        <div className="flex flex-col justify-between h-full py-1 gap-4">
          {angryTopics.map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-[#1A1B20] flex items-center gap-1.5">
                  <span className="text-[14px]">{item.label !== "---" && getTopicEmoji(item.label)}</span>
                  <span>{item.label}</span>
                </span>
                <span className="font-bold text-[#1A1B20]">{item.value}%</span>
              </div>
              <div className="h-[8px] w-full overflow-hidden rounded-full bg-slate-100">
                {isMounted ? (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundImage: getGradient(item.color) }}
                  />
                ) : (
                  <div className="h-full w-0 rounded-full" style={{ backgroundImage: getGradient(item.color) }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

