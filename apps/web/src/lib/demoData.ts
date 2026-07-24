import type {
  Alert,
  LabelChangeRequest,
  Lead,
  Mention,
  Workspace,
} from "@/types/dashboard";

const DEMO_BRAND = "Demo Brand";
const DEMO_NOW = Date.now();
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const PLATFORMS = [
  "facebook",
  "tiktok",
  "youtube",
  "thread",
  "google_maps",
  "news",
  "be",
] as const;

const TOPICS: Mention["topic"][] = [
  "quality",
  "service",
  "price",
  "delivery",
  "staff",
  "experience",
  "marketing",
  "operation",
  "competitor",
  "other",
];

const SENTIMENT_PATTERN: Mention["sentiment"][] = [
  "positive",
  "negative",
  "positive",
  "neutral",
  "negative",
  "positive",
  "negative",
  "neutral",
  "positive",
];

const AUTHORS = [
  "Nguyễn Minh Anh",
  "Trần Thu Hà",
  "Lê Quốc Bảo",
  "Phạm Gia Hân",
  "Hoàng Đức Long",
  "Đỗ Thanh Tâm",
  "Vũ Khánh Linh",
  "Bùi Tuấn Kiệt",
  "Mai Ngọc Lan",
  "Đặng Hải Nam",
];

const CONTENT_BY_SENTIMENT: Record<Mention["sentiment"], string[]> = {
  positive: [
    "Sản phẩm có chất lượng tốt, đóng gói cẩn thận và giao đúng hẹn.",
    "Nhân viên hỗ trợ rất nhiệt tình, xử lý yêu cầu nhanh hơn mong đợi.",
    "Trải nghiệm lần này rất ổn, tôi sẽ tiếp tục giới thiệu cho bạn bè.",
    "Chương trình ưu đãi rõ ràng, mua hàng thuận tiện và đáng tin cậy.",
  ],
  neutral: [
    "Cho mình hỏi sản phẩm này còn hàng và có giao trong ngày không?",
    "Mình đang so sánh các gói dịch vụ, xin gửi thêm thông tin chi tiết.",
    "Thương hiệu vừa công bố chương trình mới dành cho khách hàng tháng này.",
    "Có thể tư vấn giúp mình chính sách đổi trả và thời gian bảo hành không?",
  ],
  negative: [
    "Đơn hàng giao chậm nhưng chưa thấy cập nhật tình trạng xử lý rõ ràng.",
    "Sản phẩm nhận được chưa đúng mô tả, tôi cần thương hiệu phản hồi sớm.",
    "Trải nghiệm phục vụ chưa tốt và việc liên hệ hỗ trợ mất quá nhiều thời gian.",
    "Vấn đề vẫn chưa được giải quyết, mong bộ phận phụ trách liên hệ lại ngay.",
  ],
};

const INTENT_SIGNALS: Record<Exclude<Lead["intent"], "none">, string[]> = {
  hot: ["xin báo giá", "mua ngay", "triển khai sớm"],
  warm: ["cần tư vấn", "so sánh gói", "xin chính sách"],
  cold: ["tham khảo", "tìm hiểu thêm", "có thể quan tâm"],
};

function isoAt(timestamp: number) {
  return new Date(timestamp).toISOString();
}

function mentionTimestamp(index: number) {
  // Five records per day gives a stable 60-day history for current/previous
  // period comparisons while still keeping fresh records for the Today view.
  return DEMO_NOW - 12 * 60 * 1000 - index * 4.8 * HOUR_MS;
}

function labelTopic(topic: Mention["topic"]) {
  if (["quality", "price", "service"].includes(topic)) return topic;
  if (topic === "marketing") return "promotion";
  if (topic === "staff" || topic === "experience") return "service";
  return "other";
}

function leadIntent(index: number): Lead["intent"] {
  if (index % 5 > 1) return "none";
  return (["hot", "warm", "cold"] as const)[index % 3];
}

