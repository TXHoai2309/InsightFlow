// apps/web/src/components/ui/QuickReplyHelper.tsx
"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { Sparkles, Copy, Check, Loader2, ChevronDown, MessageCircle } from "lucide-react";

interface QuickReplyHelperProps {
  mentionContent: string;
  customerName?: string;
  sentiment: "positive" | "negative" | "neutral";
  category: "crisis" | "lead" | "faq" | "general";
  onSelectReply?: (text: string) => void;
}

export function QuickReplyHelper({
  mentionContent,
  customerName = "",
  sentiment,
  category,
  onSelectReply,
}: QuickReplyHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<"positive" | "negative" | "neutral">(sentiment);
  const [selectedTopic, setSelectedTopic] = useState<string>("other");
  const [tone, setTone] = useState<"polite_and_apologetic" | "friendly" | "professional" | "humorous">("polite_and_apologetic");
  const [generatedReply, setGeneratedReply] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Sync selectedSentiment when prop changes
  useEffect(() => {
    if (sentiment) {
      setSelectedSentiment(sentiment);
    }
  }, [sentiment]);

  // Set default topic based on category to help employee
  useEffect(() => {
    if (category === "crisis") {
      setSelectedTopic("service"); // Default topic for crisis is usually service
    } else if (category === "lead") {
      setSelectedTopic("quality"); // Default topic for leads is usually product inquiry
    } else {
      setSelectedTopic("other");
    }
  }, [category]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setGeneratedReply("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Chưa xác thực người dùng.");

      const payload = {
        mentionContent,
        customerName,
        tone,
        sentiment: selectedSentiment,
        topic: selectedTopic,
      };

      const res = await fetch("/api/templates/generate-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tối ưu hóa câu trả lời thất bại.");

      setGeneratedReply(data.replyText || "");
    } catch (err: any) {
      setError(err.message || "Không thể tạo phản hồi bằng AI.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedReply) return;
    try {
      await navigator.clipboard.writeText(generatedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] overflow-hidden transition-all">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-raised)] transition-all"
      >
        <div className="flex items-center gap-2 text-[14px] font-bold text-[var(--color-text-primary)]">
          <Sparkles className="h-4 w-4 text-[#6C63FF] fill-[#6C63FF]/20" />
          <span>Trợ lý phản hồi nhanh (AI)</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-[var(--color-text-secondary)] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Expandable panel */}
      {isOpen && (
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Sentiment Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider block">
                Sắc thái phản hồi
              </label>
              <select
                value={selectedSentiment}
                onChange={(e) => setSelectedSentiment(e.target.value as any)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-2.5 text-[13px] outline-none focus:border-[#6C63FF] text-[var(--color-text-primary)]"
              >
                <option value="positive">🟢 Tích cực</option>
                <option value="neutral">🟡 Trung lập</option>
                <option value="negative">🔴 Tiêu cực</option>
              </select>
            </div>

            {/* Topic Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider block">
                Chủ đề phản hồi
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-2.5 text-[13px] outline-none focus:border-[#6C63FF] text-[var(--color-text-primary)]"
              >
                <option value="other">💬 Hỗ trợ chung</option>
                <option value="quality">🍜 Chất lượng sản phẩm</option>
                <option value="service">🛵 Dịch vụ & Phục vụ</option>
                <option value="price">💰 Giá cả & Chi phí</option>
                <option value="location">📍 Cửa hàng / Chi nhánh</option>
                <option value="promotion">🎁 Khuyến mãi / Sự kiện</option>
                <option value="recruitment">💼 Tuyển dụng / Việc làm</option>
              </select>
            </div>

            {/* Tone Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider block">
                Giọng điệu phản hồi
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-2.5 text-[13px] outline-none focus:border-[#6C63FF] text-[var(--color-text-primary)]"
              >
                <option value="polite_and_apologetic">🙏 Lịch sự & Xin lỗi</option>
                <option value="professional">👔 Chuyên nghiệp</option>
                <option value="friendly">🤝 Thân thiện</option>
                <option value="humorous">😄 Hóm hỉnh / Vui vẻ</option>
              </select>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#6C63FF] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#5A52D5] disabled:opacity-60 transition-all shadow-sm"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 fill-white/10" />
              )}
              {generatedReply ? "Tạo lại phản hồi bằng AI" : "Tối ưu hóa phản hồi (AI) ✨"}
            </button>
          </div>

          {/* Error notice */}
          {error && (
            <p className="text-[12px] text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-1.5">
              <span>⚠️ {error}</span>
            </p>
          )}

          {/* AI Result Box */}
          {generatedReply && (
            <div className="space-y-2 border-t border-[var(--color-border)] pt-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Kết quả tối ưu hóa thành công
                </span>
                <div className="flex items-center gap-3">
                  {onSelectReply && (
                    <button
                      type="button"
                      onClick={() => onSelectReply(generatedReply)}
                      className="flex items-center gap-1 text-[12px] text-[#6C63FF] hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Áp dụng phản hồi</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[12px] text-[#6C63FF] hover:underline"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Sao chép kết quả</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <textarea
                rows={4}
                readOnly
                value={generatedReply}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 text-[13px] text-[var(--color-text-primary)] leading-relaxed focus:outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
