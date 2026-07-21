const fs = require('fs');
const path = require('path');

const dirs = [
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\crisis-monitoring',
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\brand-manager'
];

function fixDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We will blindly replace strings, then dedup multiple dark: classes just in case
      content = content.replace(/text-\[#1A1B20\]/g, 'text-[#1A1B20] dark:text-gray-100');
      content = content.replace(/text-\[#474554\]/g, 'text-[#474554] dark:text-gray-300');
      content = content.replace(/text-\[#514D5E\]/g, 'text-[#514D5E] dark:text-gray-300');
      content = content.replace(/text-\[#6E6A7C\]/g, 'text-[#6E6A7C] dark:text-gray-400');
      content = content.replace(/text-\[#767586\]/g, 'text-[#767586] dark:text-gray-400');
      content = content.replace(/text-\[#7A7688\]/g, 'text-[#7A7688] dark:text-gray-400');
      content = content.replace(/bg-white/g, 'bg-white dark:bg-[#1A1B20]');
      content = content.replace(/bg-\[#FFF7F6\]/g, 'bg-[#FFF7F6] dark:bg-[#1A1B20]');
      content = content.replace(/bg-\[#FBFAFE\]/g, 'bg-[#FBFAFE] dark:bg-gray-800');
      content = content.replace(/border-\[#DDD9E8\]/g, 'border-[#DDD9E8] dark:border-gray-700');
      content = content.replace(/border-\[#EEEAF6\]/g, 'border-[#EEEAF6] dark:border-gray-700');
      
      // Deduplicate multiple occurrences if I accidentally double injected
      content = content.replace(/(dark:text-gray-100\s*)+/g, 'dark:text-gray-100 ');
      content = content.replace(/(dark:text-gray-300\s*)+/g, 'dark:text-gray-300 ');
      content = content.replace(/(dark:text-gray-400\s*)+/g, 'dark:text-gray-400 ');
      content = content.replace(/(dark:bg-\[#1A1B20\]\s*)+/g, 'dark:bg-[#1A1B20] ');
      content = content.replace(/(dark:bg-gray-800\s*)+/g, 'dark:bg-gray-800 ');
      content = content.replace(/(dark:border-gray-700\s*)+/g, 'dark:border-gray-700 ');

      // Fix cases where dark: appears at the end of className but gets a space
      content = content.replace(/ \]/g, ']');
      content = content.replace(/ \"/g, '"');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  });
}

dirs.forEach(d => fixDir(d));
console.log('Fixed all tsx files');
