import type { Lead } from "@/types/dashboard";
import type { UserRoleProfile } from "@/lib/rbac";

export type LeadWorkbenchView =
  | "all"
  | "unassigned"
  | "priority"
  | "active"
  | "closed"
  | "skipped"
  | "urgent"
  | "follow_up"
  | "need_result";

export type LeadOwnershipStatus =
  | "unassigned"
  | "assigned_to_me"
  | "assigned_to_other"
  | "manager_override";

export interface LeadOwnershipMeta {
  status: LeadOwnershipStatus;
  label: string;
  ownerName: string;
  canClaim: boolean;
  canWork: boolean;
}

export interface LeadWorkbenchMeta {
  slaStartedAt: number;
  expiryTime: number;
  remainingMs: number;
  wasOverdueOnIngest: boolean;
  isPending: boolean;
  isOverdue: boolean;
  isUrgent: boolean;
  isFollowUp: boolean;
  isSalesHandoff: boolean;
  hasContactChannel: boolean;
  needsResultCapture: boolean;
  priorityScore: number;
  priorityReasons: string[];
  nextActionLabel: string;
}

export type LeadFollowUpBucket =
  | "overdue"
  | "due_soon"
  | "today"
  | "future"
  | "unscheduled";

export interface LeadFollowUpMeta {
  scheduledAt: number | null;
  isScheduled: boolean;
  isActive: boolean;
  isDueToday: boolean;
  isOverdue: boolean;
  isDueSoon: boolean;
  bucket: LeadFollowUpBucket;
  relativeLabel: string;
}

export interface LeadActionLink {
  label: string;
  icon: string;
  href: string;
  channel: string;
  actionType: NonNullable<Lead["last_action_type"]>;
  isContact: boolean;
}

export const WORKBENCH_VIEWS: Array<{
  id: LeadWorkbenchView;
  label: string;
}> = [
  { id: "all", label: "Tất cả lead" },
  { id: "unassigned", label: "Chưa phân công" },
  { id: "priority", label: "Chờ xử lý" },
  { id: "active", label: "Đang xử lý" },
  { id: "follow_up", label: "Follow-up" },
  { id: "closed", label: "Đã đóng" },
  { id: "skipped", label: "Đã bỏ qua" },
];

export const EMPLOYEE_PRIORITY_WORKBENCH_VIEWS: Array<{
  id: LeadWorkbenchView;
  label: string;
}> = WORKBENCH_VIEWS;

function isLeadEmployee(profile: UserRoleProfile | null | undefined) {
  if (!profile) return false;
  if (profile.role === "lead_employee") return true;
  return profile.role === "crisis_employee" && profile.permissions?.includes("leads");
}

export function getLeadWorkbenchViews(profile: UserRoleProfile | null | undefined) {
  void profile;
  return WORKBENCH_VIEWS;
}

export function getDefaultLeadWorkbenchView(
  profile: UserRoleProfile | null | undefined,
): LeadWorkbenchView {
  void profile;
  return "priority";
}

export function canLeadBeVisibleToUser(
  lead: Lead,
  profile: UserRoleProfile | null | undefined,
) {
  if (!profile) return false;
  if (!isLeadEmployee(profile)) return true;

  const ownerId = (lead.owner_id || "").trim();
  return !ownerId || ownerId === profile.uid;
}

export function getLeadSlaStartTime(lead: Lead) {
  const postedTime = lead.posted_at ? new Date(lead.posted_at).getTime() : Number.NaN;
  if (Number.isFinite(postedTime)) return postedTime;

  const createdTime = new Date(lead.created_at).getTime();
  return Number.isFinite(createdTime) ? createdTime : Number.NaN;
}

export function getLeadExpiryTime(lead: Lead) {
  const slaStartedAt = getLeadSlaStartTime(lead);
  if (!Number.isFinite(slaStartedAt)) return Number.NaN;
  const durationMin =
    lead.intent === "hot"
      ? 30
      : lead.intent === "warm"
        ? 24 * 60
        : 7 * 24 * 60;

  return slaStartedAt + durationMin * 60 * 1000;
}

