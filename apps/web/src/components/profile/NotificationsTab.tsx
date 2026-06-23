"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export default function NotificationsTab() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [crisisAlerts, setCrisisAlerts] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);
  
  const [originalState, setOriginalState] = useState({
    emailNotif: true,
    pushNotif: true,
    crisisAlerts: true,
    dailyReports: false,
  });

  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (!user) return;
    const loadSettings = async () => {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists() && docSnap.data().notifications) {
          const prefs = docSnap.data().notifications;
          setEmailNotif(prefs.emailNotif ?? true);
          setPushNotif(prefs.pushNotif ?? true);
          setCrisisAlerts(prefs.crisisAlerts ?? true);
          setDailyReports(prefs.dailyReports ?? false);
          setOriginalState({
            emailNotif: prefs.emailNotif ?? true,
            pushNotif: prefs.pushNotif ?? true,
            crisisAlerts: prefs.crisisAlerts ?? true,
            dailyReports: prefs.dailyReports ?? false,
          });
        }
      } catch (e) {
        console.error("Error loading notifications settings", e);
      }
    };
    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSavingState("saving");
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      
      const newPrefs = { emailNotif, pushNotif, crisisAlerts, dailyReports };
      
      await setDoc(doc(db, "users", user.uid), {
        notifications: newPrefs,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setOriginalState(newPrefs);
      setSavingState("saved");
      setTimeout(() => setSavingState("idle"), 2000);
    } catch (error) {
      console.error("Error saving notifications:", error);
      alert(t("notifications.errorSave"));
      setSavingState("idle");
    }
  };

  const handleCancel = () => {
    setEmailNotif(originalState.emailNotif);
    setPushNotif(originalState.pushNotif);
    setCrisisAlerts(originalState.crisisAlerts);
    setDailyReports(originalState.dailyReports);
  };

  const Toggle = ({ 
    checked, 
    onChange 
  }: { 
    checked: boolean; 
    onChange: () => void 
  }) => (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked} 
        onChange={onChange} 
      />
      <div className="w-11 h-6 bg-[#D1D5DB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C63FF]"></div>
    </label>
  );

  return (
    <div className="space-y-[32px] animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-semibold text-[#1A1A2E] mb-2">
          {t("notifications.title")}
        </h2>
        <p className="text-[14px] text-[#4A4A6A]">
          {t("notifications.subtitle")}
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-[12px]">
        {/* Email */}
        <div className="flex items-center justify-between gap-4 px-[24px] py-[20px] rounded-[12px] bg-white border border-[#E2E4F0] hover:bg-[#F9F9FF] hover:border-[#C4C0FF] transition-all group">
          <div className="flex items-center gap-[16px]">
            <div className="w-[40px] h-[40px] shrink-0 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
              <i className="ti ti-mail text-[22px]"></i>
            </div>
            <div className="flex flex-col gap-[4px]">
              <h3 className="text-[15px] text-[#1A1A2E] font-bold">{t("notifications.email.title")}</h3>
              <p className="text-[13px] text-[#9898B0] max-w-md">
                {t("notifications.email.desc")}
              </p>
            </div>
          </div>
          <Toggle checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
        </div>

        {/* Push */}
        <div className="flex items-center justify-between gap-4 px-[24px] py-[20px] rounded-[12px] bg-white border border-[#E2E4F0] hover:bg-[#F9F9FF] hover:border-[#C4C0FF] transition-all group">
          <div className="flex items-center gap-[16px]">
            <div className="w-[40px] h-[40px] shrink-0 rounded-full bg-[#EEF0FF] flex items-center justify-center text-[#6C63FF]">
              <i className="ti ti-bell-ringing text-[22px]"></i>
            </div>
            <div className="flex flex-col gap-[4px]">
              <h3 className="text-[15px] text-[#1A1A2E] font-bold">{t("notifications.push.title")}</h3>
              <p className="text-[13px] text-[#9898B0] max-w-md">
                {t("notifications.push.desc")}
              </p>
            </div>
          </div>
          <Toggle checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} />
        </div>

        {/* Crisis Alerts */}
        <div className="flex items-center justify-between gap-4 px-[24px] py-[20px] rounded-[12px] bg-white border border-[#E2E4F0] hover:bg-[#F9F9FF] hover:border-[#C4C0FF] transition-all group">
          <div className="flex items-center gap-[16px]">
            <div className="w-[40px] h-[40px] shrink-0 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#EF4444]">
              <i className="ti ti-alert-triangle text-[22px]"></i>
            </div>
            <div className="flex flex-col gap-[4px]">
              <h3 className="text-[15px] text-[#1A1A2E] font-bold">{t("notifications.crisis.title")}</h3>
              <p className="text-[13px] text-[#9898B0] max-w-md">
                {t("notifications.crisis.desc")}
              </p>
            </div>
          </div>
          <Toggle checked={crisisAlerts} onChange={() => setCrisisAlerts(!crisisAlerts)} />
        </div>

        {/* Daily Reports */}
        <div className="flex items-center justify-between gap-4 px-[24px] py-[20px] rounded-[12px] bg-white border border-[#E2E4F0] hover:bg-[#F9F9FF] hover:border-[#C4C0FF] transition-all group">
          <div className="flex items-center gap-[16px]">
            <div className="w-[40px] h-[40px] shrink-0 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[#22C55E]">
              <i className="ti ti-file-report text-[22px]"></i>
            </div>
            <div className="flex flex-col gap-[4px]">
              <h3 className="text-[15px] text-[#1A1A2E] font-bold">{t("notifications.daily.title")}</h3>
              <p className="text-[13px] text-[#9898B0] max-w-md">
                {t("notifications.daily.desc")}
              </p>
            </div>
          </div>
          <Toggle checked={dailyReports} onChange={() => setDailyReports(!dailyReports)} />
        </div>

        {/* Language */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl hover:bg-[#f0f3ff] transition-colors border border-transparent hover:border-[#e7eaf3]">
          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-[#dee8ff] flex items-center justify-center text-[#4648d4]">
              <span className="material-symbols-outlined text-[20px]">translate</span>
            </div>
            <div>
              <h3 className="text-[14px] text-[#111c2d] font-bold">{t("notifications.language.title")}</h3>
              <p className="text-[14px] text-[#464554] max-w-md mt-1">
                {t("notifications.language.desc")}
              </p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => i18n.changeLanguage('vi')}
              className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all ${
                i18n.language === 'vi'
                  ? 'bg-[#4648d4] text-white shadow-md'
                  : 'bg-[#f0f3ff] text-[#464554] hover:bg-[#dee8ff]'
              }`}
            >
              VI
            </button>
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all ${
                i18n.language === 'en'
                  ? 'bg-[#4648d4] text-white shadow-md'
                  : 'bg-[#f0f3ff] text-[#464554] hover:bg-[#dee8ff]'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-[12px] mt-[32px]">
        <button 
          onClick={handleCancel}
          className="bg-transparent text-[#4A4A6A] border-[1.5px] border-[#E2E4F0] rounded-[10px] px-[28px] py-[11px] font-semibold hover:border-[#6C63FF] hover:text-[#6C63FF] transition-colors text-[14px]"
        >
          {t("notifications.actions.cancel")}
        </button>
        <button 
          onClick={handleSave}
          disabled={savingState !== "idle"}
          className={
            "rounded-[10px] px-[28px] py-[11px] font-semibold text-[14px] flex items-center justify-center gap-[8px] transition-all min-w-[150px] " +
            (savingState === "saved" ? "bg-[#22C55E] text-white" : "bg-[#6C63FF] text-white hover:bg-[#5A52D5] shadow-[0_4px_14px_rgba(108,99,255,0.35)] active:scale-95 disabled:opacity-70 disabled:shadow-none")
          }
        >
          {savingState === "saving" && (
            <span className="w-[16px] h-[16px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {savingState === "saved" && (
            <i className="ti ti-circle-check-filled text-[18px]"></i>
          )}
          {savingState === "idle" && t("notifications.actions.save")}
          {savingState === "saving" && t("notifications.actions.saving")}
          {savingState === "saved" && t("notifications.actions.saved")}
        </button>
      </div>

      {/* Decoration / Atmospheric Context */}
      <div className="mt-12 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-90 border-t border-[#E2E4F0]">
        <div className="p-6 rounded-[12px] bg-[#F7F8FC] flex items-center gap-[16px]">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-[#6C63FF]">
            <i className="ti ti-shield-lock text-[24px]"></i>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold text-[#1A1A2E]">{t("notifications.encryption.title")}</h4>
            <p className="text-[13px] text-[#9898B0] mt-0.5">{t("notifications.encryption.desc")}</p>
          </div>
        </div>
        <div className="p-6 rounded-[12px] bg-[#F7F8FC] flex items-center gap-[16px]">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-[#6C63FF]">
            <i className="ti ti-devices text-[24px]"></i>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold text-[#1A1A2E]">{t("notifications.sync.title")}</h4>
            <p className="text-[13px] text-[#9898B0] mt-0.5">{t("notifications.sync.desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
