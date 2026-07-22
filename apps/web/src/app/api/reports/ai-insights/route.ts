import { NextRequest, NextResponse } from "next/server";
import {
  callWithKeyRotation,
  getGeminiKeyCount,
} from "@/lib/geminiKeyRotation";

export const runtime = "nodejs";
export const maxDuration = 60; // 60s timeout cho Gemini

// ─── Types ────────────────────────────────────────────────────────────────────

interface MentionInput {
  id?: string;
  brand?: string;
  source?: string;
  content?: string;
  sentiment?: string;
  topic?: string;
  posted_at?: string;
  author?: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

interface AIInsightsRequest {
  brand: string;
  mentions: MentionInput[];
  prompt?: string;
  lang?: "vi" | "en";
}

// ─── Prompt Builder ────────────────────────────────────────────────────────────

function buildGeminiPrompt(
  brand: string,
  mentions: MentionInput[],
  customPrompt: string,
  lang: "vi" | "en",
): string {
  const total = mentions.length;
  if (total === 0) {
    return lang === "vi"
      ? "Không có dữ liệu mention để phân tích."
      : "No mention data to analyze.";
  }

  // ── Tính toán thống kê cơ bản ──
  let positive = 0,
    negative = 0,
    neutral = 0;
  mentions.forEach((m) => {
    const s = (m.sentiment || "").toLowerCase();
    if (s.includes("pos")) positive++;
    else if (s.includes("neg")) negative++;
    else neutral++;
  });
  const netSentiment = Math.round(((positive - negative) / total) * 100);

  // ── Phân bổ theo platform ──
  const platformCounts: Record<string, number> = {};
  const platformSentiment: Record<
    string,
    { pos: number; neg: number; neu: number }
  > = {};
  mentions.forEach((m) => {
    const src = m.source || "unknown";
    platformCounts[src] = (platformCounts[src] || 0) + 1;
    if (!platformSentiment[src])
      platformSentiment[src] = { pos: 0, neg: 0, neu: 0 };
    const s = (m.sentiment || "").toLowerCase();
    if (s.includes("pos")) platformSentiment[src].pos++;
    else if (s.includes("neg")) platformSentiment[src].neg++;
    else platformSentiment[src].neu++;
  });
  const sortedPlatforms = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  // ── Phân bổ theo topic ──
  const topicCounts: Record<string, number> = {};
  const topicSentiment: Record<
    string,
    { pos: number; neg: number; neu: number }
  > = {};
  mentions.forEach((m) => {
    const t = m.topic || "other";
    topicCounts[t] = (topicCounts[t] || 0) + 1;
    if (!topicSentiment[t]) topicSentiment[t] = { pos: 0, neg: 0, neu: 0 };
    const s = (m.sentiment || "").toLowerCase();
    if (s.includes("pos")) topicSentiment[t].pos++;
    else if (s.includes("neg")) topicSentiment[t].neg++;
    else topicSentiment[t].neu++;
  });
  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // ── Sample mentions (lấy đại diện đa dạng, tối đa 25 cái) ──
  // Ưu tiên: tiêu cực (vì insight cần cảnh báo rõ), sau đó tích cực, rồi trung lập
  const negMentions = mentions
    .filter((m) => (m.sentiment || "").toLowerCase().includes("neg"))
    .slice(0, 10);
  const posMentions = mentions
    .filter((m) => (m.sentiment || "").toLowerCase().includes("pos"))
    .slice(0, 10);
  const neuMentions = mentions
    .filter(
      (m) =>
        !(m.sentiment || "").toLowerCase().includes("pos") &&
        !(m.sentiment || "").toLowerCase().includes("neg"),
    )
    .slice(0, 5);
  const sampleMentions = [...negMentions, ...posMentions, ...neuMentions].slice(
    0,
    25,
  );

  // ── Build prompt ──
  const displayBrand =
    brand === "all"
      ? lang === "vi"
        ? "tất cả thương hiệu"
        : "all brands"
      : brand;

  if (lang === "vi") {
    return `Bạn là chuyên gia phân tích truyền thông mạng xã hội và brand intelligence tại Việt Nam.
Hãy đọc toàn bộ dữ liệu sau và viết một BÁO CÁO PHÂN TÍCH AI INSIGHTS chuyên nghiệp, cụ thể, có dẫn chứng số liệu.

═══════════════════════════════════════════════════
📊 DỮ LIỆU THỰC TẾ — THƯƠNG HIỆU: ${displayBrand.toUpperCase()}
═══════════════════════════════════════════════════

▶ THỐNG KÊ TỔNG QUAN:
• Tổng đề cập: ${total} lượt
• Tích cực: ${positive} lượt (${Math.round((positive / total) * 100)}%)
• Tiêu cực: ${negative} lượt (${Math.round((negative / total) * 100)}%)
• Trung lập: ${neutral} lượt (${Math.round((neutral / total) * 100)}%)
• Net Sentiment: ${netSentiment > 0 ? "+" : ""}${netSentiment}%

▶ PHÂN BỔ THEO NỀN TẢNG (top ${sortedPlatforms.length}):
${sortedPlatforms
  .map(([p, c]) => {
    const s = platformSentiment[p];
    const posRatio = s ? Math.round((s.pos / c) * 100) : 0;
    const negRatio = s ? Math.round((s.neg / c) * 100) : 0;
    return `• ${p}: ${c} đề cập (${Math.round((c / total) * 100)}%) — ${posRatio}% tích cực, ${negRatio}% tiêu cực`;
  })
  .join("\n")}

▶ PHÂN BỔ THEO CHỦ ĐỀ (top ${sortedTopics.length}):
${sortedTopics
  .map(([t, c]) => {
    const s = topicSentiment[t];
    const posRatio = s ? Math.round((s.pos / c) * 100) : 0;
    const negRatio = s ? Math.round((s.neg / c) * 100) : 0;
    return `• ${t.toUpperCase()}: ${c} đề cập (${Math.round((c / total) * 100)}%) — ${posRatio}% tích cực, ${negRatio}% tiêu cực`;
  })
  .join("\n")}

▶ MẪU NỘI DUNG ĐỀ CẬP TIÊU BIỂU (${sampleMentions.length} mẫu):
${sampleMentions
  .map((m, i) => {
    const s = (m.sentiment || "").toLowerCase().includes("pos")
      ? "✅ Tích cực"
      : (m.sentiment || "").toLowerCase().includes("neg")
        ? "❌ Tiêu cực"
        : "➖ Trung lập";
    return `[${i + 1}] ${s} | Nguồn: ${m.source || "?"} | Chủ đề: ${m.topic || "?"}\n   "${(m.content || "").slice(0, 200)}"`;
  })
  .join("\n\n")}

${customPrompt ? `▶ YÊU CẦU PHÂN TÍCH ĐẶC BIỆT TỪ NGƯỜI DÙNG:\n"${customPrompt}"` : ""}

═══════════════════════════════════════════════════
📋 QUY TẮC BẮT BUỘC KHI VIẾT BÁO CÁO:
═══════════════════════════════════════════════════
1. KHÔNG BỊ CẮT ĐOẠN: Bắt buộc hoàn thành trọn vẹn cả 4 mục bên dưới. Viết đầy đủ kết luận, không dừng giữa chừng.
2. 🚫 NGUYÊN TẮC CHỐNG BỊA THÔNG TIN (ZERO HALLUCINATION):
   • Chỉ phân tích dựa trên ĐÚNG các chỉ số thực tế trong prompt. TUYỆT ĐỐI KHÔNG BỊA THÊM SỐ LIỆU, không bịa tên chi nhánh hay sự cố không có trong dữ liệu.
   • Nếu một chỉ số bằng 0 (ví dụ: 0 ca quá hạn SLA, 0 khiếu nại): BẮT BUỘC ghi "Không có ca trễ SLA trong kỳ" hoặc "Không ghi nhận vi phạm". KHÔNG ĐƯỢC tự bịa ra kịch bản khiếu nại.
   • Nếu không có thông tin về nguyên nhân cụ thể trong dữ liệu, ghi rõ: "Không đủ dữ liệu để xác định nguyên nhân cụ thể."
3. PHÂN BIỆT INSIGHT THẬT VS DIỄN GIẢI SỐ LIỆU (QUAN TRỌNG NHẤT):
   • Không chỉ diễn giải lại số liệu bằng chữ khác (Ví dụ SAI: "Tỷ lệ SLA 88.7%, có 34 ca quá hạn").
   • INSIGHT THẬT BẮT BUỘC có ít nhất 1 trong 3 yếu tố:
     1) So sánh: Với kỳ trước, ngưỡng mục tiêu hoặc giữa các nhóm con.
     2) Hệ quả: Rủi ro, cơ hội, tác động CSAT/doanh thu cụ thể.
     3) Vị trí điểm nghẽn: Chỉ ra vấn đề nằm CỤ THỂ ở nhóm/giai đoạn nào.
   • Nếu phát hiện bất thường, đánh dấu "⚠️".
   • Không suy đoán nguyên nhân nếu dữ liệu không chứng minh (dùng: "Có khả năng..." / "Cần kiểm tra thêm...").
   • Lời khuyên (Recommendation) phải thực tế và khả thi, không đưa lời khuyên chung chung.

4. CẤU TRÚC 4 MỤC THỐNG NHẤT BẮT BUỘC:

**1. ĐÁNH GIÁ TỔNG QUAN SỨC KHỎE THƯƠNG HIỆU & CAM KẾT SLA**
   - Phân tích Net Sentiment (${netSentiment > 0 ? "+" : ""}${netSentiment}%) và tỷ lệ phân bổ (${positive}% tích cực, ${negative}% tiêu cực). Nêu rõ INSIGHT QUẢN TRỊ về mức độ hài lòng thực sự của khách hàng.
   - Đánh giá tổng thể hiệu suất vận hành & điểm nghẽn SLA.

**2. PHÂN TÍCH CHUYÊN SÂU ĐIỂM NÓNG & DỮ LIỆU THỰC TẾ (INSIGHTS FOR BRAND)**
   - Phân tích các chủ đề có lượng tương tác cao nhất. Với mỗi chủ đề, nêu con số + INSIGHT tác động thực tế tới thương hiệu ${displayBrand}.
   - Đánh giá nền tảng có tỷ lệ tiêu cực cao nhất và nguyên nhân gốc rễ từ phản hồi của người dùng.

**3. DỰ BÁO RỦI RO TRUYỀN THÔNG & NGHẼN VẬN HÀNH**
   - ${customPrompt ? "Trả lời chuyên sâu yêu cầu đặc biệt của người dùng: \"" + customPrompt + "\" kèm dẫn chứng dữ liệu thực tế." : "Dự báo các rủi ro truyền thông tiềm ẩn từ luồng ý kiến tiêu cực và nghẽn trong khâu đáp ứng khách hàng."}

**4. 3 KHUYẾN NGHỊ HÀNH ĐỘNG VÀ KẾ HOẠCH THỰC THI THƯƠNG HIỆU**
   - Đề xuất 3 hành động cụ thể, khả thi kèm thời gian thực thi (Khẩn cấp 24h / Ngắn hạn 7 ngày / Trung hạn 30 ngày).

Viết bằng văn phong báo cáo quản trị BI cao cấp, súc tích và giàu giá trị thực thi.`;
  }

  // ── English version ──
  return `You are a professional brand intelligence & social media strategist.
Read all data below and generate a complete, 4-section AI INSIGHTS REPORT for ${displayBrand.toUpperCase()}.

CRITICAL RULES:
1. NO TRUNCATION: Fully complete all 4 sections. Do not cut off text midway.
2. INSIGHT FOR BRAND ON EVERY METRIC: For EVERY raw stat (% negative, SLA delays, conversion rate), provide a deep BRAND INSIGHT explaining WHY it happened, its IMPACT on brand equity/sales, and HOW to fix it. Never output raw numbers alone.
3. UNIFIED 4-SECTION STRUCTURE:

**1. OVERALL BRAND HEALTH & SLA PERFORMANCE**
**2. DEEP DIVE INTO HOTSPOTS & EMPIRICAL BRAND INSIGHTS**
**3. RISK FORECASTING & OPERATIONAL BOTTLENECKS**
**4. 3 PRIORITY ACTION RECOMMENDATIONS & EXECUTION PLAN**

Write in authoritative executive style.`;
}

// ─── Gemini API Caller ────────────────────────────────────────────────────────

async function callGeminiAPI(
  apiKey: string,
  promptText: string,
): Promise<string> {
  const models = [
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ];
  let lastErrMessage = "";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: "Bạn là chuyên gia phân tích dữ liệu & chiến lược thương hiệu cao cấp. BẮT BUỘC viết hoàn chỉnh báo cáo từ MỤC 1 đến MỤC 4. KHÔNG ĐƯỢC dừng giữa chừng hay cắt ngắn câu kết.",
            },
          ],
        },
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }

    const errorBody = await response.text();
    lastErrMessage = `Gemini model ${model} error ${response.status}: ${errorBody}`;

    if (response.status === 404) {
      continue;
    }
    throw new Error(lastErrMessage);
  }

  throw new Error(lastErrMessage);
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: AIInsightsRequest = await request.json();
    const { brand, mentions, prompt = "", lang = "vi" } = body;

    if (!brand) {
      return NextResponse.json(
        { error: "Thiếu thông tin brand" },
        { status: 400 },
      );
    }

    const keyCount = getGeminiKeyCount();
    if (keyCount === 0) {
      return NextResponse.json(
        {
          error:
            "Chưa cấu hình Gemini API key. Vui lòng thêm GEMINI_API_KEYS hoặc GEMINI_API_KEY_1 vào .env.local",
          fallback: true,
        },
        { status: 503 },
      );
    }

    // Giới hạn số lượng mentions gửi lên (tránh vượt token limit)
    const cappedMentions = mentions.slice(0, 500);

    const promptText = buildGeminiPrompt(brand, cappedMentions, prompt, lang);

    // Gọi Gemini với key rotation tự động
    const insights = await callWithKeyRotation(
      async (key: string) => callGeminiAPI(key, promptText),
      keyCount, // thử tối đa bằng số keys
    );

    return NextResponse.json({
      insights: insights.normalize("NFC"),
      mentionsAnalyzed: cappedMentions.length,
      keyCount,
      model: "gemini-1.5-flash",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[AI Insights API] Error:", message);

    return NextResponse.json(
      {
        error: message,
        fallback: true,
      },
      { status: 500 },
    );
  }
}