export function getLeadOwnershipMeta(
  lead: Lead,
  profile: UserRoleProfile | null | undefined,
): LeadOwnershipMeta {
  const ownerId = (lead.owner_id || "").trim();
  const ownerName =
    lead.owner_name || lead.owner_email || (ownerId ? "Người phụ trách khác" : "");
  const isManager = profile?.role === "admin" || profile?.role === "brand_manager";
  const isMine = Boolean(profile?.uid && ownerId && ownerId === profile.uid);
  const isUnassigned = !ownerId;

  if (isUnassigned) {
    return {
      status: "unassigned",
      label: "Chưa phân công",
      ownerName: "Chưa có người phụ trách",
      canClaim: Boolean(profile),
      canWork: false,
    };
  }

  if (isMine) {
    return {
      status: "assigned_to_me",
      label: "Của tôi",
      ownerName,
      canClaim: false,
      canWork: true,
    };
  }

  if (isManager) {
    return {
      status: "manager_override",
      label: `${ownerName} phụ trách`,
      ownerName,
      canClaim: false,
      canWork: true,
    };
  }

  return {
    status: "assigned_to_other",
    label: `${ownerName} phụ trách`,
    ownerName,
    canClaim: false,
    canWork: false,
  };
}

function getOptionalLeadUrl(lead: Lead, field: string) {
  const value = (lead as Lead & Record<string, unknown>)[field];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getLeadOriginUrl(lead: Lead) {
  return (
    getOptionalLeadUrl(lead, "comment_url") ||
    getOptionalLeadUrl(lead, "source_comment_url") ||
    getOptionalLeadUrl(lead, "original_comment_url") ||
    getOptionalLeadUrl(lead, "source_url") ||
    getOptionalLeadUrl(lead, "post_url") ||
    getOptionalLeadUrl(lead, "url")
  );
}

function getLeadPlatformLabel(platform: Lead["platform"]) {
  switch (platform) {
    case "facebook":
      return "Facebook";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
    case "thread":
      return "Threads";
    case "be":
      return "BeFood";
    case "google_maps":
      return "Google Maps";
    case "news":
      return "nguồn";
    default:
      return platform || "nguồn";
  }
}

export function getLeadSourceAction(lead: Lead): LeadActionLink | null {
  const sourceUrl = getLeadOriginUrl(lead);
  if (!sourceUrl) return null;

  if (lead.platform === "google_maps") {
    return {
      label: "Mở Google Maps",
      icon: "map",
      href: sourceUrl,
      channel: "google_maps",
      actionType: "open_source",
      isContact: true,
    };
  }

  if (lead.platform === "youtube") {
    return {
      label: "Mở video",
      icon: "play_circle",
      href: sourceUrl,
      channel: "youtube",
      actionType: "open_source",
      isContact: true,
    };
  }

  if (lead.platform === "news") {
    return {
      label: "Mở bài viết",
      icon: "article",
      href: sourceUrl,
      channel: "news",
      actionType: "open_source",
      isContact: true,
    };
  }

  return {
    label: `Mở trên ${getLeadPlatformLabel(lead.platform)}`,
    icon: "open_in_new",
    href: sourceUrl,
    channel: lead.platform,
    actionType: "open_source",
    isContact: true,
  };
}

export function getLeadContactActions(lead: Lead): LeadActionLink[] {
  return [
    lead.messenger_id
      ? {
          label: "Messenger",
          icon: "forum",
          href: `https://m.me/${lead.messenger_id}`,
          channel: "messenger",
          actionType: "message",
          isContact: true,
        }
      : null,
    lead.zalo_id
      ? {
          label: "Zalo",
          icon: "chat",
          href: `https://zalo.me/${lead.zalo_id}`,
          channel: "zalo",
          actionType: "message",
          isContact: true,
        }
      : null,
    lead.phone
      ? {
          label: "Gọi điện",
          icon: "call",
          href: `tel:${lead.phone}`,
          channel: "phone",
          actionType: "call",
          isContact: true,
        }
      : null,
    lead.email
      ? {
          label: "Email",
          icon: "mail",
          href: `mailto:${lead.email}`,
          channel: "email",
          actionType: "email",
          isContact: true,
        }
      : null,
  ].filter((item): item is LeadActionLink => Boolean(item));
}

export function getPrimaryLeadAction(lead: Lead) {
  return getLeadSourceAction(lead) || getLeadContactActions(lead)[0];
}

function hasContactChannel(lead: Lead) {
  return getLeadContactActions(lead).length > 0 || Boolean(getLeadSourceAction(lead));
}

export function getLeadFollowUpMeta(
  lead: Lead,
  nowMs = Date.now(),
): LeadFollowUpMeta {
  const scheduledAt = lead.follow_up_at
    ? new Date(lead.follow_up_at).getTime()
    : Number.NaN;
  const isScheduled = Number.isFinite(scheduledAt);
  const isOpen = lead.status === "processing";
  const hasFollowUpResult = lead.result_type === "follow_up" || !lead.result_type;
  const isActive = isScheduled && isOpen && hasFollowUpResult;

  if (!isScheduled) {
    return {
      scheduledAt: null,
      isScheduled: false,
      isActive: false,
      isDueToday: false,
      isOverdue: false,
      isDueSoon: false,
      bucket: "unscheduled",
      relativeLabel: "Chưa đặt giờ hẹn",
    };
  }

  const now = new Date(nowMs);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const isOverdue = isActive && scheduledAt <= nowMs;
  // This is the actionable scope: overdue appointments are intentionally
  // included together with appointments scheduled for the rest of today.
  const isDueToday = isActive && scheduledAt <= endOfToday.getTime();
  const remainingMs = scheduledAt - nowMs;
  const isDueSoon = isDueToday && !isOverdue && remainingMs <= 30 * 60 * 1000;
  const absoluteMinutes = Math.max(1, Math.ceil(Math.abs(remainingMs) / 60000));
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    if (hours < 24) return restMinutes ? `${hours} giờ ${restMinutes} phút` : `${hours} giờ`;
    const days = Math.floor(hours / 24);
    const restHours = hours % 24;
    return restHours ? `${days} ngày ${restHours} giờ` : `${days} ngày`;
  };

  return {
    scheduledAt,
    isScheduled: true,
    isActive,
    isDueToday,
    isOverdue,
    isDueSoon,
    bucket: !isActive
      ? "unscheduled"
      : isOverdue
        ? "overdue"
        : isDueSoon
          ? "due_soon"
          : isDueToday
            ? "today"
            : "future",
    relativeLabel: isOverdue
      ? `Quá hẹn ${formatDuration(absoluteMinutes)}`
      : isDueSoon
        ? `Còn ${formatDuration(absoluteMinutes)}`
        : isDueToday
          ? `Hôm nay lúc ${new Date(scheduledAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
          : `Hẹn ${new Date(scheduledAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
  };
}

function hasRecordedResult(lead: Lead) {
  if (lead.result_recorded_at || lead.result_type) return true;
  const notes = (lead.notes || "").toLowerCase();
  return (
    notes.includes("[kết quả]") ||
    notes.includes("[ket qua]") ||
    notes.includes("khách phản hồi") ||
    notes.includes("khach phan hoi") ||
    notes.includes("chưa phản hồi") ||
    notes.includes("chua phan hoi") ||
    notes.includes("không phù hợp") ||
    notes.includes("khong phu hop") ||
    notes.includes("đã chuyển đổi") ||
    notes.includes("da chuyen doi") ||
    notes.includes("chuyển sales") ||
    notes.includes("chuyen sales")
  );
}

export function needsLeadResultCapture(lead: Lead) {
  if (lead.status !== "processing") return false;
  if (lead.pending_result === true) return true;
  if (lead.pending_result === false) return false;
  if (!lead.contact_attempts && !lead.last_action_at && !lead.last_contact_at) return false;
  return !hasRecordedResult(lead);
}

function inferNextAction(lead: Lead) {
  if (lead.status === "completed") return "Đã chuyển đổi";
  if (lead.status === "skipped") return "Không tiềm năng";
  if (needsLeadResultCapture(lead)) return "Ghi nhận kết quả";
  if (getLeadFollowUpMeta(lead).isActive) return "Hẹn follow-up";
  return getPrimaryLeadAction(lead)?.label || "Xem chi tiết";
}

function buildPriorityReasons(
  lead: Lead,
  isUrgent: boolean,
  isOverdue: boolean,
  needsResult: boolean,
) {
  const reasons: string[] = [];
  const content = lead.content.toLowerCase();
  const signals = lead.intent_signals.filter(Boolean).slice(0, 2);

  if (needsResult) reasons.push("Đã mở liên hệ, cần ghi nhận kết quả");
  if (lead.intent === "hot") reasons.push("Có ý định mua rõ ràng");
  if (signals.length > 0) reasons.push(signals.join(", "));
  if (/giá|gia|mua|ship|giao|order|đặt|dat|còn hàng|con hang|location|quality/.test(content)) {
    reasons.push("Khách có tín hiệu mua/quan tâm rõ");
  }
  if (lead.contact_attempts && lead.contact_attempts > 0) {
    reasons.push(`Đã tiếp cận ${lead.contact_attempts} lần`);
  }
  if (hasContactChannel(lead)) reasons.push("Có kênh liên hệ rõ");
  if (isOverdue) reasons.push("Đã quá SLA");
  else if (isUrgent) reasons.push("Sắp hết SLA");

  return Array.from(new Set(reasons)).slice(0, 3);
}

export function getLeadWorkbenchMeta(
  lead: Lead,
  nowMs = Date.now(),
): LeadWorkbenchMeta {
  const slaStartedAt = getLeadSlaStartTime(lead);
  const expiryTime = getLeadExpiryTime(lead);
  const remainingMs = expiryTime - nowMs;
  const isPending = lead.status === "new" || lead.status === "processing";
  const hasValidSla = Number.isFinite(expiryTime);
  const isOverdue = isPending && hasValidSla && remainingMs <= 0;
  const urgentWindow =
    lead.intent === "hot"
      ? 10 * 60 * 1000
      : lead.intent === "warm"
        ? 2 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
  const isUrgent = isPending && hasValidSla && remainingMs > 0 && remainingMs <= urgentWindow;
  const ingestedAt = new Date(lead.created_at).getTime();
  const wasOverdueOnIngest = Number.isFinite(ingestedAt) && hasValidSla && ingestedAt >= expiryTime;
  const isFollowUp = getLeadFollowUpMeta(lead, nowMs).isActive;
  const contactable = hasContactChannel(lead);
  const needsResult = needsLeadResultCapture(lead);
  const isSalesHandoff = false;

  let priorityScore = 0;
  if (needsResult) priorityScore += 55;
  if (lead.intent === "hot") priorityScore += 45;
  if (lead.intent === "warm") priorityScore += 25;
  if (lead.intent === "cold") priorityScore += 8;
  if (isOverdue) priorityScore += 30;
  else if (isUrgent) priorityScore += 25;
  if (lead.status === "new") priorityScore += 12;
  if (lead.status === "processing") priorityScore += 6;
  if (contactable) priorityScore += 10;
  if (lead.intent_signals.length > 0) {
    priorityScore += Math.min(10, lead.intent_signals.length * 3);
  }
  if (!needsResult && lead.contact_attempts && lead.contact_attempts > 0) {
    priorityScore -= Math.min(10, lead.contact_attempts * 3);
  }
  if (lead.status === "completed" || lead.status === "skipped") priorityScore = 0;

  return {
    slaStartedAt,
    expiryTime,
    remainingMs,
    wasOverdueOnIngest,
    isPending,
    isOverdue,
    isUrgent,
    isFollowUp,
    isSalesHandoff,
    hasContactChannel: contactable,
    needsResultCapture: needsResult,
    priorityScore: Math.max(0, Math.min(100, Math.round(priorityScore))),
    priorityReasons: buildPriorityReasons(
      lead,
      isUrgent,
      isOverdue,
      needsResult,
    ),
    nextActionLabel: inferNextAction(lead),
  };
}

export function formatLeadSla(meta: LeadWorkbenchMeta) {
  if (!meta.isPending) return "Đã xử lý";
  if (!Number.isFinite(meta.expiryTime)) return "Chưa xác định SLA";

  const formatDuration = (totalMinutes: number) => {
    if (totalMinutes < 60) return `${totalMinutes} phút`;

    const totalHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (totalHours < 24) {
      return minutes > 0
        ? `${totalHours} giờ ${minutes} phút`
        : `${totalHours} giờ`;
    }

    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return hours > 0 ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  };

  if (meta.isOverdue) {
    const overdueMin = Math.ceil(Math.abs(meta.remainingMs) / 60000);
    return `Quá hạn ${formatDuration(overdueMin)}`;
  }

  const totalMinutes = Math.max(1, Math.ceil(meta.remainingMs / 60000));
  return `Còn ${formatDuration(totalMinutes)}`;
}

export function formatFollowUpTime(lead: Lead) {
  if (!lead.follow_up_at) return "";
  return new Date(lead.follow_up_at).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function matchesLeadWorkbenchView(
  lead: Lead,
  view: LeadWorkbenchView,
  nowMs = Date.now(),
  profile?: UserRoleProfile | null,
) {
  if (!canLeadBeVisibleToUser(lead, profile)) return false;

  const meta = getLeadWorkbenchMeta(lead, nowMs);
  const ownership = getLeadOwnershipMeta(lead, profile);

  if (view === "all") return true;

  if (view === "unassigned") {
    return ownership.status === "unassigned" && lead.status !== "completed" && lead.status !== "skipped";
  }

  if (view === "priority") {
    if (!meta.isPending) return false;
    if (meta.isFollowUp) return false;

    // If Brand Manager: show if it has pending label correction
    const isManager = profile?.role === "admin" || profile?.role === "brand_manager";
    if (isManager && lead.label_correction_status === "pending") {
      return true;
    }

    // Otherwise (or in addition): priority matches if the lead is mine and has NOT been contacted yet
    const isMine = ownership.status === "assigned_to_me" || ownership.status === "manager_override";
    const hasBeenContacted = Boolean(lead.last_contact_at || (lead.contact_attempts && lead.contact_attempts > 0));
    return isMine && !hasBeenContacted;
  }

  if (view === "active") {
    if (!meta.isPending) return false;
    const isMine = ownership.status === "assigned_to_me" || ownership.status === "manager_override";
    if (!isMine) return false;

    // Follow-up is a dedicated work queue. Excluding an active appointment
    // here prevents one lead from appearing in two primary workflow tabs.
    if (getLeadFollowUpMeta(lead, nowMs).isActive) return false;

    // Active matches if the lead is mine and HAS been contacted
    const hasBeenContacted = Boolean(
      lead.last_contact_at ||
      (lead.contact_attempts && lead.contact_attempts > 0) ||
      lead.last_action_type === "restore",
    );
    return hasBeenContacted;
  }

  if (view === "closed") {
    return lead.status === "completed";
  }

  if (view === "skipped") {
    return lead.status === "skipped";
  }

  // Supporting views for KPI calculations inside LeadStats:
  if (view === "urgent") return meta.isOverdue || meta.isUrgent;
  if (view === "follow_up") return getLeadFollowUpMeta(lead, nowMs).isActive;
  if (view === "need_result") return meta.needsResultCapture;

  return true;
}

function getLeadOwnerSortRank(
  lead: Lead,
  profile: UserRoleProfile | null | undefined,
) {
  const ownership = getLeadOwnershipMeta(lead, profile);
  if (ownership.status === "assigned_to_me") return 0;
  if (ownership.status === "unassigned") return 1;
  return 2;
}

export function sortLeadsForWorkbench(
  leads: Lead[],
  nowMs = Date.now(),
  profile?: UserRoleProfile | null,
) {
  return [...leads].sort((a, b) => {
    const ownerRankDiff =
      getLeadOwnerSortRank(a, profile) - getLeadOwnerSortRank(b, profile);
    if (ownerRankDiff !== 0) return ownerRankDiff;

    const aMeta = getLeadWorkbenchMeta(a, nowMs);
    const bMeta = getLeadWorkbenchMeta(b, nowMs);

    if (aMeta.needsResultCapture !== bMeta.needsResultCapture) {
      return aMeta.needsResultCapture ? -1 : 1;
    }

    if (aMeta.priorityScore !== bMeta.priorityScore) {
      return bMeta.priorityScore - aMeta.priorityScore;
    }

    if (aMeta.isPending && bMeta.isPending) {
      return aMeta.expiryTime - bMeta.expiryTime;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function sortFollowUpLeads(
  leads: Lead[],
  nowMs = Date.now(),
  profile?: UserRoleProfile | null,
) {
  return [...leads].sort((left, right) => {
    const leftFollowUp = getLeadFollowUpMeta(left, nowMs);
    const rightFollowUp = getLeadFollowUpMeta(right, nowMs);
    const leftTime = leftFollowUp.scheduledAt ?? Number.POSITIVE_INFINITY;
    const rightTime = rightFollowUp.scheduledAt ?? Number.POSITIVE_INFINITY;
    if (leftTime !== rightTime) return leftTime - rightTime;

    const ownerRankDiff =
      getLeadOwnerSortRank(left, profile) - getLeadOwnerSortRank(right, profile);
    if (ownerRankDiff !== 0) return ownerRankDiff;
    return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
  });
}
