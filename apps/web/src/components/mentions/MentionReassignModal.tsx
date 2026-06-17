"use client";

import { useState } from "react";
import type { Mention } from "@/types/dashboard";

interface MentionReassignModalProps {
  mention: Mention | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: {
    sentiment: "positive" | "negative" | "neutral";
    topics: string[];
    notes: string;
  }) => void;
  isLoading?: boolean;
}

const TOPIC_OPTIONS = [
  "Chất lượng",
  "Giá cả",
  "Dịch vụ",
  "Nhân viên",
  "Giao hàng",
  "Trải nghiệm",
  "Pháp lý",
  "Vận hành",
  "Đối thủ",
];

const SENTIMENT_OPTIONS = [
  {
    value: "positive" as const,
    label: "Tích cực",
    icon: "mood",
    color: "text-green-600",
  },
  {
    value: "neutral" as const,
    label: "Trung lập",
    icon: "sentiment_neutral",
    color: "text-outline",
  },
  {
    value: "negative" as const,
    label: "Tiêu cực",
    icon: "mood_bad",
    color: "text-error",
  },
];

export function MentionReassignModal({
  mention,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: MentionReassignModalProps) {
  const [selectedSentiment, setSelectedSentiment] = useState<
    "positive" | "negative" | "neutral"
  >("neutral");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  if (!isOpen || !mention) return null;

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleSubmit = () => {
    onSubmit({
      sentiment: selectedSentiment,
      topics: selectedTopics,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-on-background/20 z-50 flex items-center justify-center p-md overflow-y-auto">
      {/* Glass Modal */}
      <div className="glass-modal w-full max-w-[780px] rounded-2xl shadow-xl border border-outline-variant flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden my-md">
        {/* Modal Header */}
        <header className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-background">
                Hiệu chỉnh phân tích AI
              </h2>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Cải thiện độ chính xác cho mô hình huấn luyện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-xs hover:bg-surface-container transition-colors rounded-full text-outline hover:text-on-surface"
            disabled={isLoading}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-lg custom-scrollbar flex flex-col gap-xl">
          {/* Original Mention Context */}
          <section className="bg-surface-container-low p-lg rounded-lg border border-outline-variant/30">
            <div className="flex items-center justify-between mb-xs">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Nội dung gốc
              </span>
              <div className="flex gap-base">
                <span className="text-xs bg-surface-variant px-2 py-0.5 rounded text-on-surface-variant font-medium">
                  {mention.platform}
                </span>
                <span className="text-xs text-outline italic">
                  {new Date(mention.created_at).toLocaleString("vi-VN", {
                    day: "numeric",
                    month: "numeric",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface line-clamp-3 leading-relaxed">
              {mention.content}
            </p>
          </section>

          {/* Sentiment Selection */}
          <section className="flex flex-col gap-md">
            <label className="font-headline-sm text-label-md text-on-background flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">
                sentiment_satisfied
              </span>
              Xác định lại Sắc thái
            </label>
            <div className="grid grid-cols-3 gap-md">
              {SENTIMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedSentiment(option.value)}
                  disabled={isLoading}
                  className={`flex flex-col items-center justify-center gap-sm p-lg border-2 rounded-xl transition-all group ${
                    selectedSentiment === option.value
                      ? "border-primary bg-primary/5 shadow-[0_0_10px_rgba(70,72,212,0.1)]"
                      : "border-outline-variant hover:border-primary/40 hover:bg-surface-container"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span
                    className={`material-symbols-outlined text-5xl transition-transform ${option.color} ${
                      selectedSentiment === option.value
                        ? "scale-110"
                        : "group-hover:scale-110"
                    }`}
                    style={{
                      fontVariationSettings:
                        selectedSentiment === option.value
                          ? "'FILL' 1"
                          : "'FILL' 0",
                    }}
                  >
                    {option.icon}
                  </span>
                  <span
                    className={`font-body-sm transition-colors ${
                      selectedSentiment === option.value
                        ? "text-primary font-bold"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Topic Selection */}
          <section className="flex flex-col gap-md">
            <label className="font-headline-sm text-label-md text-on-background flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">
                label
              </span>
              Gán nhãn Chủ đề
            </label>
            <div className="flex flex-wrap gap-sm">
              {TOPIC_OPTIONS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicToggle(topic)}
                  disabled={isLoading}
                  className={`px-sm py-1.5 rounded-full font-label-md border transition-all ${
                    selectedTopics.includes(topic)
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary-container"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} flex items-center gap-xs`}
                >
                  <span>{topic}</span>
                  {selectedTopics.includes(topic) && (
                    <span className="material-symbols-outlined text-[16px]">
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Additional Notes */}
          <section className="flex flex-col gap-md">
            <label className="font-headline-sm text-label-md text-on-background flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">
                sticky_note_2
              </span>
              Ghi chú thêm (không bắt buộc)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              className="w-full h-32 bg-surface border border-outline-variant rounded-lg p-md font-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-outline disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Nhập phản hồi hoặc lý do bạn gán lại kết quả này..."
            />
          </section>
        </div>

        {/* Modal Footer */}
        <footer className="p-lg bg-surface-container-low border-t border-outline-variant rounded-b-xl flex items-center justify-between">
          <div className="flex items-center gap-xs text-outline font-label-sm">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Dữ liệu sẽ được gửi về máy chủ huấn luyện</span>
          </div>
          <div className="flex gap-md">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-lg py-md rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-lg py-md bg-primary text-on-primary rounded-lg font-label-md shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                upgrade
              </span>
              {isLoading ? "Đang xử lý..." : "Cập nhật & Huấn luyện AI"}
            </button>
          </div>
        </footer>
      </div>

      <style>{`
        .glass-modal {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
