import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PLATFORM_META } from "@/lib/services/dashboard";
import { TFunction } from "i18next";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function formatPlatformLabel(source: string): string {
  const key = source.toLowerCase() as keyof typeof PLATFORM_META;
  return PLATFORM_META[key]?.label || source;
}

function formatContentTypeLabel(type: unknown, t: TFunction): string {
  const normalized = String(type || "post").toLowerCase();
  if (normalized === "comment") return t("reports.contentType.comment");
  if (normalized === "reply") return t("reports.contentType.reply");
  return t("reports.contentType.post");
}

function formatSentimentLabel(sentiment: unknown, t: TFunction): string {
  const s = String(sentiment || "neutral").toLowerCase();
  if (s.includes("pos")) return t("reports.sentiment.positive");
  if (s.includes("neg")) return t("reports.sentiment.negative");
  return t("reports.sentiment.neutral");
}

function formatPostedAt(value: unknown, lang: string): string {
  if (!value) return "N/A";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString(lang, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildMentionRows(mentions: any[], t: TFunction, lang: string) {
  return mentions.slice(0, 50).map((m) => [
    formatPlatformLabel(m.source || m.platform || "unknown"),
    String(m.content || m.text || "").substring(0, 100),
    formatContentTypeLabel(m.content_type, t),
    formatSentimentLabel(m.baseline_sentiment || m.sentiment, t),
    t(`reports.topics.${(m.baseline_topic || m.topic || "other").toLowerCase()}`),
    formatPostedAt(m.posted_at, lang),
  ]);
}

const getMentionTableHead = (t: TFunction) => [
  [t("reports.table.platform"), t("reports.table.content"), t("reports.table.type"), t("reports.table.sentiment"), t("reports.table.topic"), t("reports.table.time")],
];

export async function generateDailyReportPDF(brandName: string, dateStr: string, mentions: any[], t: TFunction, lang: string) {
  try {
    if (mentions.length === 0) {
      alert(t("reports.errorNoData"));
      return;
    }

    let positive = 0;
    let negative = 0;
    let neutral = 0;
    const topics: Record<string, number> = {};

    mentions.forEach((m) => {
      const sent = (m.baseline_sentiment || m.sentiment || "").toLowerCase();
      if (sent.includes("pos")) positive++;
      else if (sent.includes("neg")) negative++;
      else neutral++;

      const topic = (m.baseline_topic || m.topic || "other").toLowerCase();
      topics[topic] = (topics[topic] || 0) + 1;
    });

    const topTopics = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    let fontLoaded = false;
    let fontBase64 = "";
    try {
      const response = await fetch("/fonts/NotoSans-Regular.ttf");
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        fontBase64 = arrayBufferToBase64(buffer);
        fontLoaded = true;
      }
    } catch (e) {
      console.warn("Could not load custom font, falling back to default.", e);
    }

    const doc = new jsPDF();

    if (fontLoaded) {
      doc.addFileToVFS("NotoSans-Regular.ttf", fontBase64);
      doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
      doc.setFont("NotoSans");
    }

    doc.setFontSize(22);
    doc.setTextColor(40);
    const displayBrand = brandName === "all" ? t("reports.allBrands") : brandName.charAt(0).toUpperCase() + brandName.slice(1);
    doc.text(`${t("reports.dailyTitle")}: ${displayBrand}`, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t("reports.date")}: ${dateStr}`, 14, 30);
    doc.text(`${t("reports.totalMentions")}: ${mentions.length}`, 14, 36);

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(t("reports.sentimentOverview"), 14, 50);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t("reports.sentiment.positive")}: ${positive}`, 14, 58);
    doc.text(`${t("reports.sentiment.neutral")}:  ${neutral}`, 14, 64);
    doc.text(`${t("reports.sentiment.negative")}: ${negative}`, 14, 70);

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(t("reports.topTopics"), 14, 85);

    let currentY = 93;
    topTopics.forEach(([topicName, count], index) => {
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`${index + 1}. ${topicName} (${count} ${t("reports.mentionsCount")})`, 14, currentY);
      currentY += 6;
    });

    currentY += 10;

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(t("reports.sampleMentions"), 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: getMentionTableHead(t),
      body: buildMentionRows(mentions, t, lang),
      theme: "grid",
      styles: {
        fontSize: 8,
        font: fontLoaded ? "NotoSans" : "helvetica",
        fontStyle: "normal", // ← thêm dòng này
      },
      headStyles: {
        fillColor: [41, 128, 185],
        font: fontLoaded ? "NotoSans" : "helvetica",
        fontStyle: "normal", // ← thêm dòng này — quan trọng nhất
        textColor: [255, 255, 255],
      },
      bodyStyles: {
        font: fontLoaded ? "NotoSans" : "helvetica",
        fontStyle: "normal", // ← thêm dòng này
      },
    });

    const safeDate = dateStr.replace(/\//g, "-").replace(/,/g, "").replace(/ /g, "_");
    const fileNameSafeBrand = displayBrand.replace(/ /g, "_");
    doc.save(`${t("reports.filenameDaily")}_${fileNameSafeBrand}_${safeDate}.pdf`);
  } catch (error) {
    console.error("Lỗi tạo PDF:", error);
    alert(t("reports.errorGenerate"));
  }
}

