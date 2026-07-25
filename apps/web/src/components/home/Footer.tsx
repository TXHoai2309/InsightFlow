"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
    </svg>
  );
}

export default function Footer() {
  const { t } = useTranslation();

  const productLinks = [
    { label: "Social Listening", href: "/#features" },
    { label: "AI Insight Report", href: "/#features" },
    { label: "Dashboard", href: "/dashboard" },
    { label: t("footer.pricing"), href: "/#pricing" },
    { label: t("footer.api"), href: "/#features" },
  ];

  const companyLinks = [
    { label: t("nav.about"), href: "/ve-chung-toi" },
    { label: "Hướng dẫn sử dụng", href: "/huong-dan" },
    { label: t("footer.blog"), href: "#" },
    { label: t("footer.careers"), href: "#" },
    { label: t("footer.contactLink"), href: "#" },
    { label: t("footer.press"), href: "#" },
  ];

  const contactItems = [
    { icon: "✉", text: "hello@insightflow.vn" },
    { icon: "☎", text: "1900 xxxx" },
    { icon: "📍", text: t("footer.address") },
  ];

  return (
    <footer className="relative mt-auto bg-[#1B1B4A] text-white overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#6D5EF6] blur-[200px] opacity-[0.15] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 pt-[64px] pb-[40px] md:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 md:gap-8 pb-12">
          {/* Col 1 — Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="mb-6 flex items-center gap-3">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#6D5EF6" opacity="0.2"/>
                <circle cx="16" cy="16" r="10" fill="#6D5EF6" opacity="0.4"/>
                <circle cx="16" cy="16" r="5" fill="#34D399"/>
              </svg>
              <span className="font-display text-[20px] font-bold text-white tracking-tight">InsightFlow</span>
            </div>
            <p className="mb-8 max-w-[280px] text-[15px] leading-[1.6] text-[#8C92B3]">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[#8C92B3] transition-all hover:-translate-y-1 hover:bg-[#6D5EF6] hover:text-white">
                <LinkedInIcon />
              </a>
              <a href="#" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[#8C92B3] transition-all hover:-translate-y-1 hover:bg-[#6D5EF6] hover:text-white">
                <FacebookIcon />
              </a>
              <a href="#" aria-label="YouTube" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[#8C92B3] transition-all hover:-translate-y-1 hover:bg-[#6D5EF6] hover:text-white">
                <YouTubeIcon />
              </a>
            </div>
          </div>

          {/* Col 2 — Products */}
          <div>
            <h6 className="mb-5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#9B8CFF]">
              {t("footer.products")}
            </h6>
            <ul className="flex flex-col gap-3">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[15px] font-medium text-[#8C92B3] transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Company */}
          <div>
            <h6 className="mb-5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#9B8CFF]">
              {t("footer.company")}
            </h6>
            <ul className="flex flex-col gap-3">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[15px] font-medium text-[#8C92B3] transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h6 className="mb-5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#9B8CFF]">
              {t("footer.contact")}
            </h6>
            <ul className="flex flex-col gap-3">
              {contactItems.map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="mt-[2px] text-[16px] text-[#34D399]">
                    {item.icon}
                  </span>
                  <span className="text-[15px] leading-[1.6] text-[#8C92B3]">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-[14px] font-medium text-[#8C92B3]">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-6 text-[14px] font-medium text-[#8C92B3]">
            <a href="#" className="transition-colors hover:text-white">{t("footer.terms")}</a>
            <a href="#" className="transition-colors hover:text-white">{t("footer.privacy")}</a>
            <a href="#" className="transition-colors hover:text-white">{t("footer.cookie")}</a>
            <span className="hidden sm:inline-block text-[#8C92B3]/50">·</span>
            <span className="text-[#8C92B3]">Made with ❤ in Vietnam</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
