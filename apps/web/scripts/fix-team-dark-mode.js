const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\team';

function fixDir(d) {
  if (!fs.existsSync(d)) return;
  const files = fs.readdirSync(d);
  files.forEach(file => {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic text colors (dark mode missing)
      content = content.replace(/text-\[#1A1B20\](?!.*dark:text-)/g, 'text-[#1A1B20] dark:text-gray-100');
      content = content.replace(/text-\[#474554\](?!.*dark:text-)/g, 'text-[#474554] dark:text-gray-300');
      content = content.replace(/text-\[#514D5E\](?!.*dark:text-)/g, 'text-[#514D5E] dark:text-gray-300');
      content = content.replace(/text-\[#6E6A7C\](?!.*dark:text-)/g, 'text-[#6E6A7C] dark:text-gray-400');
      content = content.replace(/text-\[#767586\](?!.*dark:text-)/g, 'text-[#767586] dark:text-gray-400');
      content = content.replace(/text-\[#7A7688\](?!.*dark:text-)/g, 'text-[#7A7688] dark:text-gray-400');
      content = content.replace(/text-[#111827](?!.*dark:text-)/g, 'text-[#111827] dark:text-gray-100');
      content = content.replace(/text-gray-900(?!.*dark:text-)/g, 'text-gray-900 dark:text-gray-100');
      content = content.replace(/text-gray-700(?!.*dark:text-)/g, 'text-gray-700 dark:text-gray-300');
      content = content.replace(/text-gray-500(?!.*dark:text-)/g, 'text-gray-500 dark:text-gray-400');

      // Semantic classes for basic backgrounds
      content = content.replace(/bg-white/g, 'bg-surface-card');
      content = content.replace(/bg-\[#FAF8FF\]/g, 'bg-surface-raised');
      content = content.replace(/bg-\[#F4F3FA\]/g, 'bg-surface-raised');
      content = content.replace(/bg-\[#EEEDF4\]/g, 'bg-surface-raised');
      content = content.replace(/bg-\[#F9FAFB\]/g, 'bg-surface-raised');
      content = content.replace(/bg-gray-50/g, 'bg-surface-raised');
      
      // Borders
      content = content.replace(/border-\[#[A-F0-9]{6}\]/gi, 'border-app');
      content = content.replace(/border-gray-200/g, 'border-app');
      
      // Badges and tags
      content = content.replace(/bg-orange-50(?!.*dark:bg-orange)/g, 'bg-orange-50 dark:bg-orange-900/30');
      content = content.replace(/text-orange-700(?!.*dark:text-orange)/g, 'text-orange-700 dark:text-orange-400');
      content = content.replace(/text-orange-600(?!.*dark:text-orange)/g, 'text-orange-600 dark:text-orange-400');

      content = content.replace(/bg-indigo-50(?!.*dark:bg-indigo)/g, 'bg-indigo-50 dark:bg-indigo-900/30');
      content = content.replace(/text-indigo-700(?!.*dark:text-indigo)/g, 'text-indigo-700 dark:text-indigo-400');
      content = content.replace(/text-indigo-600(?!.*dark:text-indigo)/g, 'text-indigo-600 dark:text-indigo-400');

      content = content.replace(/bg-blue-50(?!.*dark:bg-blue)/g, 'bg-blue-50 dark:bg-blue-900/30');
      content = content.replace(/text-blue-700(?!.*dark:text-blue)/g, 'text-blue-700 dark:text-blue-400');
      content = content.replace(/text-blue-600(?!.*dark:text-blue)/g, 'text-blue-600 dark:text-blue-400');

      content = content.replace(/bg-emerald-50(?!.*dark:bg-emerald)/g, 'bg-emerald-50 dark:bg-emerald-900/30');
      content = content.replace(/text-emerald-700(?!.*dark:text-emerald)/g, 'text-emerald-700 dark:text-emerald-400');
      content = content.replace(/text-emerald-600(?!.*dark:text-emerald)/g, 'text-emerald-600 dark:text-emerald-400');

      content = content.replace(/bg-green-50(?!.*dark:bg-green)/g, 'bg-green-50 dark:bg-green-900/30');
      content = content.replace(/text-green-700(?!.*dark:text-green)/g, 'text-green-700 dark:text-green-400');
      content = content.replace(/text-green-600(?!.*dark:text-green)/g, 'text-green-600 dark:text-green-400');

      content = content.replace(/bg-rose-50(?!.*dark:bg-rose)/g, 'bg-rose-50 dark:bg-rose-900/30');
      content = content.replace(/text-rose-700(?!.*dark:text-rose)/g, 'text-rose-700 dark:text-rose-400');
      content = content.replace(/text-rose-600(?!.*dark:text-rose)/g, 'text-rose-600 dark:text-rose-400');
      
      content = content.replace(/bg-red-50(?!.*dark:bg-red)/g, 'bg-red-50 dark:bg-red-900/30');
      content = content.replace(/text-red-700(?!.*dark:text-red)/g, 'text-red-700 dark:text-red-400');
      content = content.replace(/text-red-600(?!.*dark:text-red)/g, 'text-red-600 dark:text-red-400');
      
      content = content.replace(/bg-amber-50(?!.*dark:bg-amber)/g, 'bg-amber-50 dark:bg-amber-900/30');
      content = content.replace(/text-amber-700(?!.*dark:text-amber)/g, 'text-amber-700 dark:text-amber-400');
      content = content.replace(/text-amber-600(?!.*dark:text-amber)/g, 'text-amber-600 dark:text-amber-400');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  });
}

fixDir(dir);
console.log('Fixed team components dark mode');
