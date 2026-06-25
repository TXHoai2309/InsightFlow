"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  "quality",
  "price",
  "service",
  "staff",
  "delivery",
  "experience",
  "legal",
  "operation",
  "competitor",
];

const SENTIMENT_OPTIONS = [
  {
    value: "positive" as const,
    labelKey: "dashboard.filters.positive",
    emoji: "😊",
    activeClass: "border-[var(--color-success)] bg-[var(--color-success-subtle)] ring-2 ring-[var(--color-success)]/20 ring-offset-0",
    textClass: "text-[var(--color-success)] font-bold",
    hoverClass: "hover:bg-[var(--color-success-subtle)]/50 hover:border-[var(--color-success)]/40",
  },
  {
    value: "neutral" as const,
    labelKey: "dashboard.filters.neutral",
    emoji: "😐",
    activeClass: "border-[var(--color-info)] bg-[var(--color-info-subtle)] ring-2 ring-[var(--color-info)]/20 ring-offset-0",
    textClass: "text-[var(--color-info)] font-bold",
    hoverClass: "hover:bg-[var(--color-info-subtle)]/50 hover:border-[var(--color-info)]/40",
  },
  {
    value: "negative" as const,
    labelKey: "dashboard.filters.negative",
    emoji: "☹️",
    activeClass: "border-[var(--color-error)] bg-[var(--color-error-subtle)] ring-2 ring-[var(--color-error)]/20 ring-offset-0",
    textClass: "text-[var(--color-error)] font-bold",
    hoverClass: "hover:bg-[var(--color-error-subtle)]/50 hover:border-[var(--color-error)]/40",
  },
];

export function MentionReassignModal({
  mention,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: MentionReassignModalProps) {
  const { t, i18n } = useTranslation();
  const [selectedSentiment, setSelectedSentiment] = useState<
    "positive" | "negative" | "neutral"
  >("neutral");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Update internal state when a new mention is selected
  useEffect(() => {
    if (mention) {
      setSelectedSentiment(mention.sentiment);
      // Attempt to match the mention's topic with TOPIC_OPTIONS, 
      // or default to empty if "other" or not found.
      const matchedTopic = TOPIC_OPTIONS.find((t) => 
        t.toLowerCase() === mention.topic.toLowerCase() || 
        mention.topic.toLowerCase().includes(t.toLowerCase())
      );
      setSelectedTopics(matchedTopic ? [matchedTopic] : []);
      setNotes("");
    }
  }, [mention]);

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

  // Format date
  const dateObj = new Date(mention.created_at);
  const timeString = dateObj.toLocaleTimeString(i18n.language === "vi" ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit" });
  const dateString = dateObj.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", { day: "numeric", month: "numeric", year: "2-digit" });
  const formattedDate = `${timeString} ${dateString}`;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Container */}
      <main className="bg-[var(--color-bg-surface)] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[var(--color-border)] animate-in fade-in zoom-in-95 duration-200 my-4">
        {/* Header */}
        <header className="px-6 py-4 border-b border-[var(--color-border)] flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-[var(--color-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)] font-sans tracking-tight">
                {t("mentions.reassign.title", { defaultValue: "Hiệu chỉnh phân tích AI" })}
              </h1>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {t("mentions.reassign.subtitle", { defaultValue: "Cải thiện độ chính xác cho mô hình huấn luyện" })}
            </p>
          </div>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Original Content */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                {t("mentions.reassign.originalContent", { defaultValue: "Nội dung gốc" })}
              </h3>
              <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 font-medium">
                {t(`dashboard.filters.${mention.platform.toLowerCase()}`, { defaultValue: mention.platform })} • {formattedDate}
              </span>
            </div>
            <div className="bg-[var(--color-brand-subtle)]/40 border border-[var(--color-brand-border)]/30 p-4 rounded-xl">
              <p className="text-[var(--color-text-primary)] text-base md:text-lg leading-relaxed font-medium">
                {mention.content}
              </p>
            </div>
          </section>

          {/* Sentiment Selection */}
          <section>
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("mentions.reassign.sentimentSelect", { defaultValue: "Xác định lại sắc thái" })}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {SENTIMENT_OPTIONS.map((option) => {
                const isActive = selectedSentiment === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedSentiment(option.value)}
                    disabled={isLoading}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all group ${
                      isActive 
                        ? option.activeClass
                        : `border-[var(--color-border)] bg-[var(--color-bg-surface)] ${option.hoverClass}`
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`text-3xl mb-2 transition-all duration-300 ${isActive ? 'scale-110' : 'grayscale group-hover:grayscale-0 group-hover:scale-110'}`}>
                      {option.emoji}
                    </span>
                    <span className={`text-sm ${isActive ? option.textClass : 'font-medium text-[var(--color-text-secondary)]'}`}>
                      {t(option.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Topic Tagging */}
          <section>
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {t("mentions.reassign.topicTagging", { defaultValue: "Gán nhãn Chủ đề" })}
            </h3>
            <div className="flex flex-wrap gap-2">
              {TOPIC_OPTIONS.map((topic) => {
                const isActive = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    onClick={() => handleTopicToggle(topic)}
                    disabled={isLoading}
                    className={`px-4 py-1.5 border rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white shadow-sm"
                        : "bg-[var(--color-bg-surface-raised)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)] hover:border-[var(--color-border-strong)]"
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {t(`dashboard.topics.${topic}`, { defaultValue: topic })}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Feedback Notes */}
          <section>
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t("mentions.reassign.notesLabel", { defaultValue: "Ghi chú thêm (không bắt buộc)" })}
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              className="w-full h-24 p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] focus:bg-[var(--color-bg-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all outline-none text-sm placeholder:text-[var(--color-text-muted)] disabled:opacity-50 resize-none"
              placeholder={t("mentions.reassign.notesPlaceholder", { defaultValue: "Nhập phản hồi hoặc lý do bạn gán lại kết quả này..." })}
            />
          </section>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-surface-raised)]">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("mentions.reassign.trainingNote", { defaultValue: "Dữ liệu sẽ được gửi về máy chủ huấn luyện" })}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
            >
              {t("mentions.reassign.cancelBtn", { defaultValue: "Hủy" })}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-5 py-2 bg-[var(--color-brand)] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[var(--color-brand-hover)] shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {isLoading 
                ? t("mentions.reassign.processing", { defaultValue: "Đang xử lý..." }) 
                : t("mentions.reassign.updateBtn", { defaultValue: "Cập nhật & Huấn luyện AI" })}
            </button>
          </div>
        </footer>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-border-strong);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
