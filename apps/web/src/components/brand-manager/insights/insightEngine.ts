/**
 * insightEngine.ts
 * Heuristic engine để tính toán:
 * - Delta bất thường (% tăng so với kỳ trước)
 * - Dự báo xu hướng 7 ngày tới (ngoại suy tuyến tính)
 * - Phát hiện viral risk
 * - Chi nhánh có rủi ro cao
 *
 * NOTE: Đây là heuristic tạm — sẽ thay bằng model ML thật sau.
 */

import type { Mention } from "@/types/dashboard";
import { MOCK_VENUES } from "./TimeRangeFilter";

export const TOPIC_LABELS: Record<string, string> = {
  quality: "Chất lượng sản phẩm",
  service: "Phục vụ & CSKH",
  price: "Giá cả",
  delivery: "Giao hàng",
  staff: "Thái độ nhân viên",
  legal: "Pháp lý",
  operation: "Vận hành",
  marketing: "Marketing & Truyền thông",
  experience: "Trải nghiệm không gian",
  competitor: "Đối thủ cạnh tranh",
  other: "Chủ đề khác",
};

export interface TopicDelta {
  topic: string;
  label: string;
  currentCount: number;
  prevCount: number;
  deltaPercent: number; // % tăng so với kỳ trước
  posRatio: number;     // tỉ lệ tích cực (0–1)
  negRatio: number;
  forecastScore: number; // 0–100, khả năng tiếp tục tăng (heuristic)
}

export interface CrisisSignal {
  topic: string;
  label: string;
  deltaPercent: number; // % tăng bất thường (phía tiêu cực)
  severity: "low" | "medium" | "high" | "critical";
  platformSample: string;
  contentSample: string;
}

export interface ViralRiskItem {
  platform: string;
  topic: string;
  label: string;
  negativeCount: number;
  deltaPercent: number;
  projectedViews: number;
  contentSample: string;
}

/**
 * Nhóm mentions theo topic, phân chia current vs previous period.
 */
export function computeTopicDeltas(
  currentMentions: Mention[],
  prevMentions: Mention[]
): TopicDelta[] {
  const build = (list: Mention[]) => {
    const map: Record<string, { pos: number; neg: number; neu: number }> = {};
    list.forEach(m => {
      const t = m.topic || "other";
      if (!map[t]) map[t] = { pos: 0, neg: 0, neu: 0 };
      if (m.sentiment === "positive") map[t].pos++;
      else if (m.sentiment === "negative") map[t].neg++;
      else map[t].neu++;
    });
    return map;
  };

  const cur = build(currentMentions);
  const prv = build(prevMentions);

  const allTopics = new Set([...Object.keys(cur), ...Object.keys(prv)]);
  const results: TopicDelta[] = [];

  allTopics.forEach(topic => {
    const c = cur[topic] || { pos: 0, neg: 0, neu: 0 };
    const p = prv[topic] || { pos: 0, neg: 0, neu: 0 };
    const cTotal = c.pos + c.neg + c.neu;
    const pTotal = p.pos + p.neg + p.neu;
    const delta = pTotal === 0
      ? (cTotal > 0 ? 999 : 0)
      : Math.round(((cTotal - pTotal) / pTotal) * 100);
    const posRatio = cTotal > 0 ? c.pos / cTotal : 0;
    const negRatio = cTotal > 0 ? c.neg / cTotal : 0;

    // Heuristic forecast: đà tăng mạnh + tích cực cao → forecast cao
    const forecastScore = Math.min(100, Math.max(0, Math.round(
      (delta > 0 ? Math.min(delta, 200) / 200 * 60 : 0) +
      posRatio * 40
    )));

    results.push({
      topic,
      label: TOPIC_LABELS[topic] || topic,
      currentCount: cTotal,
      prevCount: pTotal,
      deltaPercent: delta,
      posRatio,
      negRatio,
      forecastScore,
    });
  });

  return results.filter(d => d.currentCount > 0);
}

/**
 * Lấy cơ hội mới nổi: tăng bất thường + phần lớn tích cực.
 */
export function getEmergingOpportunities(deltas: TopicDelta[]): TopicDelta[] {
  return deltas
    .filter(d => d.deltaPercent > 30 && d.posRatio > 0.4)
    .sort((a, b) => b.deltaPercent - a.deltaPercent)
    .slice(0, 5);
}

/**
 * Lấy tín hiệu khủng hoảng: tăng bất thường + phần lớn tiêu cực.
 */
export function getCrisisSignals(
  deltas: TopicDelta[],
  currentMentions: Mention[]
): CrisisSignal[] {
  return deltas
    .filter(d => d.deltaPercent > 30 && d.negRatio > 0.4)
    .sort((a, b) => b.deltaPercent - a.deltaPercent)
    .slice(0, 5)
    .map(d => {
      const negMentions = currentMentions.filter(
        m => (m.topic || "other") === d.topic && m.sentiment === "negative"
      );
      const sample = negMentions[0];
      const severity: CrisisSignal["severity"] =
        d.deltaPercent > 300 ? "critical"
        : d.deltaPercent > 150 ? "high"
        : d.deltaPercent > 60 ? "medium"
        : "low";
      return {
        topic: d.topic,
        label: d.label,
        deltaPercent: d.deltaPercent,
        severity,
        platformSample: sample?.platform || "facebook",
        contentSample: sample?.content || "",
      };
    });
}