function buildAlertWorkflow(index: number, createdAtMs: number) {
  const operationAt = isoAt(createdAtMs + 2 * HOUR_MS);
  const workflowIndex = Math.floor(index / 10) % 8;

  if (workflowIndex === 1) {
    return {
      resolution_status: "resolving",
      being_resolved_by: "demo@example.com",
      being_resolved_at: operationAt,
    };
  }
  if (workflowIndex === 2) {
    return {
      resolution_status: "contact_failed",
      being_resolved_by: "demo@example.com",
      being_resolved_at: operationAt,
      customer_contact_opened_at: operationAt,
      customer_contact_note: "Đã liên hệ nhưng khách hàng vẫn cần hỗ trợ thêm.",
      customer_contact_evidence_image: "demo-evidence.png",
      customer_response_result: "still_upset",
    };
  }
  if (workflowIndex === 3) {
    return {
      resolution_status: "contact_waiting",
      being_resolved_by: "demo@example.com",
      being_resolved_at: operationAt,
      customer_contact_opened_at: operationAt,
      customer_contact_note: "Đã gửi phản hồi và đang chờ khách hàng xác nhận.",
      customer_contact_evidence_image: "demo-evidence.png",
      customer_response_result: "no_response",
    };
  }
  if (workflowIndex === 4) {
    return {
      resolution_status: "resolved",
      resolved_at: isoAt(createdAtMs + 5 * HOUR_MS),
      resolved_by: "demo-user",
      resolved_by_email: "demo@example.com",
      resolved_by_name: "Khách xem Demo",
    };
  }
  if (workflowIndex === 5) {
    return {
      resolution_status: "skipped",
      skipped_at: isoAt(createdAtMs + 3 * HOUR_MS),
      skipped_by_uid: "demo-user",
      skipped_by_email: "demo@example.com",
      skipped_by_name: "Khách xem Demo",
    };
  }
  if (workflowIndex === 6) {
    return {
      resolution_status: "resolving",
      being_resolved_by: "linh.demo@insightflow.vn",
      being_resolved_at: operationAt,
    };
  }
  if (workflowIndex === 7) {
    return {
      resolution_status: "pending_approval",
      being_resolved_by: "demo@example.com",
      being_resolved_at: operationAt,
      escalation: "management_review",
    };
  }
  return { resolution_status: "new" };
}

export const dummyWorkspaces: Workspace[] = [
  {
    id: DEMO_BRAND,
    brand_name: DEMO_BRAND,
    scale: "large",
    keywords: ["demo", "dịch vụ", "chất lượng"],
    synonyms: ["InsightFlow Demo"],
    priority: true,
    created_at: isoAt(DEMO_NOW - 180 * DAY_MS),
  },
];

export const dummyMentions: Mention[] = Array.from({ length: 300 }, (_, index) => {
  const number = index + 1;
  const id = `demo-mention-${String(number).padStart(3, "0")}`;
  const groupStart = index - (index % 5);
  const rootId = `demo-mention-${String(groupStart + 1).padStart(3, "0")}`;
  const isPost = index % 5 === 0;
  const isReply = index % 5 === 4;
  const platform = PLATFORMS[index % PLATFORMS.length];
  const topic = TOPICS[index % TOPICS.length];
  const sentiment = SENTIMENT_PATTERN[index % SENTIMENT_PATTERN.length];
  const intent = leadIntent(index);
  const createdAtMs = mentionTimestamp(index);
  const baseContent = CONTENT_BY_SENTIMENT[sentiment][index % CONTENT_BY_SENTIMENT[sentiment].length];
  const content = `${baseContent} [Mẫu demo #${number}]`;
  const urgency = sentiment === "negative"
    ? (["urgent", "high", "medium"] as const)[index % 3]
    : sentiment === "neutral" ? "low" : "none";
  const workflow = sentiment === "negative" ? buildAlertWorkflow(index, createdAtMs) : {};
  // Keep source actions usable in the public demo. example.com always serves a
  // valid page, while the query/hash still make every synthetic source unique.
  const postUrl = `https://example.com/?platform=${platform}&post=${rootId}`;
  const contentType: Mention["content_type"] = isPost ? "post" : isReply ? "reply" : "comment";

  return {
    id,
    entity_key: id,
    workspace_id: DEMO_BRAND,
    platform,
    post_id: rootId,
    comment_id: isPost ? null : id,
    parent_id: isPost ? null : rootId,
    content,
    original_content: content,
    post_content: isPost ? content : dummyPostContext(groupStart),
    comment_content: isPost ? undefined : content,
    content_type: contentType,
    author: `${AUTHORS[index % AUTHORS.length]} ${number}`,
    sentiment,
    topic,
    credibility_score: 62 + (index * 7) % 38,
    star_count: 15 + (index * 37) % 2400,
    url: isPost ? postUrl : `${postUrl}#comment-${id}`,
    post_url: postUrl,
    comment_url: isPost ? undefined : `${postUrl}#comment-${id}`,
    source_url: isPost ? postUrl : `${postUrl}#comment-${id}`,
    posted_at: isoAt(createdAtMs),
    created_at: isoAt(createdAtMs + 2 * 60 * 1000),
    classified_at: isoAt(createdAtMs + 4 * 60 * 1000),
    labels: {
      sentiment,
      topic: [labelTopic(topic)],
      relevance: true,
      urgency,
      intent,
      ...workflow,
    } as Mention["labels"],
  };
});

