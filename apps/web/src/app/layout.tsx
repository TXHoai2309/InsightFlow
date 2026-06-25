"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import "../../i18n";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import Footer from "@/components/home/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/contexts/I18nProvider";

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
  const hideShell = ["/", "/login", "/register", "/forgot-password", "/nganh", "/ve-chung-toi", "/profile"].includes(pathname || "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFoucScript }} />
        <title>InsightFlow · Biến dữ liệu thành insight</title>
        <meta
          name="description"
          content="Nền tảng AI theo dõi và phân tích thương hiệu trong thời gian thực"
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
        <ThemeProvider>
          {/* I18nProvider: đọc localStorage và apply ngôn ngữ SAU khi client mount */}
          <I18nProvider>
            {hideShell ? (
              <div className="flex flex-col min-h-screen">
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            ) : (
              <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: "var(--color-bg-primary)" }}>
                <Sidebar
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                />
                <div className="flex flex-col flex-1 md:ml-64">
                  <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
                  <main
                    className="flex-1 overflow-y-auto mt-16 pb-16 md:pb-0"
                    style={{ backgroundColor: "var(--color-bg-primary)" }}
                  >
                    {children}
                  </main>
                  <MobileNav />
                </div>
              </div>
            )}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
