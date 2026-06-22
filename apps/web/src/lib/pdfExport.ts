import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to convert array buffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export async function generateDailyReportPDF(brandName: string, dateStr: string, mentions: any[]) {
  try {
    if (mentions.length === 0) {
      alert("Không có dữ liệu mentions nào cho báo cáo này.");
      return;
    }

    // 1. Aggregate metrics
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    
    const topics: Record<string, number> = {};

    mentions.forEach(m => {
      const sent = (m.baseline_sentiment || m.sentiment || "").toLowerCase();
      if (sent.includes("pos")) positive++;
      else if (sent.includes("neg")) negative++;
      else neutral++;

      const topic = (m.baseline_topic || m.topic || "other").toLowerCase();
      topics[topic] = (topics[topic] || 0) + 1;
    });

    // Top topics
    const topTopics = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // 2. Load Custom Font for Vietnamese Support
    let fontLoaded = false;
    let fontBase64 = "";
    try {
      // Fetch the font from the public folder
      const response = await fetch("/fonts/Roboto-Regular.ttf");
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        fontBase64 = arrayBufferToBase64(buffer);
        fontLoaded = true;
      }
    } catch (e) {
      console.warn("Could not load custom font, falling back to default.", e);
    }

    // 3. Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Register font if loaded
    if (fontLoaded) {
      doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.setFont("Roboto");
    }
    
    doc.setFontSize(22);
    doc.setTextColor(40);
    const displayBrand = brandName === "all" ? "Tất Cả Nhãn Hàng" : brandName.charAt(0).toUpperCase() + brandName.slice(1);
    doc.text(`Daily Insights Report: ${displayBrand}`, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Date: ${dateStr}`, 14, 30);
    doc.text(`Total Mentions: ${mentions.length}`, 14, 36);
    
    // Sentiment Summary
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Sentiment Overview", 14, 50);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Positive: ${positive}`, 14, 58);
    doc.text(`Neutral:  ${neutral}`, 14, 64);
    doc.text(`Negative: ${negative}`, 14, 70);

    // Topics Summary
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Top Topics", 14, 85);
    
    let currentY = 93;
    topTopics.forEach(([t, count], index) => {
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`${index + 1}. ${t} (${count} mentions)`, 14, currentY);
      currentY += 6;
    });

    currentY += 10;

    // Detailed Table
    const tableData = mentions.slice(0, 50).map(m => [
      m.source || m.platform || "unknown",
      (m.content || m.text || "").substring(0, 80) + "...",
      (m.baseline_sentiment || m.sentiment || "neutral"),
      (m.baseline_topic || m.topic || "other")
    ]);

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Sample Mentions (Top 50)", 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Platform", "Content", "Sentiment", "Topic"]],
      body: tableData,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        font: fontLoaded ? "Roboto" : "helvetica" // Apply font to table cells
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        font: fontLoaded ? "Roboto" : "helvetica" 
      }
    });

    const safeDate = dateStr.replace(/\//g, "-").replace(/,/g, "").replace(/ /g, "_");
    const fileNameSafeBrand = displayBrand.replace(/ /g, "_");
    doc.save(`Report_${fileNameSafeBrand}_${safeDate}.pdf`);

  } catch (error) {
    console.error("Lỗi tạo PDF:", error);
    alert("Đã xảy ra lỗi khi tạo báo cáo PDF.");
  }
}
