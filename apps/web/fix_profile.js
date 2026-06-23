const fs = require('fs');
const file = 'd:\\baitap\\InsightFlow\\InsightFlow\\apps\\web\\src\\components\\profile\\ProfilePage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
`<<<<<<< HEAD
import { useTranslation } from "react-i18next";

=======
import TopNavBar from "@/components/home/TopNavBar";
>>>>>>> origin/Lead`,
`import { useTranslation } from "react-i18next";
import TopNavBar from "@/components/home/TopNavBar";`
);

content = content.replace(
`<<<<<<< HEAD
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
                  className={\`w-full px-4 py-[14px] text-left text-[14px] transition-colors flex items-center rounded-r-[10px] mb-1 \${
                    activeTab === tab.key
                      ? "bg-[#EEF0FF] border-l-[3px] border-[#6C63FF] text-[#6C63FF] font-semibold"
                      : "text-[#4A4A6A] font-medium border-l-[3px] border-transparent hover:bg-[#F3F4FF]"
                  }\`}
                >
                  <i className={\`ti \${tab.icon} text-[18px] mr-[10px]\`}></i>
                  {tab.label}
                </button>
              ))}
              
              <div className="my-[16px]"></div>

>>>>>>> origin/Lead`,
`    <div className="min-h-screen bg-[#F7F8FC] font-sans">
      <TopNavBar />

      <main className="flex justify-center pt-[104px] pb-[60px] px-[60px] w-full">
        <div className="w-full max-w-[1200px] flex flex-col gap-8">
          {/* Page heading */}
          <div>
            <h1 className="text-[28px] font-bold text-[#1A1A2E] mb-2">
              {t("profile.title")}
            </h1>
            <p className="text-[#4A4A6A] text-[14px]">
              {t("profile.subtitle")}
            </p>
          </div>

          <div className="flex gap-[32px]">
            {/* Sidebar */}
            <div className="w-[240px] shrink-0 flex flex-col">
              {(
                [
                  { key: "profile", label: t("profile.tabs.personal"), icon: "ti-user" },
                  { key: "security", label: t("profile.tabs.security"), icon: "ti-shield-lock" },
                  { key: "notifications", label: t("profile.tabs.notifications"), icon: "ti-bell" },
                ] as { key: Tab; label: string, icon: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={\`w-full px-4 py-[14px] text-left text-[14px] transition-colors flex items-center rounded-r-[10px] mb-1 \${
                    activeTab === tab.key
                      ? "bg-[#EEF0FF] border-l-[3px] border-[#6C63FF] text-[#6C63FF] font-semibold"
                      : "text-[#4A4A6A] font-medium border-l-[3px] border-transparent hover:bg-[#F3F4FF]"
                  }\`}
                >
                  <i className={\`ti \${tab.icon} text-[18px] mr-[10px]\`}></i>
                  {tab.label}
                </button>
              ))}
              
              <div className="my-[16px]"></div>
`
);

content = content.replace(
`<<<<<<< HEAD
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
>>>>>>> origin/Lead`,
`                  </div>
                  {/* Name & role */}
                  <div className="text-center md:text-left flex-1">
                    <div className="flex flex-col gap-[4px]">
                      <div className="flex items-center gap-[12px]">
                        <h2 className="text-[22px] font-bold text-[#1A1A2E]">
                          {displayName}
                        </h2>
                        <span className="bg-[#EEF0FF] text-[#6C63FF] rounded-[6px] text-[11px] font-bold px-[10px] py-[3px] uppercase tracking-[0.06em]">
                          {t("profile.adminBadge")}
                        </span>
                      </div>
                      <p className="text-[#9898B0] text-[14px] flex items-center gap-[8px]">
                        <i className="ti ti-mail text-[16px]"></i>
                        {email}
                      </p>`
);

content = content.replace(
`<<<<<<< HEAD
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        {t("profile.form.name")}
=======
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Họ và tên
>>>>>>> origin/Lead`,
`                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        {t("profile.form.name")}`
);

content = content.replace(
`<<<<<<< HEAD
                        placeholder={t("profile.form.name")}
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
=======
                        placeholder="Họ và tên"
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white"
>>>>>>> origin/Lead`,
`                        placeholder={t("profile.form.name")}
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white"`
);

