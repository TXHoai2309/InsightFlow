"use client";

import React, { useState, useEffect } from "react";
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

const STATUS_META: Record<Lead["status"], { label: string; bg: string; text: string; dot: string }> = {
  new: {
    label: "Mới",
    bg: "bg-primary-container/10 border-primary/20",
    text: "text-primary",
    dot: "bg-primary",
  },
  processing: {
    label: "Đang xử lý",
    bg: "bg-tertiary-container/15 border-tertiary/20",
    text: "text-tertiary",
    dot: "bg-tertiary",
  },
  completed: {
    label: "Đã xử lý",
    bg: "bg-green-50 border-green-200",
    text: "text-green-700",
    dot: "bg-green-600",
  },
  skipped: {
    label: "Bỏ qua",
    bg: "bg-outline-variant/10 border-outline-variant/30",
    text: "text-on-surface-variant/80",
    dot: "bg-outline",
  },
};

export function LeadCard({ lead, currentTime }: LeadCardProps) {
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
    const durationMin = lead.intent === "hot" ? 30 : lead.intent === "warm" ? 24 * 60 : 7 * 24 * 60;
    return new Date(lead.created_at).getTime() + durationMin * 60 * 1000;
  };

  const expiryTime = getExpiryTime();
  const remainingSeconds = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
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
      setSaveError(`Lỗi liên hệ qua ${channel}`);
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
      setSaveError("Không thể cập nhật trạng thái");
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
      setSaveError("Không thể lưu ghi chú");
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
          <span className="material-symbols-outlined text-[13px]">warning</span> Quá hạn
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
          <span className={`material-symbols-outlined text-[14px] ${isUrgent ? "text-error animate-pulse" : "text-primary"}`}>
            timer
          </span>
          <span className={`font-bold text-xs ${isUrgent ? "text-error animate-pulse font-extrabold" : "text-primary"}`}>
            {formatted}
          </span>
        </div>
      );
    }

    if (lead.intent === "warm") {
      const h = Math.floor(remainingSeconds / 3600);
      const m = Math.floor((remainingSeconds % 3600) / 60);
      const formatted = h > 0 ? `Còn ${h}h ${m}p` : `Còn ${m}p`;
      const isUrgent = remainingSeconds < 2 * 60 * 60; // < 2h

      return (
        <div className="flex items-center gap-1 text-secondary">
          <span className={`material-symbols-outlined text-[14px] ${isUrgent ? "animate-bounce" : ""}`}>
            schedule
          </span>
          <span className={`font-bold text-xs ${isUrgent ? "text-secondary font-extrabold" : ""}`}>
            {formatted}
          </span>
        </div>
      );
    }

    if (lead.intent === "cold") {
      const remainingDays = Math.ceil(remainingSeconds / (24 * 60 * 60));
      const dateStr = new Date(expiryTime).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      
      return (
        <div className="flex items-center gap-1 text-on-surface-variant/80">
          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
          <span className="text-xs font-semibold">
            Hạn: {dateStr} (Còn {remainingDays} ngày)
          </span>
        </div>
      );
    }

    return null;
  };

  const getInitials = (name: string) => {
    if (!name) return "KH";
    return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  };

  // Styling helpers
  const platformMeta = PLATFORM_META[lead.platform] || { label: "Khác", color: "#666" };
  const platformIcon = PLATFORM_ICONS[lead.platform] || "public";
  const statusInfo = STATUS_META[lead.status];

  const getBorderClass = () => {
    if (lead.status === "completed" || lead.status === "skipped") {
      return "border-l-4 border-outline-variant/40 opacity-75 grayscale-[0.1]";
    }
    if (lead.intent === "hot") {
      return isExpired ? "border-l-4 border-outline-variant" : "border-l-4 border-error shadow-sm";
    }
    if (lead.intent === "warm") {
      return "border-l-4 border-secondary";
    }
    return "border-l-4 border-outline-variant/40";
  };

  const getAvatarBg = (name: string) => {
    const colors = [
      "bg-blue-50 text-blue-700 border-blue-100",
      "bg-purple-50 text-purple-700 border-purple-100",
      "bg-orange-50 text-orange-700 border-orange-100",
      "bg-pink-50 text-pink-700 border-pink-100",
      "bg-teal-50 text-teal-700 border-teal-100",
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
                  lead.author || "Khách hàng"
                )}`}
              >
                {getInitials(lead.author || "Khách hàng")}
              </div>
              <div
                className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full border border-outline-variant shadow-sm flex items-center justify-center"
                style={{ color: platformMeta.color }}
                title={platformMeta.label}
              >
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {platformIcon}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm font-bold text-on-surface line-clamp-1">
                {lead.author || "Khách hàng"}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {renderExpiryIndicator()}
              </div>
            </div>
          </div>

          {/* Core Content & Intent Tags */}
          <div className="flex-1 space-y-2.5">
            <p className="text-body-md text-on-surface leading-relaxed font-medium">
              {lead.content}
            </p>
            
            {/* Meta tags & Details line */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {/* Brand Tag */}
              <span className="bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {lead.workspace_id}
              </span>

              {/* Purchase Intent Tag */}
              {lead.intent === "hot" && (
                <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">local_fire_department</span> HOT
                </span>
              )}
              {lead.intent === "warm" && (
                <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">analytics</span> WARM
                </span>
              )}
              {lead.intent === "cold" && (
                <span className="bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold">
                  COLD
                </span>
              )}

              {/* Keyword Signals */}
              {lead.intent_signals.map((sig, i) => (
                <span
                  key={i}
                  className="bg-surface-container-high text-on-surface-variant/80 px-2 py-0.5 rounded text-[10px] font-medium"
                >
                  {sig}
                </span>
              ))}

              {/* Attempts tag */}
              {lead.contact_attempts && lead.contact_attempts > 0 ? (
                <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">call_made</span> Đã tiếp cận {lead.contact_attempts} lần
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
                className={`appearance-none pl-3 pr-8 py-1.5 bg-white border rounded-full text-xs font-bold focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer text-on-surface flex items-center gap-1.5 shadow-sm ${statusInfo.bg} ${statusInfo.text} ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <option value="new">🟢 Mới</option>
                <option value="processing">🟡 Đang xử lý</option>
                <option value="completed">🔵 Đã xử lý</option>
                <option value="skipped">⚫ Bỏ qua</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-on-surface-variant/70">keyboard_arrow_down</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Action / Contact Buttons and Notes section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-outline-variant/40">
          
          {/* Direct Contact/Approach Buttons (UX Auto-Transition triggers) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Zalo Contact */}
            {lead.zalo_id && (
              <button
                onClick={() => handleContactAction("Zalo", `https://zalo.me/${lead.zalo_id}`)}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0068ff]/10 hover:bg-[#0068ff]/20 text-[#0068ff] border border-[#0068ff]/20 rounded-lg text-xs font-bold transition-all"
                title="Mở Zalo chat"
              >
                <span className="material-symbols-outlined text-base">forum</span>
                Zalo
              </button>
            )}

            {/* Messenger Contact */}
            {lead.messenger_id && (
              <button
                onClick={() => handleContactAction("Messenger", `https://m.me/${lead.messenger_id}`)}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0084FF]/10 hover:bg-[#0084FF]/20 text-[#0084FF] border border-[#0084FF]/20 rounded-lg text-xs font-bold transition-all"
                title="Mở Facebook Messenger"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                Messenger
              </button>
            )}

            {/* Call Phone Link */}
            {lead.phone && (
              <>
                <button
                  onClick={() => handleContactAction("Call", `tel:${lead.phone}`)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-bold transition-all"
                  title={`Gọi số điện thoại ${lead.phone}`}
                >
                  <span className="material-symbols-outlined text-base">call</span>
                  Gọi điện ({lead.phone.slice(-4)})
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(lead.phone || "");
                    alert("Đã copy số điện thoại!");
                  }}
                  className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant/80 hover:text-on-surface transition-all flex items-center justify-center"
                  title="Copy SĐT"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </>
            )}

            {/* Original Post */}
            {lead.url && (
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  // Increments attempt but does not block URL open
                  if (lead.status === "new") {
                    updateLeadDetails(lead.id, {
                      status: "processing",
                      contact_attempts: (lead.contact_attempts || 0) + 1,
                      last_contact_at: new Date().toISOString()
                    });
                  } else {
                    updateLeadDetails(lead.id, {
                      contact_attempts: (lead.contact_attempts || 0) + 1,
                      last_contact_at: new Date().toISOString()
                    });
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60 rounded-lg text-xs font-bold transition-all"
                title="Xem bài đăng nguồn để lấy ngữ cảnh đầy đủ"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
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
                placeholder="Nhập ghi chú nhanh chăm sóc..."
                onChange={(e) => {
                  setNoteText(e.target.value);
                  setIsEditingNote(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveNote();
                }}
                disabled={isSavingNote}
                className="w-full pl-3 pr-9 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:bg-white text-on-surface transition-all placeholder:text-on-surface-variant/40"
              />
              {isEditingNote && (
                <button
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-primary hover:bg-primary/10 rounded flex items-center justify-center transition-all"
                  title="Lưu ghi chú"
                >
                  {isSavingNote ? (
                    <span className="w-3.5 h-3.5 border border-primary/20 border-t-primary rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-symbols-outlined text-base">check</span>
                  )}
                </button>
              )}
            </div>
            
            {showSaveSuccess && (
              <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 animate-bounce">
                <span className="material-symbols-outlined text-xs">check_circle</span> Đã lưu
              </span>
            )}
          </div>

        </div>

        {/* Error / Last updated log row */}
        {(saveError || lead.last_contact_at) && (
          <div className="flex items-center justify-between text-[10px] font-medium text-on-surface-variant pt-1">
            <div>
              {lead.last_contact_at && (
                <span>
                  Liên hệ cuối: {new Date(lead.last_contact_at).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })} ngày {new Date(lead.last_contact_at).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit"
                  })}
                </span>
              )}
            </div>
            
            {saveError && (
              <span className="text-error flex items-center gap-0.5 font-bold animate-pulse">
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
