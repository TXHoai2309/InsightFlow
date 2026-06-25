"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

export default function NotificationsTab() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [crisisAlerts, setCrisisAlerts] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'vi');
  
  const [originalState, setOriginalState] = useState({
    emailNotif: true,
    pushNotif: true,
    crisisAlerts: true,
    dailyReports: false,
    language: i18n.language || 'vi',
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
          
          if (prefs.language) {
            setSelectedLang(prefs.language);
            if (prefs.language !== i18n.language) {
              i18n.changeLanguage(prefs.language);
            }
          }
          
          setOriginalState({
            emailNotif: prefs.emailNotif ?? true,
            pushNotif: prefs.pushNotif ?? true,
            crisisAlerts: prefs.crisisAlerts ?? true,
            dailyReports: prefs.dailyReports ?? false,
            language: prefs.language ?? i18n.language ?? 'vi',
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
      
      const newPrefs = { emailNotif, pushNotif, crisisAlerts, dailyReports, language: selectedLang };
      
      if (selectedLang !== i18n.language) {
        i18n.changeLanguage(selectedLang);
      }
      
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
    setSelectedLang(originalState.language);
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
      <div 
        className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C63FF]"
        style={{
          backgroundColor: checked ? (isDark ? "var(--color-brand)" : "#6C63FF") : (isDark ? "var(--color-bg-surface)" : "#D1D5DB"),
          border: isDark ? "1px solid var(--color-border)" : "none"
        }}
      ></div>
    </label>
  );

  return (
    <div className="space-y-[32px] animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-semibold mb-2" style={{ color: isDark ? "var(--color-text-primary)" : "#1A1A2E" }}>
          {t("notifications.title")}
        </h2>
        <p className="text-[14px]" style={{ color: isDark ? "var(--color-text-secondary)" : "#4A4A6A" }}>
          {t("notifications.subtitle")}
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-[12px]">
        {/* Email */}
        <div 
          className="flex items-center justify-between gap-4 px-[24px] py-[20px] rounded-[12px] transition-all group border"
          style={{
            backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#ffffff",
            borderColor: isDark ? "var(--color-border)" : "#E2E4F0"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? "var(--color-bg-surface)" : "#F9F9FF";
            e.currentTarget.style.borderColor = isDark ? "var(--color-brand)" : "#C4C0FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? "var(--color-bg-surface-raised)" : "#ffffff";
            e.currentTarget.style.borderColor = isDark ? "var(--color-border)" : "#E2E4F0";
          }}
        >
          <div className="flex items-center gap-[16px]">
            <div 
              className="w-[40px] h-[40px] shrink-0 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isDark ? "var(--color-bg-surface)" : "#EFF6FF",
                color: isDark ? "var(--color-brand)" : "#3B82F6",
                border: isDark ? "1px solid var(--color-border)" : "none"
              }}
            >
              <i className="ti ti-mail text-[22px]"></i>
            </div>
            <div className="flex flex-col gap-[4px]">
              <h3 className="text-[15px] font-bold" style={{ color: isDark ? "var(--color-text-primary)" : "#1A1A2E" }}>{t("notifications.email.title")}</h3>
              <p className="text-[13px] max-w-md" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>
                {t("notifications.email.desc")}
              </p>
            </div>
          </div>
          <Toggle checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
        </div>

        {/* Push */}
        <div 
          className="flex items-center justify-between gap-4 px-[24px] py-[20px] rounded-[12px] transition-all group border"
          style={{
            backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#ffffff",
            borderColor: isDark ? "var(--color-border)" : "#E2E4F0"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? "var(--color-bg-surface)" : "#F9F9FF";
            e.currentTarget.style.borderColor = isDark ? "var(--color-brand)" : "#C4C0FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? "var(--color-bg-surface-raised)" : "#ffffff";
            e.currentTarget.style.borderColor = isDark ? "var(--color-border)" : "#E2E4F0";
          }}
        >
          <div className="flex items-center gap-[16px]">
            <div 
              className="w-[40px] h-[40px] shrink-0 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isDark ? "var(--color-bg-surface)" : "#EEF0FF",
                color: isDark ? "var(--color-brand)" : "#6C63FF",
                border: isDark ? "1px solid var(--color-border)" : "none"
              }}
            >
              <i className="ti ti-bell-ringing text-[22px]"></i>
            </div>
            <div className="flex flex-col gap-[4px]">
              <h3 className="text-[15px] font-bold" style={{ color: isDark ? "var(--color-text-primary)" : "#1A1A2E" }}>{t("notifications.push.title")}</h3>
              <p className="text-[13px] max-w-md" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>
                {t("notifications.push.desc")}
              </p>
            </div>
          </div>
          <Toggle checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} />
        </div>

        {/* Crisis Alerts */}
        <div 
          className="flex items-center justify-between gap-4 px-[24px] py-[20px] rounded-[12px] transition-all group border"
          style={{
            backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#ffffff",
            borderColor: isDark ? "var(--color-border)" : "#E2E4F0"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? "var(--color-bg-surface)" : "#F9F9FF";
            e.currentTarget.style.borderColor = isDark ? "var(--color-brand)" : "#C4C0FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? "var(--color-bg-surface-raised)" : "#ffffff";
            e.currentTarget.style.borderColor = isDark ? "var(--color-border)" : "#E2E4F0";
          }}
        >
          <div className="flex items-center gap-[16px]">
            <div 
              className="w-[40px] h-[40px] shrink-0 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isDark ? "var(--color-bg-surface)" : "#FEF2F2",
                color: "#EF4444",
                border: isDark ? "1px solid var(--color-border)" : "none"
              }}
            >
              <i className="ti ti-alert-triangle text-[22px]"></i>
            </div>
            <div className="flex flex-col gap-[4px]">
              <h3 className="text-[15px] font-bold" style={{ color: isDark ? "var(--color-text-primary)" : "#1A1A2E" }}>{t("notifications.crisis.title")}</h3>
              <p className="text-[13px] max-w-md" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>
                {t("notifications.crisis.desc")}
              </p>
            </div>
          </div>
          <Toggle checked={crisisAlerts} onChange={() => setCrisisAlerts(!crisisAlerts)} />
        </div>

        {/* Daily Reports */}
        <div 
          className="flex items-center justify-between gap-4 px-[24px] py-[20px] rounded-[12px] transition-all group border"
          style={{
            backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#ffffff",
            borderColor: isDark ? "var(--color-border)" : "#E2E4F0"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? "var(--color-bg-surface)" : "#F9F9FF";
            e.currentTarget.style.borderColor = isDark ? "var(--color-brand)" : "#C4C0FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? "var(--color-bg-surface-raised)" : "#ffffff";
            e.currentTarget.style.borderColor = isDark ? "var(--color-border)" : "#E2E4F0";
          }}
        >
          <div className="flex items-center gap-[16px]">
            <div 
              className="w-[40px] h-[40px] shrink-0 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isDark ? "var(--color-bg-surface)" : "#F0FDF4",
                color: "#22C55E",
                border: isDark ? "1px solid var(--color-border)" : "none"
              }}
            >
              <i className="ti ti-file-report text-[22px]"></i>
            </div>
            <div className="flex flex-col gap-[4px]">
              <h3 className="text-[15px] font-bold" style={{ color: isDark ? "var(--color-text-primary)" : "#1A1A2E" }}>{t("notifications.daily.title")}</h3>
              <p className="text-[13px] max-w-md" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>
                {t("notifications.daily.desc")}
              </p>
            </div>
          </div>
          <Toggle checked={dailyReports} onChange={() => setDailyReports(!dailyReports)} />
        </div>

        {/* Language */}
        <div 
          className="flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors"
          style={{
            borderColor: isDark ? "var(--color-border)" : "transparent"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? "var(--color-bg-surface-raised)" : "#f0f3ff";
            e.currentTarget.style.borderColor = isDark ? "var(--color-border)" : "#e7eaf3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = isDark ? "var(--color-border)" : "transparent";
          }}
        >
          <div className="flex gap-4">
            <div 
              className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: isDark ? "var(--color-bg-surface)" : "#dee8ff",
                color: isDark ? "var(--color-brand)" : "#4648d4",
                border: isDark ? "1px solid var(--color-border)" : "none"
              }}
            >
              <span className="material-symbols-outlined text-[20px]">translate</span>
            </div>
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: isDark ? "var(--color-text-primary)" : "#111c2d" }}>{t("notifications.language.title")}</h3>
              <p className="text-[14px] max-w-md mt-1" style={{ color: isDark ? "var(--color-text-secondary)" : "#464554" }}>
                {t("notifications.language.desc")}
              </p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setSelectedLang('vi')}
              className="px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all"
              style={selectedLang === 'vi' ? {
                backgroundColor: isDark ? "var(--color-brand)" : "#4648d4",
                color: "white",
              } : {
                backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#f0f3ff",
                color: isDark ? "var(--color-text-secondary)" : "#464554",
              }}
            >
              VI
            </button>
            <button
              onClick={() => setSelectedLang('en')}
              className="px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all"
              style={selectedLang === 'en' ? {
                backgroundColor: isDark ? "var(--color-brand)" : "#4648d4",
                color: "white",
              } : {
                backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#f0f3ff",
                color: isDark ? "var(--color-text-secondary)" : "#464554",
              }}
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
          className="bg-transparent border-[1.5px] rounded-[10px] px-[28px] py-[11px] font-semibold transition-colors text-[14px]"
          style={{
            borderColor: isDark ? "var(--color-border)" : "#E2E4F0",
            color: isDark ? "var(--color-text-secondary)" : "#4A4A6A",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = isDark ? "var(--color-brand)" : "#6C63FF";
            e.currentTarget.style.color = isDark ? "var(--color-brand)" : "#6C63FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isDark ? "var(--color-border)" : "#E2E4F0";
            e.currentTarget.style.color = isDark ? "var(--color-text-secondary)" : "#4A4A6A";
          }}
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
      <div className="mt-12 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-90 border-t" style={{ borderColor: isDark ? "var(--color-border)" : "#E2E4F0" }}>
        <div 
          className="p-6 rounded-[12px] flex items-center gap-[16px] border"
          style={{
            backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#F7F8FC",
            borderColor: isDark ? "var(--color-border)" : "transparent"
          }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: isDark ? "var(--color-bg-surface)" : "#ffffff",
              color: isDark ? "var(--color-brand)" : "#6C63FF",
              border: isDark ? "1px solid var(--color-border)" : "none"
            }}
          >
            <i className="ti ti-shield-lock text-[24px]"></i>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold" style={{ color: isDark ? "var(--color-text-primary)" : "#1A1A2E" }}>{t("notifications.encryption.title")}</h4>
            <p className="text-[13px] mt-0.5" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>{t("notifications.encryption.desc")}</p>
          </div>
        </div>
        <div 
          className="p-6 rounded-[12px] flex items-center gap-[16px] border"
          style={{
            backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#F7F8FC",
            borderColor: isDark ? "var(--color-border)" : "transparent"
          }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: isDark ? "var(--color-bg-surface)" : "#ffffff",
              color: isDark ? "var(--color-brand)" : "#6C63FF",
              border: isDark ? "1px solid var(--color-border)" : "none"
            }}
          >
            <i className="ti ti-devices text-[24px]"></i>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold" style={{ color: isDark ? "var(--color-text-primary)" : "#1A1A2E" }}>{t("notifications.sync.title")}</h4>
            <p className="text-[13px] mt-0.5" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>{t("notifications.sync.desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

