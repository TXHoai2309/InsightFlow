import type {
  ClassificationLabel,
  LabelIntent,
  LabelQueue,
  LabelChangeRequest,
  LabelSentiment,
  LabelTopic,
  LabelUrgency,
  Lead,
  Mention,
} from "@/types/dashboard";

export type LabelChangeReason = {
  value: string;
  label: string;
};

export const LABEL_QUEUE_LABEL: Record<LabelQueue, string> = {
  lead: "Tiềm năng",
  crisis: "Khủng hoảng",
  monitoring: "Theo dõi",
  none: "Loại khỏi queue",
  review: "Chờ phân loại",
};

export const SENTIMENT_LABELS: Record<LabelSentiment, string> = {
  positive: "Tích cực",
  negative: "Tiêu cực",
  neutral: "Trung tính",
};

export const TOPIC_LABELS: Record<LabelTopic, string> = {
  quality: "Chất lượng",
  price: "Giá",
  service: "Dịch vụ",
  location: "Địa điểm",
  promotion: "Khuyến mãi",
  other: "Khác",
};

export const URGENCY_LABELS: Record<LabelUrgency, string> = {
  normal: "Bình thường",
  notable: "Đáng chú ý",
  crisis: "Crisis",
};

export const INTENT_LABELS: Record<LabelIntent, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
  none: "None",
};

export const LABEL_TOPICS: LabelTopic[] = [
  "quality",
  "price",
  "service",
  "location",
  "promotion",
  "other",
];

export const EMPTY_CLASSIFICATION_LABEL: ClassificationLabel = {
  sentiment: null,
  topic: [],
  relevance: null,
  urgency: null,
  intent: null,
};

export const LABEL_CHANGE_REASON_OPTIONS: LabelChangeReason[] = [
  { value: "wrong_intent", label: "Sai intent khách hàng" },
  { value: "wrong_topic", label: "Sai chủ đề" },
  { value: "wrong_sentiment", label: "Sai cảm xúc" },
  { value: "wrong_relevance", label: "Sai liên quan thương hiệu" },
  { value: "wrong_queue", label: "Sai hàng chờ xử lý" },
  { value: "crisis_signal", label: "Có dấu hiệu khủng hoảng/khiếu nại" },
  { value: "ai_misclassified", label: "AI phân loại sai" },
  { value: "other", label: "Lý do khác" },
];

const VALID_SENTIMENTS = new Set<LabelSentiment>([
  "positive",
  "negative",
  "neutral",
]);
const VALID_TOPICS = new Set<LabelTopic>(LABEL_TOPICS);
const VALID_URGENCIES = new Set<LabelUrgency>([
  "normal",
  "notable",
  "crisis",
]);
const VALID_INTENTS = new Set<LabelIntent>(["hot", "warm", "cold", "none"]);

