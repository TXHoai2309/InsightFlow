"use client";

import React, { useState } from "react";
import { ArrowRight, ArrowLeft, ShieldAlert, Target, Loader2, Sparkles, CheckCircle2, Activity, PieChart, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfigurationWizardProps {
  onSubmit: (data: any) => void;
  onBack?: () => void;
  initialData?: any;
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

export function ConfigurationWizard({ onSubmit, onBack, initialData }: ConfigurationWizardProps) {
  const [formData, setFormData] = useState({
    channels: initialData?.channels || ([] as string[]),
    keywords: initialData?.keywords || ([] as string[]),
  });

  const [currentKeyword, setCurrentKeyword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onSubmit(formData);
  };

  const toggleChannel = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(val)
        ? prev.channels.filter((c) => c !== val)
        : [...prev.channels, val],
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

  const isFormValid = formData.channels.length > 0;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-8 p-4 md:p-8 bg-[#F6F8FA] rounded-[32px] overflow-hidden font-sans">
      
      {/* Middle Setup Wizard */}
      <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden">
        
        <div className="p-8 lg:p-12 flex-1 overflow-y-auto">
          <div className="mb-10">
            <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">Thiết lập Workspace</h2>
            <p className="text-[#64748B] text-[15px] mt-1.5">Hoàn thiện thông tin để hệ thống bắt đầu hoạt động</p>
            
            <div className="mt-6 p-5 bg-[#EEF2FF] rounded-[16px] border border-[#C7D2FE] shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6D5EF6] to-[#4F46E5] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-[16px] text-[#3730A3] mb-2">InsightFlow AI sẽ tự động thực hiện:</h4>
                  <ul className="flex flex-col gap-2">
                    <li className="text-[14px] text-[#4F46E5] flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> Thu thập & phân tích dữ liệu đa nền tảng 24/7</li>
                    <li className="text-[14px] text-[#4F46E5] flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> Theo dõi sức khỏe thương hiệu & đo lường cảm xúc</li>
                    <li className="text-[14px] text-[#4F46E5] flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> Cảnh báo rủi ro & khủng hoảng truyền thông tức thì</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Section 1: Data Sources */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#0F172A]">Kênh muốn theo dõi</h3>
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
                        ? "border-[#6D5EF6] bg-[#F5F3FF] text-[#6D5EF6]" 
                        : "border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] bg-white hover:bg-[#F8FAFC]"
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#0F172A]">Từ khóa quan trọng</h3>
            </div>
            
            <div className="min-h-[56px] p-2.5 rounded-[16px] border-[1.5px] border-[#E2E8F0] bg-white/50 backdrop-blur-md flex flex-wrap gap-2 items-center focus-within:border-[#6D5EF6] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#EEF2FF] transition-all cursor-text shadow-sm" onClick={() => document.getElementById("keyword-input")?.focus()}>
              <AnimatePresence>
                {formData.keywords.map((kw) => (
                  <motion.div 
                    key={kw} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#0F172A] rounded-[10px] border border-[#CBD5E1] shadow-sm transition-colors"
                  >
                    <span className="text-[14px] font-semibold">{kw}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeKeyword(kw); }} className="text-[#94A3B8] hover:text-[#EF4444] transition-colors focus:outline-none">
                      &times;
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <input
                id="keyword-input"
                type="text"
                placeholder={formData.keywords.length === 0 ? "Nhập từ khóa (vd: VinFast) và ấn Enter..." : "+ Thêm..."}
                className="flex-1 min-w-[140px] bg-transparent outline-none text-[15px] font-medium text-[#0F172A] py-1 px-2 placeholder-[#94A3B8]"
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
              <span className="text-[13px] font-semibold text-[#64748B] mr-2">Gợi ý:</span>
              {SUGGESTED_KEYWORDS.filter(k => !formData.keywords.includes(k)).map((kw) => (
                <button
                  key={kw}
                  onClick={() => addKeyword(kw)}
                  className="text-[13px] font-semibold text-[#475569] bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] px-3 py-1.5 rounded-[8px] transition-all shadow-sm active:scale-95"
                >
                  + {kw}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 lg:px-12 py-6 bg-white/80 border-t border-[#E2E8F0] flex items-center justify-between backdrop-blur-md">
          <button
            onClick={onBack} 
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[15px] font-bold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="w-4.5 h-4.5" /> Quay lại
          </button>
          
          <div className="flex items-center gap-5">
            {!isFormValid && (
              <span className="text-[14px] text-[#EF4444] font-semibold hidden sm:block">
                Chọn ít nhất 1 kênh theo dõi
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="group relative flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#0F172A] px-10 font-bold text-white transition-all hover:bg-[#1E293B] shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
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
        <div className="sticky top-4 bg-white/60 backdrop-blur-2xl border border-white rounded-[24px] p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          
          <div className="flex items-center gap-2 mb-7 pb-5 border-b border-[#E2E8F0]/60">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6D5EF6] to-[#EC4899] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <h4 className="font-extrabold text-[#0F172A] text-[16px]">Xem trước dữ liệu</h4>
          </div>
          
          <div className="flex flex-col gap-7">
            {/* Data Sources Preview */}
            <div>
              <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-3.5">Nguồn theo dõi</p>
              {formData.channels.length === 0 ? (
                <span className="text-[14px] text-[#94A3B8] italic">Chưa chọn...</span>
              ) : (
                <ul className="flex flex-col gap-3">
                  {formData.channels.map(c => {
                    const channel = CHANNELS.find(p => p.id === c);
                    return (
                      <li key={c} className="flex items-center gap-3 text-[14px] font-bold text-[#334155]">
                        <div className="w-5.5 h-5.5 rounded-full bg-[#ECFDF5] flex items-center justify-center border border-[#A7F3D0]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
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
              <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-3.5">Từ khóa mục tiêu</p>
              {formData.keywords.length === 0 && currentKeyword.trim() === "" ? (
                <span className="text-[14px] text-[#94A3B8] italic">Chưa có từ khóa...</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((kw) => (
                    <span key={kw} className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[13px] font-bold text-[#475569] shadow-sm">
                      {kw}
                    </span>
                  ))}
                  {currentKeyword.trim() !== "" && (
                    <span className="px-2.5 py-1 bg-[#F1F5F9] border-2 border-[#CBD5E1] border-dashed rounded-[8px] text-[13px] font-bold text-[#475569] shadow-sm animate-pulse">
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
