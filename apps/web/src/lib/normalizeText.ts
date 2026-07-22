/**
 * Chuẩn hóa chuỗi tiếng Việt hoặc toàn bộ Object/Array về dạng Unicode NFC
 * để tránh lỗi vỡ font/khoảng trắng lệch trước dấu (NFD).
 */
export function normalizeVietnamese<T>(obj: T): T {
  if (typeof obj === "string") {
    return obj.normalize("NFC") as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeVietnamese(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = normalizeVietnamese(value as unknown);
    }
    return result as T;
  }
  return obj;
}
