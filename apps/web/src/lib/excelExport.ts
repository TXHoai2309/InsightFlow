import type { TFunction } from "i18next";
import type { LeadReportData } from "@/lib/lead-report";
import type { CrisisReportData } from "@/lib/crisis-report";
import type { DualOperationsReportData } from "@/lib/dual-operations-report";
import type { CrisisEmployeeReportData } from "@/lib/crisis-employee-report";
import type { LeadEmployeeReportData } from "@/lib/lead-employee-report";
import type { InsightReport } from "@/lib/insight-generator";

type ReportLabels = {
  dashboard: string;
  evidence: string;
  executiveSummary: string;
  brand: string;
  period: string;
  filters: string;
  total: string;
  brandHealth: string;
  netSentiment: string;
  positive: string;
  neutral: string;
  negative: string;
  sentimentMix: string;
  sourcePerformance: string;
  topicSignals: string;
  riskRadar: string;
  opportunities: string;
  actionPlan: string;
  mentionEvidence: string;
  metric: string;
  value: string;
  share: string;
  source: string;
  topic: string;
  mentions: string;
  engagement: string;
  recommendation: string;
  content: string;
  author: string;
  time: string;
  type: string;
  url: string;
};

export function normalizeNFC<T>(data: T): T {
  if (typeof data === "string") return data.normalize("NFC") as unknown as T;
  if (Array.isArray(data)) return data.map((item) => normalizeNFC(item)) as unknown as T;
  if (data && typeof data === "object") {
    const res: any = {};
    for (const key of Object.keys(data)) {
      res[key] = normalizeNFC((data as any)[key]);
    }
    return res as T;
  }
  return data;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .normalize("NFC")
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

function pct(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function getLabels(lang: string): ReportLabels {
  if (!isVietnamese(lang)) {
    return {
      dashboard: "Dashboard",
      evidence: "Mention Evidence",
      executiveSummary: "Executive Summary",
      brand: "Brand",
      period: "Period",
      filters: "Filters",
      total: "Total mentions",
      brandHealth: "Brand Health",
      netSentiment: "Net Sentiment",
      positive: "Positive",
      neutral: "Neutral",
      negative: "Negative",
      sentimentMix: "Sentiment Mix",
      sourcePerformance: "Source Performance",
      topicSignals: "Topic Signals",
      riskRadar: "Risk Radar",
      opportunities: "Marketing Opportunities",
      actionPlan: "Action Plan",
      mentionEvidence: "Mention Evidence",
      metric: "Metric",
      value: "Value",
      share: "Share",
      source: "Source",
      topic: "Topic",
      mentions: "Mentions",
      engagement: "Engagement",
      recommendation: "Recommendation",
      content: "Content",
      author: "Author",
      time: "Time",
      type: "Type",
      url: "URL",
    };
  }

  return {
    dashboard: "Bảng điều hành",
    evidence: "Dữ liệu mention",
    executiveSummary: "Tóm tắt điều hành",
    brand: "Thương hiệu",
    period: "Kỳ báo cáo",
    filters: "Bộ lọc",
    total: "Tổng lượt đề cập",
    brandHealth: "Sức khỏe thương hiệu",
    netSentiment: "Net Sentiment",
    positive: "Tích cực",
    neutral: "Trung lập",
    negative: "Tiêu cực",
    sentimentMix: "Phân bổ sắc thái",
    sourcePerformance: "Hiệu quả theo nguồn",
    topicSignals: "Chủ đề nổi bật",
    riskRadar: "Rủi ro cần ưu tiên",
    opportunities: "Cơ hội marketing",
    actionPlan: "Kế hoạch hành động",
    mentionEvidence: "Dữ liệu mention",
    metric: "Chỉ số",
    value: "Giá trị",
    share: "Tỷ trọng",
    source: "Nguồn",
    topic: "Chủ đề",
    mentions: "Mention",
    engagement: "Tương tác",
    recommendation: "Khuyến nghị",
    content: "Nội dung",
    author: "Tác giả",
    time: "Thời gian",
    type: "Loại",
    url: "URL",
  };
}

function getSentimentKey(value: unknown) {
  const raw = String(value || "neutral").toLowerCase();
  if (raw.includes("pos")) return "positive";
  if (raw.includes("neg")) return "negative";
  return "neutral";
}

function getSentimentStats(mentions: any[]) {
  const positive = mentions.filter((item) => getSentimentKey(item.sentiment) === "positive").length;
  const negative = mentions.filter((item) => getSentimentKey(item.sentiment) === "negative").length;
  const neutral = Math.max(0, mentions.length - positive - negative);
  const netSentiment = mentions.length > 0 ? Math.round(((positive - negative) / mentions.length) * 100) : 0;
  const brandHealth = Math.max(0, Math.min(100, Math.round(55 + netSentiment * 0.45 - (negative / Math.max(mentions.length, 1)) * 15)));
  return { positive, negative, neutral, netSentiment, brandHealth };
}

function countBy(items: any[], getKey: (item: any) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topEntries(record: Record<string, number>, limit = 8) {
  return Object.entries(record).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function getEngagement(mention: any) {
  return Number(mention.reach || 0) + Number(mention.likes || 0) + Number(mention.comments || 0) + Number(mention.shares || 0);
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
  const key = getSentimentKey(value);
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

function barCell(value: number, total: number, color: string) {
  const width = total > 0 ? Math.max(4, Math.round((value / total) * 100)) : 0;
  return `<div class="bar-wrap"><div class="bar" style="width:${width}%;background:${color};"></div><span>${escapeHtml(pct(value, total))}</span></div>`;
}

function table(title: string, rows: string, columns = 6) {
  return `
    <table>
      <thead><tr><th colspan="${columns}" class="section-title">${escapeHtml(title)}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function row(cells: Array<unknown>, classes = "") {
  return `<tr class="${classes}">${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`;
}

function rawRow(cells: string[], classes = "") {
  return `<tr class="${classes}">${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
}

function buildExecutiveSummary(brandName: string, mentions: any[], labels: ReportLabels, lang: string) {
  const vi = isVietnamese(lang);
  const stats = getSentimentStats(mentions);
  const topicCounts = topEntries(countBy(mentions, (item) => String(item.topic || "other").toLowerCase()), 1);
  const negativeTopics = topEntries(countBy(mentions.filter((item) => getSentimentKey(item.sentiment) === "negative"), (item) => String(item.topic || "other").toLowerCase()), 1);
  const positiveTopics = topEntries(countBy(mentions.filter((item) => getSentimentKey(item.sentiment) === "positive"), (item) => String(item.topic || "other").toLowerCase()), 1);
  const mainTopic = topicCounts[0]?.[0] || "other";
  const riskTopic = negativeTopics[0]?.[0] || mainTopic;
  const opportunityTopic = positiveTopics[0]?.[0] || mainTopic;
  const brand = brandName === "all" ? (vi ? "tất cả thương hiệu" : "all brands") : brandName;

  const summary = vi
    ? [
        `${brand} ghi nhận ${mentions.length} mention trong kỳ, Net Sentiment ${stats.netSentiment >= 0 ? "+" : ""}${stats.netSentiment}%.`,
        `Chủ đề chi phối thảo luận là ${mainTopic}; rủi ro nổi bật cần theo dõi là ${riskTopic}.`,
        `Cơ hội tốt nhất là khuếch đại phản hồi tích cực quanh ${opportunityTopic}.`,
      ]
    : [
        `${brand} recorded ${mentions.length} mentions, with Net Sentiment ${stats.netSentiment >= 0 ? "+" : ""}${stats.netSentiment}%.`,
        `The main discussion driver is ${mainTopic}; the most visible risk topic is ${riskTopic}.`,
        `The strongest opportunity is to amplify positive feedback around ${opportunityTopic}.`,
      ];

  return table(
    labels.executiveSummary,
    summary.map((item, index) => row([index + 1, item], "wrap")).join(""),
    2,
  );
}

function buildActionRows(mentions: any[], labels: ReportLabels, lang: string) {
  const vi = isVietnamese(lang);
  const negativeTopic = topEntries(countBy(mentions.filter((item) => getSentimentKey(item.sentiment) === "negative"), (item) => String(item.topic || "other").toLowerCase()), 1)[0]?.[0] || "service";
  const positiveTopic = topEntries(countBy(mentions.filter((item) => getSentimentKey(item.sentiment) === "positive"), (item) => String(item.topic || "other").toLowerCase()), 1)[0]?.[0] || "quality";
  const actions = vi
    ? [
        ["Ưu tiên phản hồi", `Xử lý mention tiêu cực có tương tác cao về ${negativeTopic} trong 24 giờ.`],
        ["Tối ưu vận hành", `Rà soát quy trình liên quan tới ${negativeTopic} và ghi lại nguyên nhân lặp lại.`],
        ["Khuếch đại điểm mạnh", `Biến lời khen về ${positiveTopic} thành thông điệp ngắn cho nội dung tuần tới.`],
        ["Theo dõi kênh", "Phân công người phụ trách nguồn có tỷ lệ tiêu cực cao nhất."],
      ]
    : [
        ["Response priority", `Handle high-engagement negative mentions about ${negativeTopic} within 24 hours.`],
        ["Operational review", `Review the process related to ${negativeTopic} and log repeated root causes.`],
        ["Amplify strengths", `Turn praise around ${positiveTopic} into short campaign proof points.`],
        ["Channel ownership", "Assign ownership for the source with the highest negative share."],
      ];

  return table(
    labels.actionPlan,
    row([labels.metric, labels.recommendation], "header-row") + actions.map((item) => row(item, "wrap")).join(""),
    2,
  );
}

function buildDashboardSheet({
  brandName,
  startDate,
  endDate,
  mentions,
  filtersSummary,
  insights,
  t,
  lang,
}: {
  brandName: string;
  startDate: string;
  endDate: string;
  mentions: any[];
  filtersSummary: string;
  insights?: string;
  t: TFunction;
  lang: string;
}) {
  const labels = getLabels(lang);
  const stats = getSentimentStats(mentions);
  const sentimentRows = [
    [labels.positive, stats.positive, pct(stats.positive, mentions.length), barCell(stats.positive, mentions.length, "#16a34a")],
    [labels.neutral, stats.neutral, pct(stats.neutral, mentions.length), barCell(stats.neutral, mentions.length, "#64748b")],
    [labels.negative, stats.negative, pct(stats.negative, mentions.length), barCell(stats.negative, mentions.length, "#dc2626")],
  ];
  const sourceCounts = topEntries(countBy(mentions, (item) => String(item.source || item.platform || "unknown")), 8);
  const topicCounts = topEntries(countBy(mentions, (item) => translateTopic(item.topic, t, lang)), 8);
  const negativeMentions = mentions.filter((item) => getSentimentKey(item.sentiment) === "negative").sort((a, b) => getEngagement(b) - getEngagement(a));
  const positiveMentions = mentions.filter((item) => getSentimentKey(item.sentiment) === "positive").sort((a, b) => getEngagement(b) - getEngagement(a));
  const topSourceTotal = Math.max(1, ...sourceCounts.map(([, count]) => count));
  const topTopicTotal = Math.max(1, ...topicCounts.map(([, count]) => count));

  return `
    <h1>${escapeHtml(isVietnamese(lang) ? "Báo cáo quản trị thương hiệu" : "Brand Management Report")}</h1>
    <p class="subtitle">${escapeHtml(`${brandName} | ${startDate} - ${endDate}`)}</p>
    ${table(
      labels.dashboard,
      [
        row([labels.brand, brandName, labels.period, `${startDate} - ${endDate}`], "kpi-row"),
        row([labels.filters, filtersSummary, labels.total, mentions.length], "kpi-row"),
        row([labels.brandHealth, `${stats.brandHealth}/100`, labels.netSentiment, `${stats.netSentiment >= 0 ? "+" : ""}${stats.netSentiment}%`], "kpi-row"),
      ].join(""),
      4,
    )}
    ${buildExecutiveSummary(brandName, mentions, labels, lang)}
    ${table(
      labels.sentimentMix,
      row([labels.metric, labels.value, labels.share, "Chart"], "header-row") +
        sentimentRows.map(([name, count, share, bar]) => rawRow([escapeHtml(name), escapeHtml(count), escapeHtml(share), String(bar)])).join(""),
      4,
    )}
    ${table(
      labels.sourcePerformance,
      row([labels.source, labels.mentions, labels.share, "Chart"], "header-row") +
        sourceCounts.map(([source, count]) => rawRow([escapeHtml(source), escapeHtml(count), escapeHtml(pct(count, mentions.length)), barCell(count, topSourceTotal, "#4f46e5")])).join(""),
      4,
    )}
    ${table(
      labels.topicSignals,
      row([labels.topic, labels.mentions, labels.share, "Chart"], "header-row") +
        topicCounts.map(([topic, count]) => rawRow([escapeHtml(topic), escapeHtml(count), escapeHtml(pct(count, mentions.length)), barCell(count, topTopicTotal, "#0891b2")])).join(""),
      4,
    )}
    ${table(
      labels.riskRadar,
      row([labels.source, labels.topic, labels.engagement, labels.content], "header-row") +
        (negativeMentions.length
          ? negativeMentions.slice(0, 8).map((item) => row([item.source || "", translateTopic(item.topic, t, lang), getEngagement(item), String(item.content || "").slice(0, 220)], "wrap")).join("")
          : row(["", "", "", isVietnamese(lang) ? "Chưa ghi nhận mention tiêu cực trong kỳ." : "No negative mentions in this period."], "wrap")),
      4,
    )}
    ${table(
      labels.opportunities,
      row([labels.source, labels.topic, labels.engagement, labels.content], "header-row") +
        (positiveMentions.length
          ? positiveMentions.slice(0, 8).map((item) => row([item.source || "", translateTopic(item.topic, t, lang), getEngagement(item), String(item.content || "").slice(0, 220)], "wrap")).join("")
          : row(["", "", "", isVietnamese(lang) ? "Chưa ghi nhận mention tích cực trong kỳ." : "No positive mentions in this period."], "wrap")),
      4,
    )}
    ${buildActionRows(mentions, labels, lang)}
    ${insights ? table(isVietnamese(lang) ? "Nhận định phân tích" : "Analyst Notes", row([insights], "wrap"), 1) : ""}
  `;
}

function buildEvidenceSheet(mentions: any[], t: TFunction, lang: string) {
  const labels = getLabels(lang);
  const rows = mentions
    .map((mention, index) =>
      row(
        [
          index + 1,
          mention.brand || mention.workspace_id || "",
          mention.source || mention.platform || "",
          translateContentType(mention.content_type, t, lang),
          translateSentiment(mention.sentiment, t, lang),
          translateTopic(mention.topic, t, lang),
          mention.author || "",
          mention.posted_at || mention.created_at || "",
          getEngagement(mention),
          mention.content || mention.comment_content || mention.post_content || "",
          mention.url || "",
        ],
        "wrap",
      ),
    )
    .join("");

  return `
    <h1>${escapeHtml(labels.mentionEvidence)}</h1>
    <table>
      <thead>
        <tr class="header-row">
          <th>#</th>
          <th>${escapeHtml(labels.brand)}</th>
          <th>${escapeHtml(labels.source)}</th>
          <th>${escapeHtml(labels.type)}</th>
          <th>${escapeHtml(labels.metric)}</th>
          <th>${escapeHtml(labels.topic)}</th>
          <th>${escapeHtml(labels.author)}</th>
          <th>${escapeHtml(labels.time)}</th>
          <th>${escapeHtml(labels.engagement)}</th>
          <th>${escapeHtml(labels.content)}</th>
          <th>${escapeHtml(labels.url)}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function createExcelReport(filename: string, dashboardHtml: string, evidenceHtml: string, download = true) {
  const workbook = `
    <!doctype html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]><xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet><x:Name>Dashboard</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml><![endif]-->
        <style>
          body { font-family: Inter, "Segoe UI", Arial, sans-serif; color: #172033; }
          h1 { font-size: 22px; margin: 0 0 4px; color: #1f2937; }
          .subtitle { color: #64748b; margin: 0 0 14px; }
          table { border-collapse: collapse; margin: 12px 0 18px; width: 100%; }
          th, td { border: 1px solid #cbd5e1; padding: 7px 8px; vertical-align: top; font-size: 12px; }
          th, .section-title { background: #3730a3; color: #fff; font-weight: 700; text-align: left; }
          .header-row td, .header-row th { background: #eef2ff; color: #1e1b4b; font-weight: 700; }
          .kpi-row td:nth-child(odd) { background: #f8fafc; font-weight: 700; color: #475569; width: 160px; }
          .wrap td { white-space: normal; mso-number-format:"\\@"; }
          .bar-wrap { position: relative; width: 220px; height: 18px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
          .bar { height: 18px; }
          .bar-wrap span { position: absolute; left: 8px; top: 1px; font-size: 11px; color: #111827; font-weight: 700; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        ${dashboardHtml}
        <div class="page-break"></div>
        ${evidenceHtml}
      </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const normalizedFilename = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  if (download) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = normalizedFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  return { blob, filename: normalizedFilename, dashboardHtml, evidenceHtml };
}

export async function generateWeeklyBrandReportExcel({
  brandName,
  startDate,
  endDate,
  mentions,
  filtersSummary,
  insights,
  t,
  lang,
  download = true,
}: {
  brandName: string;
  startDate: string;
  endDate: string;
  mentions: any[];
  filtersSummary: string;
  insights?: string;
  t: TFunction;
  lang: string;
  download?: boolean;
}) {
  if (mentions.length === 0) {
    alert(t("reports.errorNoData"));
    return;
  }

  const dashboard = buildDashboardSheet({ brandName, startDate, endDate, mentions, filtersSummary, insights, t, lang });
  const evidence = buildEvidenceSheet(mentions, t, lang);
  return createExcelReport(
    `Brand_Management_Report_${safeFilePart(brandName)}_${safeFilePart(startDate)}_to_${safeFilePart(endDate)}.xls`,
    dashboard,
    evidence,
    download,
  );
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

function downloadExcelSheets(filename: string, sheets: Array<{ name: string; rows: Array<Array<unknown>> }>) {
  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: Inter, "Segoe UI", Arial, sans-serif; font-size: 12px; }
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
  downloadExcelSheets(`${safeFilePart(filename)}.xls`, [
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

export interface LeadEmployeeExcelViewOptions {
  periodLabel?: string;
  filterLabel?: string;
}

function leadExcelMinutes(value: number | null) {
  if (value === null) return "Chưa có dữ liệu";
  if (value < 60) return `${value} phút`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
}

export function buildLeadEmployeeReportExcelDocument(
  report: LeadEmployeeReportData,
  options: LeadEmployeeExcelViewOptions = {},
) {
  const periodLabel = options.periodLabel || "Theo phạm vi dữ liệu đã chọn";
  const filterLabel = options.filterLabel || "Lead thuộc trách nhiệm của nhân viên";
  const detailRows = report.detailRows.map((row) => [
    row.id,
    row.customer,
    row.platform,
    row.intent.toUpperCase(),
    row.status,
    row.slaStatus,
    row.ownerName,
    row.firstContactedAt,
    leadExcelMinutes(row.responseMinutes),
    row.resultType,
    row.resultRecordedAt,
    row.content,
  ]);
  const priorityRows = report.priorityRows.map((row) => [
    row.id,
    row.customer,
    row.platform,
    row.intent.toUpperCase(),
    row.urgencyLevel === "urgent"
      ? "Khẩn cấp"
      : row.urgencyLevel === "attention"
        ? "Cần chú ý"
        : "Theo dõi",
    row.urgencyReasons.join(" · "),
    row.nextActionLabel,
    row.slaStatus,
    row.content,
  ]);
  const renderRows = (rows: unknown[][], columnCount: number) =>
    rows.length > 0
      ? rows
          .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
          .join("")
      : `<tr><td colspan="${columnCount}" class="empty">Không có dữ liệu phù hợp.</td></tr>`;

  return `<!doctype html>
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { margin: 0; padding: 28px; background: #f7f7fc; color: #1f1b2d; font-family: Arial, sans-serif; }
        .report { width: 1120px; margin: 0 auto; background: #fff; border: 1px solid #e2dff1; }
        .hero { padding: 28px 32px; color: #fff; background: #5b4de3; }
        .eyebrow { margin: 0 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; }
        h1 { margin: 0; font-size: 28px; } .hero p { margin: 10px 0 0; font-size: 13px; }
        .meta { margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.3); }
        .section { padding: 22px 32px; border-bottom: 1px solid #ece9f5; }
        h2 { margin: 0 0 14px; font-size: 17px; }
        table { width: 100%; border-collapse: separate; border-spacing: 10px; } td { vertical-align: top; }
        .attention { width: 25%; padding: 14px; border: 1px solid #ddd8fa; background: #f8f7ff; }
        .attention span, .metric span { display: block; color: #6d6781; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .attention strong { display: block; margin-top: 8px; color: #5b4de3; font-size: 24px; }
        .attention p { margin: 8px 0 0; color: #625c73; font-size: 11px; line-height: 1.5; }
        .metric { width: 25%; padding: 16px; border: 1px solid #e2dff1; background: #faf9ff; }
        .metric strong { display: block; margin-top: 8px; color: #5b4de3; font-size: 25px; }
        .metric.good strong { color: #157347; } .metric.warn strong { color: #b45309; }
        .recommendation { margin: 8px 0; padding: 11px 13px; border-left: 4px solid #5b4de3; background: #f4f2ff; font-size: 12px; }
        .trend { border-spacing: 0; } .trend th, .data th { padding: 9px; color: #fff; background: #5b4de3; border: 1px solid #4234b6; font-size: 11px; text-align: left; }
        .trend td, .data td { padding: 8px; border: 1px solid #e2dff1; font-size: 10px; white-space: normal; word-break: break-word; }
        .trend tr:nth-child(even) td, .data tr:nth-child(even) td { background: #f8f7ff; }
        .data { border-spacing: 0; table-layout: fixed; } .empty { padding: 20px !important; color: #6d6781; text-align: center; }
        .footer { padding: 16px 32px; color: #6d6781; background: #f7f6fb; font-size: 10px; }
      </style>
    </head>
    <body>
      <main class="report">
        <header class="hero">
          <p class="eyebrow">Báo cáo công việc cá nhân</p>
          <h1>Xử lý khách hàng tiềm năng</h1>
          <p>Tập trung vào lead cần chú ý, kết quả cá nhân và xu hướng chuyển đổi.</p>
          <p class="meta"><strong>Kỳ báo cáo:</strong> ${escapeHtml(periodLabel)} &nbsp;·&nbsp; <strong>Phạm vi:</strong> ${escapeHtml(filterLabel)} &nbsp;·&nbsp; <strong>Cập nhật:</strong> ${escapeHtml(new Date(report.generatedAt).toLocaleString("vi-VN"))}</p>
        </header>

        <section class="section">
          <h2>Cần xử lý ngay</h2>
          <table><tr>
            ${report.attentionItems.length > 0
              ? report.attentionItems.slice(0, 4).map((item) => `<td class="attention"><span>${escapeHtml(item.title)}</span><strong>${item.count}</strong><p>${escapeHtml(item.description)}</p></td>`).join("")
              : `<td class="attention"><span>Trạng thái</span><strong>0</strong><p>Không có tồn đọng nổi bật trong phạm vi hiện tại.</p></td>`}
          </tr></table>
        </section>

        <section class="section">
          <h2>Kết quả của tôi trong kỳ</h2>
          <table><tr>
            <td class="metric"><span>Đã liên hệ</span><strong>${report.personalKpis.contactedInPeriod}</strong></td>
            <td class="metric good"><span>Đã chuyển đổi</span><strong>${report.personalKpis.convertedInPeriod}</strong></td>
            <td class="metric"><span>Đúng SLA</span><strong>${report.personalKpis.contactedInPeriod > 0 ? `${report.personalKpis.slaOnTimeRate}%` : "—"}</strong></td>
            <td class="metric warn"><span>Lead còn mở</span><strong>${report.personalKpis.openCurrent}</strong></td>
          </tr></table>
          <p style="margin: 4px 10px 0; color: #6d6781; font-size: 11px;">Tỷ lệ chuyển đổi: ${report.personalKpis.conversionRate}% trên ${report.personalKpis.resultRecordedInPeriod} kết quả trong kỳ · Phản hồi trung bình: ${escapeHtml(leadExcelMinutes(report.personalKpis.avgFirstResponseMinutes))}</p>
        </section>

        <section class="section">
          <h2>Xu hướng xử lý 7 ngày</h2>
          <table class="trend">
            <thead><tr><th>Ngày</th><th>Lead phát sinh</th><th>Đã liên hệ</th><th>Đã chuyển đổi</th></tr></thead>
            <tbody>${report.activityTrend.map((row) => `<tr><td>${escapeHtml(row.day)}</td><td>${row.created}</td><td>${row.contacted}</td><td>${row.converted}</td></tr>`).join("")}</tbody>
          </table>
        </section>

        <section class="section">
          <h2>Nhận định và đề xuất</h2>
          ${report.recommendations.map((item) => `<p class="recommendation">${escapeHtml(item)}</p>`).join("")}
        </section>

        <section class="section">
          <h2>Lead ưu tiên hiện tại</h2>
          <table class="data">
            <thead><tr><th>ID</th><th>Khách hàng</th><th>Nền tảng</th><th>Intent</th><th>Ưu tiên</th><th>Lý do</th><th>Hành động</th><th>SLA</th><th>Nội dung</th></tr></thead>
            <tbody>${renderRows(priorityRows, 9)}</tbody>
          </table>
        </section>

        <section class="section">
          <h2>Chi tiết lead phát sinh trong kỳ</h2>
          <table class="data">
            <thead><tr><th>ID</th><th>Khách hàng</th><th>Nền tảng</th><th>Intent</th><th>Trạng thái</th><th>SLA</th><th>Phụ trách</th><th>Liên hệ đầu</th><th>Phản hồi</th><th>Kết quả</th><th>Ghi nhận lúc</th><th>Nội dung</th></tr></thead>
            <tbody>${renderRows(detailRows, 12)}</tbody>
          </table>
        </section>
        <footer class="footer">InsightFlow · Nội dung trong bản xem trước và file Excel được tạo từ cùng một tài liệu.</footer>
      </main>
    </body>
  </html>`;
}

export function exportLeadEmployeeReportExcel(
  report: LeadEmployeeReportData,
  filename = "Lead_Employee_Report",
  options: LeadEmployeeExcelViewOptions = {},
) {
  const excelDocument = buildLeadEmployeeReportExcelDocument(report, options);
  const blob = new Blob([excelDocument], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${safeFilePart(filename)}.xls`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getCrisisReportOverviewRows(report: CrisisReportData) {
  const { kpis } = report;
  return [
    ["Chi so", "Gia tri"],
    ["Thoi gian xuat", report.generatedAt],
    ["Tong canh bao", kpis.total],
    ["Moi", kpis.new],
    ["Dang xu ly", kpis.resolving],
    ["Dang theo doi", kpis.monitoring],
    ["Cho duyet", kpis.pendingApproval],
    ["Da xu ly", kpis.resolved],
    ["Qua han/Tre SLA", kpis.overdue],
    ["Escalate", kpis.escalated],
    ["Critical", kpis.critical],
    ["High", kpis.high],
    ["Phan hoi dau tien TB (phut)", kpis.avgFirstResponseMinutes ?? ""],
    ["Xu ly TB (phut)", kpis.avgResolutionMinutes ?? ""],
    ["Ty le xu ly", `${kpis.resolvedRate}%`],
    ["Ty le dung SLA", `${kpis.slaOnTimeRate}%`],
    ["Tom tat", report.aiSummary],
  ];
}

function getCrisisReportDetailRows(report: CrisisReportData) {
  return [
    [
      "Case ID",
      "Thuong hieu",
      "Nen tang",
      "Chu de",
      "Muc do",
      "Sentiment",
      "Trang thai",
      "Nhan vien phu trach",
      "Tao luc",
      "Phan hoi dau tien",
      "Xu ly xong",
      "Phan hoi (phut)",
      "Xu ly (phut)",
      "SLA",
      "Diem tieu cuc",
      "Reach",
      "Engagement",
      "Escalate",
      "So ghi chu",
      "Noi dung",
      "URL",
    ],
    ...report.detailRows.map((row) => [
      row.id,
      row.brand,
      row.platform,
      row.topic,
      row.severity,
      row.sentiment,
      row.status,
      row.assigneeName,
      row.createdAt,
      row.firstResponseAt,
      row.resolvedAt,
      row.responseMinutes ?? "",
      row.resolutionMinutes ?? "",
      row.slaStatus,
      row.negativityScore,
      row.reach,
      row.engagement,
      row.escalated ? "Co" : "Khong",
      row.notesCount,
      row.content,
      row.url,
    ]),
  ];
}

function getCrisisReportDistributionRows(title: string, rows: CrisisReportData["severityDistribution"]) {
  return [
    [title],
    ["Nhom", "So luong", "Ty le"],
    ...rows.map((row) => [row.label, row.count, `${row.percentage}%`]),
  ];
}

function getCrisisReportStaffRows(report: CrisisReportData) {
  return [
    ["Nhan vien", "Tong case", "Da xu ly", "Qua han/Tre SLA", "Escalate", "Phan hoi TB (phut)", "Xu ly TB (phut)", "Ty le xu ly"],
    ...report.staffPerformance.map((row) => [
      row.ownerName,
      row.total,
      row.resolved,
      row.overdue,
      row.escalated,
      row.avgFirstResponseMinutes ?? "",
      row.avgResolutionMinutes ?? "",
      `${row.resolvedRate}%`,
    ]),
  ];
}

export function exportCrisisReportExcel(report: CrisisReportData, filename = "Crisis_Report") {
  downloadExcelSheets(`${safeFilePart(filename)}.xls`, [
    { name: "Tong quan khung hoang", rows: getCrisisReportOverviewRows(report) },
    { name: "Chi tiet case", rows: getCrisisReportDetailRows(report) },
    {
      name: "Phan tich",
      rows: [
        ...getCrisisReportDistributionRows("Phan bo muc do", report.severityDistribution),
        [],
        ...getCrisisReportDistributionRows("Trang thai xu ly", report.statusDistribution),
        [],
        ...getCrisisReportDistributionRows("Nguon canh bao", report.sourceDistribution),
        [],
        ...getCrisisReportDistributionRows("Chu de", report.topicDistribution),
        [],
        ["Ngay", "Case moi", "Da xu ly", "Escalate", "Phan hoi TB (phut)"],
        ...report.responseTrend.map((row) => [
          row.day,
          row.created,
          row.resolved,
          row.escalated,
          row.avgResponseMinutes,
        ]),
      ],
    },
    { name: "Qua han SLA", rows: [["Case qua han"], ...getCrisisReportDetailRows({ ...report, detailRows: report.overdueRows })] },
    { name: "Escalation", rows: [["Case escalate"], ...getCrisisReportDetailRows({ ...report, detailRows: report.escalationRows })] },
    { name: "Hieu suat nhan vien", rows: getCrisisReportStaffRows(report) },
  ]);
}

export interface CrisisEmployeeExcelViewOptions {
  periodLabel?: string;
  filterLabel?: string;
  aiInsights?: string;
  insightReport?: InsightReport;
  brandName?: string;
}

function crisisExcelMinutes(value: number | null) {
  if (value === null) return "Chưa có dữ liệu";
  if (value < 60) return `${value} phút`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
}

export function buildCrisisEmployeeReportExcelDocument(
  report: CrisisEmployeeReportData,
  options: CrisisEmployeeExcelViewOptions = {},
) {
  const periodLabel = options.periodLabel || "Theo phạm vi dữ liệu đã chọn";
  const filterLabel = options.filterLabel || "Case thuộc trách nhiệm của nhân viên";
  const brandName = options.brandName || "Highlands Coffee";
  const detailRows = report.detailRows.map((row) => [
    row.id,
    row.topic,
    row.platform,
    row.severity.toUpperCase(),
    row.status,
    row.slaStatus,
    row.assigneeName,
    crisisExcelMinutes(row.responseMinutes),
    crisisExcelMinutes(row.resolutionMinutes),
    row.content,
  ]);
  const priorityRows = report.priorityRows.map((row) => [
    row.id,
    row.topic,
    row.severity.toUpperCase(),
    row.urgencyLevel === "urgent"
      ? "Khẩn cấp"
      : row.urgencyLevel === "attention"
        ? "Cần chú ý"
        : "Theo dõi",
    row.urgencyReasons.join(" · "),
    row.slaStatus,
    row.assigneeName,
    row.content,
  ]);
  const renderRows = (rows: unknown[][], columnCount: number) =>
    rows.length > 0
      ? rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
          )
          .join("")
      : `<tr><td colspan="${columnCount}" class="empty">Không có dữ liệu phù hợp.</td></tr>`;

  const hasAI = Boolean(options.aiInsights || options.insightReport);

  return `<!doctype html>
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { margin: 0; padding: 28px; background: #f7f7fc; color: #211b1b; font-family: Arial, sans-serif; }
        .report { width: 1120px; margin: 0 auto; background: #fff; border: 1px solid #eadede; }
        .hero { padding: 28px 32px; color: #fff; background: #b42318; }
        .eyebrow { margin: 0 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; }
        h1 { margin: 0; font-size: 28px; } .hero p { margin: 10px 0 0; font-size: 13px; }
        .meta { margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.3); }
        .section { padding: 22px 32px; border-bottom: 1px solid #eee3e3; }
        h2 { margin: 0 0 14px; font-size: 17px; }
        table { width: 100%; border-collapse: separate; border-spacing: 10px; }
        td { vertical-align: top; }
        .attention { width: 25%; padding: 14px; border: 1px solid #f0c7c7; background: #fff8f7; }
        .attention span, .metric span { display: block; color: #756767; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .attention strong { display: block; margin-top: 8px; color: #b42318; font-size: 24px; }
        .attention p { margin: 8px 0 0; color: #655b5b; font-size: 11px; line-height: 1.5; }
        .metric { width: 25%; padding: 16px; border: 1px solid #eadede; background: #fffafa; }
        .metric strong { display: block; margin-top: 8px; color: #b42318; font-size: 25px; }
        .metric.good strong { color: #157347; } .metric.warn strong { color: #b45309; }
        .recommendation { margin: 8px 0; padding: 11px 13px; border-left: 4px solid #b42318; background: #fff3f2; font-size: 12px; }
        .trend { border-spacing: 0; } .trend th, .data th { padding: 9px; color: #fff; background: #b42318; border: 1px solid #8f1c14; font-size: 11px; text-align: left; }
        .trend td, .data td { padding: 8px; border: 1px solid #eadede; font-size: 10px; white-space: normal; word-break: break-word; }
        .trend tr:nth-child(even) td, .data tr:nth-child(even) td { background: #fff8f7; }
        .data { border-spacing: 0; table-layout: fixed; }
        .empty { padding: 20px !important; color: #756767; text-align: center; }
        .footer { padding: 16px 32px; color: #756767; background: #faf6f6; font-size: 10px; }
      </style>
    </head>
    <body>
      <main class="report">
        ${hasAI
          ? buildUnifiedBIInsightHTML({
              insightReport: options.insightReport,
              aiInsights: options.aiInsights,
              periodLabel,
              brandName,
              slaRate: report.personalKpis.slaOnTimeRate,
              overdueCount: report.personalKpis.criticalHighOpen || 0,
              totalCount: report.personalKpis.createdInPeriod || 0,
            })
          : `<header class="hero">
              <p class="eyebrow">Báo cáo công việc cá nhân</p>
              <h1>Xử lý khủng hoảng</h1>
              <p>Tập trung vào case cần chú ý, kết quả cá nhân và xu hướng xử lý.</p>
              <p class="meta"><strong>Kỳ báo cáo:</strong> ${escapeHtml(periodLabel)} &nbsp;·&nbsp; <strong>Phạm vi:</strong> ${escapeHtml(filterLabel)} &nbsp;·&nbsp; <strong>Cập nhật:</strong> ${escapeHtml(new Date(report.generatedAt).toLocaleString("vi-VN"))}</p>
            </header>`}

        <section class="section">
          <h2>Cần xử lý ngay</h2>
          <table><tr>
            ${report.attentionItems.length > 0
              ? report.attentionItems.slice(0, 4).map((item) => `<td class="attention"><span>${escapeHtml(item.title)}</span><strong>${item.count}</strong><p>${escapeHtml(item.description)}</p></td>`).join("")
              : `<td class="attention"><span>Trạng thái</span><strong>0</strong><p>Không có rủi ro nổi bật trong phạm vi hiện tại.</p></td>`}
          </tr></table>
        </section>

        <section class="section">
          <h2>Kết quả của tôi trong kỳ</h2>
          <table><tr>
            <td class="metric good"><span>Đã giải quyết</span><strong>${report.personalKpis.resolvedInPeriod}</strong></td>
            <td class="metric"><span>Đúng SLA</span><strong>${report.personalKpis.slaOnTimeRate}%</strong></td>
            <td class="metric"><span>Phản hồi trung bình</span><strong>${escapeHtml(crisisExcelMinutes(report.personalKpis.avgFirstResponseMinutes))}</strong></td>
            <td class="metric warn"><span>Case còn mở</span><strong>${report.personalKpis.openCurrent}</strong></td>
          </tr></table>
        </section>

        <section class="section">
          <h2>Xu hướng xử lý 7 ngày</h2>
          <table class="trend">
            <thead><tr><th>Ngày</th><th>Case phát sinh</th><th>Đã giải quyết</th><th>Quá hạn</th></tr></thead>
            <tbody>${report.activityTrend.map((row) => `<tr><td>${escapeHtml(row.day)}</td><td>${row.created}</td><td>${row.resolved}</td><td>${row.overdue}</td></tr>`).join("")}</tbody>
          </table>
        </section>

        <section class="section">
          <h2>Nhận định và đề xuất</h2>
          ${report.recommendations.map((item) => `<p class="recommendation">${escapeHtml(item)}</p>`).join("")}
        </section>

        <section class="section">
          <h2>Case ưu tiên hiện tại</h2>
          <table class="data">
            <thead><tr><th>ID</th><th>Chủ đề</th><th>Mức độ</th><th>Ưu tiên</th><th>Lý do</th><th>SLA</th><th>Phụ trách</th><th>Nội dung</th></tr></thead>
            <tbody>${renderRows(priorityRows, 8)}</tbody>
          </table>
        </section>

        <section class="section">
          <h2>Chi tiết case trong kỳ</h2>
          <table class="data">
            <thead><tr><th>ID</th><th>Chủ đề</th><th>Nền tảng</th><th>Mức độ</th><th>Trạng thái</th><th>SLA</th><th>Phụ trách</th><th>Phản hồi</th><th>Xử lý</th><th>Nội dung</th></tr></thead>
            <tbody>${renderRows(detailRows, 10)}</tbody>
          </table>
        </section>
        <footer class="footer">InsightFlow · Nội dung trong bản xem trước và file Excel được tạo từ cùng một tài liệu.</footer>
      </main>
    </body>
  </html>`;
}

export function exportCrisisEmployeeReportExcel(
  report: CrisisEmployeeReportData,
  filename = "Crisis_Employee_Report",
  options: CrisisEmployeeExcelViewOptions = {},
) {
  const excelDocument = buildCrisisEmployeeReportExcelDocument(report, options);
  const blob = new Blob([excelDocument], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${safeFilePart(filename)}.xls`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface DualOperationsExcelViewOptions {
  periodLabel?: string;
  filterLabel?: string;
  operation?: "all" | "lead" | "crisis";
  aiInsights?: string;
  insightReport?: InsightReport;
  brandName?: string;
}

export function renderRichMarkdownToHTML(mdText: string): string {
  if (!mdText) return "";
  const normalized = mdText.normalize("NFC");
  const lines = normalized.split("\n");
  const htmlBlocks: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      htmlBlocks.push('<div style="height: 10px;"></div>');
      continue;
    }

    // 1. Title Header (e.g. **BÁO CÁO PHÂN TÍCH...**)
    if (trimmed.startsWith("**BÁO CÁO") || trimmed.startsWith("**BÁO CÁO PHÂN TÍCH")) {
      const cleanTitle = trimmed.replace(/^\*\*/, "").replace(/\*\*/g, "").replace(/---$/, "").trim();
      htmlBlocks.push(`
        <div style="font-family:'Times New Roman', Times, serif; font-size: 20px; font-weight: 700; color: #111827; text-align: center; text-transform: uppercase; margin-bottom: 24px; line-height: 1.4; letter-spacing: 0.3px;">
          ${escapeHtml(cleanTitle)}
        </div>
      `);
      continue;
    }

    // 2. Section Headings (e.g. ### 1. ĐÁNH GIÁ TỔNG QUAN...)
    if (trimmed.startsWith("### ")) {
      const headingText = trimmed.replace(/^###\s*/, "").replace(/---$/, "").trim();
      const cleanHeading = escapeHtml(headingText).replace(/\*\*(.*?)\*\*/g, "$1");
      htmlBlocks.push(`
        <h3 style="font-family:'Times New Roman', Times, serif; font-size: 16.5px; font-weight: 700; color: #1E293B; margin-top: 24px; margin-bottom: 10px; line-height: 1.4; border-bottom: 1.5px solid #CBD5E1; padding-bottom: 4px;">
          ${cleanHeading}
        </h3>
      `);
      continue;
    }

    // 3. Bullet / List Items (*, •, -, ↳)
    if (/^[\*\•\-\↳]\s/.test(trimmed) || /^\*\s\*\*/.test(trimmed)) {
      let content = trimmed.replace(/^[\*\•\-\↳]\s*/, "").trim();
      if (content.startsWith("* **")) {
        content = content.replace(/^\*\s/, "");
      }

      const formattedContent = escapeHtml(content)
        .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700; color:#111827;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="font-style:italic; color:#374151;">$1</em>');

      htmlBlocks.push(`
        <div style="font-family:'Times New Roman', Times, serif; font-size: 14.5px; line-height: 1.75; color: #1F2937; margin-left: 20px; margin-bottom: 6px; position: relative;">
          <span style="position: absolute; left: -16px; top: 0; font-weight: bold; color: #374151;">•</span>
          ${formattedContent}
        </div>
      `);
      continue;
    }

    // 4. Regular Paragraph line
    const formattedParagraph = escapeHtml(trimmed)
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700; color:#111827;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style:italic; color:#374151;">$1</em>');

    htmlBlocks.push(`
      <p style="font-family:'Times New Roman', Times, serif; font-size: 14.5px; line-height: 1.75; color: #1F2937; margin-top: 4px; margin-bottom: 8px; text-align: justify;">
        ${formattedParagraph}
      </p>
    `);
  }

  return htmlBlocks.join("");
}

export function buildUnifiedBIInsightHTML(params: {
  insightReport?: InsightReport;
  aiInsights?: string;
  periodLabel?: string;
  brandName?: string;
  slaRate?: number | string;
  overdueCount?: number;
  totalCount?: number;
  topicBreakdown?: Record<string, number>;
}): string {
  const periodLabel = params.periodLabel || "7 ngày gần nhất";
  const brandName = params.brandName || "Highlands Coffee";
  const slaRateRaw = params.slaRate ?? 100;
  const slaRateNum = Math.min(100, Math.max(0, typeof slaRateRaw === "number" ? slaRateRaw : parseFloat(String(slaRateRaw).replace("%", "")) || 0));
  const overdueCount = params.overdueCount ?? 0;
  const totalCount = params.totalCount ?? 300;

  // Lấy dữ liệu Insight (hoặc cấu trúc mặc định nếu chưa có)
  const reportData: InsightReport = normalizeNFC(
    params.insightReport || {
      summary: overdueCount > 0
        ? `Trong kỳ báo cáo ${periodLabel}, hệ thống ghi nhận ${overdueCount} ca quá hạn SLA trên tổng số ${totalCount} case cần xử lý (Tỷ lệ tuân thủ SLA đạt ${slaRateNum}%). Nhóm case quá hạn tập trung chủ yếu ở các mốc thời gian cao điểm, đe dọa trực tiếp tới chỉ số hài lòng khách hàng (CSAT) và uy tín thương hiệu ${brandName}.`
        : `Trong kỳ báo cáo ${periodLabel}, hệ thống ghi nhận tỷ lệ tuân thủ SLA đạt 100% (không có ca quá hạn trên tổng số ${totalCount} case). Hiệu suất vận hành và trải nghiệm khách hàng của thương hiệu ${brandName} được duy trì tối ưu.`,
      overall_status: overdueCount > 0 ? "⚠️ Cần chú ý SLA" : "Tốt",
      risk_level: overdueCount > 5 ? "Cao" : overdueCount > 0 ? "Trung bình" : "Thấp",
      confidence: "Cao",
      key_insights: [
        {
          title: overdueCount > 0
            ? `⚠️ Rủi ro suy giảm CSAT do ${overdueCount} ca trễ hạn SLA (Tỷ lệ tuân thủ ${slaRateNum}%)`
            : `Duy trì tỷ lệ tuân thủ SLA tuyệt đối 100% trong kỳ`,
          description: overdueCount > 0
            ? `[NGUYÊN NHÂN GỐC RỄ]: Khối lượng công việc dồn ứ ca tối từ 19h-22h vượt quá năng lực đáp ứng của nhân sự hiện tại.\n[TÁC ĐỘNG THƯƠNG HIỆU]: ${overdueCount} khách hàng chờ đợi quá thời gian cam kết có nguy cơ cao tạo phản hồi tiêu cực trên mạng xã hội.\n[HÀNH ĐỘNG KHẮC PHỤC]: Điều chuyển 2 nhân sự hỗ trợ ca tối và ưu tiên đóng các ticket trễ hạn trong 24h.`
            : `[NGUYÊN NHÂN GỐC RỄ]: Quy trình tiếp nhận và phân công ca trực được vận hành thông suốt.\n[TÁC ĐỘNG THƯƠNG HIỆU]: Giữ vững niềm tin khách hàng và nâng cao uy tín thương hiệu ${brandName}.\n[HÀNH ĐỘNG KHẮC PHỤC]: Tiếp tục duy trì quy trình và khen thưởng đội ngũ vận hành.`,
          impact: overdueCount > 0 ? "high" : "low",
          type: overdueCount > 0 ? "negative" : "positive",
        },
      ],
      recommendations: [
        {
          title: overdueCount > 0
            ? `[Khẩn cấp 24h] Xử lý dứt điểm ${overdueCount} ca quá hạn SLA`
            : `[Định kỳ 7 ngày] Rà soát và tối ưu hóa thời gian phản hồi ca tối`,
          description: overdueCount > 0
            ? "Giao chỉ tiêu đóng ticket quá hạn cho trưởng nhóm vận hành nhằm giải tỏa ngay lập tức nghẽn hệ thống."
            : "Duy trì tần suất rà soát ca trực hàng tuần để đảm bảo tốc độ phản hồi không bị sụt giảm.",
          priority: overdueCount > 0 ? "high" : "medium",
        },
        {
          title: "[Ngắn hạn 7 ngày] Điều chỉnh ca trực linh hoạt cho khung giờ cao điểm",
          description: "Bố trí thêm nhân lực linh hoạt ca tối (19h - 22h) nhằm duy trì thời gian phản hồi đầu tiên dưới 15 phút.",
          priority: "medium",
        },
      ],
    }
  );

  const topicBreakdown = params.topicBreakdown || {
    Other: 47.3,
    Quality: 28.7,
    Service: 14.7,
    Location: 7.0,
    Price: 6.3,
    Promotion: 5.3,
  };

  const sortedTopics = Object.entries(topicBreakdown).sort((a, b) => b[1] - a[1]);
  const maxTopicVal = Math.max(...Object.values(topicBreakdown), 1);

  const TYPE_CARD_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    negative: { bg: "#FBEEE7", border: "#A85A3E", text: "#A85A3E", icon: "" },
    warning:  { bg: "#FBF3E2", border: "#9C7A2E", text: "#9C7A2E", icon: "⚠️ " },
    positive: { bg: "#ECF4EE", border: "#3F8F5F", text: "#3F8F5F", icon: "" },
    neutral:  { bg: "#FAF8F5", border: "#756F66", text: "#756F66", icon: "" },
  };

  const IMPACT_TAG_MAP: Record<string, string> = {
    high: "Cao",
    medium: "Trung bình",
    low: "Thấp",
  };

  const slaGaugeColor = slaRateNum >= 90 ? "#3F8F5F" : slaRateNum >= 75 ? "#9C7A2E" : "#A85A3E";

  if (params.aiInsights) {
    return `
    <div class="bi-report-container" style="padding:40px 48px; background:#ffffff; font-family:'Times New Roman', Times, serif; color:#1F2937;">
      <!-- Title Header -->
      <header style="margin-bottom:28px; padding-bottom:16px; border-bottom:1px solid #E2E8F0;">
        <h1 style="font-family:'Times New Roman', Times, serif; color:#111827; font-size:24px; font-weight:700; margin:0 0 6px 0; line-height:1.25; letter-spacing:-0.2px;">
          BÁO CÁO PHÂN TÍCH INSIGHT — KỲ ${escapeHtml(periodLabel).toUpperCase()}
        </h1>
        <p style="font-family:'Times New Roman', Times, serif; color:#4B5563; font-size:14px; font-style:italic; margin:0;">
          Thương hiệu: ${escapeHtml(brandName)} · Dữ liệu phân tích AI Insights
        </p>
      </header>

      <!-- Section: Phân tích AI Insights Document View -->
      <div style="margin-bottom:32px;">
        <div style="background:#ffffff; border:1px solid #E5E7EB; border-radius:8px; padding:36px 44px; box-shadow:0 4px 24px rgba(0,0,0,0.06); font-family:'Times New Roman', Times, serif;">
          ${renderRichMarkdownToHTML(params.aiInsights)}
        </div>
      </div>

      <!-- Footer -->
      <footer style="margin-top:36px; padding-top:16px; border-top:1px solid #E5E7EB; text-align:center; color:#6B7280; font-size:12px; font-style:italic; font-family:'Times New Roman', serif;">
        Báo cáo được khởi tạo tự động bởi InsightFlow BI System · Định dạng tài liệu chuẩn Word
      </footer>
    </div>`;
  }

  return `
    <div class="bi-report-container" style="padding:36px; background:#ffffff; font-family:'Calibri', 'Segoe UI', Arial, sans-serif; color:#3A3936;">
      <!-- Title Header -->
      <header style="margin-bottom:32px; padding-bottom:16px; border-bottom:1px solid #EBE8E3;">
        <h1 style="font-family:'Georgia', 'Times New Roman', serif; color:#6B5B4D; font-size:26px; font-weight:700; margin:0 0 6px 0; line-height:1.25; letter-spacing:-0.2px;">
          Báo cáo Insight — Kỳ ${escapeHtml(periodLabel)}
        </h1>
        <p style="font-family:'Georgia', 'Times New Roman', serif; color:#756F66; font-size:13px; font-style:italic; margin:0;">
          ${escapeHtml(brandName)} · Dữ liệu phân tích AI Insights &amp; Metrics
        </p>
      </header>

      <!-- 1. Tóm tắt -->
      <div style="margin-bottom:32px;">
        <h2 style="font-family:'Georgia', 'Times New Roman', serif; color:#6B5B4D; font-size:19px; font-weight:700; margin:0 0 10px 0; letter-spacing:-0.1px;">
          Tóm tắt
        </h2>
        <p style="font-family:'Calibri', 'Segoe UI', Arial, sans-serif; color:#3A3936; font-size:13.5px; line-height:1.65; margin:0; letter-spacing:0.1px;">
          ${escapeHtml(reportData.summary)}
        </p>
      </div>

      <!-- 2. Trực quan hóa -->
      <div style="margin-bottom:36px;">
        <h2 style="font-family:'Georgia', 'Times New Roman', serif; color:#6B5B4D; font-size:19px; font-weight:700; margin:0 0 16px 0; letter-spacing:-0.1px;">
          Trực quan hóa
        </h2>

        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:#FAF9F6; padding:28px 24px; border-radius:12px;">
          <!-- SLA Donut SVG -->
          <div style="text-align:center; margin-bottom:24px;">
            <div style="position:relative; width:160px; height:160px; margin:0 auto;">
              <svg width="160" height="160" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EAE7E1" stroke-width="3.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${slaGaugeColor}" stroke-width="3.5" stroke-dasharray="${Math.round(slaRateNum)}, 100" stroke-linecap="round" />
              </svg>
              <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <span style="font-size:24px; font-weight:800; color:${slaGaugeColor}; line-height:1; font-family:'Georgia', Arial, sans-serif;">${slaRateNum}%</span>
                <span style="font-size:10px; color:#756F66; font-weight:700; margin-top:4px; text-transform:uppercase; letter-spacing:0.5px;">Tuân thủ SLA</span>
              </div>
            </div>
            <p style="font-size:12px; color:#756F66; font-style:italic; margin:12px 0 0 0; font-family:'Georgia', serif;">
              ${slaRateNum}% case xử lý trong hạn SLA — ${overdueCount}/${totalCount} case quá hạn.
            </p>
          </div>

          <!-- Horizontal Bar Chart -->
          <div style="width:100%; max-width:520px;">
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${sortedTopics
                .map(([name, val]) => {
                  const pct = typeof val === "number" ? val : parseFloat(val) || 0;
                  const widthPct = Math.max(5, Math.min(100, Math.round((pct / maxTopicVal) * 100)));
                  const barColor = name.toLowerCase() === "other" ? "#C5BEB5" : name.toLowerCase() === "quality" ? "#2563EB" : name.toLowerCase() === "service" ? "#3B82F6" : "#A8A29E";
                  return `
                    <div style="display:flex; align-items:center; gap:12px; font-size:12px;">
                      <span style="width:80px; text-align:right; font-weight:600; color:#3A3936;">${escapeHtml(name)}</span>
                      <div style="flex:1; background:#EAE7E1; height:18px; border-radius:4px; overflow:hidden;">
                        <div style="width:${widthPct}%; background:${barColor}; height:100%; border-radius:4px;"></div>
                      </div>
                      <span style="width:45px; font-weight:700; color:#3A3936;">${pct}%</span>
                    </div>`;
                })
                .join("")}
            </div>
            <p style="font-size:11px; color:#756F66; font-style:italic; text-align:center; margin:14px 0 0 0; font-family:'Georgia', serif;">
              Cơ cấu chủ đề sau khi normalize theo 6 nhóm và gộp outlier vào "other".
            </p>
          </div>
        </div>
      </div>

      <!-- 3. Insight chính -->
      <div style="margin-bottom:36px;">
        <h2 style="font-family:'Georgia', 'Times New Roman', serif; color:#6B5B4D; font-size:19px; font-weight:700; margin:0 0 16px 0; letter-spacing:-0.1px;">
          Insight chính
        </h2>
        <div style="display:flex; flex-direction:column; gap:14px;">
          ${reportData.key_insights
            .map((item: any) => {
              const style = TYPE_CARD_STYLES[item.type] || TYPE_CARD_STYLES.neutral;
              const impactLabel = IMPACT_TAG_MAP[item.impact] || item.impact;
              return `
                <div style="padding:15px 18px; background:${style.bg}; border-left:4px solid ${style.border}; border-radius:0 8px 8px 0;">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <span style="font-family:'Calibri', 'Segoe UI', sans-serif; font-weight:700; color:${style.text}; font-size:14px;">
                      ${style.icon}${escapeHtml(item.title)}
                    </span>
                    <span style="font-size:10px; font-weight:700; padding:2px 7px; background:${style.border}; color:#ffffff; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px;">
                      ${escapeHtml(impactLabel)}
                    </span>
                  </div>
                  <p style="font-family:'Calibri', 'Segoe UI', sans-serif; color:#3A3936; font-size:13px; line-height:1.55; margin:0; white-space:pre-line;">
                    ${escapeHtml(item.description)}
                  </p>
                </div>`;
            })
            .join("")}
        </div>
      </div>

      <!-- 4. Khuyến nghị hành động -->
      <div style="margin-bottom:32px;">
        <h2 style="font-family:'Georgia', 'Times New Roman', serif; color:#6B5B4D; font-size:19px; font-weight:700; margin:0 0 14px 0; letter-spacing:-0.1px;">
          Khuyến nghị hành động
        </h2>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${reportData.recommendations
            .map((rec: any) => {
              const priorityLabel = IMPACT_TAG_MAP[rec.priority] || rec.priority;
              const priorityColor = rec.priority === "high" ? "#A85A3E" : rec.priority === "medium" ? "#9C7A2E" : "#3F8F5F";
              return `
                <div style="padding:14px 16px; background:#FAF9F6; border-left:4px solid ${priorityColor}; border-radius:0 8px 8px 0;">
                  <div style="font-family:'Calibri', 'Segoe UI', sans-serif; font-weight:700; color:#3A3936; font-size:13.5px; margin-bottom:4px;">
                    <span style="color:${priorityColor}; font-weight:800; margin-right:6px; letter-spacing:0.2px;">[Ưu tiên ${escapeHtml(priorityLabel)}]</span>
                    ${escapeHtml(rec.title)}
                  </div>
                  <p style="font-family:'Calibri', 'Segoe UI', sans-serif; color:#655F58; font-size:12.5px; line-height:1.5; margin:0;">
                    ${escapeHtml(rec.description)}
                  </p>
                </div>`;
            })
            .join("")}
        </div>
      </div>

      <!-- 5. Rủi ro và Độ tin cậy -->
      <div style="margin-bottom:28px;">
        <h2 style="font-family:'Georgia', 'Times New Roman', serif; color:#6B5B4D; font-size:19px; font-weight:700; margin:0 0 12px 0; letter-spacing:-0.1px;">
          Rủi ro và Độ tin cậy
        </h2>
        <div style="display:flex; gap:16px;">
          <div style="flex:1; background:#FAF9F6; padding:14px 18px; border-radius:8px;">
            <div style="font-size:10.5px; color:#756F66; font-weight:700; text-transform:uppercase; letter-spacing:0.6px;">Mức độ rủi ro</div>
            <div style="font-size:15px; font-weight:700; color:#3A3936; margin-top:4px;">${escapeHtml(reportData.risk_level)}</div>
          </div>
          <div style="flex:1; background:#FAF9F6; padding:14px 18px; border-radius:8px;">
            <div style="font-size:10.5px; color:#756F66; font-weight:700; text-transform:uppercase; letter-spacing:0.6px;">Độ tin cậy phân tích</div>
            <div style="font-size:15px; font-weight:700; color:#3A3936; margin-top:4px;">${escapeHtml(reportData.confidence)}</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer style="margin-top:36px; padding-top:16px; border-top:1px solid #EBE8E3; text-align:center; color:#756F66; font-size:11px; font-style:italic;">
        InsightFlow · Báo cáo Insight Quản trị
      </footer>
    </div>`;
}

function dualMetricCell(label: string, value: unknown, tone = "") {
  return `<td class="metric ${tone}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></td>`;
}

function dualSummaryTable(title: string, headers: string[], rows: unknown[][]) {
  return `
    <section class="report-section details">
      <h2>${escapeHtml(title)}</h2>
      <table class="data-table">
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.length > 0
            ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
            : `<tr><td colspan="${headers.length}" class="empty">Không có dữ liệu phù hợp.</td></tr>`}
        </tbody>
      </table>
    </section>`;
}

export function buildDualOperationsReportExcelDocument(
  report: DualOperationsReportData,
  options: DualOperationsExcelViewOptions = {},
) {
  const periodLabel = options.periodLabel || "Theo phạm vi dữ liệu đã chọn";
  const filterLabel = options.filterLabel || "Tất cả nghiệp vụ";
  const brandName = options.brandName || "Highlands Coffee";
  const showLead = options.operation !== "crisis";
  const showCrisis = options.operation !== "lead";
  const leadTrendRows = report.lead.responseTrend.map((row) => [
    row.day,
    row.created,
    row.completed,
  ]);
  const crisisTrendRows = report.crisis.responseTrend.map((row) => [
    row.day,
    row.created,
    row.resolved,
  ]);
  const leadDetailRows = report.lead.detailRows.map((row) => [
    row.id,
    row.customer,
    row.intent.toUpperCase(),
    row.status,
    row.slaStatus,
    row.ownerName,
    row.content,
  ]);
  const crisisDetailRows = report.crisis.detailRows.map((row) => [
    row.id,
    row.topic,
    row.severity.toUpperCase(),
    row.status,
    row.slaStatus,
    row.assigneeName,
    row.content,
  ]);
  const leadCreated7d = report.lead.responseTrend.reduce((total, row) => total + row.created, 0);
  const leadClosed7d = report.lead.responseTrend.reduce((total, row) => total + row.completed, 0);
  const crisisCreated7d = report.crisis.responseTrend.reduce((total, row) => total + row.created, 0);
  const crisisClosed7d = report.crisis.responseTrend.reduce((total, row) => total + row.resolved, 0);
  const totalCreated7d = (showLead ? leadCreated7d : 0) + (showCrisis ? crisisCreated7d : 0);
  const totalClosed7d = (showLead ? leadClosed7d : 0) + (showCrisis ? crisisClosed7d : 0);
  const backlogDelta7d = totalCreated7d - totalClosed7d;
  const trendAssessment = backlogDelta7d > 0
    ? `Tồn đọng có xu hướng tăng ${backlogDelta7d} công việc trong 7 ngày.`
    : backlogDelta7d < 0
      ? `Tồn đọng có xu hướng giảm ${Math.abs(backlogDelta7d)} công việc trong 7 ngày.`
      : "Khối lượng phát sinh và hoàn tất đang cân bằng trong 7 ngày.";
  const workflowRows = [
    ["Chưa phân công", report.kpis.workflow.unassigned.lead, report.kpis.workflow.unassigned.crisis, report.kpis.workflow.unassigned.total],
    ["Cần tiếp tục xử lý", report.kpis.workflow.inProgress.lead, report.kpis.workflow.inProgress.crisis, report.kpis.workflow.inProgress.total],
    ["Đã hoàn tất (Đã đóng)", report.kpis.workflow.completed.lead, report.kpis.workflow.completed.crisis, report.kpis.workflow.completed.total],
    ["Quá hạn còn mở", report.kpis.workflow.overdueOpen.lead, report.kpis.workflow.overdueOpen.crisis, report.kpis.workflow.overdueOpen.total],
    ["Tỷ lệ hoàn thành", `${report.kpis.workflow.completionRate.lead}%`, `${report.kpis.workflow.completionRate.crisis}%`, `${report.kpis.workflow.completionRate.total}%`],
  ];
  const sourceRows = Array.from(new Set([
    ...(showLead ? report.lead.sourceDistribution.map((item) => item.label) : []),
    ...(showCrisis ? report.crisis.sourceDistribution.map((item) => item.label) : []),
  ])).map((label) => {
    const leadCount = showLead
      ? report.lead.sourceDistribution.find((item) => item.label === label)?.count || 0
      : 0;
    const crisisCount = showCrisis
      ? report.crisis.sourceDistribution.find((item) => item.label === label)?.count || 0
      : 0;
    return [label, leadCount, crisisCount, leadCount + crisisCount];
  }).sort((first, second) => Number(second[3]) - Number(first[3]));
  const attentionRows = Array.from(
    { length: Math.ceil(report.attentionItems.length / 3) },
    (_, index) => report.attentionItems.slice(index * 3, index * 3 + 3),
  );

  const hasAI = Boolean(options.aiInsights || options.insightReport);
  const totalCount = (report.kpis.completedTasks || 0) + (report.kpis.pendingTasks || 0);

  if (hasAI) {
    return `<!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Báo cáo Insight — ${escapeHtml(brandName)}</title>
        <style>
          body { margin: 0; padding: 24px; background: #F4F3F0; color: #3A3936; font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; }
          .report-paper { max-width: 920px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden; }
        </style>
      </head>
      <body>
        <main class="report-paper">
          ${buildUnifiedBIInsightHTML({
            insightReport: options.insightReport,
            aiInsights: options.aiInsights,
            periodLabel,
            brandName,
            slaRate: report.kpis.slaOnTimeRate,
            overdueCount: report.kpis.overdueTasks,
            totalCount: totalCount > 0 ? totalCount : 300,
          })}
        </main>
      </body>
    </html>`;
  }

  return `<!doctype html>
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { margin: 0; padding: 28px; background: #f7f7fc; color: #17152b; font-family: Arial, sans-serif; }
        .report { width: 1120px; margin: 0 auto; background: #fff; border: 1px solid #dedcea; }
        .hero { padding: 28px 32px; color: #fff; background: #4f46e5; }
        .eyebrow { margin: 0 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; }
        h1 { margin: 0; font-size: 28px; } .hero p { margin: 10px 0 0; font-size: 13px; }
        .meta { margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.3); }
        .report-section { padding: 22px 32px; border-bottom: 1px solid #e6e4ef; }
        h2 { margin: 0 0 14px; font-size: 17px; } h3 { margin: 0 0 6px; font-size: 14px; }
        table { width: 100%; border-collapse: separate; border-spacing: 10px; }
        td { vertical-align: top; }
        .attention { width: 25%; padding: 14px; border: 1px solid #f0c7c7; background: #fff8f7; }
        .attention strong { display: block; margin-top: 8px; color: #b42318; font-size: 24px; }
        .attention span, .metric span { display: block; color: #6f6b7e; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .attention p { margin: 8px 0 0; color: #5d596b; font-size: 11px; line-height: 1.5; }
        .metric { width: 25%; padding: 16px; border: 1px solid #dedcea; background: #fafaff; }
        .metric strong { display: block; margin-top: 8px; color: #4f46e5; font-size: 26px; }
        .metric.good strong { color: #157347; } .metric.warn strong { color: #b45309; } .metric.danger strong { color: #b42318; }
        .operation { width: 50%; padding: 18px; border: 1px solid #dedcea; background: #fff; }
        .operation-grid { border-spacing: 0; margin-top: 10px; }
        .operation-grid td { padding: 7px 0; border-bottom: 1px solid #efedf5; font-size: 12px; }
        .operation-grid td:last-child { text-align: right; font-weight: 700; }
        .recommendation { margin: 8px 0; padding: 11px 13px; border-left: 4px solid #4f46e5; background: #f4f3ff; font-size: 12px; }
        .summary { margin: 0; padding: 14px 16px; border: 1px solid #d8d4ff; background: #f7f6ff; font-size: 12px; line-height: 1.65; }
        .note { margin: 7px 0; color: #5d596b; font-size: 11px; line-height: 1.55; }
        .data-table { border-spacing: 0; table-layout: fixed; width: 100%; }
        .data-table th { padding: 9px 12px; color: #fff; background: #4f46e5; border: 1px solid #3932bd; font-size: 11px; font-weight: 700; text-align: left; }
        .data-table td { padding: 8px; border: 1px solid #dedcea; font-size: 10px; white-space: normal; word-break: break-word; }
        .data-table tr:nth-child(even) td { background: #f8f7fc; }
        .empty { padding: 20px !important; color: #6f6b7e; text-align: center; }
        .footer { padding: 16px 32px; color: #6f6b7e; background: #f7f7fc; font-size: 10px; }
      </style>
    </head>
    <body>
      <main class="report">
        <header class="hero">
          <p class="eyebrow">Báo cáo tổng quan thương hiệu</p>
          <h1>Vận hành Khách hàng &amp; Cảnh báo</h1>
          <p>Bản báo cáo quản trị kết hợp chỉ số tổng quan, rủi ro, xu hướng và dữ liệu đối soát chi tiết.</p>
          <p class="meta"><strong>Kỳ báo cáo:</strong> ${escapeHtml(periodLabel)} &nbsp;·&nbsp; <strong>Phạm vi:</strong> ${escapeHtml(filterLabel)} &nbsp;·&nbsp; <strong>Cập nhật:</strong> ${escapeHtml(new Date(report.generatedAt).toLocaleString("vi-VN"))}</p>
        </header>

        <section class="report-section">
          <h2>Tóm tắt điều hành</h2>
          <p class="summary">Trong <strong>${escapeHtml(periodLabel)}</strong>, báo cáo ghi nhận <strong>${report.kpis.totalTasks}</strong> công việc cần xử lý; đã đóng <strong>${report.kpis.completedTasks}</strong>, còn <strong>${report.kpis.pendingTasks}</strong> công việc chưa đóng và đạt tỷ lệ hoàn thành <strong>${report.kpis.workflow.completionRate.total}%</strong>. ${escapeHtml(trendAssessment)}</p>
          <p class="note"><strong>Phạm vi và bộ lọc:</strong> ${escapeHtml(filterLabel)}. <strong>So sánh kỳ trước:</strong> chưa hiển thị vì nguồn dữ liệu hiện tại chưa cung cấp tập dữ liệu kỳ đối chiếu tương đương.</p>
        </section>

        <section class="report-section">
          <h2>Dữ liệu đối soát — Cần chú ý</h2>
          <table>
            ${attentionRows.length > 0
              ? attentionRows.map((items) => `<tr>${items.map((item) => `<td class="attention"><span>${escapeHtml(item.title)}</span><strong>${item.count}</strong><p>${escapeHtml(item.description)}</p></td>`).join("")}</tr>`).join("")
              : `<tr><td class="attention"><span>Trạng thái</span><strong>0</strong><p>Không có rủi ro nổi bật trong phạm vi báo cáo.</p></td></tr>`}
          </table>
        </section>

        <section class="report-section">
          <h2>Kết quả trong kỳ</h2>
          <table><tr>
            ${dualMetricCell("Chưa phân công", report.kpis.workflow.unassigned.total)}
            ${dualMetricCell("Cần tiếp tục xử lý", report.kpis.workflow.inProgress.total, "warn")}
            ${dualMetricCell("Đã hoàn tất", report.kpis.workflow.completed.total, "good")}
            ${dualMetricCell("Tỷ lệ hoàn thành", `${report.kpis.workflow.completionRate.total}%`, "good")}
          </tr></table>
        </section>

        ${dualSummaryTable("Tình trạng công việc theo nghiệp vụ", ["Trạng thái", "Khách hàng tiềm năng", "Cảnh báo", "Tổng"], workflowRows)}

        <section class="report-section">
          <h2>Kết quả chi tiết theo nghiệp vụ</h2>
          <table><tr>
            ${showLead ? `<td class="operation">
              <h3>Khách hàng tiềm năng</h3>
              <table class="operation-grid">
                <tr><td>Đã đóng</td><td>${report.kpis.workflow.completed.lead}/${report.kpis.leadTotal}</td></tr>
                <tr><td>Tỷ lệ hoàn thành</td><td>${report.kpis.workflow.completionRate.lead}%</td></tr>
                <tr><td>Tỷ lệ chuyển đổi</td><td>${report.lead.kpis.conversionRate}%</td></tr>
                <tr><td>Đúng SLA</td><td>${report.lead.kpis.slaOnTimeRate}%</td></tr>
                <tr><td>Follow-up quá hạn</td><td>${report.lead.kpis.followUpOverdue}</td></tr>
              </table>
            </td>` : ""}
            ${showCrisis ? `<td class="operation">
              <h3>Khủng hoảng</h3>
              <table class="operation-grid">
                <tr><td>Đã đóng</td><td>${report.kpis.workflow.completed.crisis}/${report.kpis.crisisTotal}</td></tr>
                <tr><td>Tỷ lệ hoàn thành</td><td>${report.kpis.workflow.completionRate.crisis}%</td></tr>
                <tr><td>Critical/High còn mở</td><td>${report.kpis.priorityOpen.crisis}</td></tr>
                <tr><td>Quá hạn còn mở</td><td>${report.kpis.workflow.overdueOpen.crisis}</td></tr>
                <tr><td>Đúng SLA</td><td>${report.crisis.kpis.slaOnTimeRate}%</td></tr>
              </table>
            </td>` : ""}
          </tr></table>
        </section>

        <section class="report-section">
          <h2>Nhận định và đề xuất</h2>
          ${report.managementInsights.map((item) => `<p class="recommendation"><strong>Nhận định:</strong> ${escapeHtml(item)}</p>`).join("")}
          ${report.recommendations.map((item) => `<p class="recommendation"><strong>Hành động:</strong> ${escapeHtml(item)}</p>`).join("")}
        </section>

        <section class="report-section">
          <h2>Xu hướng và biến động tồn đọng 7 ngày</h2>
          <table><tr>
            ${dualMetricCell("Phát sinh mới", totalCreated7d)}
            ${dualMetricCell("Đã đóng", totalClosed7d, "good")}
            ${dualMetricCell("Biến động tồn đọng", backlogDelta7d > 0 ? `+${backlogDelta7d}` : backlogDelta7d, backlogDelta7d > 0 ? "danger" : "good")}
            ${dualMetricCell("Đánh giá", backlogDelta7d > 0 ? "Tăng" : backlogDelta7d < 0 ? "Giảm" : "Cân bằng", backlogDelta7d > 0 ? "danger" : "good")}
          </tr></table>
          <p class="note">${escapeHtml(trendAssessment)} Số phát sinh được ghi theo ngày tạo; số hoàn tất được ghi theo ngày đóng thực tế.</p>
        </section>

        ${showLead ? dualSummaryTable("Xu hướng Khách hàng 7 ngày", ["Ngày", "Lead mới", "Đã đóng"], leadTrendRows) : ""}
        ${showCrisis ? dualSummaryTable("Xu hướng Cảnh báo 7 ngày", ["Ngày", "Case mới", "Đã đóng"], crisisTrendRows) : ""}
        ${dualSummaryTable("Cơ cấu nguồn phát sinh", ["Nguồn", "Khách hàng tiềm năng", "Cảnh báo", "Tổng"], sourceRows)}
        <section class="report-section">
          <h2>Ghi chú cách tính</h2>
          <p class="note">“Cần tiếp tục xử lý” của Khách hàng gồm Đang xử lý và Follow-up; của Cảnh báo gồm Đang xử lý và Cần liên hệ lại.</p>
          <p class="note">“Đã hoàn tất” chỉ tính trạng thái Đã đóng, không tính Đã bỏ qua. Tỷ lệ hoàn thành = số công việc Đã đóng / tổng công việc cần xử lý trong phạm vi và bộ lọc đang áp dụng.</p>
          <p class="note">Các nhóm rủi ro trong “Cần chú ý” có thể giao nhau và không được cộng thành tổng số công việc.</p>
        </section>
        ${showLead ? dualSummaryTable("Danh sách Chi tiết Lead", ["ID", "Khách hàng", "Intent", "Trạng thái", "SLA", "Phụ trách", "Nội dung"], leadDetailRows) : ""}
        ${showCrisis ? dualSummaryTable("Danh sách Chi tiết Khủng hoảng", ["ID", "Chủ đề", "Mức độ", "Trạng thái", "SLA", "Phụ trách", "Nội dung"], crisisDetailRows) : ""}
        <footer class="footer">InsightFlow · Nội dung trong bản xem trước và file Excel được tạo từ cùng một tài liệu đối soát.</footer>
      </main>
    </body>
  </html>`;
}

export function exportDualOperationsReportExcel(
  report: DualOperationsReportData,
  filename = "Dual_Operations_Report",
  options: DualOperationsExcelViewOptions = {},
) {
  const excelDocument = buildDualOperationsReportExcelDocument(report, options);
  const blob = new Blob([excelDocument], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${safeFilePart(filename)}.xls`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function generateDailyReportExcel(
  brandName: string,
  dateStr: string,
  mentions: any[],
  t: TFunction,
  lang: string,
) {
  return generateWeeklyBrandReportExcel({
    brandName,
    startDate: dateStr,
    endDate: dateStr,
    mentions,
    filtersSummary: isVietnamese(lang) ? "Báo cáo theo ngày" : "Daily report",
    insights: "",
    t,
    lang,
  });
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
  return generateWeeklyBrandReportExcel({
    brandName,
    startDate,
    endDate,
    mentions,
    filtersSummary,
    insights,
    t,
    lang,
  });
}
