"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAlertStore, type AlertData } from "@/stores/alert.store";

type CustomerResponseResult = NonNullable<AlertData["customer_response_result"]>;

const CUSTOMER_RESPONSE_OPTIONS: Array<{
  value: CustomerResponseResult;
  label: string;
  icon: string;
  tone: string;
}> = [
  { value: "positive", label: "Khách hàng phản hồi tích cực", icon: "sentiment_satisfied", tone: "border-green-300 bg-green-50 text-green-700" },
  { value: "no_response", label: "Chưa phản hồi", icon: "schedule", tone: "border-blue-300 bg-blue-50 text-blue-700" },
  { value: "still_upset", label: "Khách hàng vẫn bức xúc", icon: "sentiment_dissatisfied", tone: "border-red-300 bg-red-50 text-red-700" },
  { value: "not_suitable", label: "Không phù hợp", icon: "block", tone: "border-slate-300 bg-slate-50 text-slate-700" },
];

interface AlertContactWorkflowProps {
  alert: AlertData;
  getResolverName: (value: string | null | undefined) => string;
}

function formatBrandName(brand: string) {
  if (!brand) return "";
  const normalized = brand.toLowerCase();
  if (normalized === "mixue") return "Mixue";
  if (normalized.includes("starbuck")) return "Starbucks";
  if (normalized.includes("highland")) return "Highlands Coffee";
  return brand
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function createDefaultContactTemplate(customerName: string, brand: string) {
  return `Xin chào ${customerName || "Anh/Chị"}, ${formatBrandName(brand)} thành thật xin lỗi về trải nghiệm chưa tốt của Anh/Chị. Anh/Chị vui lòng nhắn tin trực tiếp hoặc để lại thông tin liên hệ để chúng tôi kiểm tra và hỗ trợ giải quyết vấn đề sớm nhất. Cảm ơn Anh/Chị đã phản hồi.`;
}

export function AlertContactWorkflow({ alert, getResolverName }: AlertContactWorkflowProps) {
  const { profile } = useAuth();
  const updateAlertStatus = useAlertStore((state) => state.updateAlertStatus);
  const [contactEvidenceNote, setContactEvidenceNote] = useState(alert.customer_contact_note || "");
  const [contactEvidenceImage, setContactEvidenceImage] = useState<string | null>(alert.customer_contact_evidence_image || null);
  const [previewEvidenceImage, setPreviewEvidenceImage] = useState<string | null>(null);
  const [savingContactEvidence, setSavingContactEvidence] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setContactEvidenceNote(alert.customer_contact_note || "");
    setContactEvidenceImage(alert.customer_contact_evidence_image || null);
    setFeedback(null);
  }, [alert.id, alert.customer_contact_note, alert.customer_contact_evidence_image]);

  const showFeedback = (message: string, tone: "success" | "error" = "success") => {
    setFeedback({ message, tone });
  };

  const handleOpenCustomerContact = async () => {
    const contactUrl = [alert.social_profile_url, alert.url, alert.post_url]
      .find((url) => Boolean(url && url !== "#"));
    if (!contactUrl) {
      showFeedback("Cảnh báo này chưa có liên kết để liên hệ khách hàng.", "error");
      return;
    }

    const template = createDefaultContactTemplate(alert.author || "Anh/Chị", alert.brand);
    const openedAt = new Date().toISOString();
    window.open(contactUrl, "_blank", "noopener,noreferrer");

    try {
      await navigator.clipboard.writeText(template);
    } catch (error) {
      console.warn("Could not copy the default contact template:", error);
    }

    try {
      await updateAlertStatus(alert.id, "resolving", profile, {
        note: "Đã mở liên kết liên hệ khách hàng và tạo mẫu phản hồi xin lỗi mặc định.",
        customer_contact_opened_at: openedAt,
        customer_contact_opened_by: profile?.email || profile?.uid || "unknown",
        customer_contact_template: template,
      }, alert.brand);
      showFeedback("Đã sao chép mẫu xin lỗi và mở liên kết liên hệ.");
    } catch (error) {
      console.error(error);
      showFeedback("Đã mở liên kết nhưng chưa lưu được dấu vết liên hệ.", "error");
    }
  };

  const handleContactEvidenceImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showFeedback("Vui lòng chọn một tệp hình ảnh.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showFeedback("Ảnh minh chứng phải nhỏ hơn 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 900;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        setContactEvidenceImage(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveContactEvidence = async () => {
    if (!alert.customer_contact_opened_at) {
      showFeedback("Hãy bấm ‘Xem trên nền tảng’ trước.", "error");
      return;
    }
    if (!contactEvidenceNote.trim() || !contactEvidenceImage) {
      showFeedback("Cần nhập ghi chú và thêm ảnh minh chứng.", "error");
      return;
    }

    setSavingContactEvidence(true);
    try {
      await updateAlertStatus(alert.id, "resolving", profile, {
        note: `Đã bổ sung minh chứng liên hệ: ${contactEvidenceNote.trim()}`,
        customer_contact_note: contactEvidenceNote.trim(),
        customer_contact_evidence_image: contactEvidenceImage,
      }, alert.brand);
      showFeedback("Đã lưu minh chứng liên hệ.");
    } catch (error) {
      console.error(error);
      showFeedback("Không thể lưu minh chứng. Vui lòng thử lại.", "error");
    } finally {
      setSavingContactEvidence(false);
    }
  };

  const handleCustomerResponseResult = async (result: CustomerResponseResult) => {
    if (!alert.customer_contact_opened_at || !alert.customer_contact_note || !alert.customer_contact_evidence_image) return;
    const resultLabel = CUSTOMER_RESPONSE_OPTIONS.find((option) => option.value === result)?.label || result;
    try {
      await updateAlertStatus(alert.id, "resolving", profile, {
        note: `Đã ghi nhận kết quả liên hệ: ${resultLabel}.`,
        customer_response_result: result,
      }, alert.brand);
      showFeedback(`Đã lưu: ${resultLabel}.`);
    } catch (error) {
      console.error(error);
      showFeedback("Không thể lưu kết quả phản hồi. Vui lòng thử lại.", "error");
    }
  };

  const hasContactProof = Boolean(
    alert.customer_contact_opened_at &&
    alert.customer_contact_note?.trim() &&
    alert.customer_contact_evidence_image
  );

  return (
    <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-5 space-y-4">
      <div>
        <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">
          <span className="material-symbols-outlined text-base text-purple-500">support_agent</span>
          Liên hệ và ghi nhận phản hồi
        </h3>
        <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
          Phải mở liên kết liên hệ và chọn kết quả trước khi hoàn tất vụ việc.
        </p>
      </div>

      {alert.customer_contact_history && alert.customer_contact_history.length > 0 && (
        <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]/50 p-3">
          <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined text-sm">history</span>
            Lịch sử liên hệ trước ({alert.customer_contact_history.length})
          </p>
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {[...alert.customer_contact_history].reverse().map((contactAttempt, reverseIndex) => {
              const attemptNumber = alert.customer_contact_history!.length - reverseIndex;
              const resultLabel = CUSTOMER_RESPONSE_OPTIONS.find(
                (option) => option.value === contactAttempt.response_result
              )?.label || contactAttempt.response_result;
              const outcomeLabel = contactAttempt.outcome_status === "resolved"
                ? "Đã giải quyết"
                : contactAttempt.outcome_status === "contact_waiting"
                  ? "Đã liên hệ – Chờ phản hồi"
                  : "Liên hệ không thành";
              return (
                <article key={`${contactAttempt.completed_at}-${attemptNumber}`} className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black text-[var(--color-text-primary)]">Lần liên hệ {attemptNumber}</p>
                      <p className="text-[9px] text-[var(--color-text-muted)]">
                        {new Date(contactAttempt.completed_at).toLocaleString("vi-VN")} · {getResolverName(contactAttempt.opened_by) || "Nhân viên xử lý"}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-700">{outcomeLabel}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--color-text-secondary)]">{contactAttempt.note}</p>
                  <p className="text-[10px] font-bold text-purple-700">Kết quả: {resultLabel}</p>
                  <button type="button" onClick={() => setPreviewEvidenceImage(contactAttempt.evidence_image)} className="block w-full cursor-zoom-in rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30" title="Bấm để xem ảnh lớn ngay trong InsightFlow">
                    <img src={contactAttempt.evidence_image} alt={`Minh chứng lần liên hệ ${attemptNumber}`} className="max-h-52 w-full rounded-lg border border-[var(--color-border)] bg-slate-50 object-contain" />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <button type="button" onClick={() => void handleOpenCustomerContact()} disabled={![alert.social_profile_url, alert.url, alert.post_url].some((url) => Boolean(url && url !== "#"))} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-2.5 text-xs font-bold text-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-40">
        <span className="material-symbols-outlined text-base">open_in_new</span>
        Xem trên nền tảng và sao chép mẫu liên hệ
      </button>

      <div className={`flex items-start gap-2 rounded-xl border p-3 text-[11px] font-bold ${
        alert.customer_contact_opened_at
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}>
        <span className="material-symbols-outlined text-base">{alert.customer_contact_opened_at ? "check_circle" : "info"}</span>
        <span>{alert.customer_contact_opened_at ? "Đã mở nguồn để liên hệ. Hãy bổ sung ghi chú và ảnh minh chứng bên dưới." : "Hãy mở nền tảng trước khi bổ sung minh chứng."}</span>
      </div>

      {alert.customer_contact_opened_at && (
        <div className="space-y-2 rounded-xl border border-green-200 bg-green-50/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-green-700">Mẫu đã sao chép</p>
            <button type="button" onClick={() => void navigator.clipboard.writeText(alert.customer_contact_template || createDefaultContactTemplate(alert.author || "Anh/Chị", alert.brand))} className="text-[10px] font-bold text-green-700 hover:underline">Sao chép lại</button>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">{alert.customer_contact_template || createDefaultContactTemplate(alert.author || "Anh/Chị", alert.brand)}</p>
        </div>
      )}

      <div className={`space-y-3 rounded-xl border border-[var(--color-border)] p-3 ${!alert.customer_contact_opened_at ? "opacity-50" : ""}`}>
        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Minh chứng liên hệ <span className="text-red-500">*</span></p>
        <textarea value={contactEvidenceNote} onChange={(event) => setContactEvidenceNote(event.target.value)} disabled={!alert.customer_contact_opened_at} rows={3} placeholder="Ghi rõ đã phản hồi ở đâu, nội dung trao đổi và thời điểm liên hệ..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed" />
        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-purple-300 bg-purple-50 px-3 py-2 text-[11px] font-bold text-purple-700 hover:bg-purple-100">
            <span className="material-symbols-outlined text-base">add_photo_alternate</span>
            {contactEvidenceImage ? "Đổi ảnh minh chứng" : "Thêm ảnh minh chứng"}
            <input type="file" accept="image/*" disabled={!alert.customer_contact_opened_at} onChange={(event) => handleContactEvidenceImage(event.target.files?.[0])} className="hidden" />
          </label>
          {contactEvidenceImage && (
            <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-slate-50 p-2">
              <img src={contactEvidenceImage} alt="Minh chứng liên hệ khách hàng" className="max-h-44 w-full object-contain" />
              <button type="button" onClick={() => setContactEvidenceImage(null)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white" aria-label="Xóa ảnh minh chứng">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}
        </div>
        <button type="button" disabled={!alert.customer_contact_opened_at || !contactEvidenceNote.trim() || !contactEvidenceImage || savingContactEvidence} onClick={() => void handleSaveContactEvidence()} className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">
          {savingContactEvidence ? "Đang lưu..." : hasContactProof ? "Cập nhật minh chứng" : "Lưu minh chứng"}
        </button>
      </div>

      <fieldset disabled={!hasContactProof} className="space-y-2 disabled:opacity-50">
        <legend className="mb-2 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Kết quả phản hồi của khách hàng</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CUSTOMER_RESPONSE_OPTIONS.map((option) => {
            const selected = alert.customer_response_result === option.value;
            return (
              <button type="button" key={option.value} disabled={!hasContactProof} onClick={() => void handleCustomerResponseResult(option.value)} aria-pressed={selected} className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-[11px] font-bold transition-all disabled:cursor-not-allowed ${selected ? `${option.tone} ring-2 ring-current ring-offset-1` : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] hover:border-purple-300"}`}>
                <span className="material-symbols-outlined text-base">{option.icon}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {feedback && (
        <p role="status" className={`rounded-xl border p-3 text-[11px] font-bold ${feedback.tone === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {feedback.message}
        </p>
      )}

      {previewEvidenceImage && (
        <div role="dialog" aria-modal="true" aria-label="Xem ảnh minh chứng" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setPreviewEvidenceImage(null)}>
          <button type="button" onClick={() => setPreviewEvidenceImage(null)} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="Đóng ảnh minh chứng">
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={previewEvidenceImage} alt="Ảnh minh chứng liên hệ" className="max-h-[90vh] max-w-[92vw] rounded-xl bg-white object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </section>
  );
}
