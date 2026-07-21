"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useTranslation, I18nextProvider } from "react-i18next";
import { Be_Vietnam_Pro } from "next/font/google";
import i18nInstance from "../i18n";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { NativeSelectEnhancer } from "@/components/ui/NativeSelectEnhancer";
import Footer from "@/components/home/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

const BrandManagerOnboarding = dynamic(
  () =>
    import("@/components/onboarding/BrandManagerOnboarding").then(
      (mod) => mod.BrandManagerOnboarding,
    ),
  { ssr: false },
);

const CrisisEmployeeOnboarding = dynamic(
  () =>
    import("@/components/onboarding/CrisisEmployeeOnboarding").then(
      (mod) => mod.CrisisEmployeeOnboarding,
    ),
  { ssr: false },
);

const LeadEmployeeOnboarding = dynamic(
  () =>
    import("@/components/onboarding/LeadEmployeeOnboarding").then(
      (mod) => mod.LeadEmployeeOnboarding,
    ),
  { ssr: false },
);

/**
 * Anti-FOUC (Flash of Unstyled Content) Script.
 * Được inject trực tiếp vào <head> TRƯỚC khi React hydrate.
 * Đọc localStorage và set class "dark" lên <html> ngay lập tức
 * để tránh màn hình trắng nháy khi reload trang ở dark mode.
 */
const antiFoucScript = `
(function() {
  try {
    var t = localStorage.getItem('insightflow-theme');
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();

  // Trang auth: không có sidebar, không có footer
  const isAuthPage = ["/login", "/forgot-password", "/change-password"].includes(pathname || "");
  // Trang public: không có sidebar, nhưng có footer
  const isPublicPage = [
    "/",
    "/nganh",
    "/ve-chung-toi",
    "/profile",
  ].includes(pathname || "");
  const isDemoPage = pathname?.startsWith("/demo");
  const hideShell = isAuthPage || isPublicPage;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitleKey = (path: string) => {
    switch (path) {
      case "/":
        return "metadata.home.title";
      case "/login":
        return "metadata.login.title";
      case "/forgot-password":
        return "metadata.forgotPassword.title"; // Custom title for forgot password
      case "/nganh":
        return "metadata.industries.title";
      case "/ve-chung-toi":
        return "metadata.about.title";
      case "/profile":
        return "metadata.profile.title";
      case "/dashboard":
        return "metadata.dashboard.title";
      case "/mentions":
        return "metadata.mentions.title";
      case "/alerts":
        return "metadata.alerts.title";
      case "/leads":
        return "metadata.leads.title";
      case "/reports":
        return "metadata.reports.title";
      case "/labeling_tool":
        return "Gan nhan du lieu";
      case "/label-requests":
        return "Duyet yeu cau gan lai nhan";
      default:
        if (path.startsWith("/settings")) return "metadata.settings.title";
        return "metadata.default.title";
    }
  };

  const getPageDescriptionKey = (path: string) => {
    switch (path) {
      case "/":
        return "metadata.home.desc";
      case "/login":
        return "metadata.login.desc";
      case "/forgot-password":
        return "metadata.forgotPassword.subtitle";
      case "/nganh":
        return "metadata.industries.desc";
      case "/ve-chung-toi":
        return "metadata.about.desc";
      case "/profile":
        return "metadata.profile.desc";
      default:
        return "metadata.default.desc";
    }
  };

  const titleKey = getPageTitleKey(pathname || "/");
  const descKey = getPageDescriptionKey(pathname || "/");

  return (
    <html lang={i18n.language} className={beVietnamPro.variable} suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: set dark class trước React render để tránh flash */}
        <script dangerouslySetInnerHTML={{ __html: antiFoucScript }} />
        <title>{t(titleKey)}</title>
        <meta name="description" content={t(descKey)} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body
        className="font-sans overflow-x-hidden"
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "var(--color-bg-primary)",
        }}
      >
        <I18nextProvider i18n={i18nInstance}>
          <ThemeProvider>
            <LanguageProvider>
              <NativeSelectEnhancer />
              {isAuthPage ? (
                /* Trang đăng nhập/đăng ký/quên mật khẩu — không có footer */
                <main className="flex-1">{children}</main>
              ) : hideShell ? (
                /* Trang public (Home, Ngành, Về chúng tôi...) — có footer */
                <div className="flex flex-col min-h-screen">
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              ) : isDemoPage ? (
                /* Trang demo — có layout riêng bên trong /demo/layout.tsx */
                children
              ) : (
                /* Trang app (Dashboard, Mentions...) — có sidebar */
                <ProtectedRoute>
                  <div
                    className="flex h-screen w-full overflow-hidden"
                    style={{ backgroundColor: "var(--color-bg-primary)" }}
                  >
                    <Sidebar
                      isOpen={sidebarOpen}
                      onClose={() => setSidebarOpen(false)}
                    />
                    <div className="flex flex-col flex-1 min-w-0 md:ml-64">
                      <Header
                        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
                      />
                      <main
                        data-app-scroll-root="true"
                        className="flex-1 overflow-y-auto mt-16 pb-16 md:pb-0"
                        style={{ backgroundColor: "var(--color-bg-primary)" }}
                      >
                        {children}
                      </main>
                      <MobileNav />
                      <BrandManagerOnboarding />
                      <CrisisEmployeeOnboarding />
                      <LeadEmployeeOnboarding />
                    </div>
                  </div>
                </ProtectedRoute>
              )}
            </LanguageProvider>
          </ThemeProvider>
        </I18nextProvider>
      </body>
    </html>
  );
}
