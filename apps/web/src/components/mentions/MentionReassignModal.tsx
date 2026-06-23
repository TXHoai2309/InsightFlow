"use client";

import { useState, useEffect } from "react";
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
    emoji: "😊",
    activeClass: "border-green-500 bg-green-50 ring-2 ring-green-100 ring-offset-0",
    textClass: "text-green-600 font-bold",
    hoverClass: "hover:bg-green-50 hover:border-green-200",
  },
  {
    value: "neutral" as const,
    label: "Trung lập",
    emoji: "😐",
    activeClass: "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100 ring-offset-0",
    textClass: "text-indigo-600 font-bold",
    hoverClass: "hover:bg-indigo-50 hover:border-indigo-200",
  },
  {
    value: "negative" as const,
    label: "Tiêu cực",
    emoji: "☹️",
    activeClass: "border-red-500 bg-red-50 ring-2 ring-red-100 ring-offset-0",
    textClass: "text-red-600 font-bold",
    hoverClass: "hover:bg-red-50 hover:border-red-200",
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

  // Update internal state when a new mention is selected
  useEffect(() => {
    if (mention) {
      setSelectedSentiment(mention.sentiment);
      // Attempt to match the mention's topic with TOPIC_OPTIONS, 
      // or default to empty if "other" or not found.
      const matchedTopic = TOPIC_OPTIONS.find((t) => 
        t.toLowerCase().includes(mention.topic.toLowerCase()) || 
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
  const timeString = dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const dateString = dateObj.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "2-digit" });
  const formattedDate = `${timeString} ${dateString}`;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Container */}
      <main className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 my-4">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Hiệu chỉnh phân tích AI</h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Cải thiện độ chính xác cho mô hình huấn luyện</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
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
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nội dung gốc</h3>
              <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                {mention.platform} • {formattedDate}
              </span>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-100/50 p-4 rounded-xl">
              <p className="text-gray-800 text-base md:text-lg leading-relaxed font-medium">
                {mention.content}
              </p>
            </div>
          </section>

          {/* Sentiment Selection */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Xác định lại sắc thái
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
                        : `border-gray-200 ${option.hoverClass}`
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`text-3xl mb-2 transition-all duration-300 ${isActive ? 'scale-110' : 'grayscale group-hover:grayscale-0 group-hover:scale-110'}`}>
                      {option.emoji}
                    </span>
                    <span className={`text-sm ${isActive ? option.textClass : 'font-medium text-gray-600'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Topic Tagging */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Gán nhãn Chủ đề
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
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300"
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Feedback Notes */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Ghi chú thêm (không bắt buộc)
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              className="w-full h-24 p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm placeholder:text-gray-400 disabled:opacity-50 resize-none"
              placeholder="Nhập phản hồi hoặc lý do bạn gán lại kết quả này..."
            />
          </section>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-semibold">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Dữ liệu sẽ được gửi về máy chủ huấn luyện
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {isLoading ? "Đang xử lý..." : "Cập nhật & Huấn luyện AI"}
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
          background: #D1D5DB;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
