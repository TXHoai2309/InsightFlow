const fs = require('fs');

const viPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/locales/vi.json';
const enPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/locales/en.json';

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newVi = {
  'nav.dashboard': 'Dashboard',
  'nav.mentions': 'Mentions',
  'nav.alerts': 'Alerts',
  'nav.leads': 'Leads',
  'nav.reports': 'Reports',
  'nav.brands': 'Brands',
  'nav.logout': 'Đăng xuất',
  'sidebar.reportReadyTitle': '💡 Báo cáo sẵn sàng',
  'sidebar.reportReadyDesc': 'AI hoàn tất tổng hợp dữ liệu ngày hôm qua',
  'sidebar.viewReport': 'Xem báo cáo',
  'sidebar.systemActive': 'System Active 24/7',
  'header.searchPlaceholder': 'Tìm kiếm mention, bài viết...',
  'header.simulation': 'Giả lập:',
  'header.newNotifications': 'Thông báo mới (5)',
  'header.newLead': '🔴 Hot Lead mới',
  'header.fromHighlands': 'từ Highlands Coffee',
  'header.crisisAlert': '🚨 Cảnh báo khủng hoảng',
  'header.spikeDetected': 'Spike detected: 3.2x',
  'header.viewAll': 'Xem tất cả',
  'header.guest': 'Khách',
  'header.administrator': 'Quản trị viên'
};

const newEn = {
  'nav.dashboard': 'Dashboard',
  'nav.mentions': 'Mentions',
  'nav.alerts': 'Alerts',
  'nav.leads': 'Leads',
  'nav.reports': 'Reports',
  'nav.brands': 'Brands',
  'nav.logout': 'Logout',
  'sidebar.reportReadyTitle': '💡 Report Ready',
  'sidebar.reportReadyDesc': 'AI has finished synthesizing yesterday\'s data',
  'sidebar.viewReport': 'View Report',
  'sidebar.systemActive': 'System Active 24/7',
  'header.searchPlaceholder': 'Search mentions, posts...',
  'header.simulation': 'Simulation:',
  'header.newNotifications': 'New Notifications (5)',
  'header.newLead': '🔴 New Hot Lead',
  'header.fromHighlands': 'from Highlands Coffee',
  'header.crisisAlert': '🚨 Crisis Alert',
  'header.spikeDetected': 'Spike detected: 3.2x',
  'header.viewAll': 'View All',
  'header.guest': 'Guest',
  'header.administrator': 'Administrator'
};

Object.assign(viData, newVi);
Object.assign(enData, newEn);

fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

function translateFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('useTranslation')) {
    content = content.replace(
      'import Link from "next/link";',
      'import Link from "next/link";\nimport { useTranslation } from "react-i18next";'
    );
    if (!content.includes('import { useTranslation }')) {
      content = content.replace(
        'import React',
        'import React from "react";\nimport { useTranslation } from "react-i18next";\nimport '
      );
    }
  }

  // Inject hook
  if (filePath.includes('Sidebar.tsx')) {
    if (!content.includes('const { t } = useTranslation();')) {
      content = content.replace(
        'const router = useRouter();',
        'const router = useRouter();\n  const { t } = useTranslation();'
      );
    }
  } else if (filePath.includes('Header.tsx')) {
    if (!content.includes('const { t } = useTranslation();')) {
      content = content.replace(
        'const { user } = useAuth();',
        'const { user } = useAuth();\n  const { t } = useTranslation();'
      );
    }
  } else if (filePath.includes('MobileNav.tsx')) {
    if (!content.includes('const { t } = useTranslation();')) {
      content = content.replace(
        'const pathname = usePathname();',
        'const pathname = usePathname();\n  const { t } = useTranslation();'
      );
    }
  }

  for (const rep of replacements) {
    content = content.replace(rep.search, rep.replace);
  }
  
  fs.writeFileSync(filePath, content);
}

// 1. Sidebar.tsx
translateFile('d:/baitap/InsightFlow/InsightFlow/apps/web/src/components/layout/Sidebar.tsx', [
  { search: /label: "Dashboard"/g, replace: 'label: "nav.dashboard"' },
  { search: /label: "Mentions"/g, replace: 'label: "nav.mentions"' },
  { search: /label: "Alerts"/g, replace: 'label: "nav.alerts"' },
  { search: /label: "Leads"/g, replace: 'label: "nav.leads"' },
  { search: /label: "Reports"/g, replace: 'label: "nav.reports"' },
  { search: /label: "Brands"/g, replace: 'label: "nav.brands"' },
  { search: /\{item\.label\}/g, replace: '{t(item.label)}' },
  { search: />Đăng xuất</g, replace: '>{t("nav.logout")}<' },
  { search: />💡 Báo cáo sẵn sàng</g, replace: '>{t("sidebar.reportReadyTitle")}<' },
  { search: />\s*AI hoàn tất tổng hợp dữ liệu ngày hôm qua\s*</g, replace: '>{t("sidebar.reportReadyDesc")}<' },
  { search: />\s*Xem báo cáo\s*</g, replace: '>{t("sidebar.viewReport")}<' },
  { search: />System Active 24\/7</g, replace: '>{t("sidebar.systemActive")}<' },
]);

// 2. MobileNav.tsx
translateFile('d:/baitap/InsightFlow/InsightFlow/apps/web/src/components/layout/MobileNav.tsx', [
  { search: /label: "Dashboard"/g, replace: 'label: "nav.dashboard"' },
  { search: /label: "Mentions"/g, replace: 'label: "nav.mentions"' },
  { search: /label: "Alerts"/g, replace: 'label: "nav.alerts"' },
  { search: /label: "Leads"/g, replace: 'label: "nav.leads"' },
  { search: /label: "Reports"/g, replace: 'label: "nav.reports"' },
  { search: /\{item\.label\}/g, replace: '{t(item.label)}' }
]);

// 3. Header.tsx
translateFile('d:/baitap/InsightFlow/InsightFlow/apps/web/src/components/layout/Header.tsx', [
  { search: /placeholder="Tìm kiếm mention, bài viết\.\.\."/g, replace: 'placeholder={t("header.searchPlaceholder")}' },
  { search: />\s*Giả lập:\s*</g, replace: '>{t("header.simulation")}<' },
  { search: />Thông báo mới \(5\)</g, replace: '>{t("header.newNotifications")}<' },
  { search: />🔴 Hot Lead mới</g, replace: '>{t("header.newLead")}<' },
  { search: />\s*từ Highlands Coffee\s*</g, replace: '>{t("header.fromHighlands")}<' },
  { search: />🚨 Cảnh báo khủng hoảng</g, replace: '>{t("header.crisisAlert")}<' },
  { search: />\s*Spike detected: 3\.2x\s*</g, replace: '>{t("header.spikeDetected")}<' },
  { search: />\s*Xem tất cả\s*</g, replace: '>{t("header.viewAll")}<' },
  { search: /"Guest"/g, replace: 't("header.guest")' },
  { search: /"Administrator"/g, replace: 't("header.administrator")' },
]);

console.log('Layout translated');
