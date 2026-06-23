const fs = require('fs');

const viPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/locales/vi.json';
const enPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/locales/en.json';

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newVi = {
  'dashboard.title': 'Tổng quan',
  'dashboard.subtitle': 'Cập nhật hôm nay lúc 08:00 AM',
  'dashboard.exportBtn': 'Xuất báo cáo',
  'dashboard.stats.totalMentions': 'Tổng Lượt Nhắc',
  'dashboard.stats.reach': 'Lượt Tiếp Cận',
  'dashboard.stats.sentimentScore': 'Chỉ Số Tích Cực',
  'dashboard.stats.hotLeads': 'Hot Leads',
  'dashboard.filters.timeLabel': 'Thời gian:',
  'dashboard.filters.today': 'Hôm nay',
  'dashboard.filters.7days': '7 ngày qua',
  'dashboard.filters.30days': '30 ngày qua',
  'dashboard.filters.platformLabel': 'Nền tảng:',
  'dashboard.filters.allPlatforms': 'Tất cả nền tảng',
  'dashboard.filters.facebook': 'Facebook',
  'dashboard.filters.news': 'Báo chí',
  'dashboard.filters.tiktok': 'TikTok',
  'dashboard.filters.sentimentLabel': 'Sắc thái:',
  'dashboard.filters.allSentiments': 'Tất cả sắc thái',
  'dashboard.filters.positive': 'Tích cực',
  'dashboard.filters.neutral': 'Trung lập',
  'dashboard.filters.negative': 'Tiêu cực',
  'dashboard.topSources.title': 'Nguồn Thảo Luận Chính',
  'dashboard.topSources.mentions': 'lượt',
  'dashboard.topTopics.title': 'Chủ Đề Nổi Bật',
  'dashboard.sentimentTrend.title': 'Xu Hướng Sắc Thái',
  'dashboard.sentimentDonut.title': 'Tỷ Lệ Sắc Thái',
  'dashboard.sentimentDonut.positive': 'Tích cực',
  'dashboard.sentimentDonut.neutral': 'Trung lập',
  'dashboard.sentimentDonut.negative': 'Tiêu cực',
};

const newEn = {
  'dashboard.title': 'Overview',
  'dashboard.subtitle': 'Updated today at 08:00 AM',
  'dashboard.exportBtn': 'Export Report',
  'dashboard.stats.totalMentions': 'Total Mentions',
  'dashboard.stats.reach': 'Total Reach',
  'dashboard.stats.sentimentScore': 'Sentiment Score',
  'dashboard.stats.hotLeads': 'Hot Leads',
  'dashboard.filters.timeLabel': 'Time:',
  'dashboard.filters.today': 'Today',
  'dashboard.filters.7days': 'Last 7 days',
  'dashboard.filters.30days': 'Last 30 days',
  'dashboard.filters.platformLabel': 'Platform:',
  'dashboard.filters.allPlatforms': 'All Platforms',
  'dashboard.filters.facebook': 'Facebook',
  'dashboard.filters.news': 'News',
  'dashboard.filters.tiktok': 'TikTok',
  'dashboard.filters.sentimentLabel': 'Sentiment:',
  'dashboard.filters.allSentiments': 'All Sentiments',
  'dashboard.filters.positive': 'Positive',
  'dashboard.filters.neutral': 'Neutral',
  'dashboard.filters.negative': 'Negative',
  'dashboard.topSources.title': 'Top Sources',
  'dashboard.topSources.mentions': 'mentions',
  'dashboard.topTopics.title': 'Top Topics',
  'dashboard.sentimentTrend.title': 'Sentiment Trend',
  'dashboard.sentimentDonut.title': 'Sentiment Ratio',
  'dashboard.sentimentDonut.positive': 'Positive',
  'dashboard.sentimentDonut.neutral': 'Neutral',
  'dashboard.sentimentDonut.negative': 'Negative',
};

Object.assign(viData, newVi);
Object.assign(enData, newEn);

fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

function translateFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('useTranslation')) {
    const importMatch = content.match(/import.*?from.*?;/);
    if (importMatch) {
      content = content.replace(importMatch[0], importMatch[0] + '\nimport { useTranslation } from "react-i18next";');
    }
  }

  if (!content.includes('const { t } = useTranslation();')) {
    const funcMatch = content.match(/export (?:default )?function \w+\(.*?\)\s*\{/);
    if (funcMatch) {
      content = content.replace(funcMatch[0], funcMatch[0] + '\n  const { t } = useTranslation();');
    } else {
      const constMatch = content.match(/const \w+\s*=\s*\([^)]*\)\s*=>\s*\{/);
      if (constMatch) {
        content = content.replace(constMatch[0], constMatch[0] + '\n  const { t } = useTranslation();');
      }
    }
  }

  for (const rep of replacements) {
    content = content.replace(rep.search, rep.replace);
  }
  
  fs.writeFileSync(filePath, content);
}

