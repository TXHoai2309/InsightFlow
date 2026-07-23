/**
 * Gemini API Key Rotation Manager
 *
 * Hỗ trợ 2 format env:
 *   - GEMINI_API_KEYS=key1,key2,key3,...  (recommended, comma-separated)
 *   - GEMINI_API_KEY_1=..., GEMINI_API_KEY_2=..., ... (numbered)
 *
 * Xoay vòng key round-robin để tránh bị rate limit.
 * Nếu một key fail (429/quota), tự động thử key tiếp theo.
 */

// In-memory rotation index (reset mỗi lần server restart)
let currentKeyIndex = 0;

/**
 * Thu thập tất cả Gemini API keys từ environment variables.
 */
export function getAllGeminiKeys(): string[] {
  const keys: string[] = [];

  // Format 1: GEMINI_API_KEYS=key1,key2,key3
  let csvKeys = process.env.GEMINI_API_KEYS || "";
  csvKeys = csvKeys.trim().replace(/^["']|["']$/g, "");
  if (csvKeys) {
    const parsed = csvKeys
      .split(",")
      .map((k) => k.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    keys.push(...parsed);
  }

  // Format 2: GEMINI_API_KEY_1, GEMINI_API_KEY_2, ...
  for (let i = 1; i <= 30; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && key.trim()) {
      // Avoid duplicates nếu cả 2 format cùng tồn tại
      if (!keys.includes(key.trim())) {
        keys.push(key.trim());
      }
    }
  }

  // Format 3: GEMINI_API_KEY (single key, fallback)
  const singleKey = process.env.GEMINI_API_KEY;
  if (singleKey && singleKey.trim() && !keys.includes(singleKey.trim())) {
    keys.push(singleKey.trim());
  }

  return keys;
}

/**
 * Lấy key tiếp theo theo round-robin.
 * Trả về { key, index } hoặc null nếu không có key nào.
 */
export function getNextGeminiKey(): { key: string; index: number } | null {
  const keys = getAllGeminiKeys();
  if (keys.length === 0) return null;

  const index = currentKeyIndex % keys.length;
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;

  return { key: keys[index], index };
}

/**
 * Thử gọi Gemini với key rotation tự động.
 * Nếu key hiện tại bị lỗi 429/quota/rate-limit, thử key tiếp theo.
 *
 * @param caller - async function nhận (key: string) và trả về kết quả
 * @param maxRetries - số lần thử tối đa (mặc định = số keys có sẵn)
 */
export async function callWithKeyRotation<T>(
  caller: (key: string, keyIndex: number) => Promise<T>,
  maxRetries?: number,
): Promise<T> {
  const keys = getAllGeminiKeys();
  if (keys.length === 0) {
    throw new Error(
      "Không có Gemini API key nào được cấu hình. Vui lòng thêm GEMINI_API_KEYS hoặc GEMINI_API_KEY_1 vào .env.local",
    );
  }

  const attempts = maxRetries ?? keys.length;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const keyInfo = getNextGeminiKey();
    if (!keyInfo) throw new Error("Không có key khả dụng");

    try {
      return await caller(keyInfo.key, keyInfo.index);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const errMessage = lastError.message.toLowerCase();
      const isRateLimited =
        errMessage.includes("429") ||
        errMessage.includes("quota") ||
        errMessage.includes("rate") ||
        errMessage.includes("resource_exhausted") ||
        errMessage.includes("exhausted");

      console.warn(
        `[GeminiKeyRotation] Key #${keyInfo.index + 1} thất bại (${isRateLimited ? "rate limit" : "lỗi khác"}): ${lastError.message}`,
      );

      if (!isRateLimited) {
        // Lỗi không phải rate limit (ví dụ: invalid key) → thử key tiếp
        // vẫn thử key khác để cover trường hợp key hết hạn
      }
      // Tiếp tục vòng lặp để thử key tiếp theo
    }
  }

  throw lastError ?? new Error("Tất cả Gemini API keys đều thất bại");
}

/**
 * Thông tin debug: số lượng key đã cấu hình.
 */
export function getGeminiKeyCount(): number {
  return getAllGeminiKeys().length;
}
