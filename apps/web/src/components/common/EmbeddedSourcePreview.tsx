"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, Copy, Check, X, Globe, MessageSquare } from "lucide-react";
import { PlatformLogo } from "@/components/platform/PlatformLogo";

export interface EmbeddedSourcePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  url: string | null;
  title?: string;
  author?: string;
  platform?: string;
  contentSnippet?: string;
}

/**
 * Transforms standard post URLs into official iframe embed player URLs for TikTok, YouTube, and Facebook
 * so they load 100% natively directly INSIDE the modal box without being blocked by X-Frame-Options.
 */
export function getEmbeddableUrl(rawUrl: string | null, platformStr?: string): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const plat = String(platformStr || "").toLowerCase();

    // 1. TikTok official embed player URL
    if (host.includes("tiktok.com") || plat.includes("tiktok")) {
      const videoMatch = parsed.pathname.match(/\/video\/(\d+)/);
      if (videoMatch && videoMatch[1]) {
        return `https://www.tiktok.com/embed/v2/${videoMatch[1]}`;
      }
    }

    // 2. YouTube official embed player URL
    if (host.includes("youtube.com") || plat.includes("youtube")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    }
    if (host.includes("youtu.be")) {
      const videoId = parsed.pathname.replace(/^\//, "");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    }

    // 3. Facebook official embed plugin URL
    if (host.includes("facebook.com") || host.includes("fb.com") || plat.includes("facebook")) {
      const cleanUrl = rawUrl.replace(/#.*$/, "");
      return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(cleanUrl)}&show_text=true&width=500`;
    }
  } catch {
    // Return original url if parsing fails
  }
  return rawUrl;
}

export function EmbeddedSourcePreview({
  isOpen,
  onClose,
  url,
  title = "Nguồn bài viết",
  author,
  platform,
  contentSnippet,
}: EmbeddedSourcePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  const embedUrl = React.useMemo(() => getEmbeddableUrl(url, platform), [url, platform]);

  useEffect(() => {
    if (isOpen) {
      setIframeError(false);
      setIframeLoading(true);
      setCopied(false);
    }
  }, [isOpen, url]);

  if (!isOpen || !url) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy link:", err);
    }
  };

  const handleOpenNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-3 sm:p-6 backdrop-blur-xs animate-fade-in">
      <div
        className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-2xl transition-all dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
        aria-label="Khung xem nguồn bài viết"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
              <PlatformLogo platform={platform || ""} size="md" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm sm:text-base font-black text-[var(--color-text-primary)]">
                {title || (author ? `Nguồn từ ${author}` : "Nguồn bài viết")}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--color-text-secondary)]">
                <Globe size={12} className="shrink-0" />
                <span className="truncate">{url}</span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
              title="Sao chép liên kết"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              <span className="hidden sm:inline">{copied ? "Đã sao chép" : "Sao chép link"}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)]"
              title="Mở tab mới"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Mở tab mới</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)] hover:text-[var(--color-text-primary)]"
              title="Đóng khung xem nguồn"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Content Body - Official Embed Player inside the Modal Box */}
        <div className="relative flex-1 overflow-hidden bg-slate-950/20 dark:bg-slate-950/80">
          {!iframeError ? (
            <>
              {iframeLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--color-bg-surface)] p-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent" />
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Đang tải phát trực tiếp bài viết gốc trong khung...
                  </p>
                </div>
              )}
              <iframe
                src={embedUrl || url}
                className="h-full w-full border-0"
                onLoad={() => setIframeLoading(false)}
                onError={() => {
                  setIframeError(true);
                  setIframeLoading(false);
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
                title="Khung xem phát bài viết gốc"
              />
            </>
          ) : (
            /* Fallback preview if embed player encounters network failure */
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center overflow-y-auto">
              <div className="w-full max-w-xl space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 sm:p-8 shadow-2xl dark:bg-slate-900">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
                  <PlatformLogo platform={platform || ""} size="lg" />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-[var(--color-text-primary)]">
                    Bài viết từ {platform ? String(platform).toUpperCase() : "nền tảng"}
                  </h3>
                </div>

                {contentSnippet && (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-4 text-left shadow-xs">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand)]">
                      <MessageSquare size={16} />
                      <span>Trích dẫn bình luận {author ? `từ ${author}` : ""}</span>
                    </p>
                    <p className="mt-2 text-xs sm:text-sm italic leading-relaxed text-[var(--color-text-primary)]">
                      "{contentSnippet}"
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleOpenNewTab}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[var(--color-brand-hover)]"
                  >
                    <ExternalLink size={18} />
                    <span>Mở bài gốc trong tab mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-5 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
                  >
                    {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                    <span>{copied ? "Đã sao chép" : "Sao chép link"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
