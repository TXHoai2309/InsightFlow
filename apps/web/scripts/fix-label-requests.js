const fs = require('fs');
const path = require('path');

const targetFile = 'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\app\\label-requests\\page.tsx';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Text Colors
  content = content.replace(/text-gray-900(?! dark:)/g, 'text-gray-900 dark:text-gray-100');
  content = content.replace(/text-gray-800(?! dark:)/g, 'text-gray-800 dark:text-gray-200');
  content = content.replace(/text-gray-700(?! dark:)/g, 'text-gray-700 dark:text-gray-300');
  content = content.replace(/text-gray-600(?! dark:)/g, 'text-gray-600 dark:text-gray-400');
  content = content.replace(/text-gray-500(?! dark:)/g, 'text-gray-500 dark:text-gray-400');
  content = content.replace(/text-\[\#1A1B20\](?! dark:)/g, 'text-[#1A1B20] dark:text-gray-100');
  content = content.replace(/text-\[\#13141A\](?! dark:)/g, 'text-[#13141A] dark:text-gray-100');
  content = content.replace(/text-black(?! dark:)/g, 'text-black dark:text-white');

  // 2. Backgrounds
  content = content.replace(/bg-white(?! dark:)/g, 'bg-surface-card');
  content = content.replace(/bg-\[\#FFFFFF\](?! dark:)/g, 'bg-surface-card');
  content = content.replace(/bg-\[\#FAF8FF\](?! dark:)/g, 'bg-surface-raised');
  content = content.replace(/bg-\[\#F8F9FA\](?! dark:)/g, 'bg-surface-raised');
  content = content.replace(/bg-gray-50(?! dark:)/g, 'bg-surface-raised');
  content = content.replace(/bg-gray-100(?! dark:)/g, 'bg-surface-raised');

  // Special case for cards that have specific backgrounds that clash
  content = content.replace(/bg-\[\#1F2128\]/g, 'bg-surface-card');
  content = content.replace(/bg-\[\#13141A\]/g, 'bg-surface-raised');

  // 3. Borders
  // Replace various hex borders with border-app
  content = content.replace(/border-\[\#E9E7EE\]/g, 'border-app');
  content = content.replace(/border-\[\#EEEDF4\]/g, 'border-app');
  content = content.replace(/border-\[\#F0F0F0\]/g, 'border-app');
  content = content.replace(/border-\[\#E5E7EB\]/g, 'border-app');
  content = content.replace(/border-gray-200(?! dark:)/g, 'border-app');
  content = content.replace(/border-gray-100(?! dark:)/g, 'border-app');

  // 4. Hover States
  content = content.replace(/hover:bg-gray-50(?! dark:)/g, 'hover:bg-surface-raised');
  content = content.replace(/hover:bg-gray-100(?! dark:)/g, 'hover:bg-surface-high');
  content = content.replace(/hover:bg-gray-200(?! dark:)/g, 'hover:bg-surface-high');

  // 5. Special label colors
  content = content.replace(/text-green-700(?! dark:)/g, 'text-green-700 dark:text-green-400');
  content = content.replace(/text-green-800(?! dark:)/g, 'text-green-800 dark:text-green-400');
  content = content.replace(/bg-green-50(?! dark:)/g, 'bg-green-50 dark:bg-green-900/20');
  content = content.replace(/border-green-200(?! dark:)/g, 'border-green-200 dark:border-green-800/50');
  
  content = content.replace(/text-blue-700(?! dark:)/g, 'text-blue-700 dark:text-blue-400');
  content = content.replace(/bg-blue-50(?! dark:)/g, 'bg-blue-50 dark:bg-blue-900/20');

  content = content.replace(/text-red-700(?! dark:)/g, 'text-red-700 dark:text-red-400');
  content = content.replace(/bg-red-50(?! dark:)/g, 'bg-red-50 dark:bg-red-900/20');
  
  content = content.replace(/text-amber-700(?! dark:)/g, 'text-amber-700 dark:text-amber-400');
  content = content.replace(/text-yellow-700(?! dark:)/g, 'text-yellow-700 dark:text-amber-400');
  content = content.replace(/bg-amber-50(?! dark:)/g, 'bg-amber-50 dark:bg-amber-900/20');
  content = content.replace(/bg-yellow-50(?! dark:)/g, 'bg-yellow-50 dark:bg-amber-900/20');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

if (fs.existsSync(targetFile)) {
  processFile(targetFile);
} else {
  console.log('Target file does not exist');
}
