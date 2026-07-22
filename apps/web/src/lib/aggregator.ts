export interface ReportMetrics {
  period: { from: string; to: string };
  brand_scope: string | null;
  total_annotations: number;
  sentiment_breakdown: Record<"positive" | "negative" | "neutral" | "unknown", number>;
  topic_breakdown: Record<string, number>; // normalized: quality, price, service, location, promotion, other
  severity_breakdown: Record<string, number>; // critical, high, medium, low
  sla: {
    compliance_rate: number;
    overdue_count: number;
    resolved_count: number;
    pending_count: number;
    avg_response_minutes: number | null;
  };
}

export async function aggregateReportMetrics(params?: {
  brandScope?: string | null;
  from?: string;
  to?: string;
}): Promise<ReportMetrics> {
  const fromDate = params?.from || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const toDate = params?.to || new Date().toISOString().slice(0, 10);
  const brandScope = params?.brandScope || "Highlands Coffee";

  // Mock / default data matching ReportMetrics interface if database is not connected
  return {
    period: { from: fromDate, to: toDate },
    brand_scope: brandScope,
    total_annotations: 142,
    sentiment_breakdown: {
      positive: 65,
      negative: 32,
      neutral: 41,
      unknown: 4,
    },
    topic_breakdown: {
      quality: 48,
      service: 35,
      price: 22,
      location: 18,
      promotion: 12,
      other: 7,
    },
    severity_breakdown: {
      critical: 3,
      high: 12,
      medium: 28,
      low: 99,
    },
    sla: {
      compliance_rate: 88.5,
      overdue_count: 5,
      resolved_count: 124,
      pending_count: 13,
      avg_response_minutes: 24,
    },
  };
}
