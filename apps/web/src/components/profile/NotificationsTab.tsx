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
      <div className="w-11 h-6 bg-[#c7c4d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4648d4]"></div>
    </label>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-semibold text-[#111c2d] mb-1">
          {t("notifications.title")}
        </h2>
        <p className="text-[14px] text-[#464554]">
          {t("notifications.subtitle")}
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        {/* Email */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl hover:bg-[#f0f3ff] transition-colors border border-transparent hover:border-[#e7eaf3]">
          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-[#e1e0ff] flex items-center justify-center text-[#4648d4]">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <div>
              <h3 className="text-[14px] text-[#111c2d] font-bold">{t("notifications.email.title")}</h3>
              <p className="text-[14px] text-[#464554] max-w-md mt-1">
                {t("notifications.email.desc")}
              </p>
            </div>
          </div>
          <Toggle checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
        </div>

        {/* Push */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl hover:bg-[#f0f3ff] transition-colors border border-transparent hover:border-[#e7eaf3]">
          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-[#e2dfff] flex items-center justify-center text-[#4b41e1]">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </div>
            <div>
              <h3 className="text-[14px] text-[#111c2d] font-bold">{t("notifications.push.title")}</h3>
              <p className="text-[14px] text-[#464554] max-w-md mt-1">
                {t("notifications.push.desc")}
              </p>
            </div>
          </div>
          <Toggle checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} />
        </div>

        {/* Crisis Alerts */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl hover:bg-[#f0f3ff] transition-colors border border-transparent hover:border-[#e7eaf3]">
          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div>
              <h3 className="text-[14px] text-[#111c2d] font-bold">{t("notifications.crisis.title")}</h3>
              <p className="text-[14px] text-[#464554] max-w-md mt-1">
                {t("notifications.crisis.desc")}
              </p>
            </div>
          </div>
          <Toggle checked={crisisAlerts} onChange={() => setCrisisAlerts(!crisisAlerts)} />
        </div>

        {/* Daily Reports */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl hover:bg-[#f0f3ff] transition-colors border border-transparent hover:border-[#e7eaf3]">
          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-[#ffdcc5] flex items-center justify-center text-[#904900]">
              <span className="material-symbols-outlined text-[20px]">summarize</span>
            </div>
            <div>
              <h3 className="text-[14px] text-[#111c2d] font-bold">{t("notifications.daily.title")}</h3>
              <p className="text-[14px] text-[#464554] max-w-md mt-1">
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

      <hr className="border-[#e7eaf3]" />

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-8">
        <button 
          onClick={handleCancel}
          className="px-6 py-2.5 text-[14px] font-medium text-[#464554] hover:bg-[#f0f3ff] transition-all rounded-xl border border-[#c7c4d7]"
        >
          {t("notifications.actions.cancel")}
        </button>
        <button 
          onClick={handleSave}
          disabled={savingState !== "idle"}
          className={`px-6 py-2.5 text-[14px] font-bold transition-all rounded-xl shadow-md flex items-center justify-center gap-2 min-w-[140px]
            ${savingState === "saved" ? "bg-green-600 text-white shadow-green-200" : "bg-[#4648d4] text-white hover:bg-[#6063ee] active:scale-95 disabled:opacity-70 disabled:scale-100"}
          `}
        >
          {savingState === "saving" && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {savingState === "saved" && (
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          )}
          {savingState === "idle" && t("notifications.actions.save")}
          {savingState === "saving" && t("notifications.actions.saving")}
          {savingState === "saved" && t("notifications.actions.saved")}
        </button>
      </div>

      {/* Decoration / Atmospheric Context */}
      <div className="mt-12 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
        <div className="p-6 rounded-2xl border border-[#e7eaf3] bg-[#f0f3ff] flex items-center gap-4">
          <span className="material-symbols-outlined text-[36px] text-[#4648d4]/40">security</span>
          <div>
            <h4 className="text-[14px] font-semibold text-[#111c2d]">{t("notifications.encryption.title")}</h4>
            <p className="text-[13px] text-[#464554] mt-0.5">{t("notifications.encryption.desc")}</p>
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-[#e7eaf3] bg-[#f0f3ff] flex items-center gap-4">
          <span className="material-symbols-outlined text-[36px] text-[#4648d4]/40">devices</span>
          <div>
            <h4 className="text-[14px] font-semibold text-[#111c2d]">{t("notifications.sync.title")}</h4>
            <p className="text-[13px] text-[#464554] mt-0.5">{t("notifications.sync.desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
