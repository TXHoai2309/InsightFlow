"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import SecurityTab from "@/components/profile/SecurityTab";
import NotificationsTab from "@/components/profile/NotificationsTab";

type Tab = "profile" | "security" | "notifications";

export default function ProfilePage() {
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
  };

  return (
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
              Tính năng
            </Link>
            <Link
              href="/nganh"
              className="text-[#464554] font-medium hover:text-[#4648d4] transition-colors"
            >
              Ngành
            </Link>
            <Link
              href="/ve-chung-toi"
              className="text-[#464554] font-medium hover:text-[#4648d4] transition-colors"
            >
              Về chúng tôi
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[14px] font-medium text-[#111c2d]">
              {displayName}
            </span>
            <span className="text-[12px] text-[#464554]">Quản trị viên</span>
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
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="flex flex-col items-center py-12 px-4 md:px-0">
        {/* Page heading */}
        <div className="mb-8 w-full max-w-4xl">
          <h1 className="text-[32px] leading-[40px] font-bold text-[#111c2d] mb-2">
            Cài đặt tài khoản
          </h1>
          <p className="text-[#464554]">
            Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm của bạn.
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
                { key: "profile", label: "Thông tin cá nhân" },
                { key: "security", label: "Bảo mật" },
                { key: "notifications", label: "Thông báo" },
              ] as { key: Tab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 text-[14px] font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "text-[#4648d4] font-bold border-[#4648d4]"
                    : "text-[#464554] border-transparent hover:text-[#4648d4]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === "profile" && (
              <div>
                {/* User header */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-10 border-b border-[#e7eaf3]">
                  {/* Avatar */}
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-full bg-[#dee8ff] flex items-center justify-center text-[#4648d4] text-[28px] font-bold shadow-md overflow-hidden">
                      {initials}
                    </div>
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
                        QUẢN TRỊ VIÊN
                      </span>
                    </div>
                    <p className="text-[#464554] text-[14px] mt-1">{email}</p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Họ và tên"
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
                      />
                    </div>

                    {/* Email (read-only) */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          readOnly
                          className="w-full h-12 pl-4 pr-10 rounded-xl border border-[#c7c4d7] bg-[#f0f3ff] text-[#464554] cursor-not-allowed outline-none text-[16px]"
                        />
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#464554] text-[20px]">
                          lock
                        </span>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="Ví dụ: 090 123 4567"
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
                      />
                    </div>

                    {/* Company */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        Công ty
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Tên công ty"
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
                      />
                    </div>

                    {/* Role */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        Vai trò
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="Vai trò của bạn"
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
                      />
                    </div>

                    {/* Date joined (read-only) */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        Ngày tham gia
                      </label>
                      <input
                        type="text"
                        value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("vi-VN") : "12/05/2023"}
                        readOnly
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] bg-[#f0f3ff] text-[#464554] cursor-not-allowed outline-none text-[16px]"
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-4 pt-6">
                    <button 
                      onClick={handleCancel}
                      className="px-6 py-3 text-[#464554] font-medium hover:bg-[#dee8ff] rounded-xl transition-all active:scale-95 text-[14px]"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`px-8 py-3 font-bold rounded-xl shadow-md transition-all active:scale-95 text-[14px] min-w-[140px] flex items-center justify-center gap-2 ${
                        saved
                          ? "bg-green-500 text-white shadow-green-200"
                          : "bg-[#4648d4] text-white shadow-[#4648d4]/20 hover:bg-[#6063ee] disabled:opacity-70 disabled:scale-100"
                      }`}
                    >
                      {isSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {!isSaving && saved && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                      {!isSaving && saved && "Đã lưu!"}
                      {!isSaving && !saved && "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && <SecurityTab displayName={displayName} />}

            {activeTab === "notifications" && <NotificationsTab />}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-[12px] text-[#464554]">
            © 2024 InsightFlow AI. Đã đăng ký bản quyền cho{" "}
            <span className="font-semibold">{displayName}</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
