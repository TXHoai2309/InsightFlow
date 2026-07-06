/**
 * generateInsightSummary.ts
 * Rule-based AI Insight text generator.
 * NOTE: Đây là bản rule-based tạm — thay bằng LLM thật bằng cách
 *       đổi body của generateAIInsightSummary() để gọi API /ai/summarize.
 */

import type { TopicDelta, CrisisSignal } from "./insightEngine";
import { MOCK_VENUES } from "./TimeRangeFilter";

export interface InsightSummary {
  headline: string;          // câu tổng kết 1 dòng
  bullets: string[];         // 3-5 gạch đầu dòng văn xuôi tự nhiên
  conclusion: string[];      // 2-3 ý chốt lại cuối trang
}

export function generateAIInsightSummary(
  opportunities: TopicDelta[],
  crisisSignals: CrisisSignal[],
  currentMentionsCount: number,
  riskVenues: { name: string; negRatio: number }[],
): InsightSummary {
  const oppCount  = opportunities.length;
  const riskCount = crisisSignals.length;
  const topOpp    = opportunities[0];
  const topRisk   = crisisSignals[0];

  // ── Headline ──────────────────────────────────────────────────
  let headline = "Thương hiệu đang trong trạng thái bình thường, chưa có tín hiệu đặc biệt.";
  if (oppCount > 0 && riskCount > 0) {
    headline = `Thương hiệu đang có ${oppCount} cơ hội và ${riskCount} rủi ro đáng chú ý.`;
  } else if (oppCount > 0) {
    headline = `Thương hiệu đang có ${oppCount} cơ hội nổi bật, chưa phát hiện rủi ro đáng kể.`;
  } else if (riskCount > 0) {
    headline = `Phát hiện ${riskCount} tín hiệu rủi ro cần theo dõi — chưa có cơ hội rõ ràng.`;
  }

  // ── Bullets ───────────────────────────────────────────────────
  const bullets: string[] = [];

  if (topOpp) {
    const pct = topOpp.deltaPercent === 999 ? "lần đầu xuất hiện" : `tăng ${topOpp.deltaPercent}% so với kỳ trước`;
    bullets.push(`"${topOpp.label}" đang trở thành chủ đề được quan tâm nhiều nhất — ${pct}.`);
  }
  if (topRisk) {
    bullets.push(`Phần lớn phản hồi tiêu cực tập trung vào chủ đề "${topRisk.label}" với mức tăng bất thường +${topRisk.deltaPercent}%.`);
  }
  if (riskVenues.length > 0) {
    const v = riskVenues[0];
    bullets.push(`Chi nhánh ${v.name} có tỷ lệ phản hồi tiêu cực cao hơn ${(v.negRatio).toFixed(1)} lần trung bình toàn hệ thống.`);
  }
  if (crisisSignals.length === 0) {
    bullets.push("Chưa phát hiện dấu hiệu khủng hoảng trên toàn thương hiệu — mức độ rủi ro đang ở ngưỡng an toàn.");
  }
  if (opportunities.length >= 2) {
    bullets.push(`Ngoài ra, "${opportunities[1].label}" cũng đang cho thấy đà tăng đáng theo dõi trong những ngày tới.`);
  }
  if (currentMentionsCount > 0 && crisisSignals.some(s => s.severity === "critical" || s.severity === "high")) {
    bullets.push("Cần theo dõi sát các chủ đề rủi ro cao trong vài ngày tới để tránh leo thang thành khủng hoảng.");
  }

  if (bullets.length === 0) {
    bullets.push("Chưa có đủ dữ liệu để tổng hợp insight trong khoảng thời gian này.");
  }

  // ── Conclusion ────────────────────────────────────────────────
  const conclusion: string[] = [];
  if (topOpp) conclusion.push(`Ưu tiên theo dõi "${topOpp.label}" — đây là chủ đề có đà tăng mạnh nhất.`);
  if (topRisk) conclusion.push(`Chủ đề "${topRisk.label}" cần được đội vận hành kiểm tra kỹ lưỡng.`);
  if (riskVenues.length > 0) conclusion.push(`Chi nhánh ${riskVenues[0].name} cần được ưu tiên xem xét chất lượng dịch vụ.`);
  if (conclusion.length === 0) conclusion.push("Không có điểm nổi bật cần chốt lại trong khoảng thời gian này.");

  return { headline, bullets, conclusion };
}
