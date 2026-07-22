import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { callWithKeyRotation, getGeminiKeyCount } from "@/lib/geminiKeyRotation";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const CACHE_TTL_MS = 5 * 60 * 1000;

type RiskLevel = "low" | "medium" | "high";
type RiskTrend = "decreasing" | "stable" | "increasing";

interface AiAnalysis {
  summary: string;
  riskLevel: RiskLevel;
  riskTrend: RiskTrend;
  confidence: number;
}

interface CacheEntry {
  expiresAt: number;
  value: AiAnalysis;
}

const analysisCache = new Map<string, CacheEntry>();

function finiteNumber(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : 0;
}

function shortText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function responseText(payload: any) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((part: any) => shortText(part?.text, 10_000)).join("");
}

function normalizeAnalysis(value: any): AiAnalysis | null {
  const summary = shortText(value?.summary, 420);
  const riskLevel = value?.riskLevel as RiskLevel;
  const riskTrend = value?.riskTrend as RiskTrend;
  const confidence = Math.round(finiteNumber(value?.confidence, 0, 100));

  if (
    !summary ||
    !["low", "medium", "high"].includes(riskLevel) ||
    !["decreasing", "stable", "increasing"].includes(riskTrend)
  ) {
    return null;
  }

  return { summary, riskLevel, riskTrend, confidence };
}

export async function POST(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
  }

  if (getGeminiKeyCount() === 0) {
    return NextResponse.json({ error: "Máy chủ chưa cấu hình Gemini API key." }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const input = {
      brandName: shortText(body.brandName, 160) || "thương hiệu đang theo dõi",
      timeRange: shortText(body.timeRange, 30) || "30d",
      score: Math.round(finiteNumber(body.score, 0, 100)),
      trend: Math.round(finiteNumber(body.trend, -100, 100)),
      totalMentions: Math.round(finiteNumber(body.totalMentions, 0, 1_000_000_000)),
      sentiment: {
        positive: Math.round(finiteNumber(body.sentiment?.positive, 0, 1_000_000_000)),
        neutral: Math.round(finiteNumber(body.sentiment?.neutral, 0, 1_000_000_000)),
        negative: Math.round(finiteNumber(body.sentiment?.negative, 0, 1_000_000_000)),
      },
      topics: Array.isArray(body.topics)
        ? body.topics.slice(0, 5).map((topic: any) => ({
            name: shortText(topic?.name, 80),
            count: Math.round(finiteNumber(topic?.count, 0, 1_000_000_000)),
            negative: Math.round(finiteNumber(topic?.negative, 0, 1_000_000_000)),
          })).filter((topic: any) => topic.name)
        : [],
    };

    const cacheKey = JSON.stringify(input);
    const cached = analysisCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ ...cached.value, cached: true });
    }

    const prompt = [
      "Bạn là chuyên gia social listening và quản trị danh tiếng thương hiệu tại Việt Nam.",
      "Dựa duy nhất trên dữ liệu tổng hợp bên dưới, hãy viết một nhận định ngắn bằng tiếng Việt cho quản lý thương hiệu.",
      "Nhận định phải nêu tín hiệu quan trọng nhất và một hành động cụ thể; không bịa sự kiện, kênh hoặc nguyên nhân không có trong dữ liệu.",
      "Nếu dữ liệu ít hoặc bằng 0, phải nói rõ mức độ hạn chế thay vì kết luận chắc chắn.",
      `Dữ liệu: ${JSON.stringify(input)}.`,
      "Chỉ trả JSON đúng schema. summary dài 1-2 câu, tối đa 280 ký tự. confidence phản ánh mức đủ của dữ liệu, không phải điểm sức khỏe.",
    ].join("\n");

    const model = shortText(process.env.GEMINI_DASHBOARD_MODEL, 100) || DEFAULT_MODEL;
    const result = await callWithKeyRotation(async (apiKey) => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 512,
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  summary: { type: "STRING" },
                  riskLevel: { type: "STRING", enum: ["low", "medium", "high"] },
                  riskTrend: { type: "STRING", enum: ["decreasing", "stable", "increasing"] },
                  confidence: { type: "INTEGER", minimum: 0, maximum: 100 },
                },
                required: ["summary", "riskLevel", "riskTrend", "confidence"],
              },
            },
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini dashboard analysis failed (${response.status})`);
      }

      const parsed = normalizeAnalysis(JSON.parse(responseText(await response.json())));
      if (!parsed) throw new Error("Gemini returned an invalid dashboard analysis");
      return parsed;
    });

    analysisCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ ...result, model });
  } catch (error) {
    console.error("[Dashboard AI analysis] error:", error);
    return NextResponse.json({ error: "AI chưa thể phân tích dữ liệu lúc này." }, { status: 502 });
  }
}
