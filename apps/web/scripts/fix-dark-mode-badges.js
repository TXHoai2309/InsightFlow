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
      
      content = content.replace(/bg-red-50(?!.*dark:bg-red-900)/g, 'bg-red-50 dark:bg-red-900/30');
      content = content.replace(/text-\[#BA1A1A\](?!.*dark:text-red-400)/g, 'text-[#BA1A1A] dark:text-red-400');
      content = content.replace(/bg-amber-50(?!.*dark:bg-amber-900)/g, 'bg-amber-50 dark:bg-amber-900/30');
      content = content.replace(/text-amber-700(?!.*dark:text-amber-400)/g, 'text-amber-700 dark:text-amber-400');
      content = content.replace(/bg-rose-50(?!.*dark:bg-rose-900)/g, 'bg-rose-50 dark:bg-rose-900/30');
      content = content.replace(/text-rose-700(?!.*dark:text-rose-400)/g, 'text-rose-700 dark:text-rose-400');
      content = content.replace(/bg-indigo-50(?!.*dark:bg-indigo-900)/g, 'bg-indigo-50 dark:bg-indigo-900/30');
      content = content.replace(/text-indigo-700(?!.*dark:text-indigo-400)/g, 'text-indigo-700 dark:text-indigo-400');
      content = content.replace(/bg-orange-100(?!.*dark:bg-orange-900)/g, 'bg-orange-100 dark:bg-orange-900/30');
      content = content.replace(/text-orange-700(?!.*dark:text-orange-400)/g, 'text-orange-700 dark:text-orange-400');
      
      content = content.replace(/bg-\[#F3F0FF\](?!.*dark:bg-indigo-900)/g, 'bg-[#F3F0FF] dark:bg-indigo-900/30');
      content = content.replace(/text-\[#4234B6\](?!.*dark:text-indigo-400)/g, 'text-[#4234B6] dark:text-indigo-400');
      
      content = content.replace(/bg-\[#FFDAD6\](?!.*dark:bg-red-900)/g, 'bg-[#FFDAD6] dark:bg-red-900/30');
      content = content.replace(/bg-\[#FAF8FF\](?!.*dark:bg-gray-800)/g, 'bg-[#FAF8FF] dark:bg-gray-800');
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  });
}

dirs.forEach(d => fixDir(d));
console.log('Fixed badges and tones');
