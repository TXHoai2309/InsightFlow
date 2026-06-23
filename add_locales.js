const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'apps/web/src/locales');
const viPath = path.join(localesDir, 'vi.json');
const enPath = path.join(localesDir, 'en.json');

const newViKeys = {
  "home.hero.demo.sentiment": "Sentiment",
  "home.hero.demo.positive": "Tích cực",
  "home.hero.demo.trend": "Trend",
  "home.hero.demo.crisis": "Crisis",
  "home.hero.demo.alert": "Alert",
  "home.hero.demo.newIssues": "2 vấn đề mới",
  "home.hero.demo.topKeywords": "Top Keywords",
  "home.hero.demo.kw.quality": "Chất lượng",
  "home.hero.demo.kw.delivery": "Giao hàng",
  "home.hero.demo.kw.price": "Giá",
  "home.hero.demo.kw.service": "Dịch vụ",
  "home.hero.demo.kw.promo": "Khuyến mãi",
  "home.hero.demo.wordCloud": "Từ khóa nổi bật",
  "home.hero.demo.wc.delicious": "ngon",
  "home.hero.demo.wc.fast": "nhanh",
  "home.hero.demo.wc.goodService": "phục vụ tốt",
  "home.hero.demo.wc.cheap": "giá rẻ",
  "home.hero.demo.wc.clean": "sạch",
  "home.hero.demo.wc.slow": "chậm",
  "home.hero.demo.wc.fresh": "tươi",
  "home.hero.demo.wc.crowded": "đông",
  "home.hero.demo.wc.friendly": "thân thiện",
  "home.hero.kpi.businesses": "Doanh nghiệp",
  "home.hero.kpi.articles": "Bài phân tích",
  "home.hero.kpi.accuracy": "Độ chính xác",
  "home.hero.kpi.monitoring": "Theo dõi",
  "home.hero.badge": "AI Brand Monitoring · F&B Specialist",
  "home.hero.title1": "Theo dõi thương hiệu",
  "home.hero.titleHighlight": "thông minh hơn",
  "home.hero.title2": "với AI",
  "home.hero.subtitle": "Lắng nghe mạng xã hội, phân tích cảm xúc thực khách và cảnh báo khủng hoảng truyền thông trong thời gian thực — dành riêng cho doanh nghiệp F&B Việt Nam.",
  "home.hero.dashboardBtn": "Vào Dashboard",
  "home.hero.freeTrialBtn": "Dùng thử miễn phí",
  "home.hero.demoBtn": "Xem Demo",
};

const newEnKeys = {
  "home.hero.demo.sentiment": "Sentiment",
  "home.hero.demo.positive": "Positive",
  "home.hero.demo.trend": "Trend",
  "home.hero.demo.crisis": "Crisis",
  "home.hero.demo.alert": "Alert",
  "home.hero.demo.newIssues": "2 new issues",
  "home.hero.demo.topKeywords": "Top Keywords",
  "home.hero.demo.kw.quality": "Quality",
  "home.hero.demo.kw.delivery": "Delivery",
  "home.hero.demo.kw.price": "Price",
  "home.hero.demo.kw.service": "Service",
  "home.hero.demo.kw.promo": "Promo",
  "home.hero.demo.wordCloud": "Trending Keywords",
  "home.hero.demo.wc.delicious": "delicious",
  "home.hero.demo.wc.fast": "fast",
  "home.hero.demo.wc.goodService": "good service",
  "home.hero.demo.wc.cheap": "cheap",
  "home.hero.demo.wc.clean": "clean",
  "home.hero.demo.wc.slow": "slow",
  "home.hero.demo.wc.fresh": "fresh",
  "home.hero.demo.wc.crowded": "crowded",
  "home.hero.demo.wc.friendly": "friendly",
  "home.hero.kpi.businesses": "Businesses",
  "home.hero.kpi.articles": "Analyzed Posts",
  "home.hero.kpi.accuracy": "Accuracy",
  "home.hero.kpi.monitoring": "Monitoring",
  "home.hero.badge": "AI Brand Monitoring · F&B Specialist",
  "home.hero.title1": "Monitor brands",
  "home.hero.titleHighlight": "smarter",
  "home.hero.title2": "with AI",
  "home.hero.subtitle": "Listen to social media, analyze diner sentiments, and get real-time crisis alerts — tailored exclusively for F&B businesses in Vietnam.",
  "home.hero.dashboardBtn": "Go to Dashboard",
  "home.hero.freeTrialBtn": "Start Free Trial",
  "home.hero.demoBtn": "Watch Demo",
};

function addKeys(filePath, newKeys) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(newKeys, null, 2), 'utf-8');
    return;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  let data = {};
  try {
    data = JSON.parse(content);
  } catch (e) {
    console.error('Error parsing', filePath, e);
  }
  const merged = { ...data, ...newKeys };
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`Updated ${filePath} with ${Object.keys(newKeys).length} keys.`);
}

addKeys(viPath, newViKeys);
addKeys(enPath, newEnKeys);
