const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'apps/web/src/locales');
const viPath = path.join(localesDir, 'vi.json');
const enPath = path.join(localesDir, 'en.json');

const newViKeys = {
  "home.features.badge": "Tính năng",
  "home.features.title1": "Mọi thứ bạn cần để",
  "home.features.titleHighlight": "làm chủ truyền thông",
  "home.features.subtitle": "Bộ công cụ AI toàn diện được thiết kế riêng cho doanh nghiệp F&B tại Việt Nam.",
  "home.features.ai.subtitle": "Phân tích cảm xúc",
  "home.features.ai.desc": "Phân tích cảm xúc tiếng Việt chính xác đến 98% — tích cực, tiêu cực, trung lập trên mọi kênh.",
  "home.features.rt.subtitle": "Theo dõi 24/7",
  "home.features.rt.desc": "Cập nhật dữ liệu mỗi 5 phút từ Facebook, TikTok, YouTube, Báo chí. Không bỏ lỡ bất kỳ tín hiệu nào.",
  "home.features.crisis.subtitle": "Cảnh báo tức thì",
  "home.features.crisis.desc": "Phát hiện dấu hiệu khủng hoảng và gửi thông báo ngay qua Telegram/Email trước khi tình huống leo thang.",
  "home.features.report.subtitle": "Báo cáo tự động",
  "home.features.report.desc": "Xuất báo cáo định kỳ hàng ngày, hàng tuần với biểu đồ trực quan chuyên nghiệp chỉ với 1 cú nhấp.",
  "home.features.learnMore": "Tìm hiểu thêm"
};

const newEnKeys = {
  "home.features.badge": "Features",
  "home.features.title1": "Everything you need to",
  "home.features.titleHighlight": "master communication",
  "home.features.subtitle": "Comprehensive AI toolkit designed exclusively for F&B businesses in Vietnam.",
  "home.features.ai.subtitle": "Sentiment Analysis",
  "home.features.ai.desc": "Vietnamese sentiment analysis up to 98% accurate — positive, negative, neutral across all channels.",
  "home.features.rt.subtitle": "24/7 Monitoring",
  "home.features.rt.desc": "Data updated every 5 mins from Facebook, TikTok, YouTube, News. Never miss a signal.",
  "home.features.crisis.subtitle": "Instant Alerts",
  "home.features.crisis.desc": "Detect crisis signals and send alerts immediately via Telegram/Email before escalation.",
  "home.features.report.subtitle": "Auto Reports",
  "home.features.report.desc": "Export daily and weekly reports with professional charts in just one click.",
  "home.features.learnMore": "Learn more"
};

function addKeys(filePath, newKeys) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let data = JSON.parse(content);
  const merged = { ...data, ...newKeys };
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`Updated ${filePath} with ${Object.keys(newKeys).length} keys.`);
}

addKeys(viPath, newViKeys);
addKeys(enPath, newEnKeys);