export async function generateCustomReportPDF(
  brandName: string,
  startDate: string,
  endDate: string,
  mentions: any[],
  aiInsights: string,
  filtersSummary: string,
  t: TFunction,
  lang: string
) {
  try {
    if (mentions.length === 0) {
      alert(t("reports.errorNoData"));
      return;
    }

    let positive = 0;
    let negative = 0;
    let neutral = 0;
    const topics: Record<string, number> = {};

    mentions.forEach((m) => {
      const sent = (m.baseline_sentiment || m.sentiment || "").toLowerCase();
      if (sent.includes("pos")) positive++;
      else if (sent.includes("neg")) negative++;
      else neutral++;

      const topic = (m.baseline_topic || m.topic || "other").toLowerCase();
      topics[topic] = (topics[topic] || 0) + 1;
    });

    const topTopics = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    let fontLoaded = false;
    let fontBase64 = "";
    try {
      const response = await fetch("/fonts/Roboto-Regular.ttf");
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        fontBase64 = arrayBufferToBase64(buffer);
        fontLoaded = true;
      }
    } catch (e) {
      console.warn("Could not load custom font, falling back to default.", e);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    if (fontLoaded) {
      doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.setFont("Roboto");
    } else {
      console.warn("Font Roboto chưa được load, tiêu đề có thể bị lỗi font.");
    }

    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    const displayBrand = brandName === "all" ? t("reports.allBrands") : brandName.charAt(0).toUpperCase() + brandName.slice(1);
    doc.text(t("reports.title"), 14, 22);

    doc.setFontSize(14);
    doc.setTextColor(80);
    doc.text(`${t("reports.brand")}: ${displayBrand}`, 14, 30);

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`${t("reports.time")}: ${t("reports.from")} ${startDate} ${t("reports.to")} ${endDate}`, 14, 38);
    doc.text(`${t("reports.filters")}: ${filtersSummary}`, 14, 44);
    doc.text(`${t("reports.totalMentions")}: ${mentions.length}`, 14, 50);

    doc.setDrawColor(220);
    doc.line(14, 55, pageWidth - 14, 55);

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(t("reports.sentimentOverview"), 14, 65);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`${t("reports.sentiment.positive")}: ${positive} (${Math.round((positive / mentions.length) * 100)}%)`, 14, 73);
    doc.text(`${t("reports.sentiment.neutral")}: ${neutral} (${Math.round((neutral / mentions.length) * 100)}%)`, 14, 79);
    doc.text(`${t("reports.sentiment.negative")}: ${negative} (${Math.round((negative / mentions.length) * 100)}%)`, 14, 85);

    doc.text(t("reports.topTopics"), 100, 73);
    let topicY = 79;
    topTopics.forEach(([topicName, count]) => {
      doc.text(`- ${topicName.toUpperCase()}: ${count} ${t("reports.mentionsCount")} (${Math.round((count / mentions.length) * 100)}%)`, 100, topicY);
      topicY += 6;
    });

    doc.line(14, 110, pageWidth - 14, 110);

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(t("reports.aiInsights"), 14, 120);

    doc.setFontSize(9.5);
    doc.setTextColor(60);
    const splitInsights = doc.splitTextToSize(aiInsights, pageWidth - 28);
    doc.text(splitInsights, 14, 128);

    const textHeight = splitInsights.length * 5;
    let currentY = 128 + textHeight + 12;

    if (currentY > 230) {
      doc.addPage();
      if (fontLoaded) {
        doc.setFont("Roboto");
      }
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(t("reports.sampleMentions"), 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: getMentionTableHead(t),
      body: buildMentionRows(mentions, t, lang),
      theme: "grid",
      styles: {
        fontSize: 8,
        font: fontLoaded ? "NotoSans" : "helvetica",
        fontStyle: "normal", // ← thêm dòng này
      },
      headStyles: {
        fillColor: [41, 128, 185],
        font: fontLoaded ? "NotoSans" : "helvetica",
        fontStyle: "normal", // ← thêm dòng này — quan trọng nhất
        textColor: [255, 255, 255],
      },
      bodyStyles: {
        font: fontLoaded ? "NotoSans" : "helvetica",
        fontStyle: "normal", // ← thêm dòng này
      },
    });

    const safeStart = startDate.replace(/\//g, "-");
    const safeEnd = endDate.replace(/\//g, "-");
    const fileNameSafeBrand = displayBrand.replace(/ /g, "_");
    doc.save(`${t("reports.filename")}_${fileNameSafeBrand}_${safeStart}_to_${safeEnd}.pdf`);
  } catch (error) {
    console.error("Lỗi tạo PDF tùy chỉnh:", error);
    alert(t("reports.errorGenerate"));
  }
}