content = content.replace(
`<<<<<<< HEAD
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        {t("profile.form.email")}
=======
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Email
>>>>>>> origin/Lead`,
`                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        {t("profile.form.email")}`
);

content = content.replace(
`<<<<<<< HEAD
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        {t("profile.form.phone")}
=======
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Số điện thoại
>>>>>>> origin/Lead`,
`                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        {t("profile.form.phone")}`
);

content = content.replace(
`<<<<<<< HEAD
                        placeholder={t("profile.form.phonePlaceholder")}
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
=======
                        placeholder="Ví dụ: 090 123 4567"
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white placeholder:text-[#9898B0]"
>>>>>>> origin/Lead`,
`                        placeholder={t("profile.form.phonePlaceholder")}
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white placeholder:text-[#9898B0]"`
);

content = content.replace(
`<<<<<<< HEAD
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        {t("profile.form.company")}
=======
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Công ty
>>>>>>> origin/Lead`,
`                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        {t("profile.form.company")}`
);

content = content.replace(
`<<<<<<< HEAD
                        placeholder={t("profile.form.companyPlaceholder")}
                        className="w-full h-12 px-4 rounded-xl border border-[#c7c4d7] focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
=======
                        placeholder="Tên công ty"
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white placeholder:text-[#9898B0]"
>>>>>>> origin/Lead`,
`                        placeholder={t("profile.form.companyPlaceholder")}
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white placeholder:text-[#9898B0]"`
);

content = content.replace(
`<<<<<<< HEAD
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#464554]">
                        {t("profile.form.role")}
=======
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        Vai trò
>>>>>>> origin/Lead`,
`                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        {t("profile.form.role")}`
);

content = content.replace(
`<<<<<<< HEAD
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
>>>>>>> origin/Lead`,
`                        placeholder={t("profile.form.rolePlaceholder")}
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] focus:border-[#6C63FF] focus:ring-[3px] focus:ring-[#6C63FF]/12 outline-none transition-all text-[14px] font-normal text-[#4A4A6A] bg-white placeholder:text-[#9898B0]"
                      />
                    </div>

                    {/* Date joined (read-only) */}
                    <div className="flex flex-col gap-[8px]">
                      <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                        {t("profile.form.dateJoined")}
                      </label>
                      <input
                        type="text"
                        value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("vi-VN") : "12/05/2023"}
                        readOnly
                        className="w-full h-[44px] px-[16px] rounded-[10px] border-[1.5px] border-[#E2E4F0] bg-[#F7F8FC] text-[#9898B0] cursor-not-allowed outline-none text-[14px] font-normal"`
);

content = content.replace(
`<<<<<<< HEAD
                      {t("profile.actions.cancel")}
=======
                      Hủy thay đổi
>>>>>>> origin/Lead`,
`                      {t("profile.actions.cancel")}`
);

content = content.replace(
`<<<<<<< HEAD
                      {isSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {!isSaving && saved && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                      {!isSaving && saved && t("profile.actions.saved")}
                      {!isSaving && !saved && t("profile.actions.save")}
=======
                      {isSaving && <span className="w-[16px] h-[16px] border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {!isSaving && saved && <i className="ti ti-circle-check text-[18px]"></i>}
                      {!isSaving && saved && "Đã lưu!"}
                      {!isSaving && !saved && "Lưu thay đổi"}
>>>>>>> origin/Lead`,
`                      {isSaving && <span className="w-[16px] h-[16px] border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {!isSaving && saved && <i className="ti ti-circle-check text-[18px]"></i>}
                      {!isSaving && saved && t("profile.actions.saved")}
                      {!isSaving && !saved && t("profile.actions.save")}`
);

content = content.replace(
`<<<<<<< HEAD

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-[12px] text-[#464554]">
            {t("profile.footer.copyright")}
            <span className="font-semibold">{displayName}</span>.
          </p>
        </div>
=======
>>>>>>> origin/Lead`,
`        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-[12px] text-[#464554]">
            {t("profile.footer.copyright")}
            <span className="font-semibold">{displayName}</span>.
          </p>
        </div>`
);

fs.writeFileSync(file, content);
console.log("Fixed profile page");
