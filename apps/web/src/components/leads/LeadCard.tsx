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

export function LeadCard({ lead, currentTime }: LeadCardProps) {
  const { updateLeadDetails } = useDashboardStore();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [noteText, setNoteText] = useState(lead.notes || "");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    setNoteText(lead.notes || "");
  }, [lead.notes]);

  const platformMeta = PLATFORM_META[lead.platform] || { label: lead.platform, color: "#888" };
  const platformIcon = PLATFORM_ICONS[lead.platform] || "public";

  const getExpiryTime = () => {
    if (lead.expiry_at) return new Date(lead.expiry_at).getTime();
    const durationMin = lead.intent === "hot" ? 30 : lead.intent === "warm" ? 24 * 60 : 7 * 24 * 60;
    return new Date(lead.created_at).getTime() + durationMin * 60 * 1000;
  };

  const expiryTime = getExpiryTime();
  const remainingSeconds = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
  const isExpired = remainingSeconds === 0;

  const statusMeta = {
    new: { label: t("leads.statusLabel.new"), bg: "bg-[var(--color-brand-subtle)] border-[var(--color-brand-border)]", text: "text-[var(--color-brand)]", dot: "bg-[var(--color-brand)]" },
    processing: { label: t("leads.statusLabel.processing"), bg: "bg-[var(--color-warning-subtle)] border-[var(--color-warning)]/20", text: "text-[var(--color-warning)]", dot: "bg-[var(--color-warning)]" },
    completed: { label: t("leads.statusLabel.completed"), bg: "bg-[var(--color-success-subtle)] border-[var(--color-success)]/30", text: "text-[var(--color-success)]", dot: "bg-[var(--color-success)]" },
    skipped: { label: t("leads.statusLabel.skipped"), bg: "bg-[var(--color-bg-surface-raised)] border-[var(--color-border)]", text: "text-[var(--color-text-muted)]", dot: "bg-[var(--color-text-muted)]" },
  };

  const statusInfo = statusMeta[lead.status] || statusMeta.new;

  const handleContactAction = async (channel: string, link: string) => {
    try {
      setIsSaving(true);
      setSaveError(null);
      const updatedData: Partial<Lead> = {
        contact_attempts: (lead.contact_attempts || 0) + 1,
        last_contact_at: new Date().toISOString(),
      };
      if (lead.status === "new") updatedData.status = "processing";
      await updateLeadDetails(lead.id, updatedData);
      window.open(link, "_blank");
    } catch (err) {
      setSaveError(`${t("leads.contact.error")} ${channel}`);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: Lead["status"]) => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await updateLeadDetails(lead.id, { status: newStatus });
    } catch (err) {
      setSaveError(t("leads.note.errorStatus"));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNote = async () => {
    try {
      setIsSavingNote(true);
      setSaveError(null);
      await updateLeadDetails(lead.id, { notes: noteText });
      setIsEditingNote(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (err) {
      setSaveError(t("leads.note.errorSave"));
      console.error(err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderExpiryIndicator = () => {
    if (lead.status === "completed" || lead.status === "skipped") return null;

    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 bg-error-container/10 border border-error/20 text-error px-2 py-0.5 rounded text-[11px] font-bold">
          <span className="material-symbols-outlined text-[13px]">warning</span> {t("leads.expiry.overdue")}
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
          <span className={`material-symbols-outlined text-[14px] ${isUrgent ? "text-error animate-pulse" : "text-primary"}`}>timer</span>
          <span className={`font-bold text-xs ${isUrgent ? "text-error animate-pulse font-extrabold" : "text-primary"}`}>{formatted}</span>
        </div>
      );
    }

    if (lead.intent === "warm") {
      const h = Math.floor(remainingSeconds / 3600);
      const m = Math.floor((remainingSeconds % 3600) / 60);
      const formatted = h > 0 ? `${t("leads.expiry.remaining")} ${h}h ${m}m` : `${t("leads.expiry.remaining")} ${m}m`;
      const isUrgent = remainingSeconds < 2 * 60 * 60;
      return (
        <div className="flex items-center gap-1 text-secondary">
          <span className={`material-symbols-outlined text-[14px] ${isUrgent ? "animate-bounce" : ""}`}>schedule</span>
          <span className={`font-bold text-xs ${isUrgent ? "text-secondary font-extrabold" : ""}`}>{formatted}</span>
        </div>
      );
    }

    if (lead.intent === "cold") {
      const remainingDays = Math.ceil(remainingSeconds / (24 * 60 * 60));
      const dateStr = new Date(expiryTime).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
      return (
        <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
          <span className="text-xs font-semibold">
            {t("leads.expiry.deadline")}: {dateStr} ({t("leads.expiry.remaining")} {remainingDays} {t("leads.expiry.days")})
          </span>
        </div>
      );
    }

    return null;
  };

  const getBorderClass = () => {
    if (lead.intent === "hot") return "border-l-4 border-[var(--color-error)]";
    if (lead.intent === "warm") return "border-l-4 border-[var(--color-warning)]";
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
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const customerLabel = t("leads.customer");

  return (
    <div className={`glass-card rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition-all duration-300 ${getBorderClass()}`}>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Avatar + Author */}
          <div className="flex items-center gap-3 sm:w-56 flex-shrink-0">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-bold text-sm shadow-sm ${getAvatarBg(lead.author || customerLabel)}`}>
                {getInitials(lead.author || customerLabel)}
              </div>
              <div
                className="absolute -bottom-1 -right-1 p-0.5 rounded-full border shadow-sm flex items-center justify-center"
                style={{ color: platformMeta.color, backgroundColor: "var(--color-bg-surface)", borderColor: "var(--color-border)" }}
                title={platformMeta.label}
              >
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>{platformIcon}</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1">{lead.author || customerLabel}</h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">{renderExpiryIndicator()}</div>
            </div>
          </div>

          {/* Content & Tags */}
          <div className="flex-1 space-y-2.5">
            <p className="text-body-md text-[var(--color-text-primary)] leading-relaxed font-medium">{lead.content}</p>
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[var(--color-border)]">
                {lead.workspace_id}
              </span>
              {lead.intent === "hot" && (
                <span className="bg-[var(--color-error-subtle)] text-[var(--color-error)] px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">local_fire_department</span> HOT
                </span>
              )}
              {lead.intent === "warm" && (
                <span className="bg-[var(--color-warning-subtle)] text-[var(--color-warning)] px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">analytics</span> WARM
                </span>
              )}
              {lead.intent === "cold" && (
                <span className="bg-[var(--color-bg-surface-high)] text-[var(--color-text-muted)] px-2 py-0.5 rounded text-[10px] font-bold">COLD</span>
              )}
              {lead.intent_signals.map((sig, i) => (
                <span key={i} className="bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)] px-2 py-0.5 rounded text-[10px] font-medium">{sig}</span>
              ))}
              {lead.contact_attempts && lead.contact_attempts > 0 ? (
                <span className="bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 border border-[var(--color-border)]">
                  <span className="material-symbols-outlined text-xs">call_made</span>
                  {t("leads.contact.attempts")} {lead.contact_attempts} {t("leads.contact.attemptsSuffix")}
                </span>
              ) : null}
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center sm:justify-end gap-3 sm:flex-shrink-0 self-start">
            <div className="relative">
              <select
                value={lead.status}
                disabled={isSaving}
                onChange={(e) => handleStatusChange(e.target.value as Lead["status"])}
                className={`appearance-none pl-3 pr-8 py-1.5 border rounded-full text-xs font-bold focus:ring-1 outline-none transition-all cursor-pointer shadow-sm ${statusInfo.bg} ${statusInfo.text} ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{ backgroundColor: "var(--color-bg-surface)" }}
              >
                <option value="new">{t("leads.status.new")}</option>
                <option value="processing">{t("leads.status.processing")}</option>
                <option value="completed">{t("leads.status.completed")}</option>
                <option value="skipped">{t("leads.status.skipped")}</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-[var(--color-brand)]/20 border-t-[var(--color-brand)] rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-[var(--color-text-muted)]">keyboard_arrow_down</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions & Notes */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex flex-wrap items-center gap-2">
            {lead.zalo_id && (
              <button onClick={() => handleContactAction("Zalo", `https://zalo.me/${lead.zalo_id}`)} disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0068ff]/10 hover:bg-[#0068ff]/20 text-[#0068ff] border border-[#0068ff]/20 rounded-lg text-xs font-bold transition-all">
                <span className="material-symbols-outlined text-base">forum</span>
                {t("leads.contact.zalo")}
              </button>
            )}
            {lead.messenger_id && (
              <button onClick={() => handleContactAction("Messenger", `https://m.me/${lead.messenger_id}`)} disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0084FF]/10 hover:bg-[#0084FF]/20 text-[#0084FF] border border-[#0084FF]/20 rounded-lg text-xs font-bold transition-all">
                <span className="material-symbols-outlined text-base">chat</span>
                {t("leads.contact.messenger")}
              </button>
            )}
            {lead.phone && (
              <>
                <button onClick={() => handleContactAction("Call", `tel:${lead.phone}`)} disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-success-subtle)] hover:bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30 rounded-lg text-xs font-bold transition-all">
                  <span className="material-symbols-outlined text-base">call</span>
                  {t("leads.contact.call")} ({lead.phone.slice(-4)})
                </button>
                <button onClick={() => { navigator.clipboard.writeText(lead.phone || ""); alert(t("leads.contact.copyPhone")); }}
                  className="p-1.5 hover:bg-[var(--color-bg-surface-raised)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </>
            )}
            {lead.url && (
              <a href={lead.url} target="_blank" rel="noopener noreferrer"
                onClick={() => {
                  if (lead.status === "new") {
                    updateLeadDetails(lead.id, { status: "processing", contact_attempts: (lead.contact_attempts || 0) + 1, last_contact_at: new Date().toISOString() });
                  } else {
                    updateLeadDetails(lead.id, { contact_attempts: (lead.contact_attempts || 0) + 1, last_contact_at: new Date().toISOString() });
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-bg-surface-high)] text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg text-xs font-bold transition-all">
                <span className="material-symbols-outlined text-base">open_in_new</span>
                {t("leads.contact.viewPost")}
              </a>
            )}
          </div>

          {/* Note field */}
          <div className="flex-1 max-w-md flex items-center gap-2 self-stretch lg:self-auto mt-2 lg:mt-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={noteText}
                placeholder={t("leads.note.placeholder")}
                onChange={(e) => { setNoteText(e.target.value); setIsEditingNote(true); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(); }}
                disabled={isSavingNote}
                className="w-full pl-3 pr-9 py-1.5 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary transition-all"
                style={{ backgroundColor: "var(--color-bg-surface-raised)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
              />
              {isEditingNote && (
                <button onClick={handleSaveNote} disabled={isSavingNote} title={t("leads.note.save")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-primary hover:bg-primary/10 rounded flex items-center justify-center transition-all">
                  {isSavingNote ? (
                    <span className="w-3.5 h-3.5 border border-primary/20 border-t-primary rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-symbols-outlined text-base">check</span>
                  )}
                </button>
              )}
            </div>
            {showSaveSuccess && (
              <span className="text-[10px] text-[var(--color-success)] font-bold flex items-center gap-0.5 animate-bounce">
                <span className="material-symbols-outlined text-xs">check_circle</span> {t("leads.note.saved")}
              </span>
            )}
          </div>
        </div>

        {/* Error / Last contact row */}
        {(saveError || lead.last_contact_at) && (
          <div className="flex items-center justify-between text-[10px] font-medium text-[var(--color-text-muted)] pt-1">
            <div>
              {lead.last_contact_at && (
                <span>
                  {t("leads.lastContact")} {new Date(lead.last_contact_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} {new Date(lead.last_contact_at).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" })}
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
