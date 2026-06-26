"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import { PLATFORM_META } from "@/lib/services/dashboard";
import type { Lead } from "@/types/dashboard";

interface LeadCardProps {
  lead: Lead;
  currentTime: number;
}

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "chat",
  tiktok: "music_note",
  youtube: "play_circle",
  thread: "alternate_email",
  be: "restaurant",
  google_maps: "pin_drop",
  news: "newspaper",
};

const STATUS_META: Record<
  Lead["status"],
  { bg: string; text: string; dot: string }
> = {
  new: {
    bg: "bg-[var(--color-brand-subtle)] border-[var(--color-brand-border)]",
    text: "text-[var(--color-brand)]",
    dot: "bg-[var(--color-brand)]",
  },
  processing: {
    bg: "bg-[var(--color-warning-subtle)] border-[var(--color-warning)]/20",
    text: "text-[var(--color-warning)]",
    dot: "bg-[var(--color-warning)]",
  },
  completed: {
    bg: "bg-[var(--color-success-subtle)] border-[var(--color-success)]/30",
    text: "text-[var(--color-success)]",
    dot: "bg-[var(--color-success)]",
  },
  skipped: {
    bg: "bg-[var(--color-bg-surface-raised)] border-[var(--color-border)]",
    text: "text-[var(--color-text-muted)]",
    dot: "bg-[var(--color-text-muted)]",
  },
};

