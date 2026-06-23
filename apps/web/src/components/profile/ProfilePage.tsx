"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import SecurityTab from "@/components/profile/SecurityTab";
import NotificationsTab from "@/components/profile/NotificationsTab";
<<<<<<< HEAD
import { useTranslation } from "react-i18next";

=======
import TopNavBar from "@/components/home/TopNavBar";
>>>>>>> origin/Lead
type Tab = "profile" | "security" | "notifications";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    company: "",
    role: "",
  });
  const [originalData, setOriginalData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);

  // Load user data from Firestore on mount
  useEffect(() => {
    if (!user) return;
    const loadUserData = async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        let data = {
          name: user.displayName || user.email || "Nguyễn Thu Hạ",
          phoneNumber: "",
          company: "",
          role: "",
        };

        if (docSnap.exists()) {
          data = { ...data, ...docSnap.data() };
        }
        setFormData(data);
        setOriginalData(data);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };
    loadUserData();
  }, [user]);

  const displayName = formData.name || user?.displayName || user?.email || "Nguyễn Thu Hạ";
  const email = user?.email || "thu.ha@example.com";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { updateProfile } = await import("firebase/auth");
      
      // Update Auth Profile
      if (formData.name !== user.displayName) {
        await updateProfile(user, { displayName: formData.name });
      }

      // Update Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        company: formData.company,
        role: formData.role,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setOriginalData(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert(t("profile.errorSave"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-[#F8F9FA] text-[#111c2d]">
      {/* TopNavBar */}
      <header className="w-full top-0 sticky z-50 bg-white shadow-sm border-b border-[#e7eaf3] flex justify-between items-center px-10 py-4">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="text-[22px] font-bold text-[#4648d4] tracking-tight hover:opacity-80 transition-opacity"
          >
            InsightFlow
          </Link>
          <nav className="hidden md:flex gap-8 text-[14px]">
            <Link
              href="/#features"
              className="text-[#464554] font-medium hover:text-[#4648d4] transition-colors"
            >
              {t("nav.features")}
            </Link>
            <Link
              href="/nganh"
              className="text-[#464554] font-medium hover:text-[#4648d4] transition-colors"
            >
              {t("nav.industries")}
            </Link>
            <Link
              href="/ve-chung-toi"
              className="text-[#464554] font-medium hover:text-[#4648d4] transition-colors"
            >
              {t("nav.about")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[14px] font-medium text-[#111c2d]">
              {displayName}
            </span>
            <span className="text-[12px] text-[#464554]">{t("profile.adminRole")}</span>
          </div>
          {/* Avatar circle */}
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-[#4648d4] flex items-center justify-center text-white text-[14px] font-bold border-2 border-[#c0c1ff] hover:scale-105 transition-transform shadow-md"
          >
            {initials}
          </Link>
          <button
            onClick={handleLogout}
            className="text-[12px] font-semibold text-[#ef4444] hover:underline"
          >
            {t("profile.logout")}
          </button>
        </div>
      </header>

      <main className="flex flex-col items-center py-12 px-4 md:px-0">
        {/* Page heading */}
        <div className="mb-8 w-full max-w-4xl">
          <h1 className="text-[32px] leading-[40px] font-bold text-[#111c2d] mb-2">
            {t("profile.title")}
          </h1>
          <p className="text-[#464554]">
            {t("profile.subtitle")}
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden flex flex-col"
          style={{ boxShadow: "0 4px 20px -2px rgba(70,72,212,0.06), 0 2px 8px -2px rgba(0,0,0,0.03)" }}
        >
          {/* Tab bar */}
          <div className="flex border-b border-[#e7eaf3] px-6">
            {(
              [
                { key: "profile", label: t("profile.tabs.personal") },
                { key: "security", label: t("profile.tabs.security") },
                { key: "notifications", label: t("profile.tabs.notifications") },
              ] as { key: Tab; label: string }[]
            ).map((tab) => (
=======
    <div className="min-h-screen bg-[#F7F8FC] font-sans">
      <TopNavBar />

      <main className="flex justify-center pt-[104px] pb-[60px] px-[60px] w-full">
        <div className="w-full max-w-[1200px] flex flex-col gap-8">
          {/* Page heading */}
          <div>
            <h1 className="text-[28px] font-bold text-[#1A1A2E] mb-2">
              Cài đặt tài khoản
            </h1>
            <p className="text-[#4A4A6A] text-[14px]">
              Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm của bạn.
            </p>
          </div>

          <div className="flex gap-[32px]">
            {/* Sidebar */}
            <div className="w-[240px] shrink-0 flex flex-col">
              {(
                [
                  { key: "profile", label: "Thông tin cá nhân", icon: "ti-user" },
                  { key: "security", label: "Bảo mật", icon: "ti-shield-lock" },
                  { key: "notifications", label: "Thông báo", icon: "ti-bell" },
                ] as { key: Tab; label: string, icon: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full px-4 py-[14px] text-left text-[14px] transition-colors flex items-center rounded-r-[10px] mb-1 ${
                    activeTab === tab.key
                      ? "bg-[#EEF0FF] border-l-[3px] border-[#6C63FF] text-[#6C63FF] font-semibold"
                      : "text-[#4A4A6A] font-medium border-l-[3px] border-transparent hover:bg-[#F3F4FF]"
                  }`}
                >
                  <i className={`ti ${tab.icon} text-[18px] mr-[10px]`}></i>
                  {tab.label}
                </button>
              ))}
              
              <div className="my-[16px]"></div>

>>>>>>> origin/Lead
              <button
                onClick={handleLogout}
                className="w-full px-4 py-[14px] text-left text-[14px] transition-colors flex items-center rounded-r-[10px] text-[#EF4444] font-medium border-l-[3px] border-transparent hover:bg-[#FEF2F2]"
              >
                <i className="ti ti-logout text-[18px] mr-[10px]"></i>
                Đăng xuất
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 bg-[#FFFFFF] rounded-[16px] shadow-[0_2px_12px_rgba(108,99,255,0.07)] p-[32px] min-h-[500px]">
              {activeTab === "profile" && (
                <div className="animate-in fade-in duration-300">
                  {/* User header */}
                  <div className="flex items-center gap-[24px]">
                    {/* Avatar */}
                    <div className="relative group shrink-0">
                      <div className="h-[80px] w-[80px] rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#9B8FF8] flex items-center justify-center text-white text-[24px] font-bold">
                        {initials}
                      </div>
                      <button className="absolute bottom-0 right-0 w-[26px] h-[26px] bg-white rounded-full border-[2px] border-white shadow-[0_2px_6px_rgba(0,0,0,0.15)] flex items-center justify-center hover:scale-110 transition-transform text-[#6C63FF]">
                        <i className="ti ti-pencil text-[14px]"></i>
                      </button>
                    </div>
<<<<<<< HEAD
                    <button className="absolute bottom-0 right-0 p-1.5 bg-[#4648d4] text-white rounded-full shadow-lg border-2 border-white hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">
                        photo_camera
                      </span>
                    </button>
                  </div>
                  {/* Name & role */}
                  <div className="text-center md:text-left flex-1">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <h2 className="text-[24px] font-semibold text-[#111c2d]">
                        {displayName}
                      </h2>
                      <span className="px-3 py-1 bg-[#b55d00] text-white text-[10px] font-bold rounded-full tracking-widest uppercase">
                        {t("profile.adminBadge")}
                      </span>
=======
                    {/* Name & role */}
                    <div className="flex flex-col gap-[4px]">
                      <div className="flex items-center gap-[12px]">
                        <h2 className="text-[22px] font-bold text-[#1A1A2E]">
                          {displayName}
                        </h2>
                        <span className="bg-[#EEF0FF] text-[#6C63FF] rounded-[6px] text-[11px] font-bold px-[10px] py-[3px] uppercase tracking-[0.06em]">
                          QUẢN TRỊ VIÊN
                        </span>
                      </div>
                      <p className="text-[#9898B0] text-[14px] flex items-center gap-[8px]">
                        <i className="ti ti-mail text-[16px]"></i>
                        {email}
                      </p>
>>>>>>> origin/Lead
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#E2E4F0] my-[24px]"></div>

                  {/* Form fields */}
                  <div className="grid grid-cols-2 gap-x-[24px] gap-y-[24px]">
                    {/* Name */}
<<<<<<< HEAD
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        {t("profile.form.name")}
=======
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Họ và tên
>>>>>>> origin/Lead
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
<<<<<<< HEAD
                        placeholder={t("profile.form.name")}
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
=======
                        placeholder="Họ và tên"
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white"
>>>>>>> origin/Lead
                      />
                    </div>

                    {/* Email (read-only) */}
<<<<<<< HEAD
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        {t("profile.form.email")}
=======
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Email
>>>>>>> origin/Lead
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          readOnly
                          className="w-full h-[44px] pl-[16px] pr-[40px] rounded-[10px] border-[1.5px] border-[#E2E4F0] bg-[#F7F8FC] text-[#9898B0] cursor-not-allowed outline-none text-[14px] font-normal"
                        />
                        <i className="ti ti-lock absolute right-[12px] top-1/2 -translate-y-1/2 text-[#9898B0] text-[18px]"></i>
                      </div>
                    </div>

                    {/* Phone */}
<<<<<<< HEAD
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        {t("profile.form.phone")}
=======
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Số điện thoại
>>>>>>> origin/Lead
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
<<<<<<< HEAD
                        placeholder={t("profile.form.phonePlaceholder")}
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
=======
                        placeholder="Ví dụ: 090 123 4567"
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white placeholder:text-[#9898B0]"
>>>>>>> origin/Lead
                      />
                    </div>

                    {/* Company */}
<<<<<<< HEAD
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        {t("profile.form.company")}
=======
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Công ty
>>>>>>> origin/Lead
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
<<<<<<< HEAD
                        placeholder={t("profile.form.companyPlaceholder")}
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
=======
                        placeholder="Tên công ty"
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white placeholder:text-[#9898B0]"
>>>>>>> origin/Lead
                      />
                    </div>

                    {/* Role */}
<<<<<<< HEAD
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        {t("profile.form.role")}
=======
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Vai trò
>>>>>>> origin/Lead
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
<<<<<<< HEAD
                        placeholder={t("profile.form.rolePlaceholder")}
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
                      />
                    </div>

                    {/* Date joined (read-only) */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        {t("profile.form.dateJoined")}
                      </label>
                      <input
                        type="text"
                        value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("vi-VN") : "12/05/2023"}
                        readOnly
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] bg-[#f0f3ff] text-[#464554] cursor-not-allowed outline-none text-[16px]"
=======
                        placeholder="Vai trò của bạn"
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white placeholder:text-[#9898B0]"
>>>>>>> origin/Lead
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-[12px] mt-[32px]">
                    <button 
                      onClick={handleCancel}
                      className="bg-transparent text-[#4A4A6A] border-[1.5px] border-[#E2E4F0] rounded-[10px] px-[28px] py-[11px] font-semibold hover:border-[#6C63FF] hover:text-[#6C63FF] transition-colors text-[14px]"
                    >
<<<<<<< HEAD
                      {t("profile.actions.cancel")}
=======
                      Hủy thay đổi
>>>>>>> origin/Lead
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`rounded-[10px] px-[28px] py-[11px] font-semibold text-[14px] flex items-center justify-center gap-[8px] transition-all min-w-[150px] ${
                        saved
                          ? "bg-[#22C55E] text-white"
                          : "bg-[#6C63FF] text-white hover:bg-[#5A52D5] shadow-[0_4px_14px_rgba(108,99,255,0.35)] disabled:opacity-70 disabled:shadow-none"
                      }`}
                    >
<<<<<<< HEAD
                      {isSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {!isSaving && saved && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                      {!isSaving && saved && t("profile.actions.saved")}
                      {!isSaving && !saved && t("profile.actions.save")}
=======
                      {isSaving && <span className="w-[16px] h-[16px] border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {!isSaving && saved && <i className="ti ti-circle-check text-[18px]"></i>}
                      {!isSaving && saved && "Đã lưu!"}
                      {!isSaving && !saved && "Lưu thay đổi"}
>>>>>>> origin/Lead
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "security" && <SecurityTab displayName={displayName} />}

              {activeTab === "notifications" && <NotificationsTab />}
            </div>
          </div>
        </div>
<<<<<<< HEAD

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-[12px] text-[#464554]">
            {t("profile.footer.copyright")}
            <span className="font-semibold">{displayName}</span>.
          </p>
        </div>
=======
>>>>>>> origin/Lead
      </main>
    </div>
  );
}
