"use client";

import React, { useState } from "react";
import { BasicInfoForm } from "./BasicInfoForm";
import { BusinessAuthStep } from "./BusinessAuthStep";
import { ConfigurationWizard } from "./ConfigurationWizard";
import { SuccessStep } from "./SuccessStep";
import { AnimatePresence, motion } from "framer-motion";

export type Step = "BASIC_INFO" | "BUSINESS_AUTH" | "CONFIG_WIZARD" | "SUCCESS";

export function TrialRegistrationFlow() {
  const [currentStep, setCurrentStep] = useState<Step>("BASIC_INFO");

  // State to hold collected data (mocking the submission process)
  const [formData, setFormData] = useState({
    basicInfo: null,
    businessAuth: null,
    configuration: null,
  });

  const handleBasicInfoSubmit = (data: any) => {
    setFormData((prev) => ({ ...prev, basicInfo: data }));
    setCurrentStep("BUSINESS_AUTH");
  };

  const handleBusinessAuthSubmit = (data: any) => {
    setFormData((prev) => ({ ...prev, businessAuth: data }));
    setCurrentStep("CONFIG_WIZARD");
  };

  const handleConfigSubmit = (data: any) => {
    setFormData((prev) => ({ ...prev, configuration: data }));
    setCurrentStep("SUCCESS");
  };

  const handleBusinessAuthBack = () => {
    setCurrentStep("BASIC_INFO");
  };

  const handleConfigBack = () => {
    setCurrentStep("BUSINESS_AUTH");
  };

  return (
    <div className="relative w-full max-w-[1440px] px-4 md:px-8 mx-auto min-h-[500px]">
      <AnimatePresence mode="wait">
        {currentStep === "BASIC_INFO" && (
          <motion.div
            key="basic-info"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <BasicInfoForm onSubmit={handleBasicInfoSubmit} initialData={formData.basicInfo} />
          </motion.div>
        )}

        {currentStep === "BUSINESS_AUTH" && (
          <motion.div
            key="business-auth"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <BusinessAuthStep onSubmit={handleBusinessAuthSubmit} onBack={handleBusinessAuthBack} initialData={formData.businessAuth} />
          </motion.div>
        )}

        {currentStep === "CONFIG_WIZARD" && (
          <motion.div
            key="config-wizard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ConfigurationWizard onSubmit={handleConfigSubmit} onBack={handleConfigBack} initialData={formData.configuration} />
          </motion.div>
        )}

        {currentStep === "SUCCESS" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <SuccessStep />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
