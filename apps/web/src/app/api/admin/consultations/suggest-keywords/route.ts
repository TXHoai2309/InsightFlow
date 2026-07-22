import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const MAX_KEYWORDS = 30;

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function textList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map((item) => text(item, maxLength))
    .filter((item) => {
      const key = item.toLocaleLowerCase("vi");
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxItems);
}

function geminiKeys() {
  const raw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  if (!raw.trim()) return [];
  if (raw.trim().startsWith("[")) {
    try {
      return textList(JSON.parse(raw), 20, 300);
    } catch {
      return [];
    }
  }
  return raw.split(/[\s,;]+/).map((key) => key.trim()).filter(Boolean);
}

async function requireAdmin(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) return null;
  const profile = await db.collection("users").doc(token.uid).get();
  return (profile.data()?.role || token.role) === "admin" ? token : null;
}

function responseText(payload: any) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((part: any) => text(part?.text, 20_000)).join("");
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Bạn không có quyền gợi ý từ khóa." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const brandName = text(body.brandName, 180);
    const industry = text(body.industry, 180);
    const notes = text(body.notes, 1_000);
    const existingKeywords = textList(body.existingKeywords, 50, 160);
    if (!brandName) {
      return NextResponse.json({ error: "Hãy nhập tên thương hiệu trước." }, { status: 400 });
    }

    const keys = geminiKeys();
    if (keys.length === 0) {
      return NextResponse.json(
        { error: "Máy chủ chưa cấu hình GEMINI_API_KEYS." },
        { status: 503 },
      );
    }

    const prompt = [
      "Bạn là chuyên gia social listening tại Việt Nam.",
      `Hãy đề xuất ${MAX_KEYWORDS} truy vấn tìm kiếm ngắn, có giá trị để theo dõi thương hiệu ${JSON.stringify(brandName)}.`,
      industry ? `Ngành hàng: ${industry}.` : "",
      notes ? `Ghi chú của admin: ${notes}.` : "",
      existingKeywords.length ? `Từ khóa đã có (không lặp lại): ${existingKeywords.join(", ")}.` : "",
      "Bao phủ: tên và biến thể chính tả, sản phẩm/dịch vụ, review, giá/khuyến mãi, trải nghiệm, chất lượng, nhân viên/phục vụ, khiếu nại/sự cố và địa phương phù hợp.",
      "Không tự thêm thương hiệu đối thủ. Không tạo câu quá dài. Ưu tiên tiếng Việt và ý định tìm kiếm thực tế.",
      "Chỉ trả JSON đúng schema, không giải thích.",
    ].filter(Boolean).join("\n");

    const model = text(process.env.GEMINI_KEYWORD_MODEL, 100) || DEFAULT_MODEL;
    let lastStatus = 502;
    for (const key of keys) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.55,
              maxOutputTokens: 2_048,
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  keywords: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    minItems: 12,
                    maxItems: MAX_KEYWORDS,
                  },
                },
                required: ["keywords"],
              },
            },
          }),
          signal: AbortSignal.timeout(35_000),
        },
      );
      lastStatus = response.status;
      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) continue;
        break;
      }

      const payload = await response.json();
      const parsed = JSON.parse(responseText(payload));
      const existing = new Set(existingKeywords.map((item) => item.toLocaleLowerCase("vi")));
      const keywords = textList(parsed?.keywords, MAX_KEYWORDS, 160)
        .filter((item) => !existing.has(item.toLocaleLowerCase("vi")));
      if (keywords.length > 0) {
        return NextResponse.json({ keywords, model });
      }
    }

    const quotaError = lastStatus === 429;
    return NextResponse.json(
      { error: quotaError ? "Gemini đang hết hạn mức. Bạn vẫn có thể nhập từ khóa thủ công." : "AI chưa thể tạo từ khóa. Vui lòng thử lại hoặc nhập thủ công." },
      { status: quotaError ? 429 : 502 },
    );
  } catch (error) {
    console.error("[Keyword suggestion API] error:", error);
    return NextResponse.json(
      { error: "Không thể tạo gợi ý lúc này. Bạn vẫn có thể nhập từ khóa thủ công." },
      { status: 500 },
    );
  }
}
