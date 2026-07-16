"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Mail, 
  Phone, 
  User, 
  RadioTower, 
  BellRing, 
  Target, 
  Star,
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";
import { motion } from "framer-motion";

export interface BasicInfoData {
  fullName: string;
  email: string;
  phone: string;
  brandName: string;
  industry: string;
}

interface BasicInfoFormProps {
  onSubmit: (data: BasicInfoData) => void;
  initialData?: BasicInfoData | null;
}

const INDUSTRY_OPTIONS = [
  "Bán lẻ & Thương mại điện tử",
  "F&B - Nhà hàng & Đồ uống",
  "Tài chính - Ngân hàng - Bảo hiểm",
  "Bất động sản",
  "Ô tô & Xe máy",
  "Công nghệ & Phần mềm",
  "Viễn thông",
  "Y tế & Dược phẩm",
  "Giáo dục & Đào tạo",
  "Du lịch & Khách sạn",
  "Thời trang & Làm đẹp",
  "Hàng tiêu dùng nhanh (FMCG)",
  "Truyền thông & Giải trí",
  "Logistics & Vận tải",
  "Sản xuất & Công nghiệp",
  "Dịch vụ chuyên nghiệp",
  "Tổ chức công & Phi lợi nhuận",
  "Khác",
];

export function BasicInfoForm({ onSubmit, initialData }: BasicInfoFormProps) {
  const [formData, setFormData] = useState<BasicInfoData>({
    fullName: initialData?.fullName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    brandName: initialData?.brandName || "",
    industry: initialData?.industry || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên";
    if (!formData.brandName.trim()) newErrors.brandName = "Vui lòng nhập tên công ty / thương hiệu";
    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email công việc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!formData.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    if (!formData.industry) newErrors.industry = "Vui lòng chọn ngành hàng";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row w-full bg-gradient-to-br from-[#F5F3FF] to-white rounded-[24px] shadow-[0_20px_40px_rgba(109,94,246,0.06)] overflow-hidden min-h-[600px]">
      
      {/* Left Column (55%) */}
      <div className="lg:w-[55%] p-8 lg:p-12 xl:p-14 flex flex-col justify-center relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/60 border border-[#ECE9FF] px-4 py-2 text-[13px] font-bold text-[#6D5EF6] shadow-sm mb-6 backdrop-blur-md">
            ✨ Trải nghiệm nền tảng quản trị thương hiệu bằng AI
          </div>
          
          <h2 className="font-display text-[32px] sm:text-[36px] xl:text-[44px] font-extrabold text-[#1B1B4A] leading-[1.15] tracking-tight mb-4 lg:mb-5">
            Biến dữ liệu thành quyết định <span className="text-[#6D5EF6]">nhanh hơn.</span>
          </h2>
          
          <p className="text-[#4F5577] text-[15px] sm:text-[16px] leading-[1.6] max-w-[480px] mb-6 lg:mb-8">
            InsightFlow giúp doanh nghiệp theo dõi thương hiệu, phát hiện rủi ro và quản lý khách hàng tiềm năng trên một nền tảng duy nhất.
          </p>

          {/* Benefit Cards */}
          <div className="flex flex-col gap-3 mb-8 lg:mb-10">
            {[
              { icon: RadioTower, text: "Theo dõi thương hiệu đa kênh." },
              { icon: BellRing, text: "Phát hiện cảnh báo bằng AI." },
              { icon: Target, text: "Quản lý khách hàng tiềm năng." }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-white/40 border border-white/60 rounded-2xl p-4 shadow-sm backdrop-blur-sm transition-transform hover:translate-x-1 duration-300">
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[#6D5EF6]/10">
                  <item.icon className="w-5 h-5 text-[#6D5EF6]" />
                </div>
                <span className="font-bold text-[#1B1B4A] text-[15px]">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-[#ECE9FF]">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-[2px] border-white bg-slate-200 overflow-hidden relative shadow-sm">
                  <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="avatar" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                ))}
                <span className="font-bold text-[#1B1B4A] ml-1 text-[14px]">4.9/5</span>
              </div>
              <span className="text-[13px] text-[#6B7090] font-medium mt-0.5">Hơn 300 doanh nghiệp đang sử dụng</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column (45%) */}
      <div className="lg:w-[45%] p-6 lg:p-10 flex items-center justify-center relative bg-gradient-to-bl from-white via-white to-[#F5F3FF]/30">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[480px] bg-white border border-[#F1F0F5] rounded-[24px] p-6 sm:p-8 shadow-[0_30px_60px_rgba(109,94,246,0.12)] transition-transform hover:-translate-y-1 duration-300"
        >
          <div className="mb-6 lg:mb-8">
            <h3 className="font-display text-[22px] font-bold text-[#1B1B4A] mb-2 flex items-center gap-2">
              🚀 Bắt đầu dùng thử miễn phí
            </h3>
            <p className="text-[#6B7090] text-[14px] leading-relaxed">
              Thiết lập không gian làm việc riêng cho doanh nghiệp của bạn chỉ trong vài bước.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              {/* Họ và tên */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#1B1B4A]">Họ và tên <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${errors.fullName ? "text-red-500" : "text-[#9CA3AF] group-focus-within:text-[#6D5EF6]"}`}>
                    <User className="h-[18px] w-[18px]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className={`w-full h-[52px] rounded-[14px] border bg-[#FAFAFA] pl-[42px] pr-4 text-[14px] outline-none transition-all focus:bg-white hover:bg-white shadow-sm ${errors.fullName ? "border-red-500 focus:ring-[3px] focus:ring-red-500/15" : "border-gray-200 focus:border-[#6D5EF6] focus:ring-[3px] focus:ring-[#6D5EF6]/15 hover:border-gray-300"}`}
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      if (errors.fullName) setErrors({ ...errors, fullName: "" });
                    }}
                  />
                </div>
                {errors.fullName && <span className="text-[12px] text-red-500 font-medium">{errors.fullName}</span>}
              </div>

              {/* Tên công ty / thương hiệu */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#1B1B4A]">Tên công ty / thương hiệu <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${errors.brandName ? "text-red-500" : "text-[#9CA3AF] group-focus-within:text-[#6D5EF6]"}`}>
                    <Building2 className="h-[18px] w-[18px]" />
                  </div>
                  <input
                    type="text"
                    placeholder="InsightFlow"
                    className={`w-full h-[52px] rounded-[14px] border bg-[#FAFAFA] pl-[42px] pr-4 text-[14px] outline-none transition-all focus:bg-white hover:bg-white shadow-sm ${errors.brandName ? "border-red-500 focus:ring-[3px] focus:ring-red-500/15" : "border-gray-200 focus:border-[#6D5EF6] focus:ring-[3px] focus:ring-[#6D5EF6]/15 hover:border-gray-300"}`}
                    value={formData.brandName}
                    onChange={(e) => {
                      setFormData({ ...formData, brandName: e.target.value });
                      if (errors.brandName) setErrors({ ...errors, brandName: "" });
                    }}
                  />
                </div>
                {errors.brandName && <span className="text-[12px] text-red-500 font-medium">{errors.brandName}</span>}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#1B1B4A]">Email công việc <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${errors.email ? "text-red-500" : "text-[#9CA3AF] group-focus-within:text-[#6D5EF6]"}`}>
                    <Mail className="h-[18px] w-[18px]" />
                  </div>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className={`w-full h-[52px] rounded-[14px] border bg-[#FAFAFA] pl-[42px] pr-4 text-[14px] outline-none transition-all focus:bg-white hover:bg-white shadow-sm ${errors.email ? "border-red-500 focus:ring-[3px] focus:ring-red-500/15" : "border-gray-200 focus:border-[#6D5EF6] focus:ring-[3px] focus:ring-[#6D5EF6]/15 hover:border-gray-300"}`}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                  />
                </div>
                {errors.email && <span className="text-[12px] text-red-500 font-medium">{errors.email}</span>}
              </div>

              {/* Số điện thoại */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#1B1B4A]">Số điện thoại <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${errors.phone ? "text-red-500" : "text-[#9CA3AF] group-focus-within:text-[#6D5EF6]"}`}>
                    <Phone className="h-[18px] w-[18px]" />
                  </div>
                  <input
                    type="tel"
                    placeholder="090..."
                    className={`w-full h-[52px] rounded-[14px] border bg-[#FAFAFA] pl-[42px] pr-4 text-[14px] outline-none transition-all focus:bg-white hover:bg-white shadow-sm ${errors.phone ? "border-red-500 focus:ring-[3px] focus:ring-red-500/15" : "border-gray-200 focus:border-[#6D5EF6] focus:ring-[3px] focus:ring-[#6D5EF6]/15 hover:border-gray-300"}`}
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: "" });
                    }}
                  />
                </div>
                {errors.phone && <span className="text-[12px] text-red-500 font-medium">{errors.phone}</span>}
              </div>

              {/* Ngành hàng */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[13px] font-bold text-[#1B1B4A]">Ngành hàng <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${errors.industry ? "text-red-500" : "text-[#9CA3AF] group-focus-within:text-[#6D5EF6]"}`}>
                    <BriefcaseBusiness className="h-[18px] w-[18px]" />
                  </div>
                  <select
                    className={`w-full h-[52px] appearance-none rounded-[14px] border bg-[#FAFAFA] pl-[42px] pr-9 text-[14px] outline-none transition-all focus:bg-white hover:bg-white shadow-sm ${errors.industry ? "border-red-500 focus:ring-[3px] focus:ring-red-500/15" : "border-gray-200 focus:border-[#6D5EF6] focus:ring-[3px] focus:ring-[#6D5EF6]/15 hover:border-gray-300"}`}
                    value={formData.industry}
                    onChange={(e) => {
                      setFormData({ ...formData, industry: e.target.value });
                      if (errors.industry) setErrors({ ...errors, industry: "" });
                    }}
                  >
                    <option value="">Chọn ngành hàng</option>
                    {INDUSTRY_OPTIONS.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
                  </select>
                </div>
                {errors.industry && <span className="text-[12px] text-red-500 font-medium">{errors.industry}</span>}
              </div>

            </div>

            {/* CTA Button */}
            <button
              type="submit"
              className="group relative flex w-full h-[56px] items-center justify-center gap-2 overflow-hidden rounded-[14px] bg-[#6D5EF6] px-8 font-bold text-white transition-all hover:-translate-y-0.5 shadow-[0_12px_24px_rgba(109,94,246,0.25)] hover:shadow-[0_20px_40px_rgba(109,94,246,0.35)] mt-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#5B4DF5] to-[#4F46E5] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 text-[16px] flex items-center gap-2">
                Bắt đầu dùng thử <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
            
            {/* Trust Badges */}
            <div className="flex flex-col gap-2 pt-5 mt-1 border-t border-[#F1F0F5]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-2">
                {[
                  { text: "Bảo mật dữ liệu doanh nghiệp", icon: "🛡️" },
                  { text: "Kích hoạt nhanh trong vài phút", icon: "⚡" },
                  { text: "AI tự động hỗ trợ thiết lập", icon: "🤖" },
                  { text: "Tùy chỉnh theo nhu cầu thương hiệu", icon: "📈" }
                ].map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[14px]">{badge.icon}</span>
                    <span className="text-[12px] font-medium text-[#6B7090] leading-tight">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
