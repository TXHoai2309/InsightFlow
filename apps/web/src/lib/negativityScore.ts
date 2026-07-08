const TOPIC_WEIGHTS: Record<string, number> = {
  legal: 2.5,
  quality: 2.0,
  service: 1.8,
  staff: 1.6,
  experience: 1.4,
  delivery: 1.3,
  operation: 1.2,
  price: 1.1,
  marketing: 1.0,
  competitor: 1.0,
  other: 1.0,
};

const URGENCY_MULTIPLIERS: Record<string, number> = {
  crisis: 2.0,
  notable: 1.4,
  normal: 1.0,
};

const PLATFORM_RISK: Record<string, number> = {
  tiktok: 1.3,
  facebook: 1.2,
  youtube: 1.15,
  news: 1.1,
  thread: 1.05,
  google_maps: 1.0,
  be: 1.0,
};

const CRISIS_KEYWORDS = [
  "ngộ độc",
  "tẩy chay",
  "khủng hoảng",
  "kiện",
  "tố cáo",
  "lừa đảo",
  "sập",
  "chết",
  "nguy hiểm",
  "công an",
  "thanh tra",
  "thu hồi",
];

export interface NegativityResult {
  score: number;
  severity: "critical" | "high" | "medium" | "low";
}

export function calculateNegativityScore(params: {
  sentiment: string;
  topic: string;
  urgency?: string | null;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  platform?: string;
  text?: string;
}): NegativityResult {
  const sentimentBase =
    params.sentiment === "negative" ? 40 :
    params.sentiment === "neutral" ? 10 : 0;

  if (sentimentBase === 0) return { score: 0, severity: "low" };

  const topicWeight = TOPIC_WEIGHTS[params.topic] ?? 1.0;

  const urgencyMult = URGENCY_MULTIPLIERS[params.urgency ?? "normal"] ?? 1.0;

  const likes = params.likeCount ?? 0;
  const comments = params.commentCount ?? 0;
  const shares = params.shareCount ?? 0;
  const engagement = likes + comments * 2 + shares * 3;
  const engagementAmp =
    engagement >= 1000 ? 1.5 :
    engagement >= 500  ? 1.3 :
    engagement >= 100  ? 1.2 :
    engagement >= 50   ? 1.1 : 1.0;

  const platformRisk = PLATFORM_RISK[params.platform ?? ""] ?? 1.0;

  const lowerText = (params.text ?? "").toLowerCase();
  const keywordHits = CRISIS_KEYWORDS.filter(kw => lowerText.includes(kw)).length;
  const keywordBonus = Math.min(15, keywordHits * 5);

  const raw = sentimentBase * topicWeight * urgencyMult * engagementAmp * platformRisk;
  const score = Math.min(100, Math.round(raw / 2) + keywordBonus);

  const severity: NegativityResult["severity"] =
    score >= 75 ? "critical" :
    score >= 50 ? "high" :
    score >= 20 ? "medium" : "low";

  return { score, severity };
}
