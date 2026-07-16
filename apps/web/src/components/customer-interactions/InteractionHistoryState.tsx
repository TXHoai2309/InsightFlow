"use client";

type InteractionHistoryStateKind =
  | "source_unavailable"
  | "identity_unavailable"
  | "empty_history"
  | "access_denied"
  | "auth_required"
  | "technical_error";

const STATE_CONTENT: Record<
  InteractionHistoryStateKind,
  { icon: string; title: string; description: string; tone: "neutral" | "positive" | "danger" }
> = {
  source_unavailable: {
    icon: "history_off",
    title: "Chưa có dữ liệu lịch sử tương tác",
    description:
      "Hệ thống chưa thể liên kết khách hàng này với dữ liệu tương tác đã thu thập. Bạn vẫn có thể tiếp tục xử lý khách hàng như bình thường.",
    tone: "neutral",
  },
  identity_unavailable: {
    icon: "person_search",
    title: "Chưa đủ thông tin để đối chiếu",
    description:
      "Nền tảng chưa cung cấp ID tài khoản hoặc địa chỉ hồ sơ ổn định. Hệ thống không đối chiếu bằng tên hiển thị để tránh nhầm khách hàng.",
    tone: "neutral",
  },
  empty_history: {
    icon: "history",
    title: "Đây là tương tác đầu tiên được ghi nhận",
    description:
      "Hệ thống chưa ghi nhận tương tác nào khác của khách hàng này với thương hiệu trên cùng nền tảng.",
    tone: "positive",
  },
  access_denied: {
    icon: "lock",
    title: "Lịch sử tương tác bị giới hạn",
    description:
      "Bạn không có quyền xem dữ liệu này theo phạm vi vai trò hoặc thương hiệu được phân công.",
    tone: "neutral",
  },
  auth_required: {
    icon: "login",
    title: "Cần đăng nhập lại",
    description: "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại để xem lịch sử tương tác.",
    tone: "neutral",
  },
  technical_error: {
    icon: "cloud_off",
    title: "Chưa thể tải lịch sử tương tác",
    description: "Kết nối đang gặp sự cố. Vui lòng thử lại sau.",
    tone: "danger",
  },
};

export function InteractionHistoryState({
  kind,
  actionLabel,
  onAction,
}: {
  kind: InteractionHistoryStateKind;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const content = STATE_CONTENT[kind];
  const isDanger = content.tone === "danger";
  const isPositive = content.tone === "positive";
  const surfaceClass = isDanger
    ? "border-red-200 bg-red-50/70 dark:border-red-900/40 dark:bg-red-950/20"
    : isPositive
      ? "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]/30"
      : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]/45";
  const iconClass = isDanger
    ? "text-red-600 dark:text-red-300"
    : isPositive
      ? "text-[var(--color-brand)]"
      : "text-[var(--color-text-muted)]";

  return (
    <section
      className={`rounded-xl border border-dashed px-5 py-7 text-center ${surfaceClass}`}
      role={isDanger ? "alert" : "status"}
      aria-live="polite"
    >
      <span className={`material-symbols-outlined text-3xl ${iconClass}`} aria-hidden="true">
        {content.icon}
      </span>
      <h3 className="mt-2 text-sm font-black text-[var(--color-text-primary)]">{content.title}</h3>
      <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-[var(--color-text-secondary)]">
        {content.description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`mt-4 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
            isDanger
              ? "border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
              : "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
          }`}
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}

