"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import SecurityTab from "@/components/profile/SecurityTab";
import NotificationsTab from "@/components/profile/NotificationsTab";
import TopNavBar from "@/components/home/TopNavBar";
type Tab = "profile" | "security" | "notifications";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
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
      alert("Có lỗi xảy ra khi lưu. Vui lòng thử lại.");
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
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#E2E4F0] my-[24px]"></div>

                  {/* Form fields */}
                  <div className="grid grid-cols-2 gap-x-[24px] gap-y-[24px]">
                    {/* Name */}
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Họ và tên"
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white"
                      />
                    </div>

                    {/* Email (read-only) */}
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Email
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
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="Ví dụ: 090 123 4567"
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white placeholder:text-[#9898B0]"
                      />
                    </div>

                    {/* Company */}
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Công ty
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Tên công ty"
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white placeholder:text-[#9898B0]"
                      />
                    </div>

                    {/* Role */}
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Vai trò
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="Vai trò của bạn"
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white placeholder:text-[#9898B0]"
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-[12px] mt-[32px]">
                    <button 
                      onClick={handleCancel}
                      className="bg-transparent text-[#4A4A6A] border-[1.5px] border-[#E2E4F0] rounded-[10px] px-[28px] py-[11px] font-semibold hover:border-[#6C63FF] hover:text-[#6C63FF] transition-colors text-[14px]"
                    >
                      Hủy thay đổi
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
                      {isSaving && <span className="w-[16px] h-[16px] border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {!isSaving && saved && <i className="ti ti-circle-check text-[18px]"></i>}
                      {!isSaving && saved && "Đã lưu!"}
                      {!isSaving && !saved && "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "security" && <SecurityTab displayName={displayName} />}

              {activeTab === "notifications" && <NotificationsTab />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
