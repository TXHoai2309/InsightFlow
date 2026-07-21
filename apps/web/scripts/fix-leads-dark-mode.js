const fs = require('fs');
const path = require('path');

const dirs = [
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\lead-monitoring',
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\leads',
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\dashboard', 
];

function fixDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic text colors
      content = content.replace(/text-\[#1A1B20\]/g, 'text-[#1A1B20] dark:text-gray-100');
      content = content.replace(/text-\[#474554\]/g, 'text-[#474554] dark:text-gray-300');
      content = content.replace(/text-\[#514D5E\]/g, 'text-[#514D5E] dark:text-gray-300');
      content = content.replace(/text-\[#6E6A7C\]/g, 'text-[#6E6A7C] dark:text-gray-400');
      content = content.replace(/text-\[#767586\]/g, 'text-[#767586] dark:text-gray-400');
      content = content.replace(/text-\[#7A7688\]/g, 'text-[#7A7688] dark:text-gray-400');
      
      // Basic backgrounds and borders
      content = content.replace(/bg-white/g, 'bg-white dark:bg-[#1A1B20]');
      content = content.replace(/bg-\[#FFF7F6\]/g, 'bg-[#FFF7F6] dark:bg-[#1A1B20]');
      content = content.replace(/bg-\[#FBFAFE\]/g, 'bg-[#FBFAFE] dark:bg-gray-800');
      content = content.replace(/border-\[#DDD9E8\]/g, 'border-[#DDD9E8] dark:border-gray-700');
      content = content.replace(/border-\[#EEEAF6\]/g, 'border-[#EEEAF6] dark:border-gray-700');

      // Tones and badges
      content = content.replace(/bg-red-50/g, 'bg-red-50 dark:bg-red-900/30');
      content = content.replace(/text-\[#BA1A1A\]/g, 'text-[#BA1A1A] dark:text-red-400');
      content = content.replace(/text-red-600/g, 'text-red-600 dark:text-red-400');
      
      content = content.replace(/bg-amber-50/g, 'bg-amber-50 dark:bg-amber-900/30');
      content = content.replace(/text-amber-700/g, 'text-amber-700 dark:text-amber-400');
      content = content.replace(/text-amber-600/g, 'text-amber-600 dark:text-amber-400');
      
      content = content.replace(/bg-orange-50/g, 'bg-orange-50 dark:bg-orange-900/30');
      content = content.replace(/bg-orange-100/g, 'bg-orange-100 dark:bg-orange-900/30');
      content = content.replace(/text-orange-700/g, 'text-orange-700 dark:text-orange-400');
      content = content.replace(/text-orange-600/g, 'text-orange-600 dark:text-orange-400');

      content = content.replace(/bg-rose-50/g, 'bg-rose-50 dark:bg-rose-900/30');
      content = content.replace(/text-rose-700/g, 'text-rose-700 dark:text-rose-400');
      
      content = content.replace(/bg-indigo-50/g, 'bg-indigo-50 dark:bg-indigo-900/30');
      content = content.replace(/text-indigo-700/g, 'text-indigo-700 dark:text-indigo-400');
      content = content.replace(/text-indigo-600/g, 'text-indigo-600 dark:text-indigo-400');
      
      content = content.replace(/bg-\[#F3F0FF\]/g, 'bg-[#F3F0FF] dark:bg-indigo-900/30');
      content = content.replace(/text-\[#4234B6\]/g, 'text-[#4234B6] dark:text-indigo-400');
      
      content = content.replace(/bg-\[#FFDAD6\]/g, 'bg-[#FFDAD6] dark:bg-red-900/30');
      content = content.replace(/bg-\[#FAF8FF\]/g, 'bg-[#FAF8FF] dark:bg-gray-800');
      
      content = content.replace(/bg-emerald-50/g, 'bg-emerald-50 dark:bg-emerald-900/30');
      content = content.replace(/text-emerald-700/g, 'text-emerald-700 dark:text-emerald-400');
      content = content.replace(/text-emerald-600/g, 'text-emerald-600 dark:text-emerald-400');
      
      content = content.replace(/bg-green-50/g, 'bg-green-50 dark:bg-green-900/30');
      content = content.replace(/text-green-700/g, 'text-green-700 dark:text-green-400');
      content = content.replace(/text-green-600/g, 'text-green-600 dark:text-green-400');
      
      content = content.replace(/bg-blue-50/g, 'bg-blue-50 dark:bg-blue-900/30');
      content = content.replace(/text-blue-700/g, 'text-blue-700 dark:text-blue-400');
      content = content.replace(/text-blue-600/g, 'text-blue-600 dark:text-blue-400');

      content = content.replace(/bg-gray-50/g, 'bg-gray-50 dark:bg-gray-800');

      // Deduplicate multiple occurrences if I accidentally double injected (or if they already had dark:)
      content = content.replace(/(dark:text-gray-100\s*)+/g, 'dark:text-gray-100 ');
      content = content.replace(/(dark:text-gray-300\s*)+/g, 'dark:text-gray-300 ');
      content = content.replace(/(dark:text-gray-400\s*)+/g, 'dark:text-gray-400 ');
      content = content.replace(/(dark:bg-\[#1A1B20\]\s*)+/g, 'dark:bg-[#1A1B20] ');
      content = content.replace(/(dark:bg-gray-800\s*)+/g, 'dark:bg-gray-800 ');
      content = content.replace(/(dark:border-gray-700\s*)+/g, 'dark:border-gray-700 ');
      
      content = content.replace(/(dark:bg-red-900\/30\s*)+/g, 'dark:bg-red-900/30 ');
      content = content.replace(/(dark:text-red-400\s*)+/g, 'dark:text-red-400 ');
      content = content.replace(/(dark:bg-amber-900\/30\s*)+/g, 'dark:bg-amber-900/30 ');
      content = content.replace(/(dark:text-amber-400\s*)+/g, 'dark:text-amber-400 ');
      content = content.replace(/(dark:bg-orange-900\/30\s*)+/g, 'dark:bg-orange-900/30 ');
      content = content.replace(/(dark:text-orange-400\s*)+/g, 'dark:text-orange-400 ');
      content = content.replace(/(dark:bg-rose-900\/30\s*)+/g, 'dark:bg-rose-900/30 ');
      content = content.replace(/(dark:text-rose-400\s*)+/g, 'dark:text-rose-400 ');
      content = content.replace(/(dark:bg-indigo-900\/30\s*)+/g, 'dark:bg-indigo-900/30 ');
      content = content.replace(/(dark:text-indigo-400\s*)+/g, 'dark:text-indigo-400 ');
      
      content = content.replace(/(dark:bg-emerald-900\/30\s*)+/g, 'dark:bg-emerald-900/30 ');
      content = content.replace(/(dark:text-emerald-400\s*)+/g, 'dark:text-emerald-400 ');
      content = content.replace(/(dark:bg-green-900\/30\s*)+/g, 'dark:bg-green-900/30 ');
      content = content.replace(/(dark:text-green-400\s*)+/g, 'dark:text-green-400 ');
      content = content.replace(/(dark:bg-blue-900\/30\s*)+/g, 'dark:bg-blue-900/30 ');
      content = content.replace(/(dark:text-blue-400\s*)+/g, 'dark:text-blue-400 ');

      // Fix cases where dark: appears at the end of className but gets a space before quote or bracket
      content = content.replace(/ \]/g, ']');
      content = content.replace(/ \"/g, '"');
      content = content.replace(/ \`/g, '`');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  });
}

dirs.forEach(d => fixDir(d));
console.log('Fixed leads dark mode');
