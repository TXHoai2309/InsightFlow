import type { Lead } from "@/types/dashboard";
import type { LeadActivityEventDto } from "@/types/lead-activity";

export type LeadHistoryActor = "employee" | "system";
export type LeadHistoryKind =
  | "created"
  | "assigned"
  | "contact"
  | "status"
  | "result"
  | "follow_up"
  | "note"
  | "sales"
  | "closed";
export type LeadHistorySource = "live" | "backfill" | "derived";

export interface LeadHistoryEvent {
  id: string;
  occurredAt: string;
  actor: LeadHistoryActor;
  actorName: string;
  kind: LeadHistoryKind;
  eventType: string;
  title: string;
  description?: string;
  badge: string;
  fromStatus?: string;
  toStatus?: string;
  source: LeadHistorySource;
}
const ACTION_LABELS: Record<string, string> = {
  open_source: "Đã mở nguồn liên hệ",
  message: "Đã gửi tin nhắn",
  call: "Đã thực hiện cuộc gọi",
  email: "Đã gửi email",
  open_profile: "Đã mở hồ sơ nguồn",
  note: "Đã thêm ghi chú",
  skip: "Đã bỏ qua Lead",
};

const RESULT_LABELS: Record<string, string> = {
  positive: "Khách phản hồi tích cực",
  no_response: "Khách chưa phản hồi",
  follow_up: "Đã hẹn follow-up",
  not_fit: "Khách không phù hợp",
  converted: "Đã chuyển đổi",
  transfer_sales: "Đã chuyển cho Sales",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Mới phát hiện",
  processing: "Đang xử lý",
  completed: "Đã hoàn thành",
  skipped: "Đã bỏ qua",
};

function isValidDate(value: string | null | undefined): value is string {
  if (!value) return false;
  return Number.isFinite(new Date(value).getTime());
}

function pushEvent(events: LeadHistoryEvent[], event: LeadHistoryEvent | null) {
  if (!event || !isValidDate(event.occurredAt)) return;
  events.push(event);
}

export function getLeadActionLabel(action?: Lead["last_action_type"] | string) {
  return action ? ACTION_LABELS[action] || "Đã thực hiện thao tác xử lý" : "Chưa có thao tác";
}

export function getLeadResultLabel(result?: Lead["result_type"] | string) {
  return result ? RESULT_LABELS[result] || result : "Chưa ghi nhận kết quả";
}

export function getLeadStatusLabel(lead: Lead) {
  if (lead.pending_result) return "Cần ghi nhận kết quả";
  return STATUS_LABELS[lead.status] || lead.status;
}

export function getStatusLabel(status?: string) {
  return status ? STATUS_LABELS[status] || status : "Chưa xác định";
}

function apiEventKind(eventType: string): LeadHistoryKind {
  if (["assigned", "unassigned"].includes(eventType)) return "assigned";
  if (eventType === "contact_action") return "contact";
  if (eventType === "status_changed") return "status";
  if (eventType === "result_recorded") return "result";
  if (["follow_up_scheduled", "follow_up_cancelled"].includes(eventType)) return "follow_up";
  if (eventType === "note_updated") return "note";
  if (eventType === "sales_transferred") return "sales";
  if (eventType === "closed") return "closed";
  return "created";
}

function apiEventTitle(event: LeadActivityEventDto) {
  const actionType = event.details?.actionType;
  const titles: Record<string, string> = {
    lead_created: "Lead được hệ thống ghi nhận",
    assigned: "Phân công người phụ trách",
    unassigned: "Hủy phân công",
    status_changed: "Thay đổi trạng thái",
    result_recorded: "Ghi nhận kết quả xử lý",
    follow_up_scheduled: "Đặt lịch follow-up",
    follow_up_cancelled: "Hủy lịch follow-up",
    note_updated: "Cập nhật ghi chú",
    sales_transferred: "Chuyển Lead cho Sales",
    closed: actionType === "skip" ? "Bỏ qua và đóng Lead" : "Đóng quy trình xử lý",
  };
  if (event.eventType === "contact_action") return getLeadActionLabel(actionType);
  return titles[event.eventType] || "Cập nhật quy trình xử lý";
}

function apiEventDescription(event: LeadActivityEventDto) {
  if (event.eventType === "status_changed") {
    return `${getStatusLabel(event.fromStatus)} → ${getStatusLabel(event.toStatus)}`;
  }
  if (event.eventType === "result_recorded") return getLeadResultLabel(event.resultType);
  if (event.eventType === "assigned") {
    const owner = event.details?.toOwnerName;
    return owner ? `Người phụ trách: ${owner}` : event.description;
  }
  if (event.eventType === "unassigned") {
    const owner = event.details?.fromOwnerName;
    return owner ? `Đã hủy phân công của ${owner}` : event.description;
  }
  if (event.eventType === "contact_action" && event.channel) {
    return `Kênh liên hệ: ${event.channel}`;
  }
  if (event.eventType === "follow_up_scheduled" && event.details?.followUpTo) {
    return `Thời điểm follow-up: ${new Date(event.details.followUpTo).toLocaleString("vi-VN")}`;
  }
  return event.description;
}

