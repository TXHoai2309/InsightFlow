"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, Copy, Check, X, ShieldAlert, Globe, MessageSquare } from "lucide-react";
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
 * Transforms standard video URLs (TikTok, YouTube) into official iframe embed player URLs
 * so they render natively inside the modal without frame restriction blocks.
 */
export function getEmbeddableUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);

    // TikTok official embed player conversion
    if (parsed.hostname.includes("tiktok.com")) {
      const videoMatch = parsed.pathname.match(/\/video\/(\d+)/);
      if (videoMatch && videoMatch[1]) {
        return `https://www.tiktok.com/embed/v2/${videoMatch[1]}`;
      }
    }

    // YouTube official embed player conversion
    if (parsed.hostname.includes("youtube.com") && parsed.searchParams.get("v")) {
      const videoId = parsed.searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace(/^\//, "");
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
  } catch {
    // Return original url if URL parsing fails
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

  const embedUrl = React.useMemo(() => getEmbeddableUrl(url), [url]);

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
        aria-label="Khung xem nguồn"
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

        {/* Content Body - Iframe Player & Preview */}
        <div className="relative flex-1 overflow-hidden bg-slate-950/10 dark:bg-slate-950/60">
          {!iframeError ? (
            <>
              {iframeLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--color-bg-surface)] p-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent" />
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Đang tải nội dung bài viết gốc...
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
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
                title="Khung xem bài viết gốc"
              />
            </>
          ) : (
            /* Fallback Card when Iframe Framing is explicitly blocked by browser */
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center overflow-y-auto">
              <div className="max-w-lg space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-xl dark:bg-slate-900">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--color-text-primary)]">
                    Nền tảng này không cho xem trực tiếp trong iframe
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    Bạn vẫn có thể bấm nút bên dưới để mở bài viết gốc trong tab mới hoặc sao chép liên kết.
                  </p>
                </div>

                {contentSnippet && (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 text-left">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-brand)]">
                      <MessageSquare size={14} />
                      <span>Trích dẫn bài viết {author ? `từ ${author}` : ""}</span>
                    </p>
                    <p className="mt-1 line-clamp-4 text-xs italic leading-relaxed text-[var(--color-text-primary)]">
                      &ldquo;{contentSnippet}&rdquo;
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
                  >
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                    <span>{copied ? "Đã sao chép link" : "Sao chép link"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenNewTab}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 text-xs font-bold text-white shadow-md hover:bg-[var(--color-brand-hover)]"
                  >
                    <ExternalLink size={16} />
                    <span>Mở tab mới ngay</span>
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
