import type { TFunction } from "i18next";
import type { LeadReportData } from "@/lib/lead-report";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeFilePart(value: unknown) {
  return String(value || "report")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function isVietnamese(lang: string) {
  return lang.toLowerCase().startsWith("vi");
}

function getMentionHeaders(lang: string) {
  return isVietnamese(lang)
    ? ["#", "Thương hiệu", "Nguồn", "Loại nội dung", "Sắc thái", "Chủ đề", "Thời gian", "Nội dung"]
    : ["#", "Brand", "Source", "Type", "Sentiment", "Topic", "Time", "Content"];
}

function getOverviewLabels(lang: string) {
  return isVietnamese(lang)
    ? {
        brand: "Thương hiệu",
        date: "Ngày",
        from: "Từ ngày",
        to: "Đến ngày",
        filters: "Bộ lọc",
        total: "Tổng lượt đề cập",
        positive: "Tích cực",
        neutral: "Trung lập",
        negative: "Tiêu cực",
        insights: "Nhận định AI",
      }
    : {
        brand: "Brand",
        date: "Date",
        from: "From",
        to: "To",
        filters: "Filters",
        total: "Total mentions",
        positive: "Positive",
        neutral: "Neutral",
        negative: "Negative",
        insights: "AI Insights",
      };
}

function translateContentType(value: unknown, t: TFunction, lang: string) {
  const key = String(value || "post").toLowerCase().trim();
  const defaults: Record<string, { vi: string; en: string }> = {
    post: { vi: "Bài viết", en: "Post" },
    comment: { vi: "Bình luận", en: "Comment" },
    reply: { vi: "Phản hồi", en: "Reply" },
  };
  const fallback = defaults[key] || { vi: String(value || ""), en: String(value || "") };
  return t(`reports.contentType.${key}`, {
    defaultValue: isVietnamese(lang) ? fallback.vi : fallback.en,
  });
}

function translateSentiment(value: unknown, t: TFunction, lang: string) {
  const raw = String(value || "neutral").toLowerCase().trim();
  const key = raw.includes("pos") ? "positive" : raw.includes("neg") ? "negative" : "neutral";
  const defaults: Record<string, { vi: string; en: string }> = {
    positive: { vi: "Tích cực", en: "Positive" },
    neutral: { vi: "Trung lập", en: "Neutral" },
    negative: { vi: "Tiêu cực", en: "Negative" },
  };
  return t(`reports.sentiment.${key}`, {
    defaultValue: isVietnamese(lang) ? defaults[key].vi : defaults[key].en,
  });
}

function translateTopic(value: unknown, t: TFunction, lang: string) {
  const key = String(value || "other").toLowerCase().trim();
  const defaults: Record<string, { vi: string; en: string }> = {
    competitor: { vi: "Đối thủ", en: "Competitor" },
    delivery: { vi: "Giao hàng", en: "Delivery" },
    experience: { vi: "Trải nghiệm", en: "Experience" },
    legal: { vi: "Pháp lý", en: "Legal" },
    marketing: { vi: "Marketing", en: "Marketing" },
    operation: { vi: "Vận hành", en: "Operation" },
    other: { vi: "Khác", en: "Other" },
    price: { vi: "Giá cả", en: "Price" },
    quality: { vi: "Sản phẩm", en: "Product" },
    service: { vi: "Dịch vụ khách hàng", en: "Customer service" },
    staff: { vi: "Nhân viên", en: "Staff" },
  };
  const fallback = defaults[key] || { vi: String(value || ""), en: String(value || "") };
  return t(`reports.topics.${key}`, {
    defaultValue: isVietnamese(lang) ? fallback.vi : fallback.en,
  });
}

function getMentionRows(mentions: any[], t: TFunction, lang: string) {
  return mentions.map((mention, index) => [
    index + 1,
    mention.brand || mention.workspace_id || "",
    mention.source || mention.platform || "",
    translateContentType(mention.content_type, t, lang),
    translateSentiment(mention.sentiment, t, lang),
    translateTopic(mention.topic, t, lang),
    mention.posted_at || mention.created_at || "",
    mention.content || mention.comment_content || mention.post_content || "",
  ]);
}

function buildTable(title: string, rows: Array<Array<unknown>>) {
  return `
    <table>
      <thead><tr><th colspan="8">${escapeHtml(title)}</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function downloadExcel(filename: string, sheets: Array<{ name: string; rows: Array<Array<unknown>> }>) {
  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
          th { background: #4648d4; color: #fff; font-weight: 700; }
          td, th { border: 1px solid #c7c4d7; padding: 6px; vertical-align: top; }
        </style>
      </head>
      <body>
        ${sheets.map((sheet) => buildTable(sheet.name, sheet.rows)).join("<br />")}
      </body>
    </html>
  `;

  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadBlob(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsToCsv(rows: Array<Array<unknown>>) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

function getLeadReportOverviewRows(report: LeadReportData) {
  const { kpis } = report;
  return [
    ["Chi so", "Gia tri"],
    ["Thoi gian xuat", report.generatedAt],
    ["Tong lead", kpis.total],
    ["Hot lead", kpis.hot],
    ["Warm lead", kpis.warm],
    ["Cold lead", kpis.cold],
    ["Da lien he", kpis.contacted],
    ["Chua lien he", kpis.uncontacted],
    ["Can ghi ket qua", kpis.needResult],
    ["Follow-up dang mo", kpis.followUpDue],
    ["Follow-up qua han", kpis.followUpOverdue],
    ["Cho chuyen sales", kpis.salesHandoff],
    ["Da chuyen doi", kpis.converted],
    ["Bo qua", kpis.skipped],
    ["Tre SLA", kpis.slaBreached],
    ["Phan hoi dau tien TB (phut)", kpis.avgFirstResponseMinutes ?? ""],
    ["Ghi nhan ket qua TB (phut)", kpis.avgResultMinutes ?? ""],
    ["Ty le lien he", `${kpis.contactRate}%`],
    ["Ty le dung SLA", `${kpis.slaOnTimeRate}%`],
    ["Ty le chuyen doi", `${kpis.conversionRate}%`],
    ["Tom tat", report.aiSummary],
  ];
}

function getLeadReportDetailRows(report: LeadReportData) {
  return [
    [
      "Lead ID",
      "Khach hang",
      "Thuong hieu",
      "Nguon",
      "Intent",
      "Trang thai",
      "Nhan vien phu trach",
      "Tao luc",
      "Lien he dau tien",
      "Phan hoi (phut)",
      "Ket qua",
      "Ghi nhan ket qua",
      "So lan tiep can",
      "Follow-up",
      "SLA",
      "Diem uu tien",
      "Noi dung",
      "URL",
    ],
    ...report.detailRows.map((row) => [
      row.id,
      row.customer,
      row.workspaceId,
      row.platform,
      row.intent,
      row.status,
      row.ownerName,
      row.createdAt,
      row.firstContactedAt,
      row.responseMinutes ?? "",
      row.resultType,
      row.resultRecordedAt,
      row.contactAttempts,
      row.followUpAt,
      row.slaStatus,
      row.priorityScore,
      row.content,
      row.url,
    ]),
  ];
}

function getLeadReportDistributionRows(title: string, rows: LeadReportData["intentDistribution"]) {
  return [
    [title],
    ["Nhom", "So luong", "Ty le"],
    ...rows.map((row) => [row.label, row.count, `${row.percentage}%`]),
  ];
}

function getLeadReportStaffRows(report: LeadReportData) {
  return [
    ["Nhan vien", "Tong lead", "Da lien he", "Da chuyen doi", "Can ghi ket qua", "Qua han", "Phan hoi TB (phut)", "Ty le chuyen doi"],
    ...report.staffPerformance.map((row) => [
      row.ownerName,
      row.total,
      row.contacted,
      row.converted,
      row.needResult,
      row.overdue,
      row.avgFirstResponseMinutes ?? "",
      `${row.conversionRate}%`,
    ]),
  ];
}

export function exportLeadReportExcel(report: LeadReportData, filename = "Lead_Report") {
  downloadExcel(`${safeFilePart(filename)}.xls`, [
    { name: "Tong quan", rows: getLeadReportOverviewRows(report) },
    { name: "Chi tiet lead", rows: getLeadReportDetailRows(report) },
    {
      name: "Phan tich",
      rows: [
        ...getLeadReportDistributionRows("Phan bo intent", report.intentDistribution),
        [],
        ...getLeadReportDistributionRows("Nguon lead", report.sourceDistribution),
        [],
        ...getLeadReportDistributionRows("Pipeline", report.pipeline),
        [],
        ["Ngay", "Lead moi", "Da lien he", "Da chuyen doi", "Phan hoi TB (phut)"],
        ...report.responseTrend.map((row) => [
          row.day,
          row.created,
          row.contacted,
          row.converted,
          row.avgResponseMinutes,
        ]),
      ],
    },
    { name: "Hieu suat nhan vien", rows: getLeadReportStaffRows(report) },
  ]);
}

export function exportLeadReportCsv(report: LeadReportData, filename = "Lead_Report") {
  const csv = rowsToCsv(getLeadReportDetailRows(report));
  downloadBlob(
    `${safeFilePart(filename)}.csv`,
    `\uFEFF${csv}`,
    "text/csv;charset=utf-8",
  );
}

export async function generateDailyReportExcel(
  brandName: string,
  dateStr: string,
  mentions: any[],
  t: TFunction,
  lang: string,
) {
  const labels = getOverviewLabels(lang);
  const positive = mentions.filter((item) => String(item.sentiment).toLowerCase().includes("pos")).length;
  const negative = mentions.filter((item) => String(item.sentiment).toLowerCase().includes("neg")).length;
  const neutral = mentions.length - positive - negative;

  downloadExcel(`Daily_Report_${safeFilePart(brandName)}_${safeFilePart(dateStr)}.xls`, [
    {
      name: isVietnamese(lang) ? "Tổng quan" : "Overview",
      rows: [
        [labels.brand, brandName],
        [labels.date, dateStr],
        [labels.total, mentions.length],
        [labels.positive, positive],
        [labels.neutral, neutral],
        [labels.negative, negative],
      ],
    },
    {
      name: isVietnamese(lang) ? "Danh sách đề cập" : "Mentions",
      rows: [
        getMentionHeaders(lang),
        ...getMentionRows(mentions, t, lang),
      ],
    },
  ]);
}

export async function generateCustomReportExcel(
  brandName: string,
  startDate: string,
  endDate: string,
  mentions: any[],
  insights: string,
  filtersSummary: string,
  t: TFunction,
  lang: string,
) {
  const labels = getOverviewLabels(lang);
  const positive = mentions.filter((item) => String(item.sentiment).toLowerCase().includes("pos")).length;
  const negative = mentions.filter((item) => String(item.sentiment).toLowerCase().includes("neg")).length;
  const neutral = mentions.length - positive - negative;

  downloadExcel(`Analysis_Report_${safeFilePart(brandName)}_${safeFilePart(startDate)}_to_${safeFilePart(endDate)}.xls`, [
    {
      name: isVietnamese(lang) ? "Tổng quan" : "Overview",
      rows: [
        [labels.brand, brandName],
        [labels.from, startDate],
        [labels.to, endDate],
        [labels.filters, filtersSummary],
        [labels.total, mentions.length],
        [labels.positive, positive],
        [labels.neutral, neutral],
        [labels.negative, negative],
        [labels.insights, insights],
      ],
    },
    {
      name: isVietnamese(lang) ? "Danh sách đề cập" : "Mentions",
      rows: [
        getMentionHeaders(lang),
        ...getMentionRows(mentions, t, lang),
      ],
    },
  ]);
}