/**
 * Tính Early Warning score: xác suất khủng hoảng tiếp diễn (0–100).
 * Heuristic: dựa trên số tín hiệu + mức độ bất thường.
 */
export function computeEarlyWarningScore(
  crisisSignals: CrisisSignal[],
  currentMentions: Mention[]
): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 30; // base

  if (crisisSignals.length >= 3) { score += 20; factors.push("Nhiều chủ đề bị phàn nàn cùng lúc"); }
  if (crisisSignals.some(s => s.severity === "critical")) { score += 25; factors.push("Có tín hiệu nghiêm trọng (tăng >300%)"); }
  if (crisisSignals.some(s => s.severity === "high")) { score += 15; factors.push("Tín hiệu mức cao phát hiện"); }

  const negCount = currentMentions.filter(m => m.sentiment === "negative").length;
  const total = currentMentions.length || 1;
  if (negCount / total > 0.3) { score += 10; factors.push("Tỉ lệ tiêu cực vượt 30%"); }

  const platforms = new Set(currentMentions.filter(m => m.sentiment === "negative").map(m => m.platform));
  if (platforms.size >= 3) { score += 10; factors.push("Tiêu cực lan rộng trên nhiều nền tảng"); }
  if (platforms.has("tiktok")) { score += 5; factors.push("Có tín hiệu trên TikTok (nguy cơ viral)"); }

  if (factors.length < 2) factors.push("Chưa đủ tín hiệu để cảnh báo mức cao");

  return { score: Math.min(99, score), factors };
}

/**
 * Phát hiện viral risk: mentions tiêu cực tập trung trên 1 platform.
 */
export function getViralRisks(currentMentions: Mention[]): ViralRiskItem[] {
  const byPlatformTopic: Record<string, { neg: number; total: number; topic: string; content: string }> = {};

  currentMentions.forEach(m => {
    const key = `${m.platform}||${m.topic || "other"}`;
    if (!byPlatformTopic[key]) byPlatformTopic[key] = { neg: 0, total: 0, topic: m.topic || "other", content: m.content || "" };
    byPlatformTopic[key].total++;
    if (m.sentiment === "negative") byPlatformTopic[key].neg++;
  });

  return Object.entries(byPlatformTopic)
    .filter(([_, d]) => d.neg >= 2 && d.neg / d.total > 0.5)
    .sort((a, b) => b[1].neg - a[1].neg)
    .slice(0, 3)
    .map(([key, d]) => {
      const [platform] = key.split("||");
      return {
        platform,
        topic: d.topic,
        label: TOPIC_LABELS[d.topic] || d.topic,
        negativeCount: d.neg,
        deltaPercent: Math.round(d.neg / d.total * 100),
        projectedViews: d.neg * 15000, // heuristic projection
        contentSample: d.content,
      };
    });
}

/**
 * Tính rủi ro theo chi nhánh bằng cách tìm tên chi nhánh trong nội dung (vì API hiện chưa bóc tách riêng field này).
 */
export function computeVenueRisks(currentMentions: Mention[]): {
  venues: { name: string; negCount: number; totalCount: number; negRatio: number }[];
  systemAvgNegRatio: number;
} {
  const venueData: Record<string, { neg: number; total: number }> = {};
  
  // Sử dụng danh sách các chi nhánh phổ biến làm từ điển quét
  const KNOWN_VENUES = [
    "Láng Hạ", "Nguyễn Du", "Hàm Cá Mập", "Time City", "Landmark 81", 
    "Võ Văn Ngân", "Phan Đình Phùng", "Trần Duy Hưng", "Hồ Tùng Mậu", "Nguyễn Trãi",
    "Hai Bà Trưng", "Lê Lợi", "Nguyễn Huệ", "Quận 1", "Quận 7", "Cầu Giấy"
  ];

  currentMentions.forEach(m => {
    const text = (m.content || "").toLowerCase();
    let found = false;
    
    // Quét xem nội dung có nhắc đến chi nhánh nào không
    for (const v of KNOWN_VENUES) {
      if (text.includes(v.toLowerCase())) {
        if (!venueData[v]) venueData[v] = { neg: 0, total: 0 };
        venueData[v].total++;
        if (m.sentiment === "negative") venueData[v].neg++;
        found = true;
      }
    }
  });

  const totalNeg   = currentMentions.filter(m => m.sentiment === "negative").length;
  const totalAll   = currentMentions.length || 1;
  const sysAvg     = totalNeg / totalAll;

  const venues = Object.entries(venueData)
    // Chỉ lấy các chi nhánh có đủ lượng data để thống kê
    .filter(([_, d]) => d.total >= 1) 
    .map(([name, d]) => ({
      name,
      negCount: d.neg,
      totalCount: d.total,
      negRatio: sysAvg > 0 ? (d.neg / d.total) / sysAvg : 0,
    }));

  return { venues, systemAvgNegRatio: sysAvg };
}
