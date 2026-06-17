"use client";

import type { Metadata } from "next";
import { usePathname } from "next/navigation";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

// export const metadata: Metadata = {
//   title: {
//     template: "%s — InsightFlow",
//     default: "InsightFlow · Biến dữ liệu thành insight",
//   },
//   description: "Nền tảng AI theo dõi và phân tích thương hiệu theo thời gian thực",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideShell = ["/", "/login", "/register"].includes(pathname || "");

  return (
    <html lang="vi">
      <head>
        <title>InsightFlow · Biến dữ liệu thành insight</title>
        <meta
          name="description"
          content="Nền tảng AI theo dõi và phân tích thương hiệu trong thời gian thực"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Hanken+Grotesk:wght@600;700;800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f9f9ff" }}>
        {hideShell ? (
          <main className="min-h-screen">{children}</main>
        ) : (
          <div className="flex h-screen w-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 ml-64">
              <Header />
              <main className="flex-1 overflow-y-auto mt-16">{children}</main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
