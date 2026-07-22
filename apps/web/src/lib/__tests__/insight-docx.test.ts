import {
  InsightSchema,
  sortInsightsAndRecommendations,
  createFallbackInsightReport,
  InsightReport,
} from "../insight-generator";
import { generateDocxReport } from "../docx-generator";
import { aggregateReportMetrics } from "../aggregator";

// ─── Test 1: Validate Schema Gemini Response ────────────────────────────────

export function testValidateSchema() {
  console.log("🧪 Running Test 1: Validate Schema Gemini Response...");

  const validResponse = {
    summary: "Báo cáo tổng quan hoạt động thương hiệu.",
    overall_status: "Ổn định",
    key_insights: [
      {
        title: "Tỷ lệ hài lòng cao",
        description: "Khách hàng phản hồi tích cực về sản phẩm.",
        impact: "high",
        type: "positive",
      },
      {
        title: "Cảnh báo trễ SLA",
        description: "Một số ticket xử lý chậm.",
        impact: "medium",
        type: "warning",
      },
    ],
    recommendations: [
      {
        title: "Tăng cường nhân sự ca tối",
        description: "Phân công thêm nhân viên trực chat.",
        priority: "high",
      },
    ],
    risk_level: "Thấp",
    confidence: "Cao",
  };

  const parsed = InsightSchema.parse(validResponse);
  if (parsed.summary !== validResponse.summary) {
    throw new Error("Validation summary failed");
  }

  // Test invalid schema failure
  let invalidCaught = false;
  try {
    InsightSchema.parse({ summary: "Test", key_insights: "invalid_type" });
  } catch {
    invalidCaught = true;
  }

  if (!invalidCaught) {
    throw new Error("Failed to catch invalid schema!");
  }

  console.log("✅ Test 1 PASSED: Schema Validation & Zod Parse works!");
}

// ─── Test 2: Sort Insights & Recommendations by Impact/Priority ────────────

export function testSortingPriority() {
  console.log("🧪 Running Test 2: Sort Insights & Recommendations by Impact/Priority...");

  const unsortedData: InsightReport = {
    summary: "Test summary",
    overall_status: "Test",
    key_insights: [
      { title: "Low impact", description: "d1", impact: "low", type: "neutral" },
      { title: "High impact", description: "d2", impact: "high", type: "negative" },
      { title: "Medium impact", description: "d3", impact: "medium", type: "warning" },
    ],
    recommendations: [
      { title: "Rec Low", description: "r1", priority: "low" },
      { title: "Rec High", description: "r2", priority: "high" },
      { title: "Rec Medium", description: "r3", priority: "medium" },
    ],
    risk_level: "Trung bình",
    confidence: "Cao",
  };

  const sorted = sortInsightsAndRecommendations(unsortedData);

  if (sorted.key_insights[0].impact !== "high" || sorted.key_insights[1].impact !== "medium" || sorted.key_insights[2].impact !== "low") {
    throw new Error("Key Insights sorting failed!");
  }

  if (sorted.recommendations[0].priority !== "high" || sorted.recommendations[1].priority !== "medium" || sorted.recommendations[2].priority !== "low") {
    throw new Error("Recommendations sorting failed!");
  }

  console.log("✅ Test 2 PASSED: Priority Sorting (High -> Medium -> Low) works!");
}

// ─── Test 3: Render Docx with Empty Input ───────────────────────────────────

export async function testRenderDocxWithEmptyInput() {
  console.log("🧪 Running Test 3: Render Docx with Empty Input...");

  const emptyMetrics = await aggregateReportMetrics({
    brandScope: null,
    from: "2026-01-01",
    to: "2026-01-07",
  });
  emptyMetrics.total_annotations = 0;
  emptyMetrics.topic_breakdown = {};

  const emptyInsight = createFallbackInsightReport();

  const buffer = await generateDocxReport(emptyMetrics, emptyInsight);

  if (!buffer || buffer.length === 0) {
    throw new Error("Docx Buffer is empty!");
  }

  console.log(`✅ Test 3 PASSED: Docx rendered successfully with empty input (${buffer.length} bytes)!`);
}

// ─── Main Test Runner ────────────────────────────────────────────────────────

export async function runAllTests() {
  console.log("=================================================");
  console.log("🚀 INSIGHT & DOCX GENERATOR UNIT TESTS RUNNER");
  console.log("=================================================");
  testValidateSchema();
  testSortingPriority();
  await testRenderDocxWithEmptyInput();
  console.log("=================================================");
  console.log("🎉 ALL 3 UNIT TESTS PASSED 100% CLEANLY!");
  console.log("=================================================");
}

if (require.main === module) {
  runAllTests().catch((err) => {
    console.error("❌ Unit Test Failed:", err);
    process.exit(1);
  });
}