function normalizeString(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

export function normalizeLabelSentiment(value: unknown): LabelSentiment | null {
  const normalized = normalizeString(value);
  return VALID_SENTIMENTS.has(normalized as LabelSentiment)
    ? (normalized as LabelSentiment)
    : null;
}

export function normalizeLabelTopic(value: unknown): LabelTopic | null {
  const normalized = normalizeString(value);
  const topicMap: Record<string, LabelTopic> = {
    delivery: "service",
    experience: "service",
    staff: "service",
    legal: "other",
    operation: "other",
    marketing: "promotion",
    competitor: "other",
  };
  const mapped = topicMap[normalized] || normalized;
  return VALID_TOPICS.has(mapped as LabelTopic) ? (mapped as LabelTopic) : null;
}

export function normalizeLabelUrgency(value: unknown): LabelUrgency | null {
  const normalized = normalizeString(value);
  return VALID_URGENCIES.has(normalized as LabelUrgency)
    ? (normalized as LabelUrgency)
    : null;
}

export function normalizeLabelIntent(value: unknown): LabelIntent | null {
  const normalized = normalizeString(value);
  return VALID_INTENTS.has(normalized as LabelIntent)
    ? (normalized as LabelIntent)
    : null;
}

export function normalizeClassificationLabel(
  raw: Partial<ClassificationLabel> | Record<string, unknown> | null | undefined,
  fallback: Partial<ClassificationLabel> = {},
): ClassificationLabel {
  const value = raw || {};
  const rawTopics = Array.isArray(value.topic)
    ? value.topic
    : value.topic
      ? [value.topic]
    : Array.isArray((value as Record<string, unknown>).topics)
      ? ((value as Record<string, unknown>).topics as unknown[])
      : [];
  const topics = Array.from(
    new Set(
      rawTopics
        .map((topic) => normalizeLabelTopic(topic))
        .filter((topic): topic is LabelTopic => Boolean(topic)),
    ),
  );

  return {
    sentiment:
      normalizeLabelSentiment(value.sentiment) ??
      normalizeLabelSentiment(fallback.sentiment) ??
      null,
    topic:
      topics.length > 0
        ? topics
        : Array.isArray(fallback.topic)
          ? fallback.topic
              .map((topic) => normalizeLabelTopic(topic))
              .filter((topic): topic is LabelTopic => Boolean(topic))
          : [],
    relevance:
      typeof value.relevance === "boolean"
        ? value.relevance
        : typeof fallback.relevance === "boolean"
          ? fallback.relevance
          : null,
    urgency:
      normalizeLabelUrgency(value.urgency) ??
      normalizeLabelUrgency(fallback.urgency) ??
      null,
    intent:
      normalizeLabelIntent(value.intent) ??
      normalizeLabelIntent(fallback.intent) ??
      null,
  };
}

export function isClassificationLabelComplete(label: ClassificationLabel) {
  return (
    label.sentiment !== null &&
    label.relevance !== null &&
    label.urgency !== null &&
    label.intent !== null
  );
}

export function inferQueueFromLabels(label: ClassificationLabel): LabelQueue {
  if (!isClassificationLabelComplete(label)) return "review";
  if (label.relevance === false) return "none";
  if (
    label.urgency === "crisis" ||
    (label.sentiment === "negative" && label.urgency === "notable")
  ) {
    return "crisis";
  }
  if (label.intent === "hot" || label.intent === "warm" || label.intent === "cold") {
    return "lead";
  }
  if (label.urgency === "notable") return "monitoring";
  return "none";
}

export function getQueueLabel(queue: LabelQueue) {
  return LABEL_QUEUE_LABEL[queue];
}

export function isPendingLeadRerouteRequest(
  request: LabelChangeRequest | null | undefined,
) {
  return Boolean(
    request &&
      request.status === "pending" &&
      request.current_queue === "lead" &&
      request.requested_queue !== "lead",
  );
}

export function canContinueLeadWorkflow(
  request: LabelChangeRequest | null | undefined,
) {
  return !isPendingLeadRerouteRequest(request);
}

export function isLabelRequestForLead(
  request: LabelChangeRequest,
  lead: Lead,
) {
  return (
    request.lead_id === lead.id ||
    request.source_id === lead.id ||
    request.id === lead.pending_label_request_id ||
    Boolean(lead.mention_id && request.mention_id === lead.mention_id) ||
    Boolean(
      lead.source_mention_id && request.mention_id === lead.source_mention_id,
    )
  );
}

export function isPendingLeadLabelRequest(
  request: LabelChangeRequest | null | undefined,
) {
  return Boolean(
    request &&
      request.status === "pending" &&
      (request.current_queue === "lead" ||
        request.requested_queue === "lead" ||
        request.source_type === "lead"),
  );
}

export function getLabelRequestStatusLabel(
  status: LabelChangeRequest["status"],
) {
  const labels: Record<LabelChangeRequest["status"], string> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    cancelled: "Đã hủy",
  };

  return labels[status];
}

export function getLabelRequestWorkflowLabel(
  request: LabelChangeRequest | null | undefined,
) {
  if (!request) return "";
  if (request.status !== "pending") return getLabelRequestStatusLabel(request.status);
  return isPendingLeadRerouteRequest(request)
    ? "Tạm khóa xử lý"
    : "Vẫn xử lý được";
}

export function getPendingRerouteMessage(
  request: LabelChangeRequest | null | undefined,
) {
  if (!isPendingLeadRerouteRequest(request) || !request) return "";

  return `Lead này đang chờ quản lý duyệt chuyển từ queue ${getQueueLabel(
    request.current_queue,
  )} sang ${getQueueLabel(
    request.requested_queue,
  )}. Tạm khóa thao tác xử lý lead cho đến khi có quyết định duyệt/từ chối.`;
}

export function getLeadCurrentLabels(
  lead: Lead,
  mention?: Mention,
): ClassificationLabel {
  const mentionTopic = mention?.topic
    ? normalizeLabelTopic(mention.topic)
    : null;
  return normalizeClassificationLabel(lead.labels, {
    sentiment: mention?.labels?.sentiment || mention?.sentiment || "neutral",
    topic: mention?.labels?.topic || (mentionTopic ? [mentionTopic] : []),
    relevance: mention?.labels?.relevance ?? true,
    urgency: mention?.labels?.urgency || "normal",
    intent: lead.labels?.intent || lead.intent,
  });
}

export function getChangedLabelFields(
  current: ClassificationLabel,
  requested: ClassificationLabel,
) {
  const fields: Array<keyof ClassificationLabel> = [
    "sentiment",
    "topic",
    "relevance",
    "urgency",
    "intent",
  ];

  return fields.filter((field) => {
    if (field === "topic") {
      return current.topic.join("|") !== requested.topic.join("|");
    }
    return current[field] !== requested[field];
  });
}

export function areClassificationLabelsEqual(
  current: ClassificationLabel,
  requested: ClassificationLabel,
) {
  return getChangedLabelFields(current, requested).length === 0;
}

export function formatClassificationLabelSummary(label: ClassificationLabel) {
  return [
    label.sentiment ? SENTIMENT_LABELS[label.sentiment] : "Chưa có cảm xúc",
    label.topic.length > 0
      ? label.topic.map((topic) => TOPIC_LABELS[topic]).join(", ")
      : "Không có chủ đề",
    label.relevance === null
      ? "Chưa rõ liên quan"
      : label.relevance
        ? "Có liên quan"
        : "Không liên quan",
    label.urgency ? URGENCY_LABELS[label.urgency] : "Chưa có mức độ",
    label.intent ? INTENT_LABELS[label.intent] : "Chưa có intent",
  ].join(" · ");
}
