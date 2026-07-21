import { z } from "zod";
import { ReportMetrics } from "./aggregator";
import { getAllGeminiKeys } from "./geminiKeyRotation";

// ─── Zod Schema Definition ───────────────────────────────────────────────────

export const KeyInsightItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  impact: z.enum(["high", "medium", "low"]),
  type: z.enum(["positive", "negative", "warning", "neutral"]),
});

export const RecommendationItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(["high", "medium", "low"]),
});

export const InsightSchema = z.object({
  summary: z.string(),
  overall_status: z.string(),
  key_insights: z.array(KeyInsightItemSchema),
  recommendations: z.array(RecommendationItemSchema),
  risk_level: z.string(),
  confidence: z.string(),
});

export type InsightReport = z.infer<typeof InsightSchema>;

// ─── System Prompt (Bắt buộc giữ nguyên 100%) ─────────────────────────────

export const SYSTEM_PROMPT = `ROLE

Bạn là Senior Business Intelligence Analyst và Data Analyst với hơn 10 năm kinh nghiệm trong việc phân tích dữ liệu doanh nghiệp.
Nhiệm vụ của bạn là phân tích các metrics đã được hệ thống tính toán sẵn để tạo ra những insight có giá trị, dễ hiểu và có thể hành động ngay.
Bạn KHÔNG được bịa dữ liệu.
Chỉ được kết luận dựa trên dữ liệu được cung cấp.
Nếu dữ liệu không đủ để đưa ra kết luận, hãy ghi rõ:
"Không đủ dữ liệu để kết luận."

OBJECTIVE

Phân tích dữ liệu và tạo báo cáo Insight dành cho doanh nghiệp.
Báo cáo phải trả lời được:

Điều gì đang xảy ra?
Tại sao điều đó quan trọng?
Xu hướng là tích cực hay tiêu cực?
Người dùng/doanh nghiệp nên làm gì tiếp theo?

RULES
Không nhắc lại toàn bộ số liệu.
Chỉ nêu những điểm quan trọng.
Mỗi insight phải có căn cứ từ dữ liệu.
Nếu có nhiều insight, hãy sắp xếp theo mức độ ảnh hưởng.
Nếu phát hiện bất thường, phải đánh dấu là "⚠️".
Không sử dụng ngôn ngữ mơ hồ.
Không được suy đoán nguyên nhân nếu dữ liệu không chứng minh. Dùng "Có khả năng..." hoặc "Cần kiểm tra thêm...".
Recommendation phải thực tế và khả thi, không chung chung.`;

// ─── Priority Mapping Helpers ────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

export function sortInsightsAndRecommendations(data: InsightReport): InsightReport {
  const sortedKeyInsights = [...data.key_insights].sort(
    (a, b) => (PRIORITY_ORDER[a.impact] || 99) - (PRIORITY_ORDER[b.impact] || 99),
  );

  const sortedRecommendations = [...data.recommendations].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] || 99) - (PRIORITY_ORDER[b.priority] || 99),
  );

  return {
    ...data,
    key_insights: sortedKeyInsights,
    recommendations: sortedRecommendations,
  };
}

// ─── Fallback / Empty Data Helper ──────────────────────────────────────────

export function createFallbackInsightReport(): InsightReport {
  return {
    summary: "Không đủ dữ liệu để kết luận.",
    overall_status: "Chưa xác định",
    key_insights: [],
    recommendations: [],
    risk_level: "Không đủ dữ liệu",
    confidence: "Thấp",
  };
}

// ─── Gemini API Call Function with Retry ────────────────────────────────────

export async function generateInsightFromMetrics(
  metrics: ReportMetrics,
  maxRetries = 3,
): Promise<InsightReport> {
  const keys = getAllGeminiKeys();
  const promptInput = `${SYSTEM_PROMPT}\n\n{{metrics}}:\n${JSON.stringify(metrics, null, 2)}`;

  const models = [
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ];

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const key = keys.length > 0 ? keys[(attempt - 1) % keys.length] : process.env.GEMINI_API_KEY || "";

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: promptInput }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
              maxOutputTokens: 4096,
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 404) continue;
          throw new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 200)}`);
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          throw new Error("Dữ liệu phản hồi từ Gemini API rỗng");
        }

        const parsedJson = JSON.parse(rawText.trim());
        const validated = InsightSchema.parse(parsedJson);

        // Sort by impact / priority before returning
        return sortInsightsAndRecommendations(validated);
      } catch (err: any) {
        lastError = err;
        // Proceed to next model or next attempt
      }
    }
  }

  // If retries failed, throw clear error (as required by specification)
  throw new Error(
    `Không thể sinh báo cáo Insight sau ${maxRetries} lần thử. Lỗi chi tiết: ${lastError?.message || "Không xác định"}`,
  );
}
