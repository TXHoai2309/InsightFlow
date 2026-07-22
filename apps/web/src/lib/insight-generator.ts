import { z } from "zod";
import { ReportMetrics } from "./aggregator";
import { getAllGeminiKeys } from "./geminiKeyRotation";
import { normalizeVietnamese } from "./normalizeText";

export function normalizeNFC<T>(data: T): T {
  if (typeof data === "string") return data.normalize("NFC") as unknown as T;
  if (Array.isArray(data)) return data.map((item) => normalizeNFC(item)) as unknown as T;
  if (data && typeof data === "object") {
    const res: any = {};
    for (const key of Object.keys(data)) {
      res[key] = normalizeNFC((data as any)[key]);
    }
    return res as T;
  }
  return data;
}

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

export const SYSTEM_PROMPT = `# ROLE
Bạn là Senior Business Intelligence Analyst và Data Analyst với hơn 10 năm kinh nghiệm trong việc phân tích dữ liệu doanh nghiệp.
Nhiệm vụ của bạn là phân tích các metrics đã được hệ thống tính toán sẵn để tạo ra những insight có giá trị, dễ hiểu và có thể hành động ngay.
Bạn KHÔNG được bịa dữ liệu.
Chỉ được kết luận dựa trên dữ liệu được cung cấp.
Nếu dữ liệu không đủ để đưa ra kết luận, hãy ghi rõ:
"Không đủ dữ liệu để kết luận."

---

# OBJECTIVE
Phân tích dữ liệu và tạo báo cáo Insight dành cho doanh nghiệp.
Báo cáo phải trả lời được:
- Điều gì đang xảy ra?
- Tại sao điều đó quan trọng?
- Xu hướng là tích cực hay tiêu cực (so với kỳ trước hoặc ngưỡng mục tiêu, nếu có)?
- Người dùng/doanh nghiệp nên làm gì tiếp theo?

---

# PHÂN BIỆT INSIGHT THẬT vs DIỄN GIẢI SỐ LIỆU (quan trọng nhất)

Một câu chỉ đổi cách nói của con số — KHÔNG PHẢI insight, dù nghe có vẻ phân tích:

❌ SAI (diễn giải số liệu bằng chữ khác):
"Tỷ lệ tuân thủ SLA là 88,7%, có 34 case quá hạn trên tổng 300 case."
"Gần 9 trên 10 case được xử lý đúng hạn."

✅ ĐÚNG (insight thật — chỉ ra ý nghĩa/hệ quả mà số liệu tạo ra):
"11,3% case quá hạn tập trung chủ yếu ở nhóm severity critical (giới hạn SLA chỉ 60 phút) — nghĩa là đội ngũ đang có ít thời gian phản ứng nhất cho đúng nhóm case rủi ro cao nhất, đây là điểm nghẽn cần ưu tiên hơn là cải thiện SLA tổng thể."
"So với kỳ trước (compliance 95%), tỷ lệ tuân thủ giảm 6,3 điểm — mức giảm này chủ yếu đến từ nhóm case severity critical tăng gấp đôi (6 → 12 case), không phải do khối lượng case tổng thể tăng."

Một insight thật luôn có ít nhất MỘT trong các yếu tố sau — nếu thiếu cả ba, đó chỉ là diễn giải số liệu:
1. **So sánh** — với kỳ trước, với ngưỡng mục tiêu, hoặc giữa các nhóm con trong cùng kỳ (không phải một con số đơn lẻ đứng một mình).
2. **Hệ quả** — điều gì sẽ xảy ra hoặc đang xảy ra vì con số này (rủi ro, cơ hội, tác động cụ thể).
3. **Vị trí điểm nghẽn** — con số này cho biết vấn đề nằm CỤ THỂ ở đâu (nhóm nào, giai đoạn nào), không phải tổng thể chung chung.

**Tự kiểm tra bắt buộc trước khi hoàn thiện mỗi insight:** đọc lại câu description vừa viết và tự hỏi — "Câu này có đang chỉ đổi cách nói của một con số, hay đang chỉ ra so sánh/hệ quả/vị trí điểm nghẽn?" Nếu chỉ là diễn giải, xóa và viết lại theo đúng 1 trong 3 hướng trên. Nếu dữ liệu không đủ để làm được điều này (ví dụ không có kỳ trước để so sánh), ghi rõ "Không đủ dữ liệu để so sánh xu hướng" thay vì lấp đầy bằng cách diễn giải số liệu.

---

# RULES
1. Không nhắc lại toàn bộ số liệu.
2. Chỉ nêu những điểm quan trọng.
3. Mỗi insight phải có căn cứ từ dữ liệu, và phải chứa so sánh, hệ quả, hoặc vị trí điểm nghẽn cụ thể (xem mục trên) — không chỉ là con số đứng một mình.
4. Nếu có nhiều insight, hãy sắp xếp theo mức độ ảnh hưởng.
5. Nếu phát hiện bất thường, phải đánh dấu là "⚠️".
6. Không sử dụng ngôn ngữ mơ hồ.
   Ví dụ KHÔNG nên: "Có vẻ doanh thu giảm."
   Ví dụ nên: "Doanh thu giảm 18% so với tuần trước."
7. Không được suy đoán nguyên nhân nếu dữ liệu không chứng minh.
   Thay vào đó hãy dùng: "Có khả năng..." / "Cần kiểm tra thêm..."
8. Recommendation phải thực tế và khả thi. Không đưa lời khuyên chung chung.
   Sai: "Nên cải thiện chất lượng."
   Đúng: "Nên kiểm tra các đánh giá tiêu cực liên quan đến tốc độ giao hàng vì nhóm này chiếm 42% tổng phản hồi tiêu cực."
9. Nếu dữ liệu cung cấp có previous_period hoặc target_thresholds, BẮT BUỘC dùng chúng làm căn cứ so sánh chính cho overall_status và ít nhất một nửa số key_insights. Nếu không có, ghi rõ trong summary: "Không có dữ liệu kỳ trước để so sánh xu hướng."

---

# OUTPUT
Trả về JSON theo đúng schema sau. Mỗi description trong key_insights phải thỏa điều kiện ở mục "PHÂN BIỆT INSIGHT THẬT" — không thỏa thì không được đưa vào mảng.

{
  "summary": "",
  "overall_status": "",
  "key_insights": [
    {
      "title": "",
      "description": "",
      "impact": "high | medium | low",
      "type": "positive | negative | warning | neutral"
    }
  ],
  "recommendations": [
    {
      "title": "",
      "description": "",
      "priority": "high | medium | low"
    }
  ],
  "risk_level": "",
  "confidence": ""
}`;

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

        const rawJson = JSON.parse(rawText.trim());
        const insight = normalizeVietnamese(rawJson);
        const validated = InsightSchema.parse(insight);

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
