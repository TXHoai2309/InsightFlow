"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation, I18nextProvider } from "react-i18next";
import i18nInstance from "../i18n";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import Footer from "@/components/home/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname || "");
  // Trang public: không có sidebar, nhưng có footer
  const isPublicPage = ["/", "/nganh", "/ve-chung-toi", "/profile"].includes(pathname || "");
  const hideShell = isAuthPage || isPublicPage;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitleKey = (path: string) => {
    switch (path) {
      case "/":
        return "metadata.home.title";
      case "/login":
        return "metadata.login.title";
      case "/register":
        return "metadata.register.title";
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
      case "/register":
        return "metadata.register.desc";
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
    <html lang={i18n.language} suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: set dark class trước React render để tránh flash */}
        <script dangerouslySetInnerHTML={{ __html: antiFoucScript }} />
        <title>{t(titleKey)}</title>
        <meta
          name="description"
          content={t(descKey)}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Hanken+Grotesk:wght@600;700;800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "var(--color-bg-primary)" }}>
        <I18nextProvider i18n={i18nInstance}>
        <ThemeProvider>
          <LanguageProvider>
          {isAuthPage ? (
            /* Trang đăng nhập/đăng ký/quên mật khẩu — không có footer */
            <main className="flex-1">{children}</main>
          ) : hideShell ? (
            /* Trang public (Home, Ngành, Về chúng tôi...) — có footer */
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          ) : (
            /* Trang app (Dashboard, Mentions...) — có sidebar */
            <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: "var(--color-bg-primary)" }}>
              <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
              <div className="flex flex-col flex-1 md:ml-64">
                <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
                <main
                  data-app-scroll-root="true"
                  className="flex-1 overflow-y-auto mt-16 pb-16 md:pb-0"
                  style={{ backgroundColor: "var(--color-bg-primary)" }}
                >
                  {children}
                </main>
                <MobileNav />
              </div>
            </div>
          )}
          </LanguageProvider>
        </ThemeProvider>
        </I18nextProvider>
      </body>
    </html>
  );
}

