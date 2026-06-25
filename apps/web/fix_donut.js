const fs = require('fs');

function translateDonut() {
  const filePath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/components/dashboard/SentimentDonut.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('useTranslation')) {
    const importMatch = content.match(/import.*?from.*?;/);
    if (importMatch) {
      content = content.replace(importMatch[0], importMatch[0] + '\nimport { useTranslation } from "react-i18next";');
    }
  }

  const hookTarget = 'const canvasRef = useRef<HTMLCanvasElement>(null);';
  if (content.includes(hookTarget) && !content.includes('const { t } = useTranslation();')) {
    content = content.replace(
      hookTarget,
      'const { t } = useTranslation();\n  ' + hookTarget
    );
  }

  const replacements = [
    { search: />Tỷ Lệ Sắc Thái</g, replace: '>{t("dashboard.sentimentDonut.title")}<' },
    { search: />Cơ cấu cảm xúc</g, replace: '>{t("dashboard.sentimentDonut.title")}<' },
    { search: /"Tích cực"/g, replace: 't("dashboard.sentimentDonut.positive")' },
    { search: /"Trung lập"/g, replace: 't("dashboard.sentimentDonut.neutral")' },
    { search: /"Tiêu cực"/g, replace: 't("dashboard.sentimentDonut.negative")' },
    { search: />Tích cực \(/g, replace: '>{t("dashboard.sentimentDonut.positive")} (' },
    { search: />Trung lập \(/g, replace: '>{t("dashboard.sentimentDonut.neutral")} (' },
    { search: />Tiêu cực \(/g, replace: '>{t("dashboard.sentimentDonut.negative")} (' }
  ];

  for (const rep of replacements) {
    content = content.replace(rep.search, rep.replace);
  }
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed Donut');
}

translateDonut();
