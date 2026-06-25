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
    <footer
      className="font-sans mt-auto"
      style={{
        background: "linear-gradient(180deg, #1E1B4B 0%, #12103A 100%)",
        borderTop: "1px solid rgba(109,76,255,0.3)",
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .footer-link {
          color: rgba(255,255,255,0.65);
          font-size: 14px;
          display: inline-block;
          transition: all 0.2s ease;
        }
        .footer-link:hover {
          color: #ffffff;
          transform: translateX(4px);
        }
        .social-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.7);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .social-icon-btn:hover {
          background: rgba(109,76,255,0.4);
          color: white;
          transform: scale(1.1);
        }
        @media (prefers-reduced-motion: reduce) {
          .footer-link, .social-icon-btn { transition: none !important; transform: none !important; }
        }
      `}} />

      <div className="max-w-[1200px] mx-auto px-6 md:px-10 pt-[80px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 pb-16">
          {/* Col 1 — Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#6D4CFF" opacity="0.2"/>
                <circle cx="16" cy="16" r="10" fill="#6D4CFF" opacity="0.4"/>
                <circle cx="16" cy="16" r="5" fill="#A78BFA"/>
              </svg>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "white" }}>InsightFlow</span>
            </div>
            <p
              className="leading-relaxed mb-6"
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "14px",
                lineHeight: 1.7,
                maxWidth: "240px",
              }}
            >
              {t("footer.tagline")}
            </p>
            <div className="flex gap-2">
              <a href="#" aria-label="LinkedIn" className="social-icon-btn">
                <LinkedInIcon />
              </a>
              <a href="#" aria-label="Facebook" className="social-icon-btn">
                <FacebookIcon />
              </a>
              <a href="#" aria-label="YouTube" className="social-icon-btn">
                <YouTubeIcon />
              </a>
            </div>
          </div>

          {/* Col 2 — Products */}
          <div>
            <h6
              className="mb-5"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              {t("footer.products")}
            </h6>
            <ul className="flex flex-col gap-3">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="footer-link">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Company */}
          <div>
            <h6
              className="mb-5"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              {t("footer.company")}
            </h6>
            <ul className="flex flex-col gap-3">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="footer-link">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h6
              className="mb-5"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              {t("footer.contact")}
            </h6>
            <ul className="flex flex-col gap-3">
              {contactItems.map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span style={{ color: "#A78BFA", fontSize: "15px", marginTop: "1px", flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px" }}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright bar */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-3 py-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-4" style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>
            <a href="#" className="hover:text-white transition-colors">{t("footer.terms")}</a>
            <span>·</span>
            <a href="#" className="hover:text-white transition-colors">{t("footer.privacy")}</a>
            <span>·</span>
            <a href="#" className="hover:text-white transition-colors">{t("footer.cookie")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
