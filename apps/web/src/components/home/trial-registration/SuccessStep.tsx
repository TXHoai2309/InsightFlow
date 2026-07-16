"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, Mail, Hash, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export function SuccessStep() {
  const [reqId] = useState(`REQ-${Math.floor(Math.random() * 90000) + 10000}`);
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const now = new Date();
    setTimeStr(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.toLocaleDateString('vi-VN')}`);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full min-h-[650px] p-10 md:p-14 bg-white/90 backdrop-blur-3xl rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col relative overflow-hidden mx-auto"
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-[#10B981]/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col items-center mb-14 relative z-10">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className="w-20 h-20 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center shadow-lg mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>
        <h3 className="text-[32px] md:text-[40px] font-extrabold text-[#0F172A] tracking-tight mb-4 text-center">
          Yêu cầu đã được gửi thành công!
        </h3>
        <p className="text-[#64748B] text-[16px] max-w-[650px] text-center leading-relaxed">
          Đội ngũ InsightFlow đang kiểm tra thông tin xác thực. Tài khoản của doanh nghiệp sẽ được cấu hình và kích hoạt trong vòng <span className="font-bold text-[#0F172A]">1–2 giờ</span> tới.
        </p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-10 w-full relative z-10">
        {/* Left: Thông tin yêu cầu */}
        <div className="flex-1 bg-[#F8FAFC] rounded-[24px] p-8 md:p-10 border border-[#E2E8F0]">
          <h4 className="text-[18px] font-extrabold text-[#0F172A] mb-8">Thông tin yêu cầu</h4>
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0]">
              <span className="text-[#64748B] text-[15px] font-medium flex items-center gap-2"><Hash className="w-4 h-4"/> Mã yêu cầu</span>
              <span className="font-bold text-[16px] text-[#0F172A]">{reqId}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0]">
              <span className="text-[#64748B] text-[15px] font-medium flex items-center gap-2"><Calendar className="w-4 h-4"/> Thời gian gửi</span>
              <span className="font-bold text-[16px] text-[#0F172A]">{timeStr || "Đang tải..."}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0]">
              <span className="text-[#64748B] text-[15px] font-medium flex items-center gap-2"><Mail className="w-4 h-4"/> Email thông báo</span>
              <span className="font-bold text-[16px] text-[#0F172A]">contact@company.vn</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B] text-[15px] font-medium flex items-center gap-2"><Clock className="w-4 h-4"/> Trạng thái</span>
              <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#F59E0B] bg-[#FFFBEB] px-3.5 py-1.5 rounded-[10px] border border-[#FCD34D]">
                Đang xét duyệt
              </span>
            </div>
          </div>
        </div>

        {/* Right: Tiến trình xử lý */}
        <div className="flex-1 bg-white rounded-[24px] p-8 md:p-10 border border-[#E2E8F0] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#10B981]/10 to-transparent blur-2xl rounded-full" />
          <h4 className="text-[18px] font-extrabold text-[#0F172A] mb-8 relative z-10">Tiến trình xử lý</h4>
          <div className="flex flex-col gap-8 relative">
            {/* Vertical Line */}
            <div className="absolute left-[20px] top-[24px] bottom-[24px] w-[2px] bg-[#E2E8F0] z-0" />
            
            <div className="flex items-start gap-5 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h5 className="font-bold text-[16px] text-[#0F172A] mb-0.5">Thông tin cơ bản</h5>
                <p className="text-[14px] text-[#64748B]">Đã cung cấp đủ thông tin</p>
              </div>
            </div>
            
            <div className="flex items-start gap-5 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h5 className="font-bold text-[16px] text-[#0F172A] mb-0.5">Xác thực doanh nghiệp</h5>
                <p className="text-[14px] text-[#64748B]">Đã tiếp nhận hồ sơ</p>
              </div>
            </div>

            <div className="flex items-start gap-5 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h5 className="font-bold text-[16px] text-[#0F172A] mb-0.5">Thiết lập cấu hình</h5>
                <p className="text-[14px] text-[#64748B]">Đã lưu các tùy chọn Workspace</p>
              </div>
            </div>

            <div className="flex items-start gap-5 relative z-10">
              <div className="w-10 h-10 rounded-full bg-white border-[2.5px] border-[#E2E8F0] flex items-center justify-center shadow-sm">
                <span className="w-3 h-3 rounded-full bg-[#F59E0B] animate-pulse" />
              </div>
              <div>
                <h5 className="font-bold text-[16px] text-[#0F172A] mb-0.5">Chờ phê duyệt</h5>
                <p className="text-[14px] text-[#F59E0B] font-medium">Sẽ kích hoạt trong vòng 1-2 giờ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
