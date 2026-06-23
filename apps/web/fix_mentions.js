const fs = require('fs');

const targetFile = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/components/mentions/MentionTable.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Replace t(...) with translation keys in sentimentMap
content = content.replace(/label:\s*t\("mentions\.table\.tags\.positive"\)/g, 'labelKey: "mentions.table.tags.positive"');
content = content.replace(/label:\s*t\("mentions\.table\.tags\.negative"\)/g, 'labelKey: "mentions.table.tags.negative"');
content = content.replace(/label:\s*t\("mentions\.table\.tags\.neutral"\)/g, 'labelKey: "mentions.table.tags.neutral"');

// Fix type
content = content.replace(/label: string; icon: string; className: string/g, 'labelKey: string; icon: string; className: string');

// Fix call sites
content = content.replace(/\{sentimentMap\[mention\.sentiment\]\.label\}/g, '{t(sentimentMap[mention.sentiment].labelKey)}');

// Fix the hardcoded translation for empty states
content = content.replace(/>\s*Đang tải dữ liệu mentions\.\.\.\s*</g, '>Đang tải dữ liệu mentions...<');
content = content.replace(/>\s*Không tìm thấy mention phù hợp với bộ lọc\.\s*</g, '>Không tìm thấy mention phù hợp với bộ lọc.<');

// Fix pagination hardcoded translations
content = content.replace(/Hiển thị \{startIndex \+ 1\}-\{endIndex\} trên tổng số/g, 'Hiển thị {startIndex + 1}-{endIndex} trên tổng số');
content = content.replace(/\{mentions\.length\} đề cập/g, '{mentions.length} đề cập');

// Fix headers
content = content.replace(/>\s*Nguồn\s*<\/th>/g, '>{t("mentions.table.platform")}</th>');
content = content.replace(/>\s*Độ tin cậy\s*<\/th>/g, '>Độ tin cậy</th>'); // Add if needed, or leave as is
content = content.replace(/>\s*Nội dung tóm tắt\s*<\/th>/g, '>{t("mentions.table.content")}</th>');
content = content.replace(/>\s*Sắc thái\s*<\/th>/g, '>{t("mentions.table.sentiment")}</th>');
content = content.replace(/>\s*Chủ đề\s*<\/th>/g, '>Chủ đề</th>'); // Or add to t
content = content.replace(/>\s*Thời gian\s*<\/th>/g, '>{t("mentions.table.time")}</th>');

fs.writeFileSync(targetFile, content);
console.log('Fixed MentionTable');