const basePath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/components/dashboard';

// 1. Dashboard.tsx
translateFile(basePath + '/Dashboard.tsx', [
  { search: />Tổng quan</g, replace: '>{t("dashboard.title")}<' },
  { search: />Cập nhật hôm nay lúc 08:00 AM</g, replace: '>{t("dashboard.subtitle")}<' },
  { search: />Xuất báo cáo</g, replace: '>{t("dashboard.exportBtn")}<' },
  { search: /title="Tổng Lượt Nhắc"/g, replace: 'title={t("dashboard.stats.totalMentions")}' },
  { search: /title="Lượt Tiếp Cận"/g, replace: 'title={t("dashboard.stats.reach")}' },
  { search: /title="Chỉ Số Tích Cực"/g, replace: 'title={t("dashboard.stats.sentimentScore")}' },
  { search: /title="Hot Leads"/g, replace: 'title={t("dashboard.stats.hotLeads")}' },
]);

// 2. DashboardFilters.tsx
translateFile(basePath + '/DashboardFilters.tsx', [
  { search: />Thời gian:</g, replace: '>{t("dashboard.filters.timeLabel")}<' },
  { search: />Hôm nay</g, replace: '>{t("dashboard.filters.today")}<' },
  { search: />7 ngày qua</g, replace: '>{t("dashboard.filters.7days")}<' },
  { search: />30 ngày qua</g, replace: '>{t("dashboard.filters.30days")}<' },
  { search: />Nền tảng:</g, replace: '>{t("dashboard.filters.platformLabel")}<' },
  { search: />Tất cả nền tảng</g, replace: '>{t("dashboard.filters.allPlatforms")}<' },
  { search: />Facebook</g, replace: '>{t("dashboard.filters.facebook")}<' },
  { search: />Báo chí</g, replace: '>{t("dashboard.filters.news")}<' },
  { search: />TikTok</g, replace: '>{t("dashboard.filters.tiktok")}<' },
  { search: />Sắc thái:</g, replace: '>{t("dashboard.filters.sentimentLabel")}<' },
  { search: />Tất cả sắc thái</g, replace: '>{t("dashboard.filters.allSentiments")}<' },
  { search: />Tích cực</g, replace: '>{t("dashboard.filters.positive")}<' },
  { search: />Trung lập</g, replace: '>{t("dashboard.filters.neutral")}<' },
  { search: />Tiêu cực</g, replace: '>{t("dashboard.filters.negative")}<' },
]);

// 3. TopSources.tsx
translateFile(basePath + '/TopSources.tsx', [
  { search: />Nguồn Thảo Luận Chính</g, replace: '>{t("dashboard.topSources.title")}<' },
  { search: />\s*lượt\s*</g, replace: '>{t("dashboard.topSources.mentions")}<' },
]);

// 4. TopTopics.tsx
translateFile(basePath + '/TopTopics.tsx', [
  { search: />Chủ Đề Nổi Bật</g, replace: '>{t("dashboard.topTopics.title")}<' },
]);

// 5. SentimentTrend.tsx
translateFile(basePath + '/SentimentTrend.tsx', [
  { search: />Xu Hướng Sắc Thái</g, replace: '>{t("dashboard.sentimentTrend.title")}<' },
  { search: /name: "Tích cực"/g, replace: 'name: t("dashboard.filters.positive")' },
  { search: /name: "Tiêu cực"/g, replace: 'name: t("dashboard.filters.negative")' },
]);

// 6. SentimentDonut.tsx
translateFile(basePath + '/SentimentDonut.tsx', [
  { search: />Tỷ Lệ Sắc Thái</g, replace: '>{t("dashboard.sentimentDonut.title")}<' },
  { search: /name: "Tích cực"/g, replace: 'name: t("dashboard.sentimentDonut.positive")' },
  { search: /name: "Trung lập"/g, replace: 'name: t("dashboard.sentimentDonut.neutral")' },
  { search: /name: "Tiêu cực"/g, replace: 'name: t("dashboard.sentimentDonut.negative")' },
]);

console.log('Dashboard translated');
