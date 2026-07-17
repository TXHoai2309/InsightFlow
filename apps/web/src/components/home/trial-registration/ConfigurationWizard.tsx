"use client";

import React, { useState } from "react";
import { ArrowRight, ArrowLeft, ShieldAlert, Target, Loader2, Sparkles, CheckCircle2, Activity, PieChart, Briefcase, AtSign, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ConfigurationData {
  channels: string[];
  keywords: string[];
  companyEmailDomain: string;
}

interface ConfigurationWizardProps {
  onSubmit: (data: ConfigurationData) => Promise<void> | void;
  onBack?: () => void;
  initialData?: ConfigurationData | null;
  submissionError?: string;
}

const CHANNELS = [
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "review", label: "Review" },
  { id: "news", label: "Tin tức" },
  { id: "website", label: "Website" },
];

const SUGGESTED_KEYWORDS = ["VinFast", "Hyundai", "Khuyến mãi", "Bảo hành"];

function normalizeEmailDomain(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, "");
}

function isValidEmailDomain(value: string) {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(normalizeEmailDomain(value));
}

export function ConfigurationWizard({ onSubmit, onBack, initialData, submissionError = "" }: ConfigurationWizardProps) {
  const [formData, setFormData] = useState<ConfigurationData>({
    channels: initialData?.channels ?? CHANNELS.map((channel) => channel.id),
    keywords: initialData?.keywords || [],
    companyEmailDomain: initialData?.companyEmailDomain || "",
  });

  const [currentKeyword, setCurrentKeyword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        companyEmailDomain: normalizeEmailDomain(formData.companyEmailDomain),
      });
    } catch {
      // The parent renders the server-provided submission error.
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChannel = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(val)
        ? prev.channels.filter((c) => c !== val)
        : [...prev.channels, val],
    }));
  };

  const allChannelsSelected = formData.channels.length === CHANNELS.length;
  const toggleAllChannels = () => {
    setFormData((previous) => ({
      ...previous,
      channels: allChannelsSelected ? [] : CHANNELS.map((channel) => channel.id),
    }));
  };

  const addKeyword = (kw: string) => {
    if (kw.trim() !== "" && !formData.keywords.includes(kw.trim())) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, kw.trim()],
      }));
    }
    setCurrentKeyword("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword(currentKeyword);
    } else if (e.key === "Backspace" && currentKeyword === "" && formData.keywords.length > 0) {
      removeKeyword(formData.keywords[formData.keywords.length - 1]);
    }
  };

  const removeKeyword = (kw: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== kw),
    }));
  };

  const emailDomainValid = isValidEmailDomain(formData.companyEmailDomain);
  const isFormValid = formData.channels.length > 0 && emailDomainValid;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-8 p-4 md:p-8 bg-[#F6F8FA] dark:bg-[#09090E] rounded-[32px] overflow-hidden font-sans min-h-[600px]">
      
      {/* Middle Setup Wizard */}
      <div className="flex-1 bg-white/70 dark:bg-[#151521] backdrop-blur-xl border border-white dark:border-white/5 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex flex-col relative overflow-hidden">
        
        <div className="p-8 lg:p-12 flex-1 overflow-y-auto">
          <div className="mb-10">
            <h2 className="text-[28px] font-extrabold text-[#0F172A] dark:text-white tracking-tight">Thiết lập Workspace</h2>
            <p className="text-[#64748B] dark:text-gray-400 text-[15px] mt-1.5">Hoàn thiện thông tin để hệ thống bắt đầu hoạt động</p>
            
            <div className="mt-6 p-5 bg-[#EEF2FF] dark:bg-[#1E1E36] rounded-[16px] border border-[#C7D2FE] dark:border-[#38385A] shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6D5EF6] to-[#4F46E5] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-[16px] text-[#3730A3] dark:text-[#A599FF] mb-2">InsightFlow AI sẽ tự động thực hiện:</h4>
                  <ul className="flex flex-col gap-2">
                    <li className="text-[14px] text-[#4F46E5] dark:text-[#C7C2FF] flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 text-[#6D5EF6] dark:text-[#8E83FA]" /> Thu thập & phân tích dữ liệu đa nền tảng 24/7</li>
                    <li className="text-[14px] text-[#4F46E5] dark:text-[#C7C2FF] flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 text-[#6D5EF6] dark:text-[#8E83FA]" /> Theo dõi sức khỏe thương hiệu & đo lường cảm xúc</li>
                    <li className="text-[14px] text-[#4F46E5] dark:text-[#C7C2FF] flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 text-[#6D5EF6] dark:text-[#8E83FA]" /> Cảnh báo rủi ro & khủng hoảng truyền thông tức thì</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Company email domain */}
          <div className="mb-10">
            <div className="mb-4">
              <h3 className="text-[15px] font-bold text-[#0F172A] dark:text-gray-100">Đuôi email doanh nghiệp <span className="text-[#EF4444]">*</span></h3>
              <p className="mt-1 text-[13px] text-[#64748B] dark:text-gray-400">Phần nằm sau dấu @ trong email công việc, dùng để xác định tài khoản thuộc doanh nghiệp.</p>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3 text-[12px] leading-5 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Ví dụ email là <strong>lan@highlandcoffee.com</strong> thì chỉ nhập <strong>highlandcoffee.com</strong>. Không nhập dấu @ và không dùng Gmail/Yahoo cá nhân.</span>
              </div>
            </div>
            <div className={`relative rounded-[16px] border-[1.5px] bg-white shadow-sm transition-all focus-within:ring-2 ${formData.companyEmailDomain && !emailDomainValid ? "border-[#EF4444] focus-within:ring-red-100" : "border-[#E2E8F0] focus-within:border-[#6D5EF6] focus-within:ring-[#EEF2FF]"}`}>
              <AtSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={formData.companyEmailDomain}
                onChange={(event) => setFormData((previous) => ({ ...previous, companyEmailDomain: event.target.value }))}
                onBlur={() => setFormData((previous) => ({ ...previous, companyEmailDomain: normalizeEmailDomain(previous.companyEmailDomain) }))}
                placeholder="company.com"
                className="h-[56px] w-full rounded-[16px] bg-transparent pl-12 pr-4 text-[15px] font-semibold text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
              />
            </div>
            {formData.companyEmailDomain && !emailDomainValid && (
              <p className="mt-2 text-[12px] font-semibold text-[#EF4444]">Vui lòng nhập đúng định dạng, ví dụ: insightflow.vn</p>
            )}
          </div>

          {/* Section 1: Data Sources */}
          <div className="mb-12">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-[15px] font-bold text-[#0F172A] dark:text-gray-100">Kênh muốn theo dõi</h3>
                <p className="mt-1 text-[12px] text-[#64748B] dark:text-gray-400">Mặc định đã chọn tất cả. Bỏ chọn toàn bộ nếu bạn muốn tự chọn từng kênh.</p>
              </div>
              <button
                type="button"
                onClick={toggleAllChannels}
                className="shrink-0 rounded-[10px] border border-[#C7D2FE] bg-[#EEF2FF] px-3 py-2 text-[12px] font-bold text-[#4F46E5] transition hover:bg-[#E0E7FF] dark:border-[#8E83FA]/30 dark:bg-[#6D5EF6]/15 dark:text-[#A599FF] dark:hover:bg-[#6D5EF6]/25"
              >
                {allChannelsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CHANNELS.map((item) => {
                const isSelected = formData.channels.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleChannel(item.id)}
                    className={`h-[48px] flex items-center justify-center rounded-[12px] border-[1.5px] font-bold text-[14px] cursor-pointer transition-all duration-200 shadow-sm ${
                      isSelected 
                        ? "border-[#6D5EF6] dark:border-[#8E83FA] bg-[#F5F3FF] dark:bg-[#6D5EF6]/15 text-[#6D5EF6] dark:text-[#8E83FA]" 
                        : "border-[#E2E8F0] dark:border-white/5 text-[#64748B] dark:text-gray-400 hover:border-[#CBD5E1] dark:hover:border-white/20 bg-white dark:bg-[#1B1C2A] hover:bg-[#F8FAFC] dark:hover:bg-[#252636]"
                    }`}
                  >
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Keywords */}
          <div>
            <div className="mb-4">
              <h3 className="text-[15px] font-bold text-[#0F172A] dark:text-gray-100">Từ khóa quan trọng</h3>
              <p className="mt-1 text-[12px] leading-5 text-[#64748B] dark:text-gray-400">Nhập những cụm từ khách hàng thường dùng khi nhắc đến bạn: tên thương hiệu, sản phẩm, chiến dịch, người đại diện hoặc tên viết sai phổ biến. Nhấn <strong>Enter</strong> sau mỗi từ khóa.</p>
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] leading-5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Ví dụ: <strong>Highlands Coffee</strong>, <strong>Freeze trà xanh</strong>, <strong>#HighlandsCoffee</strong>. Bạn có thể bấm các gợi ý bên dưới để thêm nhanh.</span>
              </div>
            </div>
            
            <div className="min-h-[56px] p-2.5 rounded-[16px] border-[1.5px] border-[#E2E8F0] dark:border-white/5 bg-white/50 dark:bg-[#1B1C2A] backdrop-blur-md flex flex-wrap gap-2 items-center focus-within:border-[#6D5EF6] dark:focus-within:border-[#8E83FA] focus-within:bg-white dark:focus-within:bg-[#1F202E] focus-within:ring-2 focus-within:ring-[#EEF2FF] dark:focus-within:ring-[#8E83FA]/10 transition-all cursor-text shadow-sm" onClick={() => document.getElementById("keyword-input")?.focus()}>
              <AnimatePresence>
                {formData.keywords.map((kw) => (
                  <motion.div 
                    key={kw} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#262738] hover:bg-[#F8FAFC] dark:hover:bg-[#2E2F42] text-[#0F172A] dark:text-gray-200 rounded-[10px] border border-[#CBD5E1] dark:border-white/5 shadow-sm transition-colors"
                  >
                    <span className="text-[14px] font-semibold">{kw}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeKeyword(kw); }} className="text-[#94A3B8] dark:text-gray-400 hover:text-[#EF4444] dark:hover:text-[#F87171] transition-colors focus:outline-none">
                      &times;
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <input
                id="keyword-input"
                type="text"
                placeholder={formData.keywords.length === 0 ? "Nhập từ khóa (vd: VinFast) và ấn Enter..." : "+ Thêm..."}
                className="flex-1 min-w-[140px] bg-transparent outline-none text-[15px] font-medium text-[#0F172A] dark:text-white py-1 px-2 placeholder-[#94A3B8] dark:placeholder-gray-500"
                value={currentKeyword}
                onChange={(e) => setCurrentKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (currentKeyword.trim() !== "") {
                    addKeyword(currentKeyword);
                  }
                }}
              />
            </div>
            
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-[#64748B] dark:text-gray-500 mr-2">Gợi ý:</span>
              {SUGGESTED_KEYWORDS.filter(k => !formData.keywords.includes(k)).map((kw) => (
                <button
                  key={kw}
                  onClick={() => addKeyword(kw)}
                  className="text-[13px] font-semibold text-[#475569] dark:text-gray-400 bg-white dark:bg-[#1B1C2A] border border-[#E2E8F0] dark:border-white/5 hover:border-[#CBD5E1] dark:hover:border-white/20 hover:bg-[#F8FAFC] dark:hover:bg-[#252636] px-3 py-1.5 rounded-[8px] transition-all shadow-sm active:scale-95"
                >
                  + {kw}
                </button>
              ))}
            </div>
          </div>

          {submissionError && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 lg:px-12 py-6 bg-white/80 dark:bg-[#151521] border-t border-[#E2E8F0] dark:border-white/5 flex items-center justify-between backdrop-blur-md">
          <button
            onClick={onBack} 
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[15px] font-bold text-[#64748B] dark:text-gray-400 hover:bg-[#F1F5F9] dark:hover:bg-[#1F202E] hover:text-[#0F172A] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4.5 h-4.5" /> Quay lại
          </button>
          
          <div className="flex items-center gap-5">
            {!isFormValid && (
              <span className="text-[14px] text-[#EF4444] dark:text-[#F87171] font-semibold hidden sm:block">
                {!emailDomainValid ? "Nhập đúng đuôi email doanh nghiệp" : "Chọn ít nhất 1 kênh theo dõi"}
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="group relative flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#0F172A] dark:bg-[#6D5EF6] px-10 font-bold text-white transition-all hover:bg-[#1E293B] dark:hover:bg-[#5B4DF5] shadow-[0_4px_14px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_24px_rgba(109,94,246,0.25)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
            >
              <span className="text-[15px] flex items-center gap-2">
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý</>
                ) : (
                  <>Hoàn tất <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" /></>
                )}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Right Preview Floating */}
      <div className="hidden xl:flex w-[320px] shrink-0 flex-col pt-4">
        <div className="sticky top-4 bg-white/60 dark:bg-[#151521] backdrop-blur-2xl border border-white dark:border-white/5 rounded-[24px] p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          
          <div className="flex items-center gap-2 mb-7 pb-5 border-b border-[#E2E8F0]/60 dark:border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6D5EF6] to-[#EC4899] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <h4 className="font-extrabold text-[#0F172A] dark:text-white text-[16px]">Xem trước dữ liệu</h4>
          </div>
          
          <div className="flex flex-col gap-7">
            <div>
              <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-3.5">Đuôi email doanh nghiệp</p>
              <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-[14px] font-bold text-[#334155]">
                <AtSign className="h-4 w-4 text-[#6D5EF6]" />
                {normalizeEmailDomain(formData.companyEmailDomain) || "Chưa nhập..."}
              </div>
            </div>

            {/* Data Sources Preview */}
            <div>
              <p className="text-[12px] font-bold text-[#64748B] dark:text-gray-500 uppercase tracking-wider mb-3.5">Nguồn theo dõi</p>
              {formData.channels.length === 0 ? (
                <span className="text-[14px] text-[#94A3B8] dark:text-gray-600 italic">Chưa chọn...</span>
              ) : (
                <ul className="flex flex-col gap-3">
                  {formData.channels.map(c => {
                    const channel = CHANNELS.find(p => p.id === c);
                    return (
                      <li key={c} className="flex items-center gap-3 text-[14px] font-bold text-[#334155] dark:text-gray-300">
                        <div className="w-5.5 h-5.5 rounded-full bg-[#ECFDF5] dark:bg-[#10B981]/15 flex items-center justify-center border border-[#A7F3D0] dark:border-[#10B981]/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] dark:text-[#34D399]" />
                        </div>
                        {channel?.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Keywords Preview */}
            <div>
              <p className="text-[12px] font-bold text-[#64748B] dark:text-gray-500 uppercase tracking-wider mb-3.5">Từ khóa mục tiêu</p>
              {formData.keywords.length === 0 && currentKeyword.trim() === "" ? (
                <span className="text-[14px] text-[#94A3B8] dark:text-gray-600 italic">Chưa có từ khóa...</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((kw) => (
                    <span key={kw} className="px-2.5 py-1 bg-[#F8FAFC] dark:bg-[#1B1C2A] border border-[#E2E8F0] dark:border-white/5 rounded-[8px] text-[13px] font-bold text-[#475569] dark:text-gray-300 shadow-sm">
                      {kw}
                    </span>
                  ))}
                  {currentKeyword.trim() !== "" && (
                    <span className="px-2.5 py-1 bg-[#F1F5F9] dark:bg-[#252636] border-2 border-[#CBD5E1] dark:border-white/20 border-dashed rounded-[8px] text-[13px] font-bold text-[#475569] dark:text-gray-300 shadow-sm animate-pulse">
                      {currentKeyword}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

    </div>
  );
}
