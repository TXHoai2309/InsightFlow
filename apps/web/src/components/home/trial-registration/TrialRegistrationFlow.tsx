"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BasicInfoForm, type BasicInfoData } from "./BasicInfoForm";
import { BusinessAuthStep } from "./BusinessAuthStep";
import { ConfigurationWizard, type ConfigurationData } from "./ConfigurationWizard";
import { ConsultationFollowUpForm, type ConsultationFollowUpData } from "./ConsultationFollowUpForm";
import { SuccessStep } from "./SuccessStep";

export type Step = "BASIC_INFO" | "BUSINESS_AUTH" | "CONFIG_WIZARD" | "SUCCESS" | "CONSULTATION_FORM";

interface BusinessAuthData {
  taxId: string;
}

interface SubmissionResult {
  consultationId: string;
  email: string;
}

export function TrialRegistrationFlow() {
  const [currentStep, setCurrentStep] = useState<Step>("BASIC_INFO");
  const [formData, setFormData] = useState<{
    basicInfo: BasicInfoData | null;
    businessAuth: BusinessAuthData | null;
    configuration: ConfigurationData | null;
  }>({
    basicInfo: null,
    businessAuth: null,
    configuration: null,
  });
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [submissionError, setSubmissionError] = useState("");
  const [consultationCompleted, setConsultationCompleted] = useState(false);
  const [consultationEmailSent, setConsultationEmailSent] = useState<boolean | null>(null);

  const handleBasicInfoSubmit = (data: BasicInfoData) => {
    setSubmissionError("");
    setFormData((previous) => ({ ...previous, basicInfo: data }));
    setCurrentStep("BUSINESS_AUTH");
  };

  const handleBusinessAuthSubmit = (data: BusinessAuthData) => {
    setSubmissionError("");
    setFormData((previous) => ({ ...previous, businessAuth: { taxId: data.taxId } }));
    setCurrentStep("CONFIG_WIZARD");
  };

  const handleConfigSubmit = async (data: ConfigurationData) => {
    const basicInfo = formData.basicInfo;
    const businessAuth = formData.businessAuth;

    if (!basicInfo || !businessAuth) {
      setSubmissionError("Thông tin đăng ký chưa đầy đủ. Vui lòng quay lại kiểm tra.");
      throw new Error("Incomplete trial registration data");
    }

    setSubmissionError("");
    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: basicInfo.fullName,
          email: basicInfo.email,
          phone: basicInfo.phone,
          company: basicInfo.brandName,
          industry: basicInfo.industry,
          taxId: businessAuth.taxId,
          need: "Đăng ký dùng thử và cấu hình Workspace",
          channels: data.channels,
          keywords: data.keywords,
          companyEmailDomain: data.companyEmailDomain,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Không thể gửi yêu cầu tư vấn.");
      }

      setFormData((previous) => ({ ...previous, configuration: data }));
      setSubmissionResult({
        consultationId: result.consultationId,
        email: basicInfo.email,
      });
      setCurrentStep("SUCCESS");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể gửi yêu cầu tư vấn.";
      setSubmissionError(message);
      throw error;
    }
  };

  const handleConsultationSubmit = async (data: ConsultationFollowUpData) => {
    if (!submissionResult) {
      setSubmissionError("Không tìm thấy yêu cầu dùng thử để bổ sung thông tin.");
      throw new Error("Missing trial request");
    }

    setSubmissionError("");
    try {
      const response = await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId: submissionResult.consultationId,
          email: submissionResult.email,
          need: data.need,
          consultationNotes: data.notes,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Không thể bổ sung thông tin tư vấn.");
      }

      setConsultationEmailSent(result.emailSent === true);
      setConsultationCompleted(true);
      setCurrentStep("SUCCESS");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể bổ sung thông tin tư vấn.";
      setSubmissionError(message);
      throw error;
    }
  };

  return (
    <div className="relative mx-auto min-h-[500px] w-full max-w-[1440px] px-4 md:px-8">
      <AnimatePresence mode="wait">
        {currentStep === "BASIC_INFO" && (
          <motion.div key="basic-info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <BasicInfoForm onSubmit={handleBasicInfoSubmit} initialData={formData.basicInfo} />
          </motion.div>
        )}

        {currentStep === "BUSINESS_AUTH" && (
          <motion.div key="business-auth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <BusinessAuthStep
              onSubmit={handleBusinessAuthSubmit}
              onBack={() => setCurrentStep("BASIC_INFO")}
              initialData={formData.businessAuth}
            />
          </motion.div>
        )}

        {currentStep === "CONFIG_WIZARD" && (
          <motion.div key="config-wizard" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <ConfigurationWizard
              onSubmit={handleConfigSubmit}
              onBack={() => {
                setSubmissionError("");
                setCurrentStep("BUSINESS_AUTH");
              }}
              initialData={formData.configuration}
              submissionError={submissionError}
            />
          </motion.div>
        )}

        {currentStep === "SUCCESS" && submissionResult && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <SuccessStep
              requestId={submissionResult.consultationId}
              email={submissionResult.email}
              consultationCompleted={consultationCompleted}
              consultationEmailSent={consultationEmailSent}
              onFillConsultation={() => setCurrentStep("CONSULTATION_FORM")}
              onRestart={() => {
                setSubmissionError("");
                setFormData({ basicInfo: null, businessAuth: null, configuration: null });
                setSubmissionResult(null);
                setConsultationCompleted(false);
                setConsultationEmailSent(null);
                setCurrentStep("BASIC_INFO");
                requestAnimationFrame(() => {
                  document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
              }}
            />
          </motion.div>
        )}

        {currentStep === "CONSULTATION_FORM" && submissionResult && (
          <motion.div key="consultation-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <ConsultationFollowUpForm
              onSubmit={handleConsultationSubmit}
              onBack={() => {
                setSubmissionError("");
                setCurrentStep("SUCCESS");
              }}
              submissionError={submissionError}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
