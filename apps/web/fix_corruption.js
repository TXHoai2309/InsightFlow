const fs = require('fs');
const file = 'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\home\\BrandLandingPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Restore the wrecked map function
const brokenMapStr = `                <div className="mt-auto pt-12 grid gap-4 sm:grid-cols-3">
                            <div className="flex items-center gap-2 mb-3 text-[#6B7090] dark:text-slate-400">
                          {label.includes('Cảnh báo') || label.includes('Chờ') ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}`;

const fixedMapStr = `                <div className="mt-auto pt-12 grid gap-4 sm:grid-cols-3">
                  {activeRole.metrics.map(([label, value, delta]) => {
                    const isPositive = delta.includes('+') || delta.includes('Tăng');
                    const isNeutral = delta.includes('Tuần này') || delta.includes('Cần xử lý') || delta.includes('Cần xem') || delta.includes('phân khúc') || delta.includes('ngày');
                    
                    return (
                      <div key={label} className="rounded-[20px] border border-[#ECE9FF] dark:border-white/10 bg-[#F7F9FF] dark:bg-white/5 p-5 shadow-sm transition-all duration-300 hover:shadow-[0_20px_40px_rgba(109,94,246,0.1)] hover:-translate-y-1 hover:bg-white dark:hover:bg-white/10">
                        <div className="flex items-center gap-2 mb-3 text-[#6B7090] dark:text-slate-400">
                          {label.includes('Cảnh báo') || label.includes('Chờ') ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}`;

// We will use replace with normalized line endings just in case
let normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedBroken = brokenMapStr.replace(/\r\n/g, '\n');
const normalizedFixed = fixedMapStr.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedBroken)) {
    normalizedContent = normalizedContent.replace(normalizedBroken, normalizedFixed);
} else {
    console.log("Could not find the broken map to restore.");
}

// 2. Fix the consultation section text list (add dark mode to the checkmarks list)
const oldCheckmarkList = `              {["Đề xuất quy trình theo ngành hàng và mô hình đội ngũ", "Chọn chỉ số, kênh theo dõi và tình huống ưu tiên", "Demo xoay quanh bài toán thật, không phải bản trình diễn chung chung"].map((item) => (
                <div key={item} className="flex gap-4 text-[16px] font-medium leading-[1.6] text-[#1B1B4A]">`;
                
const newCheckmarkList = `              {["Đề xuất quy trình theo ngành hàng và mô hình đội ngũ", "Chọn chỉ số, kênh theo dõi và tình huống ưu tiên", "Demo xoay quanh bài toán thật, không phải bản trình diễn chung chung"].map((item) => (
                <div key={item} className="flex gap-4 text-[16px] font-medium leading-[1.6] text-[#1B1B4A] dark:text-white">`;

normalizedContent = normalizedContent.replace(oldCheckmarkList, newCheckmarkList);

fs.writeFileSync(file, normalizedContent, 'utf8');
console.log("Restored successfully");
