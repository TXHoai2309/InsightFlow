import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InsightFlow - AI Brand Monitoring Platform",
  description:
    "Nền tảng AI theo dõi dữ liệu thương hiệu và cảnh báo sớm cho doanh nghiệp F&B tại Việt Nam.",
  keywords: "brand monitoring, AI, F&B, Vietnam, sentiment analysis, social media",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
