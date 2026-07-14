import type { TFunction } from "i18next";
import type { LeadReportData } from "@/lib/lead-report";

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
          body { font-family: Arial, sans-serif; color: #172033; }
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
