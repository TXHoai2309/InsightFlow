import type { Lead } from "@/types/dashboard";

export type LeadHistoryActor = "customer" | "employee" | "system";
export type LeadHistoryKind =
  | "created"
  | "assigned"
  | "contact"
  | "status"
  | "result"
  | "follow_up"
  | "closed";

export interface LeadHistoryEvent {
  id: string;
  occurredAt: string;
  actor: LeadHistoryActor;
  actorName: string;
  kind: LeadHistoryKind;
  title: string;
  description?: string;
  badge: string;
}

const ACTION_LABELS: Record<NonNullable<Lead["last_action_type"]>, string> = {
  open_source: "Đã mở nguồn liên hệ",
  message: "Đã gửi tin nhắn",
  call: "Đã thực hiện cuộc gọi",
  email: "Đã gửi email",
  open_profile: "Đã mở hồ sơ nguồn",
  note: "Đã thêm ghi chú",
  skip: "Đã bỏ qua item",
};

const RESULT_LABELS: Record<NonNullable<Lead["result_type"]>, string> = {
  positive: "Khách phản hồi tích cực",
  no_response: "Khách chưa phản hồi",
  follow_up: "Đã hẹn follow-up",
  not_fit: "Khách không phù hợp",
  converted: "Đã chuyển đổi",
  transfer_sales: "Đã chuyển cho Sales",
};

function isValidDate(value: string | null | undefined): value is string {
  if (!value) return false;
  return Number.isFinite(new Date(value).getTime());
}

function pushEvent(
  events: LeadHistoryEvent[],
  event: LeadHistoryEvent | null,
) {
  if (!event || !isValidDate(event.occurredAt)) return;
  events.push(event);
}

export function getLeadActionLabel(action?: Lead["last_action_type"]) {
  return action ? ACTION_LABELS[action] : "Chưa có thao tác";
}

export function getLeadResultLabel(result?: Lead["result_type"]) {
  return result ? RESULT_LABELS[result] : "Chưa ghi nhận kết quả";
}

export function getLeadStatusLabel(lead: Lead) {
  if (lead.pending_result) return "Cần ghi nhận kết quả";
  if (lead.status === "new") return "Mới phát hiện";
  if (lead.status === "processing") return "Đang xử lý";
  if (lead.status === "completed") return "Đã hoàn thành";
  return "Đã bỏ qua";
}

export function buildLeadHistoryEvents(lead: Lead): LeadHistoryEvent[] {
  const events: LeadHistoryEvent[] = [];
  const ownerName = lead.owner_name || lead.owner_email || "Nhân viên xử lý";

  pushEvent(events, {
    id: `created-${lead.id}`,
    occurredAt: lead.posted_at || lead.created_at,
    actor: "customer",
    actorName: lead.author || "Khách hàng",
    kind: "created",
    title: "Khách gửi nội dung",
    description: lead.content,
    badge: lead.platform,
  });

  const assignedAt = lead.claimed_at || lead.assigned_at;
  if (isValidDate(assignedAt)) {
    pushEvent(events, {
      id: `assigned-${lead.id}`,
      occurredAt: assignedAt,
      actor: "employee",
      actorName: ownerName,
      kind: "assigned",
      title: "Nhận xử lý khách hàng",
      badge: "Nhân viên",
    });
  }

  if (isValidDate(lead.last_action_at)) {
    pushEvent(events, {
      id: `action-${lead.id}-${lead.last_action_at}`,
      occurredAt: lead.last_action_at,
      actor: "employee",
      actorName: ownerName,
      kind: lead.last_action_type === "skip" ? "closed" : "contact",
      title: getLeadActionLabel(lead.last_action_type),
      description: lead.last_contact_channel
        ? `Kênh: ${lead.last_contact_channel}`
        : undefined,
      badge: "Xử lý",
    });
  }

  if (isValidDate(lead.result_recorded_at) && lead.result_type) {
    pushEvent(events, {
      id: `result-${lead.id}-${lead.result_recorded_at}`,
      occurredAt: lead.result_recorded_at,
      actor: "employee",
      actorName: ownerName,
      kind: "result",
      title: "Ghi nhận kết quả",
      description: getLeadResultLabel(lead.result_type),
      badge: "Kết quả",
    });
  }

  if (isValidDate(lead.follow_up_at)) {
    pushEvent(events, {
      id: `follow-up-${lead.id}-${lead.follow_up_at}`,
      occurredAt: lead.follow_up_at,
      actor: "employee",
      actorName: ownerName,
      kind: "follow_up",
      title: "Lịch follow-up",
      description: "Thời điểm cần quay lại xử lý lead",
      badge: "Hẹn lại",
    });
  }

  if (isValidDate(lead.closed_at) && !lead.result_recorded_at) {
    pushEvent(events, {
      id: `closed-${lead.id}-${lead.closed_at}`,
      occurredAt: lead.closed_at,
      actor: "system",
      actorName: "Hệ thống",
      kind: "closed",
      title: lead.status === "skipped" ? "Đóng item đã bỏ qua" : "Đóng quy trình xử lý",
      badge: "Hệ thống",
    });
  }

  return events
    .filter(
      (event, index, list) =>
        list.findIndex(
          (candidate) =>
            candidate.occurredAt === event.occurredAt &&
            candidate.title === event.title,
        ) === index,
    )
    .sort(
      (left, right) =>
        new Date(left.occurredAt).getTime() -
        new Date(right.occurredAt).getTime(),
    );
}
