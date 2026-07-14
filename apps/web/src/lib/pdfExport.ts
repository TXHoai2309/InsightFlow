import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TFunction } from "i18next";

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  google_maps: "Google Maps",
  befood: "BeFood",
  be: "BeFood",
  threads: "Threads",
  thread: "Threads",
  news: "News",
  news_html: "News",
  unknown: "Unknown",
};

function isVi(lang: string) {
  return lang.toLowerCase().startsWith("vi");
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

async function loadPdfFont(doc: jsPDF) {
  try {
    const response = await fetch("/fonts/NotoSans-Regular.ttf");
    if (!response.ok) return false;
    const buffer = await response.arrayBuffer();
    doc.addFileToVFS("NotoSans-Regular.ttf", arrayBufferToBase64(buffer));
    doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
    doc.setFont("NotoSans");
    return true;
  } catch {
    return false;
  }
}

function setPdfFont(doc: jsPDF, fontLoaded: boolean) {
  doc.setFont(fontLoaded ? "NotoSans" : "helvetica", "normal");
}

function safeFilePart(value: unknown) {
  return String(value || "report")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function formatPlatformLabel(source: unknown): string {
  const raw = String(source || "unknown");
  const key = raw.toLowerCase();
  return PLATFORM_LABELS[key] || raw;
}

function formatPostedAt(value: unknown, lang: string): string {
  if (!value) return "N/A";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString(isVi(lang) ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

function topEntries(record: Record<string, number>, limit = 5) {
  return Object.entries(record).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function getEngagement(mention: any) {
  return Number(mention.reach || 0) + Number(mention.likes || 0) + Number(mention.comments || 0) + Number(mention.shares || 0);
}

function formatContentTypeLabel(type: unknown, t: TFunction) {
  const normalized = String(type || "post").toLowerCase();
  if (normalized === "comment") return t("reports.contentType.comment", { defaultValue: "Bình luận" });
  if (normalized === "reply") return t("reports.contentType.reply", { defaultValue: "Phản hồi" });
  return t("reports.contentType.post", { defaultValue: "Bài viết" });
}

function formatSentimentLabel(sentiment: unknown, t: TFunction) {
  const key = getSentimentKey(sentiment);
  const defaults: Record<string, string> = {
    positive: "Tích cực",
    neutral: "Trung lập",
    negative: "Tiêu cực",
  };
  return t(`reports.sentiment.${key}`, { defaultValue: defaults[key] });
}

function formatTopicLabel(topic: unknown, t: TFunction) {
  const key = String(topic || "other").toLowerCase();
  const defaults: Record<string, string> = {
    competitor: "Đối thủ",
    delivery: "Giao hàng",
    experience: "Trải nghiệm",
    legal: "Pháp lý",
    marketing: "Marketing",
    operation: "Vận hành",
    other: "Khác",
    price: "Giá cả",
    quality: "Sản phẩm",
    service: "Dịch vụ khách hàng",
    staff: "Nhân viên",
  };
  return t(`reports.topics.${key}`, { defaultValue: defaults[key] || key });
}

function ensurePageSpace(doc: jsPDF, y: number, needed: number, fontLoaded: boolean) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - 18) return y;
  doc.addPage();
  setPdfFont(doc, fontLoaded);
  return 18;
}

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, width: number, lineHeight = 5.2) {
  const lines = doc.splitTextToSize(text || "", width);
  doc.text(lines, x, y);
  return y + Math.max(1, lines.length) * lineHeight;
}

function addBullets(doc: jsPDF, bullets: string[], x: number, y: number, width: number, fontLoaded: boolean) {
  let currentY = y;
  bullets.forEach((item) => {
    currentY = ensurePageSpace(doc, currentY, 12, fontLoaded);
    const lines = doc.splitTextToSize(item, width - 6);
    doc.text("-", x, currentY);
    doc.text(lines, x + 5, currentY);
    currentY += Math.max(6, lines.length * 5.2);
  });
  return currentY;
}

function sectionTitle(doc: jsPDF, title: string, margin: number, y: number, fontLoaded: boolean) {
  y = ensurePageSpace(doc, y, 14, fontLoaded);
  setPdfFont(doc, fontLoaded);
  doc.setFontSize(14);
  doc.setTextColor(36, 37, 46);
  doc.text(title, margin, y);
  return y + 7;
}

function buildWeeklyInsightBullets(brandName: string, mentions: any[], lang: string) {
  const vi = isVi(lang);
  const stats = getSentimentStats(mentions);
  const topicCounts = countBy(mentions, (item) => String(item.topic || "other").toLowerCase());
  const negativeTopics = countBy(
    mentions.filter((item) => getSentimentKey(item.sentiment) === "negative"),
    (item) => String(item.topic || "other").toLowerCase(),
  );
  const positiveTopics = countBy(
    mentions.filter((item) => getSentimentKey(item.sentiment) === "positive"),
    (item) => String(item.topic || "other").toLowerCase(),
  );
  const mainTopic = topEntries(topicCounts, 1)[0]?.[0] || "other";
  const riskTopic = topEntries(negativeTopics, 1)[0]?.[0] || mainTopic;
  const opportunityTopic = topEntries(positiveTopics, 1)[0]?.[0] || mainTopic;
  const displayBrand = brandName === "all" ? (vi ? "tất cả thương hiệu" : "all brands") : brandName;

  if (!vi) {
    return {
      summary: [
        `${displayBrand} recorded ${mentions.length} mentions with Net Sentiment ${stats.netSentiment >= 0 ? "+" : ""}${stats.netSentiment}%.`,
        `The main conversation driver is ${mainTopic}, while the most visible risk topic is ${riskTopic}.`,
        `The clearest marketing opportunity is to amplify positive feedback around ${opportunityTopic}.`,
      ],
      actions: [
        `Prioritize response on high-engagement negative mentions about ${riskTopic}.`,
        `Turn positive ${opportunityTopic} comments into short campaign proof points.`,
        "Review source/channel performance before assigning the next response queue.",
      ],
    };
  }

  return {
    summary: [
      `${displayBrand} ghi nhận ${mentions.length} đề cập trong kỳ, Net Sentiment ${stats.netSentiment >= 0 ? "+" : ""}${stats.netSentiment}%.`,
      `Chủ đề chi phối thảo luận là ${mainTopic}; điểm rủi ro cần theo sát nhất là ${riskTopic}.`,
      `Cơ hội truyền thông rõ nhất là khuếch đại các phản hồi tích cực quanh ${opportunityTopic}.`,
    ],
    actions: [
      `Ưu tiên phản hồi các mention tiêu cực có tương tác cao về ${riskTopic}.`,
      `Biến các lời khen về ${opportunityTopic} thành thông điệp/creative cho chiến dịch tuần tới.`,
      "Rà soát nguồn/kênh có tỷ lệ tiêu cực cao trước khi phân công đội xử lý.",
    ],
  };
}

function buildMentionRows(mentions: any[], t: TFunction, lang: string) {
  return mentions.slice(0, 50).map((m) => [
    formatPlatformLabel(m.source || m.platform || "unknown"),
    String(m.content || m.text || "").slice(0, 120),
    formatContentTypeLabel(m.content_type, t),
    formatSentimentLabel(m.sentiment, t),
    formatTopicLabel(m.topic, t),
    formatPostedAt(m.posted_at || m.created_at, lang),
  ]);
}

function getMentionTableHead(t: TFunction) {
  return [[
    t("reports.table.platform", { defaultValue: "Nguồn" }),
    t("reports.table.content", { defaultValue: "Nội dung" }),
    t("reports.table.type", { defaultValue: "Loại" }),
    t("reports.table.sentiment", { defaultValue: "Sắc thái" }),
    t("reports.table.topic", { defaultValue: "Chủ đề" }),
    t("reports.table.time", { defaultValue: "Thời gian" }),
  ]];
}

export async function generateWeeklyBrandReportPDF({
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
  try {
    if (mentions.length === 0) {
      alert(t("reports.errorNoData"));
      return;
    }

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const fontLoaded = await loadPdfFont(doc);
    setPdfFont(doc, fontLoaded);

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const tableFont = fontLoaded ? "NotoSans" : "helvetica";
    const stats = getSentimentStats(mentions);
    const sourceCounts = topEntries(countBy(mentions, (item) => String(item.source || "unknown")), 6);
    const topicCounts = topEntries(countBy(mentions, (item) => formatTopicLabel(item.topic, t)), 6);
    const negativeMentions = mentions
      .filter((item) => getSentimentKey(item.sentiment) === "negative")
      .sort((a, b) => getEngagement(b) - getEngagement(a));
    const positiveMentions = mentions
      .filter((item) => getSentimentKey(item.sentiment) === "positive")
      .sort((a, b) => getEngagement(b) - getEngagement(a));
    const { summary, actions } = buildWeeklyInsightBullets(brandName, mentions, lang);
    const displayBrand = brandName === "all" ? t("reports.allBrands", { defaultValue: isVi(lang) ? "Tất cả thương hiệu" : "All brands" }) : brandName;
    const title = isVi(lang) ? "Báo cáo quản trị thương hiệu" : "Brand Management Report";

    doc.setFontSize(20);
    doc.setTextColor(36, 37, 46);
    doc.text(title, margin, 20);
    doc.setFontSize(11);
    doc.setTextColor(90, 94, 110);
    doc.text(`${displayBrand} | ${startDate} - ${endDate}`, margin, 28);
    let y = addWrappedText(doc, filtersSummary, margin, 35, contentWidth, 5) + 4;

    autoTable(doc, {
      startY: y,
      head: [[
        isVi(lang) ? "Sức khỏe thương hiệu" : "Brand Health",
        "Net Sentiment",
        t("reports.sentiment.positive", { defaultValue: "Tích cực" }),
        t("reports.sentiment.neutral", { defaultValue: "Trung lập" }),
        t("reports.sentiment.negative", { defaultValue: "Tiêu cực" }),
      ]],
      body: [[
        `${stats.brandHealth}/100`,
        `${stats.netSentiment >= 0 ? "+" : ""}${stats.netSentiment}%`,
        `${stats.positive}`,
        `${stats.neutral}`,
        `${stats.negative}`,
      ]],
      theme: "grid",
      styles: { font: tableFont, fontSize: 10, halign: "center", cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [70, 72, 212], textColor: [255, 255, 255], font: tableFont, fontStyle: "normal" },
      didDrawPage: () => setPdfFont(doc, fontLoaded),
    });

    y = ((doc as any).lastAutoTable?.finalY || y + 20) + 10;
    y = sectionTitle(doc, isVi(lang) ? "Tóm tắt điều hành" : "Executive Summary", margin, y, fontLoaded);
    doc.setFontSize(10);
    doc.setTextColor(70, 74, 90);
    y = addBullets(doc, summary, margin, y, contentWidth, fontLoaded) + 4;

    y = sectionTitle(doc, isVi(lang) ? "Chủ đề và kênh nổi bật" : "Topic And Channel Signals", margin, y, fontLoaded);
    autoTable(doc, {
      startY: y,
      head: [[isVi(lang) ? "Chủ đề nổi bật" : "Top topics", "Mentions", isVi(lang) ? "Nguồn nổi bật" : "Top sources", "Mentions"]],
      body: Array.from({ length: Math.max(topicCounts.length, sourceCounts.length, 1) }).map((_, index) => [
        topicCounts[index]?.[0] || "",
        topicCounts[index]?.[1] || "",
        sourceCounts[index] ? formatPlatformLabel(sourceCounts[index][0]) : "",
        sourceCounts[index]?.[1] || "",
      ]),
      theme: "striped",
      styles: { font: tableFont, fontSize: 9, cellPadding: 2.5, overflow: "linebreak" },
      headStyles: { fillColor: [238, 239, 255], textColor: [44, 45, 90], font: tableFont, fontStyle: "normal" },
      didDrawPage: () => setPdfFont(doc, fontLoaded),
    });

    y = ((doc as any).lastAutoTable?.finalY || y + 45) + 10;
    y = sectionTitle(doc, isVi(lang) ? "Rủi ro cần ưu tiên" : "Risks To Prioritize", margin, y, fontLoaded);
    autoTable(doc, {
      startY: y,
      head: [[
        t("reports.table.platform", { defaultValue: "Nguồn" }),
        t("reports.table.topic", { defaultValue: "Chủ đề" }),
        isVi(lang) ? "Tương tác" : "Engagement",
        t("reports.table.content", { defaultValue: "Nội dung" }),
      ]],
      body: negativeMentions.length
        ? negativeMentions.slice(0, 6).map((item) => [
            formatPlatformLabel(item.source),
            formatTopicLabel(item.topic, t),
            getEngagement(item),
            String(item.content || "").slice(0, 150),
          ])
        : [["", "", "", isVi(lang) ? "Chưa ghi nhận mention tiêu cực trong kỳ này." : "No negative mentions were found in this period."]],
      theme: "grid",
      styles: { font: tableFont, fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [220, 53, 69], textColor: [255, 255, 255], font: tableFont, fontStyle: "normal" },
      columnStyles: { 3: { cellWidth: 92 } },
      didDrawPage: () => setPdfFont(doc, fontLoaded),
    });

    y = ((doc as any).lastAutoTable?.finalY || y + 45) + 10;
    y = sectionTitle(doc, isVi(lang) ? "Cơ hội marketing" : "Marketing Opportunities", margin, y, fontLoaded);
    autoTable(doc, {
      startY: y,
      head: [[
        t("reports.table.platform", { defaultValue: "Nguồn" }),
        t("reports.table.topic", { defaultValue: "Chủ đề" }),
        isVi(lang) ? "Tương tác" : "Engagement",
        t("reports.table.content", { defaultValue: "Nội dung" }),
      ]],
      body: positiveMentions.length
        ? positiveMentions.slice(0, 6).map((item) => [
            formatPlatformLabel(item.source),
            formatTopicLabel(item.topic, t),
            getEngagement(item),
            String(item.content || "").slice(0, 150),
          ])
        : [["", "", "", isVi(lang) ? "Chưa ghi nhận mention tích cực trong kỳ này." : "No positive mentions were found in this period."]],
      theme: "grid",
      styles: { font: tableFont, fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [34, 139, 90], textColor: [255, 255, 255], font: tableFont, fontStyle: "normal" },
      columnStyles: { 3: { cellWidth: 92 } },
      didDrawPage: () => setPdfFont(doc, fontLoaded),
    });

    y = ((doc as any).lastAutoTable?.finalY || y + 45) + 10;
    y = sectionTitle(doc, isVi(lang) ? "Kế hoạch hành động đề xuất" : "Recommended Action Plan", margin, y, fontLoaded);
    doc.setFontSize(10);
    doc.setTextColor(70, 74, 90);
    y = addBullets(doc, actions, margin, y, contentWidth, fontLoaded) + 4;

    y = sectionTitle(doc, isVi(lang) ? "Nhận định phân tích" : "Analyst Notes", margin, y, fontLoaded);
    doc.setFontSize(9.5);
    doc.setTextColor(70, 74, 90);
    y = addWrappedText(doc, insights || summary.join(" "), margin, y, contentWidth, 5) + 8;

    y = ensurePageSpace(doc, y, 50, fontLoaded);
    y = sectionTitle(doc, isVi(lang) ? "Dữ liệu mention tiêu biểu" : "Representative Mentions", margin, y, fontLoaded);
    autoTable(doc, {
      startY: y,
      head: getMentionTableHead(t),
      body: buildMentionRows(mentions, t, lang).slice(0, 25),
      theme: "grid",
      styles: { fontSize: 7.5, font: tableFont, fontStyle: "normal", cellPadding: 1.8, overflow: "linebreak" },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], font: tableFont, fontStyle: "normal" },
      columnStyles: { 1: { cellWidth: 70 } },
      didDrawPage: () => setPdfFont(doc, fontLoaded),
    });

    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page);
      setPdfFont(doc, fontLoaded);
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(`InsightFlow - ${page}/${pageCount}`, margin, 290);
    }

    const filename = `Brand_Management_Report_${safeFilePart(displayBrand)}_${safeFilePart(startDate)}_to_${safeFilePart(endDate)}.pdf`;
    const blob = doc.output("blob");
    if (download) doc.save(filename);
    return { blob, filename };
  } catch (error) {
    console.error("Error generating PDF report:", error);
    alert(t("reports.errorGenerate"));
  }
}

export async function generateDailyReportPDF(brandName: string, dateStr: string, mentions: any[], t: TFunction, lang: string) {
  return generateWeeklyBrandReportPDF({
    brandName,
    startDate: dateStr,
    endDate: dateStr,
    mentions,
    filtersSummary: isVi(lang) ? "Báo cáo theo ngày" : "Daily report",
    insights: "",
    t,
    lang,
  });
}

export async function generateCustomReportPDF(
  brandName: string,
  startDate: string,
  endDate: string,
  mentions: any[],
  aiInsights: string,
  filtersSummary: string,
  t: TFunction,
  lang: string,
) {
  return generateWeeklyBrandReportPDF({
    brandName,
    startDate,
    endDate,
    mentions,
    filtersSummary,
    insights: aiInsights,
    t,
    lang,
  });
}
