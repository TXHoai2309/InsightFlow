const fs = require('fs');

const viPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/locales/vi.json';
const enPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/locales/en.json';

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newVi = {
  'reports.overview.totalMentions': 'Tổng Lượt Nhắc',
  'reports.overview.positive': 'Tích Cực',
  'reports.overview.negative': 'Tiêu Cực',
  'reports.overview.reach': 'Độ Tiếp Cận (Reach)',
  'reports.sentimentChart.title': 'Diễn biến Sắc thái theo Thời gian',
  'reports.sentimentChart.positive': 'Tích cực',
  'reports.sentimentChart.neutral': 'Trung lập',
  'reports.sentimentChart.negative': 'Tiêu cực',
  'reports.topTopics.title': 'Top Chủ đề Nổi bật',
  'mentions.stats.total': 'Tổng Lượt Nhắc',
  'mentions.stats.positive': 'Tích Cực',
  'mentions.stats.neutral': 'Trung Lập',
  'mentions.stats.negative': 'Tiêu Cực',
  'mentions.filters.searchPlaceholder': 'Tìm kiếm từ khóa, bài viết...',
  'mentions.filters.allPlatforms': 'Tất cả Nền tảng',
  'mentions.filters.facebook': 'Facebook',
  'mentions.filters.news': 'News',
  'mentions.filters.tiktok': 'TikTok',
  'mentions.filters.allSentiments': 'Tất cả Sắc thái',
  'mentions.filters.positive': 'Tích cực',
  'mentions.filters.neutral': 'Trung lập',
  'mentions.filters.negative': 'Tiêu cực',
  'mentions.table.content': 'Nội dung Bài viết',
  'mentions.table.platform': 'Nền tảng',
  'mentions.table.sentiment': 'Sắc thái',
  'mentions.table.author': 'Tác giả',
  'mentions.table.time': 'Thời gian',
  'mentions.table.actions': 'Hành động',
  'mentions.table.tags.positive': 'Tích cực',
  'mentions.table.tags.neutral': 'Trung lập',
  'mentions.table.tags.negative': 'Tiêu cực'
};

const newEn = {
  'reports.overview.totalMentions': 'Total Mentions',
  'reports.overview.positive': 'Positive',
  'reports.overview.negative': 'Negative',
  'reports.overview.reach': 'Reach',
  'reports.sentimentChart.title': 'Sentiment Over Time',
  'reports.sentimentChart.positive': 'Positive',
  'reports.sentimentChart.neutral': 'Neutral',
  'reports.sentimentChart.negative': 'Negative',
  'reports.topTopics.title': 'Top Topics',
  'mentions.stats.total': 'Total Mentions',
  'mentions.stats.positive': 'Positive',
  'mentions.stats.neutral': 'Neutral',
  'mentions.stats.negative': 'Negative',
  'mentions.filters.searchPlaceholder': 'Search keywords, posts...',
  'mentions.filters.allPlatforms': 'All Platforms',
  'mentions.filters.facebook': 'Facebook',
  'mentions.filters.news': 'News',
  'mentions.filters.tiktok': 'TikTok',
  'mentions.filters.allSentiments': 'All Sentiments',
  'mentions.filters.positive': 'Positive',
  'mentions.filters.neutral': 'Neutral',
  'mentions.filters.negative': 'Negative',
  'mentions.table.content': 'Content',
  'mentions.table.platform': 'Platform',
  'mentions.table.sentiment': 'Sentiment',
  'mentions.table.author': 'Author',
  'mentions.table.time': 'Time',
  'mentions.table.actions': 'Actions',
  'mentions.table.tags.positive': 'Positive',
  'mentions.table.tags.neutral': 'Neutral',
  'mentions.table.tags.negative': 'Negative'
};

Object.assign(viData, newVi);
Object.assign(enData, newEn);

fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

function translateFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    console.log('Skipping: ' + filePath);
    return;
  }
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

const reportsPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/components/reports';
const mentionsPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/components/mentions';

// 1. OverviewCards.tsx
translateFile(reportsPath + '/OverviewCards.tsx', [
  { search: /title="Tổng Lượt Nhắc"/g, replace: 'title={t("reports.overview.totalMentions")}' },
  { search: /title="Tích Cực"/g, replace: 'title={t("reports.overview.positive")}' },
  { search: /title="Tiêu Cực"/g, replace: 'title={t("reports.overview.negative")}' },
  { search: /title="Độ Tiếp Cận \(Reach\)"/g, replace: 'title={t("reports.overview.reach")}' },
]);

// 2. SentimentChart.tsx
translateFile(reportsPath + '/SentimentChart.tsx', [
  { search: />Diễn biến Sắc thái theo Thời gian</g, replace: '>{t("reports.sentimentChart.title")}<' },
  { search: /name: "Tích cực"/g, replace: 'name: t("reports.sentimentChart.positive")' },
  { search: /name: "Trung lập"/g, replace: 'name: t("reports.sentimentChart.neutral")' },
  { search: /name: "Tiêu cực"/g, replace: 'name: t("reports.sentimentChart.negative")' },
]);

// 3. TopTopicsList.tsx
translateFile(reportsPath + '/TopTopicsList.tsx', [
  { search: />Top Chủ đề Nổi bật</g, replace: '>{t("reports.topTopics.title")}<' },
]);

// 4. MentionStats.tsx
translateFile(mentionsPath + '/MentionStats.tsx', [
  { search: />Tổng Lượt Nhắc</g, replace: '>{t("mentions.stats.total")}<' },
  { search: />Tích Cực</g, replace: '>{t("mentions.stats.positive")}<' },
  { search: />Trung Lập</g, replace: '>{t("mentions.stats.neutral")}<' },
  { search: />Tiêu Cực</g, replace: '>{t("mentions.stats.negative")}<' },
]);

// 5. MentionFilters.tsx
translateFile(mentionsPath + '/MentionFilters.tsx', [
  { search: /placeholder="Tìm kiếm từ khóa, bài viết\.\.\."/g, replace: 'placeholder={t("mentions.filters.searchPlaceholder")}' },
  { search: />Tất cả Nền tảng</g, replace: '>{t("mentions.filters.allPlatforms")}<' },
  { search: />Facebook</g, replace: '>{t("mentions.filters.facebook")}<' },
  { search: />News</g, replace: '>{t("mentions.filters.news")}<' },
  { search: />TikTok</g, replace: '>{t("mentions.filters.tiktok")}<' },
  { search: />Tất cả Sắc thái</g, replace: '>{t("mentions.filters.allSentiments")}<' },
  { search: />Tích cực</g, replace: '>{t("mentions.filters.positive")}<' },
  { search: />Trung lập</g, replace: '>{t("mentions.filters.neutral")}<' },
  { search: />Tiêu cực</g, replace: '>{t("mentions.filters.negative")}<' },
]);

// 6. MentionTable.tsx
translateFile(mentionsPath + '/MentionTable.tsx', [
  { search: />Nội dung Bài viết</g, replace: '>{t("mentions.table.content")}<' },
  { search: />Nền tảng</g, replace: '>{t("mentions.table.platform")}<' },
  { search: />Sắc thái</g, replace: '>{t("mentions.table.sentiment")}<' },
  { search: />Tác giả</g, replace: '>{t("mentions.table.author")}<' },
  { search: />Thời gian</g, replace: '>{t("mentions.table.time")}<' },
  { search: />Hành động</g, replace: '>{t("mentions.table.actions")}<' },
  { search: /"Tích cực"/g, replace: 't("mentions.table.tags.positive")' },
  { search: /"Trung lập"/g, replace: 't("mentions.table.tags.neutral")' },
  { search: /"Tiêu cực"/g, replace: 't("mentions.table.tags.negative")' },
]);

console.log('Reports and Mentions translated');