function dummyPostContext(groupStart: number) {
  const number = groupStart + 1;
  const sentiment = SENTIMENT_PATTERN[groupStart % SENTIMENT_PATTERN.length];
  return `${CONTENT_BY_SENTIMENT[sentiment][groupStart % CONTENT_BY_SENTIMENT[sentiment].length]} [Bài demo #${number}]`;
}

function buildLead(mention: Mention, leadIndex: number): Lead {
  const state = leadIndex % 10;
  const createdAtMs = new Date(mention.created_at).getTime();
  const actionAt = isoAt(createdAtMs + 45 * 60 * 1000);
  const isUnassigned = state === 0 || state === 9;
  const isOtherOwner = state === 8;
  const ownerId = isUnassigned ? null : isOtherOwner ? "demo-lead-02" : "demo-user";
  const ownerName = isUnassigned ? null : isOtherOwner ? "Trần Khánh Linh" : "Khách xem Demo";
  const ownerEmail = isUnassigned ? null : isOtherOwner ? "linh.demo@insightflow.vn" : "demo@example.com";
  const base: Lead = {
    id: `demo-lead-${String(leadIndex + 1).padStart(3, "0")}`,
    mention_id: mention.id,
    source_mention_id: mention.id,
    post_id: mention.post_id,
    parent_id: mention.parent_id,
    content_type: mention.content_type,
    current_label: `lead_${mention.labels?.intent || "warm"}` as Lead["current_label"],
    labels: mention.labels,
    workspace_id: DEMO_BRAND,
    platform: mention.platform,
    author: mention.author,
    content: mention.content,
    intent: mention.labels?.intent === "none" || !mention.labels?.intent
      ? "warm"
      : mention.labels.intent,
    intent_signals: INTENT_SIGNALS[(mention.labels?.intent === "none" || !mention.labels?.intent ? "warm" : mention.labels.intent) as Exclude<Lead["intent"], "none">],
    status: "new",
    owner_id: ownerId,
    owner_name: ownerName,
    owner_email: ownerEmail,
    assigned_at: ownerId ? actionAt : null,
    assigned_by: ownerId ? "demo-manager" : null,
    claimed_at: ownerId ? actionAt : null,
    phone: `09${String(leadIndex % 90 + 10)} xxx ${String(100 + leadIndex).slice(-3)}`,
    email: `khachhang${String(leadIndex + 1).padStart(3, "0")}@example.com`,
    created_at: mention.created_at,
    updated_at: mention.created_at,
    posted_at: mention.posted_at,
    expiry_at: isoAt(createdAtMs + (mention.labels?.intent === "hot" ? 30 * 60 * 1000 : 24 * HOUR_MS)),
    url: mention.url,
    source_url: mention.source_url,
  };

  if (state === 1) return base;

  if (state === 2 || state === 8) {
    return {
      ...base,
      status: "processing",
      contact_attempts: 1,
      first_contacted_at: actionAt,
      last_contact_at: actionAt,
      last_action_at: actionAt,
      last_action_type: "message",
      last_contact_channel: "messenger",
      pending_result: true,
      updated_at: actionAt,
    };
  }

  if (state === 3 || state === 4) {
    const followUpAt = state === 3
      ? isoAt(DEMO_NOW + ((leadIndex % 5) + 1) * DAY_MS)
      : isoAt(DEMO_NOW - ((leadIndex % 4) + 1) * DAY_MS);
    return {
      ...base,
      status: "processing",
      contact_attempts: 1,
      first_contacted_at: actionAt,
      last_contact_at: actionAt,
      last_action_at: actionAt,
      last_action_type: "message",
      last_contact_channel: "messenger",
      pending_result: false,
      result_type: "follow_up",
      result_recorded_at: actionAt,
      follow_up_at: followUpAt,
      updated_at: actionAt,
    };
  }

  if (state === 5 || state === 6) {
    const closedAt = isoAt(createdAtMs + 6 * HOUR_MS);
    return {
      ...base,
      status: "completed",
      contact_attempts: 1,
      first_contacted_at: actionAt,
      last_contact_at: actionAt,
      pending_result: false,
      result_type: state === 5 ? "converted" : "not_fit",
      result_recorded_at: closedAt,
      closed_at: closedAt,
      sales_status: state === 5 ? "transferred" : "not_ready",
      updated_at: closedAt,
    };
  }

  if (state === 7) {
    const closedAt = isoAt(createdAtMs + 4 * HOUR_MS);
    return {
      ...base,
      status: "skipped",
      pending_result: false,
      result_type: "not_fit",
      result_recorded_at: closedAt,
      closed_at: closedAt,
      last_action_at: closedAt,
      last_action_type: "skip",
      updated_at: closedAt,
    };
  }

  return base;
}

