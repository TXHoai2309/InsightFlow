const fs = require('fs');
const path = require('path');

const dirs = [
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\lead-monitoring',
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\leads',
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
      
      // Clean up my previous hacks
      content = content.replace(/dark:bg-\[#1A1B20\]/g, '');
      content = content.replace(/dark:bg-gray-800/g, '');
      content = content.replace(/dark:border-[#262338]/g, '');
      content = content.replace(/dark:border-gray-700/g, '');
      
      // Clean up extra spaces left over
      content = content.replace(/ +/g, ' ');

      // Use semantic CSS classes for background and borders instead of hardcoded hex values
      content = content.replace(/bg-white/g, 'bg-surface-card');
      content = content.replace(/bg-\[#FAF8FF\]/g, 'bg-surface-raised');
      content = content.replace(/bg-\[#F4F3FA\]/g, 'bg-surface-raised');
      content = content.replace(/bg-\[#EEEDF4\]/g, 'bg-surface-raised');
      
      content = content.replace(/border-\[#[A-F0-9]{6}\]/gi, 'border-app');
      content = content.replace(/border-gray-200/g, 'border-app');
      
      // Some cards use flex flex-col overflow-hidden rounded-[14px] border border-app bg-surface-card shadow-sm
      // This is effectively `glass-card` but we can leave the tailwind utility classes for layout, just bg and border colors are enough to fix the theme!
      
      // Fix text colors that might be missing dark mode variants (just to be safe)
      content = content.replace(/text-\[#A14A00\](?!.*dark:)/g, 'text-[#A14A00] dark:text-orange-400');
      content = content.replace(/text-\[#147A3F\](?!.*dark:)/g, 'text-[#147A3F] dark:text-green-400');
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  });
}

dirs.forEach(d => fixDir(d));
console.log('Fixed leads dark mode using semantic variables');