function apiEventBadge(kind: LeadHistoryKind) {
  const badges: Record<LeadHistoryKind, string> = {
    created: "Hệ thống",
    assigned: "Phân công",
    contact: "Liên hệ",
    status: "Trạng thái",
    result: "Kết quả",
    follow_up: "Follow-up",
    note: "Ghi chú",
    sales: "Sales",
    closed: "Đóng Lead",
  };
  return badges[kind];
}

export function mapLeadActivityEvent(event: LeadActivityEventDto): LeadHistoryEvent {
  const kind = apiEventKind(event.eventType);
  return {
    id: event.id,
    occurredAt: event.occurredAt,
    actor: event.actorType,
    actorName: event.actorName,
    kind,
    eventType: event.eventType,
    title: apiEventTitle(event),
    description: apiEventDescription(event),
    badge: apiEventBadge(kind),
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    source: event.source,
  };
}

export function buildLeadHistoryEvents(lead: Lead): LeadHistoryEvent[] {
  const events: LeadHistoryEvent[] = [];
  const ownerName = lead.owner_name || lead.owner_email || "Nhân viên xử lý";

  pushEvent(events, {
    id: `derived-created-${lead.id}`,
    occurredAt: lead.created_at,
    actor: "system",
    actorName: "Hệ thống",
    kind: "created",
    eventType: "lead_created",
    title: "Lead được hệ thống ghi nhận",
    description: "Mốc được suy ra từ dữ liệu Lead hiện tại.",
    badge: "Hệ thống",
    source: "derived",
  });

  const assignedAt = lead.claimed_at || lead.assigned_at;
  if (isValidDate(assignedAt)) {
    pushEvent(events, {
      id: `derived-assigned-${lead.id}`,
      occurredAt: assignedAt,
      actor: "employee",
      actorName: ownerName,
      kind: "assigned",
      eventType: "assigned",
      title: "Nhận xử lý Lead",
      description: `Người phụ trách: ${ownerName}`,
      badge: "Phân công",
      source: "derived",
    });
  }

  if (isValidDate(lead.last_action_at)) {
    pushEvent(events, {
      id: `derived-action-${lead.id}-${lead.last_action_at}`,
      occurredAt: lead.last_action_at,
      actor: "employee",
      actorName: ownerName,
      kind: lead.last_action_type === "skip" ? "closed" : lead.last_action_type === "note" ? "note" : "contact",
      eventType: lead.last_action_type === "skip" ? "closed" : lead.last_action_type === "note" ? "note_updated" : "contact_action",
      title: getLeadActionLabel(lead.last_action_type),
      description: lead.last_contact_channel ? `Kênh liên hệ: ${lead.last_contact_channel}` : undefined,
      badge: lead.last_action_type === "note" ? "Ghi chú" : "Xử lý",
      source: "derived",
    });
  }

  if (isValidDate(lead.result_recorded_at) && lead.result_type) {
    pushEvent(events, {
      id: `derived-result-${lead.id}-${lead.result_recorded_at}`,
      occurredAt: lead.result_recorded_at,
      actor: "employee",
      actorName: ownerName,
      kind: "result",
      eventType: "result_recorded",
      title: "Ghi nhận kết quả xử lý",
      description: getLeadResultLabel(lead.result_type),
      badge: "Kết quả",
      source: "derived",
    });
  }

  if (isValidDate(lead.follow_up_at)) {
    pushEvent(events, {
      id: `derived-follow-up-${lead.id}-${lead.follow_up_at}`,
      occurredAt: lead.follow_up_at,
      actor: "employee",
      actorName: ownerName,
      kind: "follow_up",
      eventType: "follow_up_scheduled",
      title: "Đặt lịch follow-up",
      description: `Thời điểm follow-up: ${new Date(lead.follow_up_at).toLocaleString("vi-VN")}`,
      badge: "Follow-up",
      source: "derived",
    });
  }

  if (isValidDate(lead.sales_transferred_at)) {
    pushEvent(events, {
      id: `derived-sales-${lead.id}-${lead.sales_transferred_at}`,
      occurredAt: lead.sales_transferred_at,
      actor: "employee",
      actorName: ownerName,
      kind: "sales",
      eventType: "sales_transferred",
      title: "Chuyển Lead cho Sales",
      description: lead.sales_owner_name ? `Người tiếp nhận: ${lead.sales_owner_name}` : undefined,
      badge: "Sales",
      source: "derived",
    });
  }

  return events
    .filter(
      (event, index, list) =>
        list.findIndex(
          (candidate) => candidate.occurredAt === event.occurredAt && candidate.title === event.title,
        ) === index,
    )
    .sort(
      (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );
}
