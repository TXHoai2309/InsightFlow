const fs = require('fs');

function translateDashboard() {
  const filePath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/components/dashboard/Dashboard.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // Inject useTranslation import
  if (!content.includes('useTranslation')) {
    const importMatch = content.match(/import.*?from.*?;/);
    if (importMatch) {
      content = content.replace(importMatch[0], importMatch[0] + '\nimport { useTranslation } from "react-i18next";');
    }
  }

  // Find } = useDashboardStore(); and add hook below it
  const hookTarget = '} = useDashboardStore();';
  if (content.includes(hookTarget) && !content.includes('const { t } = useTranslation();')) {
    content = content.replace(
      hookTarget,
      hookTarget + '\n\n  const { t } = useTranslation();'
    );
  }

  // Replacements
  const replacements = [
    { search: />Tổng quan</g, replace: '>{t("dashboard.title")}<' },
    { search: />Cập nhật hôm nay lúc 08:00 AM</g, replace: '>{t("dashboard.subtitle")}<' },
    { search: />Xuất báo cáo</g, replace: '>{t("dashboard.exportBtn")}<' },
    { search: /title="Tổng Lượt Nhắc"/g, replace: 'title={t("dashboard.stats.totalMentions")}' },
    { search: /title="Lượt Tiếp Cận"/g, replace: 'title={t("dashboard.stats.reach")}' },
    { search: /title="Chỉ Số Tích Cực"/g, replace: 'title={t("dashboard.stats.sentimentScore")}' },
    { search: /title="Hot Leads"/g, replace: 'title={t("dashboard.stats.hotLeads")}' },
    { search: /title="Tổng lượt nhắc đến"/g, replace: 'title={t("dashboard.stats.totalMentions")}' },
    { search: /title="Chỉ số Net Sentiment"/g, replace: 'title={t("dashboard.stats.sentimentScore")}' },
    { search: /text: "Tích Cực"/g, replace: 'text: t("dashboard.filters.positive")' },
    { search: /text: "Tiêu Cực"/g, replace: 'text: t("dashboard.filters.negative")' },
    { search: /text: "Ổn định"/g, replace: 'text: t("dashboard.filters.neutral")' }
  ];

  for (const rep of replacements) {
    content = content.replace(rep.search, rep.replace);
  }
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed Dashboard');
}

translateDashboard();
