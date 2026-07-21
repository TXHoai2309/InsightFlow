import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ImageRun,
  WidthType,
} from "docx";
import { ReportMetrics } from "./aggregator";
import { InsightReport } from "./insight-generator";

// ─── Color Palette Definitions ───────────────────────────────────────────────

const COLOR_TITLE_GEORGIA = "6B5B4D"; // Georgia Brown
const COLOR_TEXT_PRIMARY = "3A3936";  // Main Text
const COLOR_TEXT_SECONDARY = "756F66";// Secondary Text
const COLOR_BG_BEIGE = "FAF8F5";      // Light Beige Background

const TYPE_STYLE_MAP = {
  negative: { text: "A85A3E", bg: "FBEEE7", border: "A85A3E", icon: "" },
  warning:  { text: "9C7A2E", bg: "FBF3E2", border: "9C7A2E", icon: "⚠️ " },
  positive: { text: "3F8F5F", bg: "ECF4EE", border: "3F8F5F", icon: "" },
  neutral:  { text: "756F66", bg: "FAF8F5", border: "756F66", icon: "" },
};

const IMPACT_LABEL_MAP: Record<string, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

const PRIORITY_STYLE_MAP: Record<string, { text: string; bg: string }> = {
  high:   { text: "A85A3E", bg: "FBEEE7" },
  medium: { text: "9C7A2E", bg: "FBF3E2" },
  low:    { text: "3F8F5F", bg: "ECF4EE" },
};

// ─── QuickChart PNG Generator Helper ────────────────────────────────────────