export const dummyLeads: Lead[] = dummyMentions
  .filter((mention) => mention.labels?.intent && mention.labels.intent !== "none")
  .map(buildLead);

export const dummyAlerts: Alert[] = dummyMentions
  .filter((mention) => mention.sentiment === "negative")
  .map((mention, index) => {
    const labels = (mention.labels || {}) as Record<string, unknown>;
    const rawStatus = String(labels.resolution_status || "new");
    const status: Alert["status"] = rawStatus === "resolved"
      ? "resolved"
      : rawStatus === "new" ? "new" : "acknowledged";
    const urgency = String(labels.urgency || "medium");
    const severity: Alert["severity"] = urgency === "urgent"
      ? "critical"
      : urgency === "high" ? "high" : urgency === "low" ? "low" : "medium";

    return {
      id: `demo-alert-${String(index + 1).padStart(3, "0")}`,
      workspace_id: DEMO_BRAND,
      severity,
      status,
      signal_type: index % 3 === 0 ? "mention_spike" : index % 3 === 1 ? "high_reach" : "sensitive_topic",
      message: mention.content,
      spike_multiplier: Number((1.2 + (index % 8) * 0.35).toFixed(2)),
      affected_mentions_count: 8 + (index * 47) % 5200,
      created_at: mention.created_at,
      resolved_at: typeof labels.resolved_at === "string" ? labels.resolved_at : undefined,
      assigned_to: typeof labels.being_resolved_by === "string" ? labels.being_resolved_by : null,
    };
  });

export const dummyLabelChangeRequests: LabelChangeRequest[] = [];

export const dummyStaff: Array<{
  uid: string;
  email: string;
  displayName: string;
  role: string;
  permissions: string[];
  disabled: boolean;
}> = [
  {
    uid: "demo-user",
    email: "demo@example.com",
    displayName: "Khách xem Demo",
    role: "brand_manager",
    permissions: ["leads", "alerts", "reports"],
    disabled: false,
  },
  {
    uid: "demo-lead-01",
    email: "minhanh.demo@insightflow.vn",
    displayName: "Nguyễn Minh Anh",
    role: "lead_employee",
    permissions: ["leads"],
    disabled: false,
  },
  {
    uid: "demo-crisis-01",
    email: "quocbao.demo@insightflow.vn",
    displayName: "Lê Quốc Bảo",
    role: "crisis_employee",
    permissions: ["alerts"],
    disabled: false,
  },
  {
    uid: "demo-dual-01",
    email: "linh.demo@insightflow.vn",
    displayName: "Trần Khánh Linh",
    role: "dual_employee",
    permissions: ["leads", "alerts"],
    disabled: false,
  },
];

export const DEMO_DATA_COUNTS = Object.freeze({
  mentions: dummyMentions.length,
  leads: dummyLeads.length,
  alerts: dummyAlerts.length,
});
