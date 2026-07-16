"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, MessageSquareText, Send, Target } from "lucide-react";
import { motion } from "framer-motion";

export interface ConsultationFollowUpData {
  need: string;
  notes: string;
}

interface ConsultationFollowUpFormProps {
  onSubmit: (data: ConsultationFollowUpData) => Promise<void>;
  onBack: () => void;
  submissionError?: string;
}

const NEED_OPTIONS = [
  "Phát hiện khách hàng tiềm năng",
  "Theo dõi sức khỏe thương hiệu",
  "Cảnh báo khủng hoảng truyền thông",
  "Báo cáo AI cho ban lãnh đạo",
  "Tư vấn quy trình tổng thể",
  "Tất cả nhu cầu trên",
];

export function ConsultationFollowUpForm({
  onSubmit,
  onBack,
  submissionError = "",
}: ConsultationFollowUpFormProps) {
  const [formData, setFormData] = useState<ConsultationFollowUpData>({ need: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needError, setNeedError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.need) {
      setNeedError("Vui lòng chọn nhu cầu chính");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-[820px] rounded-[28px] border border-[#ECE9FF] bg-white p-6 shadow-[0_24px_60px_rgba(109,94,246,0.12)] md:p-10"
    >
      <div className="mb-8">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#6D5EF6]">Thông tin bổ sung</p>
        <h3 className="mt-2 flex items-center gap-3 text-[28px] font-extrabold text-[#1B1B4A]">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6D5EF6]/10 text-[#6D5EF6]">
            <MessageSquareText className="h-5 w-5" />
          </span>
          Đăng ký nhận tư vấn
        </h3>
        <p className="mt-3 text-[15px] leading-6 text-[#6B7090]">
          Cho InsightFlow biết mục tiêu ưu tiên để đội ngũ chuẩn bị phương án tư vấn phù hợp hơn.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <label className="grid gap-2 text-[14px] font-extrabold text-[#1B1B4A]">
          Nhu cầu chính *
          <div className="relative">
            <Target className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]" />
            <select
              value={formData.need}
              onChange={(event) => {
                setFormData((current) => ({ ...current, need: event.target.value }));
                setNeedError("");
              }}
              className={`h-14 w-full appearance-none rounded-[16px] border bg-[#FAFAFA] pl-12 pr-4 text-[15px] font-medium text-[#1B1B4A] outline-none transition focus:bg-white focus:ring-4 ${needError ? "border-red-500 focus:ring-red-500/10" : "border-[#E2E8F0] focus:border-[#6D5EF6] focus:ring-[#6D5EF6]/10"}`}
            >
              <option value="">Chọn nhu cầu chính</option>
              {NEED_OPTIONS.map((need) => <option key={need} value={need}>{need}</option>)}
            </select>
          </div>
          {needError && <span className="text-[12px] font-medium text-red-500">{needError}</span>}
        </label>

        <label className="grid gap-2 text-[14px] font-extrabold text-[#1B1B4A]">
          Ghi chú cho chuyên viên tư vấn
          <textarea
            value={formData.notes}
            onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
            rows={6}
            maxLength={2000}
            className="rounded-[16px] border border-[#E2E8F0] bg-[#FAFAFA] px-4 py-3 text-[15px] font-medium leading-6 text-[#1B1B4A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#6D5EF6] focus:bg-white focus:ring-4 focus:ring-[#6D5EF6]/10"
            placeholder="Ví dụ: mục tiêu triển khai, vấn đề đang gặp, thời gian mong muốn được liên hệ..."
          />
          <span className="text-right text-[11px] font-medium text-[#94A3B8]">{formData.notes.length}/2000</span>
        </label>

        {submissionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600">
            {submissionError}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border border-[#E2E8F0] px-5 text-[14px] font-bold text-[#64748B] transition hover:bg-[#F8FAFC]"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#6D5EF6] px-7 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(109,94,246,0.22)] transition hover:-translate-y-0.5 hover:bg-[#5B4DF5] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSubmitting ? "Đang gửi..." : "Gửi thông tin tư vấn"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
