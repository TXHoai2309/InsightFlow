export enum IntentType { HOT = "hot", WARM = "warm", COLD = "cold", NONE = "none" }

export function classifyLead(signals: string[]): IntentType {
  const hotKeywords = ["cần mua ngay", "mua ở đâu", "giá bao nhiêu", "order ngay"];
  const warmKeywords = ["đang tìm", "so sánh", "review", "ai dùng rồi chưa"];
  
  if (signals.some(s => hotKeywords.includes(s))) return IntentType.HOT;
  if (signals.some(s => warmKeywords.includes(s))) return IntentType.WARM;
  return IntentType.COLD;
}
