"use client";

import React, { useState } from "react";
import { ArrowRight, ArrowLeft, Building2, CheckCircle2, ShieldCheck, Lock, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface BusinessAuthStepProps {
  onSubmit: (data: any) => void;
  onBack?: () => void;
  initialData?: any;
}

export function BusinessAuthStep({ onSubmit, onBack, initialData }: BusinessAuthStepProps) {
  const [formData, setFormData] = useState({
    taxId: initialData?.taxId || "",
    emailOtp: "",
    phoneOtp: "",
  });

  const [companyInfo, setCompanyInfo] = useState<{ name: string; status: string } | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchCompanyInfo = async () => {
      const taxId = formData.taxId.trim();
      
      // Standard Vietnamese Tax IDs are 10, 13, 14 digits/chars, but CCCDs (12 digits) are also used by some household businesses
      if (taxId.length >= 10 && taxId.length <= 14) {
        // Handle case where user forgets hyphen (13 digits), auto-insert hyphen for API
        const formattedTaxId = taxId.length === 13 && !taxId.includes('-') 
          ? `${taxId.substring(0, 10)}-${taxId.substring(10)}` 
          : taxId;

        setIsFetchingInfo(true);
        setFetchError(null);
        try {
          const res = await fetch(`https://api.vietqr.io/v2/business/${formattedTaxId}`);
          
          if (!res.ok) {
            throw new Error("Rate limited or server error");
          }
          
          const data = await res.json();
          if (data.code === '00' && data.data) {
            setCompanyInfo({
              name: data.data.name,
              status: data.data.status || "Đang hoạt động",
            });
          } else {
            setCompanyInfo(null);
            setFetchError("Không tìm thấy thông tin doanh nghiệp");
          }
        } catch (error) {
          setCompanyInfo(null);
          setFetchError("Không thể tra cứu thông tin lúc này, vui lòng thử lại sau.");
        } finally {
          setIsFetchingInfo(false);
        }
      } else {
        setCompanyInfo(null);
        setFetchError(null);
      }
    };

    const timeoutId = setTimeout(fetchCompanyInfo, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.taxId]);

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, taxId: val });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row w-full bg-gradient-to-br from-[#F5F3FF] to-white dark:from-[#13141f] dark:to-[#0B0B13] rounded-[24px] shadow-[0_20px_40px_rgba(109,94,246,0.06)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden min-h-[600px] border border-transparent dark:border-white/5">
      
      {/* Left Column (55%) - Explanation */}
      <div className="lg:w-[55%] p-8 lg:p-12 xl:p-14 flex flex-col justify-center relative bg-gradient-to-br from-[#1B1B4A] to-[#2D2B65] dark:from-[#0C0C16] dark:to-[#171638] text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6D5EF6] blur-[100px] opacity-30 rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-lg">
            <ShieldCheck className="h-7 w-7 text-[#34D399]" />
          </div>
          
          <h2 className="font-display text-[32px] sm:text-[36px] xl:text-[44px] font-extrabold leading-[1.15] tracking-tight mb-5">
            Xác thực để bảo vệ <span className="text-[#A599FF]">thương hiệu.</span>
          </h2>
          
          <p className="text-white/80 text-[15px] sm:text-[16px] leading-[1.6] max-w-[480px] mb-8">
            Để đảm bảo tính an toàn và bảo mật cho dữ liệu thương hiệu, InsightFlow yêu cầu xác thực doanh nghiệp trước khi kích hoạt.
          </p>

          <div className="space-y-4 mb-10">
            <p className="text-[14px] font-bold text-white uppercase tracking-wider opacity-90">Việc xác thực giúp:</p>
            <ul className="flex flex-col gap-3.5">
              {[
                "Ngăn chặn việc theo dõi hoặc sử dụng trái phép dữ liệu thương hiệu.",
                "Đảm bảo chỉ những người đại diện hợp lệ mới có quyền truy cập.",
                "Tăng độ tin cậy của dữ liệu phân tích và cảnh báo AI.",
                "Tạo môi trường an toàn cho toàn bộ hệ sinh thái người dùng."
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#34D399] mt-0.5" />
                  <span className="text-[14px] text-white/80 leading-relaxed font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3 rounded-[16px] bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-white/90" />
            </div>
            <p className="text-[13px] text-white/70 leading-snug font-medium">
              Thông tin xác thực được mã hóa và bảo mật tuyệt đối.<br />
              Quá trình xét duyệt hoàn tất trong khoảng 1–2 giờ làm việc.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Column (45%) - Form */}
      <div className="lg:w-[45%] p-6 lg:p-10 flex items-center justify-center relative bg-gradient-to-bl from-white via-white to-[#F5F3FF]/30 dark:from-[#1A1B28] dark:via-[#1A1B28] dark:to-[#13141f]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[480px] bg-white dark:bg-[#161722] border border-[#F1F0F5] dark:border-white/10 rounded-[24px] p-6 sm:p-8 shadow-[0_30px_60px_rgba(109,94,246,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-1 duration-300"
        >
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-6 text-[10px] font-bold uppercase tracking-wider text-[#6B7090] dark:text-gray-400">
            <span>Cơ bản</span>
            <ArrowRight className="h-2.5 w-2.5" />
            <span className="text-[#6D5EF6] dark:text-[#8E83FA]">Xác thực</span>
            <ArrowRight className="h-2.5 w-2.5" />
            <span>Cấu hình</span>
          </div>

          <div className="mb-6 lg:mb-8">
            <h3 className="font-display text-[22px] font-bold text-[#1B1B4A] dark:text-white mb-2 flex items-center gap-2">
              Xác thực doanh nghiệp
            </h3>
            <p className="text-[#6B7090] dark:text-gray-400 text-[14px] leading-relaxed">
              Nhập mã số thuế và mã xác nhận để tiếp tục cấu hình.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Tax ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[#1B1B4A] dark:text-gray-200">Mã số thuế doanh nghiệp <span className="text-red-500">*</span></label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] dark:text-gray-500 group-focus-within:text-[#6D5EF6] dark:group-focus-within:text-[#8E83FA] transition-colors">
                  <Building2 className="h-[18px] w-[18px]" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nhập mã số thuế..."
                  className="w-full h-[52px] rounded-[14px] border border-gray-200 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#1B1C2A] text-black dark:text-white pl-[42px] pr-4 text-[14px] outline-none transition-all focus:border-[#6D5EF6] dark:focus:border-[#8E83FA] focus:bg-white dark:focus:bg-[#1F202E] focus:ring-[3px] focus:ring-[#6D5EF6]/15 hover:border-gray-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#1F202E] shadow-sm"
                  value={formData.taxId}
                  onChange={handleTaxIdChange}
                />
              </div>
              
              {isFetchingInfo && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-2 p-3 bg-gray-50 dark:bg-[#1B1C2A] rounded-xl border border-gray-100 dark:border-white/10"
                >
                  <Loader2 className="w-4 h-4 text-gray-500 dark:text-gray-400 animate-spin" />
                  <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">Đang tra cứu thông tin doanh nghiệp...</span>
                </motion.div>
              )}
              
              {!isFetchingInfo && companyInfo && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-1.5 mt-2 p-3 bg-[#EEF2FF] dark:bg-indigo-900/20 rounded-xl border border-[#C7D2FE] dark:border-indigo-500/20"
                >
                  <p className="text-[13px] font-bold text-[#3730A3] dark:text-indigo-300">{companyInfo.name}</p>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] dark:text-[#10B981]" />
                    <span className="text-[12px] font-medium text-[#10B981] dark:text-[#10B981]">{companyInfo.status}</span>
                  </div>
                </motion.div>
              )}

              {!isFetchingInfo && fetchError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                  <span className="text-[12px] font-medium text-red-500 dark:text-red-400">{fetchError}</span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center justify-center w-[56px] h-[56px] rounded-[14px] bg-[#F1F0F5] dark:bg-[#1B1C2A] hover:bg-[#E5E5EB] dark:hover:bg-[#252636] text-[#6B7090] dark:text-gray-400 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <button
                type="submit"
                className="group relative flex flex-1 h-[56px] items-center justify-center gap-2 overflow-hidden rounded-[14px] bg-[#6D5EF6] px-8 font-bold text-white transition-all hover:-translate-y-0.5 shadow-[0_12px_24px_rgba(109,94,246,0.25)] hover:shadow-[0_20px_40px_rgba(109,94,246,0.35)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#5B4DF5] to-[#4F46E5] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 text-[16px] flex items-center gap-2">
                  Tiếp tục cấu hình <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
