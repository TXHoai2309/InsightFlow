// apps/web/src/components/brand-settings/ResponseTemplates.tsx
"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { Plus, Trash2, Edit3, Loader2, AlertCircle, CheckCircle, HelpCircle, Sparkles } from "lucide-react";

interface Template {
  id: string;
  name: string;
  sentiment: "positive" | "negative" | "neutral" | "all";
  category: "crisis" | "lead" | "faq" | "general";
  templateText: string;
  placeholders: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function ResponseTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formName, setFormName] = useState("");
  const [formSentiment, setFormSentiment] = useState<Template["sentiment"]>("negative");
  const [formCategory, setFormCategory] = useState<Template["category"]>("crisis");
  const [formText, setFormText] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const handleSuggestTemplate = async () => {
    if (!formName.trim()) {
      alert("Vui lòng điền 'Tên mẫu gợi nhớ' để AI biết chủ đề cần tạo mẫu.");
      return;
    }
    setSuggesting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Chưa xác thực người dùng.");

      const res = await fetch("/api/templates/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formName.trim(),
          sentiment: formSentiment,
          category: formCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể gợi ý mẫu bằng AI.");

      if (data.templateText) {
        setFormText(data.templateText);
      }
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi tạo gợi ý mẫu.");
    } finally {
      setSuggesting(false);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Chưa xác thực người dùng. Vui lòng đăng nhập lại.");

      const res = await fetch("/api/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải danh sách mẫu phản hồi.");

      setTemplates(data.data || []);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormSentiment("negative");
    setFormCategory("crisis");
    setFormText("");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSentiment(template.sentiment);
    setFormCategory(template.category);
    setFormText(template.templateText);
    setFormIsActive(template.isActive);
    setIsModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) {
      setError("Tên mẫu và nội dung mẫu không được để trống.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Chưa xác thực người dùng.");

      // Parse placeholders dynamically (e.g. {{customer_name}} -> customer_name)
      const placeholderRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
      const placeholders: string[] = [];
      let match;
      while ((match = placeholderRegex.exec(formText)) !== null) {
        if (match[1] && !placeholders.includes(match[1])) {
          placeholders.push(match[1]);
        }
      }

      const payload = {
        name: formName.trim(),
        sentiment: formSentiment,
        category: formCategory,
        templateText: formText.trim(),
        placeholders,
        isActive: formIsActive,
      };

      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : "/api/templates";
      const method = editingTemplate ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ghi nhận mẫu phản hồi thất bại.");

      setSuccessMsg(editingTemplate ? "Cập nhật mẫu phản hồi thành công!" : "Tạo mẫu phản hồi mới thành công!");
      setIsModalOpen(false);
      fetchTemplates();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Không thể thực hiện tác vụ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mẫu phản hồi này?")) return;

    setError("");
    setSuccessMsg("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Chưa xác thực người dùng.");

      const res = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xóa mẫu phản hồi thất bại.");

      setSuccessMsg("Xóa mẫu phản hồi thành công!");
      fetchTemplates();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Không thể xóa mẫu.");
    }
  };

  const getSentimentBadgeColor = (sentiment: Template["sentiment"]) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "negative":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case "neutral":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
      default:
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800";
    }
  };

  const getCategoryLabel = (category: Template["category"]) => {
    switch (category) {
      case "crisis":
        return "Khủng hoảng";
      case "lead":
        return "Khách hàng tiềm năng";
      case "faq":
        return "Hỏi đáp nhanh (FAQ)";
      default:
        return "Chung";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">
            Mẫu phản hồi thương hiệu
          </h2>
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Định nghĩa các mẫu chuẩn để nhân viên phản hồi nhanh bằng AI.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#6C63FF] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#5A52D5] transition-all"
        >
          <Plus className="h-4 w-4" />
          Tạo mẫu phản hồi
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900/50 p-4 text-[14px] text-green-700 dark:text-green-400">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-4 text-[14px] text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
          <Loader2 className="h-8 w-8 animate-spin text-[#6C63FF]" />
          <p className="mt-3 text-[14px] text-[var(--color-text-secondary)]">Đang tải danh sách mẫu phản hồi...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
          <HelpCircle className="h-12 w-12 text-[var(--color-text-muted)]" />
          <h3 className="mt-4 text-[16px] font-bold text-[var(--color-text-primary)]">Chưa có mẫu phản hồi nào</h3>
          <p className="mt-2 max-w-sm text-[14px] text-[var(--color-text-secondary)]">
            Hãy tạo các mẫu phản hồi trước để hệ thống hỗ trợ nhân viên xử lý thông tin nhanh chóng hơn.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 rounded-xl border border-[#6C63FF] text-[#6C63FF] px-4 py-2 text-[14px] font-semibold hover:bg-[#6C63FF]/5 transition-all"
          >
            Tạo mẫu đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`rounded-xl border p-5 bg-[var(--color-bg-surface)] transition-all flex flex-col justify-between ${
                template.isActive
                  ? "border-[var(--color-border)]"
                  : "border-dashed border-[var(--color-text-disabled)] opacity-60"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-[16px] text-[var(--color-text-primary)] line-clamp-1">
                    {template.name}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(template)}
                      className="p-1.5 text-[var(--color-text-secondary)] hover:text-[#6C63FF] hover:bg-[var(--color-bg-surface-raised)] rounded-lg transition-all"
                      title="Sửa mẫu"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1.5 text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                      title="Xóa mẫu"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded border ${getSentimentBadgeColor(template.sentiment)}`}>
                    {template.sentiment === "all" ? "Tất cả sắc thái" : template.sentiment}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]">
                    {getCategoryLabel(template.category)}
                  </span>
                  {!template.isActive && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded border border-gray-300 bg-gray-100 text-gray-500">
                      Tắt hoạt động
                    </span>
                  )}
                </div>

                <div className="rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-[13px] text-[var(--color-text-secondary)] font-sans leading-relaxed line-clamp-3 whitespace-pre-wrap">
                  {template.templateText}
                </div>
              </div>

              {template.placeholders && template.placeholders.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Placeholders:
                  </span>
                  {template.placeholders.map((p) => (
                    <code key={p} className="text-[11px] bg-[#6C63FF]/10 text-[#6C63FF] px-1.5 py-0.5 rounded">
                      {`{{${p}}}`}
                    </code>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveTemplate}
            className="w-full max-w-[640px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-[20px] font-bold text-[var(--color-text-primary)]">
                {editingTemplate ? "Chỉnh sửa mẫu phản hồi" : "Tạo mẫu phản hồi mới"}
              </h3>
              <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                Thiết lập thông tin mẫu và cấu trúc câu phản hồi phù hợp.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Tên mẫu gợi nhớ</span>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Phản hồi lỗi giao trễ, Xin lỗi thái độ phục vụ..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 text-[14px] outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] text-[var(--color-text-primary)]"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Dành cho Sắc thái</span>
                  <select
                    value={formSentiment}
                    onChange={(e) => setFormSentiment(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 text-[14px] outline-none focus:border-[#6C63FF] text-[var(--color-text-primary)]"
                  >
                    <option value="negative">Tiêu cực (Negative)</option>
                    <option value="positive">Tích cực (Positive)</option>
                    <option value="neutral">Trung lập (Neutral)</option>
                    <option value="all">Tất cả sắc thái</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Phân loại nghiệp vụ</span>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 text-[14px] outline-none focus:border-[#6C63FF] text-[var(--color-text-primary)]"
                  >
                    <option value="crisis">Xử lý khủng hoảng (Crisis)</option>
                    <option value="lead">Xử lý Lead (Potential Lead)</option>
                    <option value="faq">Giải đáp FAQ (Hỏi đáp nhanh)</option>
                    <option value="general">Mẫu chung (General)</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Nội dung mẫu phản hồi</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSuggestTemplate}
                      disabled={suggesting}
                      className="flex items-center gap-1 text-[11px] text-[#6C63FF] hover:underline font-semibold"
                    >
                      {suggesting ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Đang viết...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 fill-[#6C63FF]/20" />
                          <span>Viết hộ tôi bằng AI ✨</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      Dùng cú pháp gõ <code className="bg-[var(--color-bg-surface-raised)] px-1 py-0.5 rounded font-sans">{"{{tên}}"}</code> để tạo biến
                    </span>
                  </div>
                </div>
                <textarea
                  required
                  rows={6}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder={`Ví dụ:\nChào {{customer_name}}, {{brand_name}} vô cùng xin lỗi về trải nghiệm không tốt tại chi nhánh {{location_name}}...\nChúng tôi xin phép liên hệ qua hộp thư để hỗ trợ đền bù ạ.`}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 text-[13px] font-sans outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] text-[var(--color-text-primary)] leading-relaxed"
                />
              </label>

              {/* Placeholder Helper Tooltips */}
              <div className="rounded-xl bg-[var(--color-bg-surface-raised)] p-3.5 space-y-2">
                <span className="text-[12px] font-bold text-[var(--color-text-primary)]">Gợi ý Placeholder AI tự nhận biết:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--color-text-secondary)] font-sans">
                  <div>• <code>{"{{customer_name}}"}</code>: Tên khách</div>
                  <div>• <code>{"{{brand_name}}"}</code>: Tên thương hiệu</div>
                  <div>• <code>{"{{location_name}}"}</code>: Tên chi nhánh</div>
                  <div>• <code>{"{{issue_detail}}"}</code>: Chi tiết sự việc</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[#6C63FF] focus:ring-[#6C63FF]"
                />
                <label htmlFor="isActive" className="text-[13px] font-semibold text-[var(--color-text-primary)] cursor-pointer">
                  Kích hoạt sử dụng ngay
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-[#6C63FF] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#5A52D5] disabled:opacity-60 transition-all"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