async function fetchChartBuffer(chartConfig: object): Promise<Buffer | null> {
  try {
    const encoded = encodeURIComponent(JSON.stringify(chartConfig));
    const url = `https://quickchart.io/chart?c=${encoded}&w=450&h=250&devicePixelRatio=2`;
    const res = await fetch(url);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (err) {
    console.warn("Lỗi khi tải biểu đồ QuickChart:", err);
  }
  return null;
}

// ─── Main Docx Generator Function ───────────────────────────────────────────

export async function generateDocxReport(
  metrics: ReportMetrics,
  insight: InsightReport,
): Promise<Buffer> {
  // 1. Prepare Charts (Donut SLA & Horizontal Bar Topics)
  const slaDonutConfig = {
    type: "doughnut",
    data: {
      labels: ["Tuân thủ SLA", "Trễ SLA"],
      datasets: [
        {
          data: [
            metrics.sla.compliance_rate,
            Math.max(0, 100 - metrics.sla.compliance_rate),
          ],
          backgroundColor: ["#3F8F5F", "#A85A3E"],
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `Tỷ lệ tuân thủ SLA (${metrics.sla.compliance_rate}%)`,
          color: "#6B5B4D",
          font: { family: "Georgia", size: 14, weight: "bold" },
        },
      },
    },
  };

  const sortedTopics = Object.entries(metrics.topic_breakdown || {}).sort(
    (a, b) => b[1] - a[1],
  );

  const topicBarConfig = {
    type: "horizontalBar",
    data: {
      labels: sortedTopics.map((t) => t[0].toUpperCase()),
      datasets: [
        {
          label: "Số lượng đề cập",
          data: sortedTopics.map((t) => t[1]),
          backgroundColor: "#6B5B4D",
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Phân bổ Chủ đề (Topic Breakdown)",
          color: "#6B5B4D",
          font: { family: "Georgia", size: 14, weight: "bold" },
        },
      },
    },
  };

  const [slaChartBuf, topicChartBuf] = await Promise.all([
    fetchChartBuffer(slaDonutConfig),
    fetchChartBuffer(topicBarConfig),
  ]);

  // 2. Build Document Sections
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1100,
              right: 1100,
            },
          },
        },
        children: [
          // ── 1. TIÊU ĐỀ ──
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120, line: 320 },
            children: [
              new TextRun({
                text: "BÁO CÁO PHÂN TÍCH INSIGHT DOANH NGHIỆP",
                font: "Georgia",
                bold: true,
                size: 36,
                color: COLOR_TITLE_GEORGIA,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 300, line: 320 },
            children: [
              new TextRun({
                text: `Thương hiệu: `,
                font: "Calibri",
                bold: true,
                size: 22,
                color: COLOR_TEXT_PRIMARY,
              }),
              new TextRun({
                text: `${metrics.brand_scope || "Toàn hệ thống"}  |  `,
                font: "Calibri",
                size: 22,
                color: COLOR_TEXT_PRIMARY,
              }),
              new TextRun({
                text: `Kỳ báo cáo: `,
                font: "Calibri",
                bold: true,
                size: 22,
                color: COLOR_TEXT_PRIMARY,
              }),
              new TextRun({
                text: `${metrics.period.from} – ${metrics.period.to}`,
                font: "Calibri",
                size: 22,
                color: COLOR_TEXT_SECONDARY,
              }),
            ],
          }),

          // ── 2. TÓM TẮT ──
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120, line: 320 },
            children: [
              new TextRun({
                text: "Tóm tắt",
                font: "Georgia",
                bold: true,
                size: 28,
                color: COLOR_TITLE_GEORGIA,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 350, line: 340 },
            children: [
              new TextRun({
                text: insight.summary || "Không đủ dữ liệu để kết luận.",
                font: "Calibri",
                size: 22,
                color: COLOR_TEXT_PRIMARY,
              }),
            ],
          }),

          // ── 3. TRỰC QUAN HÓA (CHARTS) ──
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150, line: 320 },
            children: [
              new TextRun({
                text: "Trực quan hóa dữ liệu",
                font: "Georgia",
                bold: true,
                size: 28,
                color: COLOR_TITLE_GEORGIA,
              }),
            ],
          }),
          ...(slaChartBuf || topicChartBuf
            ? [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                  },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: slaChartBuf
                            ? [
                                new Paragraph({
                                  alignment: AlignmentType.CENTER,
                                  children: [
                                    new ImageRun({
                                      data: slaChartBuf,
                                      transformation: { width: 260, height: 165 },
                                      type: "png",
                                    }),
                                  ],
                                }),
                              ]
                            : [],
                        }),
                        new TableCell({
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: topicChartBuf
                            ? [
                                new Paragraph({
                                  alignment: AlignmentType.CENTER,
                                  children: [
                                    new ImageRun({
                                      data: topicChartBuf,
                                      transformation: { width: 260, height: 165 },
                                      type: "png",
                                    }),
                                  ],
                                }),
                              ]
                            : [],
                        }),
                      ],
                    }),
                  ],
                }),
              ]
            : [
                new Paragraph({
                  spacing: { after: 200, line: 320 },
                  children: [
                    new TextRun({
                      text: "Không đủ dữ liệu biểu đồ.",
                      font: "Calibri",
                      italics: true,
                      size: 20,
                      color: COLOR_TEXT_SECONDARY,
                    }),
                  ],
                }),
              ]),

          // ── 4. INSIGHT CHÍNH (SOFT CARDS) ──
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 150, line: 320 },
            children: [
              new TextRun({
                text: "Insight chính",
                font: "Georgia",
                bold: true,
                size: 28,
                color: COLOR_TITLE_GEORGIA,
              }),
            ],
          }),
          ...(insight.key_insights.length > 0
            ? insight.key_insights.map((item) => {
                const style = TYPE_STYLE_MAP[item.type] || TYPE_STYLE_MAP.neutral;
                const impactLabel = IMPACT_LABEL_MAP[item.impact] || item.impact;

                return new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  margins: { bottom: 180 },
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.SINGLE, size: 24, color: style.border },
                    right: { style: BorderStyle.NONE },
                  },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          shading: { fill: style.bg },
                          margins: { top: 120, bottom: 120, left: 160, right: 160 },
                          children: [
                            new Paragraph({
                              spacing: { line: 320, after: 60 },
                              children: [
                                new TextRun({
                                  text: `${style.icon}${item.title}  `,
                                  font: "Calibri",
                                  bold: true,
                                  size: 24,
                                  color: style.text,
                                }),
                                new TextRun({
                                  text: `[Tác động: ${impactLabel}]`,
                                  font: "Calibri",
                                  bold: true,
                                  size: 18,
                                  color: style.text,
                                }),
                              ],
                            }),
                            new Paragraph({
                              spacing: { line: 320 },
                              children: [
                                new TextRun({
                                  text: item.description,
                                  font: "Calibri",
                                  size: 21,
                                  color: COLOR_TEXT_PRIMARY,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                });
              })
            : [
                new Paragraph({
                  spacing: { after: 200, line: 320 },
                  children: [
                    new TextRun({
                      text: "Không đủ dữ liệu để kết luận.",
                      font: "Calibri",
                      italics: true,
                      size: 21,
                      color: COLOR_TEXT_SECONDARY,
                    }),
                  ],
                }),
              ]),

          // ── 5. KHUYẾN NGHỊ HÀNH ĐỘNG ──
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 150, line: 320 },
            children: [
              new TextRun({
                text: "Khuyến nghị hành động",
                font: "Georgia",
                bold: true,
                size: 28,
                color: COLOR_TITLE_GEORGIA,
              }),
            ],
          }),
          ...(insight.recommendations.length > 0
            ? insight.recommendations.map((rec) => {
                const priorityStyle = PRIORITY_STYLE_MAP[rec.priority] || PRIORITY_STYLE_MAP.low;
                const priorityLabel = IMPACT_LABEL_MAP[rec.priority] || rec.priority;

                return new Paragraph({
                  spacing: { before: 100, after: 160, line: 340 },
                  children: [
                    new TextRun({
                      text: `[Ưu tiên ${priorityLabel}] `,
                      font: "Calibri",
                      bold: true,
                      size: 22,
                      color: priorityStyle.text,
                    }),
                    new TextRun({
                      text: `${rec.title}\n`,
                      font: "Calibri",
                      bold: true,
                      size: 22,
                      color: COLOR_TEXT_PRIMARY,
                    }),
                    new TextRun({
                      text: rec.description,
                      font: "Calibri",
                      size: 21,
                      color: COLOR_TEXT_SECONDARY,
                    }),
                  ],
                });
              })
            : [
                new Paragraph({
                  spacing: { after: 200, line: 320 },
                  children: [
                    new TextRun({
                      text: "Không đủ dữ liệu để kết luận.",
                      font: "Calibri",
                      italics: true,
                      size: 21,
                      color: COLOR_TEXT_SECONDARY,
                    }),
                  ],
                }),
              ]),

          // ── 6. RỦI RO VÀ ĐỘ TIN CẬY ──
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 150, line: 320 },
            children: [
              new TextRun({
                text: "Rủi ro và Độ tin cậy",
                font: "Georgia",
                bold: true,
                size: 28,
                color: COLOR_TITLE_GEORGIA,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { bottom: 300 },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    shading: { fill: COLOR_BG_BEIGE },
                    margins: { top: 140, bottom: 140, left: 180, right: 180 },
                    children: [
                      new Paragraph({
                        spacing: { line: 320, after: 40 },
                        children: [
                          new TextRun({
                            text: "Mức độ rủi ro",
                            font: "Calibri",
                            bold: true,
                            size: 20,
                            color: COLOR_TEXT_SECONDARY,
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { line: 320 },
                        children: [
                          new TextRun({
                            text: insight.risk_level || "Chưa xác định",
                            font: "Calibri",
                            bold: true,
                            size: 24,
                            color: COLOR_TEXT_PRIMARY,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    shading: { fill: COLOR_BG_BEIGE },
                    margins: { top: 140, bottom: 140, left: 180, right: 180 },
                    children: [
                      new Paragraph({
                        spacing: { line: 320, after: 40 },
                        children: [
                          new TextRun({
                            text: "Độ tin cậy phân tích",
                            font: "Calibri",
                            bold: true,
                            size: 20,
                            color: COLOR_TEXT_SECONDARY,
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { line: 320 },
                        children: [
                          new TextRun({
                            text: insight.confidence || "Cao",
                            font: "Calibri",
                            bold: true,
                            size: 24,
                            color: COLOR_TEXT_PRIMARY,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // ── 7. FOOTER ──
          new Paragraph({
            spacing: { before: 400, line: 300 },
            border: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_TEXT_SECONDARY },
            },
            children: [
              new TextRun({
                text: `Báo cáo được tổng hợp bởi phân tích Business Intelligence dựa trên các chỉ số hệ thống đã tính toán sẵn, kỳ ${metrics.period.from}–${metrics.period.to}.`,
                font: "Calibri",
                italics: true,
                size: 18,
                color: COLOR_TEXT_SECONDARY,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
