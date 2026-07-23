import { NextResponse } from "next/server";
import { getAllGeminiKeys } from "@/lib/geminiKeyRotation";

export const runtime = "nodejs";

export async function GET() {
  const keys = getAllGeminiKeys();

  if (keys.length === 0) {
    return NextResponse.json({
      status: "no_keys",
      message: "Chưa tìm thấy Gemini API key nào trong file .env.local (GEMINI_API_KEYS)",
      totalKeys: 0,
      results: [],
    });
  }

  const results = await Promise.all(
    keys.map(async (key, index) => {
      const maskedKey = `${key.slice(0, 6)}...${key.slice(-4)}`;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }],
          }),
        });

        if (res.ok) {
          return { index: index + 1, maskedKey, status: "WORKING", statusCode: 200 };
        } else {
          const errText = await res.text();
          if (res.status === 429 || errText.toLowerCase().includes("quota")) {
            return { index: index + 1, maskedKey, status: "RATE_LIMITED", statusCode: res.status, error: "Hết quota / Rate limited (thử lại sau)" };
          }
          if (res.status === 400 || res.status === 403 || res.status === 404) {
            return { index: index + 1, maskedKey, status: "INVALID_KEY", statusCode: res.status, error: "API key không hợp lệ hoặc sai định dạng" };
          }
          return { index: index + 1, maskedKey, status: "FAILED", statusCode: res.status, error: errText.slice(0, 100) };
        }
      } catch (err: any) {
        return { index: index + 1, maskedKey, status: "ERROR", error: err.message };
      }
    }),
  );

  const workingCount = results.filter((r) => r.status === "WORKING").length;
  const rateLimitedCount = results.filter((r) => r.status === "RATE_LIMITED").length;
  const invalidCount = results.filter((r) => r.status === "INVALID_KEY").length;
  const failedCount = results.filter((r) => r.status === "FAILED" || r.status === "ERROR").length;

  return NextResponse.json({
    status: workingCount > 0 ? "ok" : "all_failed",
    totalKeys: keys.length,
    summary: {
      total: keys.length,
      working: workingCount,
      rateLimited: rateLimitedCount,
      invalid: invalidCount,
      failed: failedCount,
    },
    results,
  });
}
