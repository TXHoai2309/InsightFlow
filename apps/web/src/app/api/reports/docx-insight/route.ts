import { NextRequest, NextResponse } from "next/server";
import { aggregateReportMetrics } from "@/lib/aggregator";
import { generateInsightFromMetrics, createFallbackInsightReport } from "@/lib/insight-generator";
import { generateDocxReport } from "@/lib/docx-generator";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Allow empty body
    }

    const { brand_scope, from, to } = body;

    // 1. Aggregate ReportMetrics
    const metrics = await aggregateReportMetrics({
      brandScope: brand_scope,
      from,
      to,
    });

    // 2. Generate AI Insight with Gemini
    let insight;
    try {
      insight = await generateInsightFromMetrics(metrics, 3);
    } catch (err: any) {
      console.warn("⚠️ Gemini AI insight error, using fallback insight:", err.message);
      insight = createFallbackInsightReport();
    }

    // 3. Generate Docx Buffer
    const docxBuffer = await generateDocxReport(metrics, insight);

    const safeBrand = (metrics.brand_scope || "System").replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `BaoCao_Insight_${safeBrand}_${metrics.period.from}_${metrics.period.to}.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    console.error("Lỗi khi tạo báo cáo Word docx:", err);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tạo báo cáo Word", details: err.message },
      { status: 500 },
    );
  }
}