export function LeadCard({ lead, currentTime }: LeadCardProps) {
  const { t, i18n } = useTranslation();
  const { updateLeadDetails } = useDashboardStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Notes state
  const [noteText, setNoteText] = useState(lead.notes || "");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Sync state notes when lead changes
  useEffect(() => {
    setNoteText(lead.notes || "");
  }, [lead.notes]);

  // Compute Expiry Time based on intent
  const getExpiryTime = () => {
    if (lead.expiry_at) return new Date(lead.expiry_at).getTime();
    const durationMin =
      lead.intent === "hot"
        ? 30
        : lead.intent === "warm"
          ? 24 * 60
          : 7 * 24 * 60;
    return new Date(lead.created_at).getTime() + durationMin * 60 * 1000;
  };

  const expiryTime = getExpiryTime();
  const remainingSeconds = Math.max(
    0,
    Math.floor((expiryTime - currentTime) / 1000),
  );
  const isExpired = remainingSeconds === 0;

  // Handle direct contact action
  const handleContactAction = async (channel: string, link: string) => {
    try {
      setIsSaving(true);
      setSaveError(null);

      // Auto-transition: Status from "new" to "processing" and increment contact attempts
      const updatedData: Partial<Lead> = {
        contact_attempts: (lead.contact_attempts || 0) + 1,
        last_contact_at: new Date().toISOString(),
      };

      if (lead.status === "new") {
        updatedData.status = "processing";
      }

      await updateLeadDetails(lead.id, updatedData);

      // Open contact link in new tab
      window.open(link, "_blank");
    } catch (err) {
      setSaveError(t("leads.errors.contact", { channel }));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Status select changes
  const handleStatusChange = async (newStatus: Lead["status"]) => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await updateLeadDetails(lead.id, { status: newStatus });
    } catch (err) {
      setSaveError(t("leads.errors.status"));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Notes update
  const handleSaveNote = async () => {
    try {
      setIsSavingNote(true);
      setSaveError(null);
      await updateLeadDetails(lead.id, { notes: noteText });
      setIsEditingNote(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (err) {
      setSaveError(t("leads.errors.saveNote"));
      console.error(err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Expiry layout calculations
  const renderExpiryIndicator = () => {
    if (lead.status === "completed" || lead.status === "skipped") return null;

    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 bg-error-container/10 border border-error/20 text-error px-2 py-0.5 rounded text-[11px] font-bold">
          <span className="material-symbols-outlined text-[13px]">warning</span>{" "}
          Quá hạn
        </span>
      );
    }

    if (lead.intent === "hot") {
      const m = Math.floor(remainingSeconds / 60);
      const s = remainingSeconds % 60;
      const formatted = `${m}:${s < 10 ? "0" + s : s}s`;
      const isUrgent = remainingSeconds < 10 * 60;

      return (
        <div className="flex items-center gap-1">
          <span
            className={`material-symbols-outlined text-[14px] ${isUrgent ? "text-error animate-pulse" : "text-primary"}`}
          >
            timer
          </span>
          <span
            className={`font-bold text-xs ${isUrgent ? "text-error animate-pulse font-extrabold" : "text-primary"}`}
          >
            {formatted}
          </span>
        </div>
      );
    }

    if (lead.intent === "warm") {
      const h = Math.floor(remainingSeconds / 3600);
      const m = Math.floor((remainingSeconds % 3600) / 60);
      const formatted = h > 0 
        ? t("leads.card.remainingHours", { hours: h, mins: m }) 
        : t("leads.card.remainingMins", { mins: m });
      const isUrgent = remainingSeconds < 2 * 60 * 60; // < 2h

      return (
        <div className="flex items-center gap-1 text-secondary">
          <span
            className={`material-symbols-outlined text-[14px] ${isUrgent ? "animate-bounce" : ""}`}
          >
            schedule
          </span>
          <span
            className={`font-bold text-xs ${isUrgent ? "text-secondary font-extrabold" : ""}`}
          >
            {formatted}
          </span>
        </div>
      );
    }

    if (lead.intent === "cold") {
      const remainingDays = Math.ceil(remainingSeconds / (24 * 60 * 60));
      const dateStr = new Date(expiryTime).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });

      return (
        <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
          <span className="material-symbols-outlined text-[14px]">
            calendar_today
          </span>
          <span className="text-xs font-semibold">
            {t("leads.card.deadline", { date: dateStr, days: remainingDays })}
          </span>
        </div>
      );
    }

    return null;
  };

  const authorName = lead.author || t("leads.card.defaultCustomer", { defaultValue: "Customer" });

  const getInitials = (name: string) => {
    if (!name) return "KH";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Styling helpers
  const platformMeta = PLATFORM_META[lead.platform] || {
    label: "Khác",
    color: "#666",
  };
  const platformIcon = PLATFORM_ICONS[lead.platform] || "public";
  const statusInfo = STATUS_META[lead.status];
  const contactUrl = lead.social_profile_url?.trim();
  const originalPostUrl = lead.url?.trim();
  const postLinkUrl = originalPostUrl;
  const shouldShowProfileContact = Boolean(contactUrl);

  const getProfileContactMeta = (url?: string) => {
    const normalizedUrl = (url || "").toLowerCase();
    if (
      normalizedUrl.includes("facebook.com") ||
      normalizedUrl.includes("fb.com")
    ) {
      return {
        label: "Liên hệ",
        icon: "chat",
        title: "Liên hệ qua Facebook",
        className:
          "bg-[#0084FF]/10 hover:bg-[#0084FF]/20 text-[#0084FF] border-[#0084FF]/20",
      };
    }
    if (normalizedUrl.includes("tiktok.com")) {
      return {
        label: "Liên hệ",
        icon: "music_note",
        title: "Liên hệ qua TikTok",
        className:
          "bg-[#111827]/10 hover:bg-[#111827]/20 text-[#111827] border-[#111827]/20",
      };
    }
    if (
      normalizedUrl.includes("youtube.com") ||
      normalizedUrl.includes("youtu.be")
    ) {
      return {
        label: "Liên hệ",
        icon: "play_circle",
        title: "Liên hệ qua YouTube",
        className:
          "bg-[#FF0000]/10 hover:bg-[#FF0000]/20 text-[#FF0000] border-[#FF0000]/20",
      };
    }
    return {
      label: "Liên hệ",
      icon: "contact_page",
      title: "Liên hệ với khách hàng",
      className:
        "bg-[var(--color-info-subtle)] hover:bg-[var(--color-info)]/20 text-[var(--color-info)] border-[var(--color-info)]/30",
    };
  };

  const profileContactMeta = getProfileContactMeta(contactUrl);

  const getBorderClass = () => {
    if (lead.status === "completed" || lead.status === "skipped") {
      return "border-l-4 border-[var(--color-border)] opacity-75 grayscale-[0.1]";
    }
    if (lead.intent === "hot") {
      return isExpired
        ? "border-l-4 border-[var(--color-border)]"
        : "border-l-4 border-[var(--color-error)] shadow-sm";
    }
    if (lead.intent === "warm") {
      return "border-l-4 border-[var(--color-warning)]";
    }
    return "border-l-4 border-[var(--color-border)]";
  };

  const getAvatarBg = (name: string) => {
    const colors = [
      "bg-[var(--color-info-subtle)] text-[var(--color-info)] border-[var(--color-info)]/20",
      "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border-[var(--color-brand-border)]",
      "bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border-[var(--color-warning)]/20",
      "bg-[var(--color-error-subtle)] text-[var(--color-error)] border-[var(--color-error)]/20",
      "bg-[var(--color-success-subtle)] text-[var(--color-success)] border-[var(--color-success)]/20",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={`glass-card rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition-all duration-300 ${getBorderClass()}`}
    >
      <div className="p-4 md:p-6 space-y-4">
        {/* Core Layout Grid */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Avatar + Author Details */}
          <div className="flex items-center gap-3 sm:w-56 flex-shrink-0">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-full border flex items-center justify-center font-bold text-sm shadow-sm ${getAvatarBg(
                  lead.author || "Khách hàng",
                )}`}
              >
                {getInitials(authorName)}
              </div>
              <div
                className="absolute -bottom-1 -right-1 p-0.5 rounded-full border shadow-sm flex items-center justify-center"
                style={{
                  color: platformMeta.color,
                  backgroundColor: "var(--color-bg-surface)",
                  borderColor: "var(--color-border)",
                }}
                title={platformMeta.label}
              >
                <span
                  className="material-symbols-outlined text-[13px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {platformIcon}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1">
                {authorName}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {renderExpiryIndicator()}
              </div>
            </div>
          </div>

          {/* Core Content & Intent Tags */}
          <div className="flex-1 space-y-2.5">
            <p className="text-body-md text-[var(--color-text-primary)] leading-relaxed font-medium">
              {lead.content}
            </p>

            {/* Meta tags & Details line */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {/* Brand Tag */}
              <span className="bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[var(--color-border)]">
                {lead.workspace_id}
              </span>

              {/* Purchase Intent Tag */}
              {lead.intent === "hot" && (
                <span className="bg-[var(--color-error-subtle)] text-[var(--color-error)] px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">
                    local_fire_department
                  </span>{" "}
                  HOT
                </span>
              )}
              {lead.intent === "warm" && (
                <span className="bg-[var(--color-warning-subtle)] text-[var(--color-warning)] px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">
                    analytics
                  </span>{" "}
                  WARM
                </span>
              )}
              {lead.intent === "cold" && (
                <span className="bg-[var(--color-bg-surface-high)] text-[var(--color-text-muted)] px-2 py-0.5 rounded text-[10px] font-bold">
                  {t("leads.tabs.cold").toUpperCase()}
                </span>
              )}

              {/* Keyword Signals */}
              {lead.intent_signals.map((sig, i) => (
                <span
                  key={i}
                  className="bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)] px-2 py-0.5 rounded text-[10px] font-medium"
                >
                  {sig}
                </span>
              ))}

              {/* Attempts tag */}
              {lead.contact_attempts && lead.contact_attempts > 0 ? (
                <span className="bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 border border-[var(--color-border)]">
                  <span className="material-symbols-outlined text-xs">
                    call_made
                  </span>{" "}
                  Đã tiếp cận {lead.contact_attempts} lần
                </span>
              ) : null}
            </div>

            {(lead.phone || lead.email || postLinkUrl) && (
              <div className="flex flex-wrap gap-2 mt-3 text-[12px] text-[var(--color-text-secondary)] items-center">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-bg-surface-high)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      call
                    </span>
                    {lead.phone}
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-bg-surface-high)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      email
                    </span>
                    {lead.email}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center sm:justify-end gap-3 sm:flex-shrink-0 self-start">
            <div className="relative">
              <select
                value={lead.status}
                disabled={isSaving}
                onChange={(e) =>
                  handleStatusChange(e.target.value as Lead["status"])
                }
                className={`appearance-none pl-3 pr-8 py-1.5 border rounded-full text-xs font-bold focus:ring-1 outline-none transition-all cursor-pointer shadow-sm ${statusInfo.bg} ${statusInfo.text} ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{ backgroundColor: "var(--color-bg-surface)" }}
              >
                <option value="new" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>🟢 {t("leads.card.status.new")}</option>
                <option value="processing" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>🟡 {t("leads.card.status.processing")}</option>
                <option value="completed" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>🔵 {t("leads.card.status.completed")}</option>
                <option value="skipped" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>⚫ {t("leads.card.status.skipped")}</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-[var(--color-brand)]/20 border-t-[var(--color-brand)] rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-[var(--color-text-muted)]">
                    keyboard_arrow_down
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action / Contact Buttons and Notes section */}
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* Direct Contact/Approach Buttons (UX Auto-Transition triggers) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Zalo Contact */}
            {lead.zalo_id && (
              <button
                onClick={() =>
                  handleContactAction("Zalo", `https://zalo.me/${lead.zalo_id}`)
                }
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0068ff]/10 hover:bg-[#0068ff]/20 text-[#0068ff] border border-[#0068ff]/20 rounded-lg text-xs font-bold transition-all"
                title={t("leads.card.zaloTooltip")}
              >
                <span className="material-symbols-outlined text-base">
                  forum
                </span>
                Zalo
              </button>
            )}

            {/* Messenger Contact */}
            {lead.messenger_id && (
              <button
                onClick={() =>
                  handleContactAction(
                    "Messenger",
                    `https://m.me/${lead.messenger_id}`,
                  )
                }
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0084FF]/10 hover:bg-[#0084FF]/20 text-[#0084FF] border border-[#0084FF]/20 rounded-lg text-xs font-bold transition-all"
                title={t("leads.card.messengerTooltip")}
              >
                <span className="material-symbols-outlined text-base">
                  chat
                </span>
                Messenger
              </button>
            )}

            {/* Email Contact */}
            {lead.email && (
              <button
                onClick={() =>
                  handleContactAction("Email", `mailto:${lead.email}`)
                }
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-info-subtle)] hover:bg-[var(--color-info)]/20 text-[var(--color-info)] border border-[var(--color-info)]/30 rounded-lg text-xs font-bold transition-all"
                title={`Gửi email tới ${lead.email}`}
              >
                <span className="material-symbols-outlined text-base">
                  email
                </span>
                Email
              </button>
            )}

            {/* Contact Link */}
            {shouldShowProfileContact && contactUrl && (
              <button
                onClick={() =>
                  handleContactAction(profileContactMeta.label, contactUrl)
                }
                disabled={isSaving}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${profileContactMeta.className}`}
                title={profileContactMeta.title}
              >
                <span className="material-symbols-outlined text-base">
                  {profileContactMeta.icon}
                </span>
                Liên hệ
              </button>
            )}

            {/* Original Post */}
            {postLinkUrl && (
              <a
                href={postLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  // Increments attempt but does not block URL open
                  if (lead.status === "new") {
                    updateLeadDetails(lead.id, {
                      status: "processing",
                      contact_attempts: (lead.contact_attempts || 0) + 1,
                      last_contact_at: new Date().toISOString(),
                    });
                  } else {
                    updateLeadDetails(lead.id, {
                      contact_attempts: (lead.contact_attempts || 0) + 1,
                      last_contact_at: new Date().toISOString(),
                    });
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-bg-surface-high)] text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg text-xs font-bold transition-all"
                title={t("leads.card.viewPostTooltip")}
              >
                <span className="material-symbols-outlined text-base">
                  open_in_new
                </span>
                Xem bài viết gốc
              </a>
            )}
          </div>

          {/* CRM Note Field */}
          <div className="flex-1 max-w-md flex items-center gap-2 self-stretch lg:self-auto mt-2 lg:mt-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={noteText}
                placeholder={t("leads.card.notePlaceholder")}
                onChange={(e) => {
                  setNoteText(e.target.value);
                  setIsEditingNote(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveNote();
                }}
                disabled={isSavingNote}
                className="w-full pl-3 pr-9 py-1.5 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary transition-all"
                style={{
                  backgroundColor: "var(--color-bg-surface-raised)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
              {isEditingNote && (
                <button
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-primary hover:bg-primary/10 rounded flex items-center justify-center transition-all"
                  title={t("leads.card.saveNoteTooltip", { defaultValue: "Lưu ghi chú" })}
                >
                  {isSavingNote ? (
                    <span className="w-3.5 h-3.5 border border-primary/20 border-t-primary rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-symbols-outlined text-base">
                      check
                    </span>
                  )}
                </button>
              )}
            </div>

            {showSaveSuccess && (
              <span className="text-[10px] text-[var(--color-success)] font-bold flex items-center gap-0.5 animate-bounce">
                <span className="material-symbols-outlined text-xs">
                  check_circle
                </span>{" "}
                Đã lưu
              </span>
            )}
          </div>
        </div>

        {/* Error / Last updated log row */}
        {(saveError || lead.last_contact_at) && (
          <div className="flex items-center justify-between text-[10px] font-medium text-[var(--color-text-muted)] pt-1">
            <div>
              {lead.last_contact_at && (
                <span>
                  Liên hệ cuối:{" "}
                  {new Date(lead.last_contact_at).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  ngày{" "}
                  {new Date(lead.last_contact_at).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              )}
            </div>

            {saveError && (
              <span className="text-[var(--color-error)] flex items-center gap-0.5 font-bold animate-pulse">
                <span className="material-symbols-outlined text-xs">error</span>
                {saveError}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
