const fs = require('fs');
const path = require('path');

const targetFile = 'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\admin\\AdminBrandManagerPage.tsx';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Texts
  content = content.replace(/text-\[var\(--color-text-primary\)\]/g, 'text-gray-900 dark:text-gray-100');
  content = content.replace(/text-\[var\(--color-text-secondary\)\]/g, 'text-gray-700 dark:text-gray-300');
  content = content.replace(/text-\[var\(--color-text-muted\)\]/g, 'text-gray-500 dark:text-gray-400');
  
  // Backgrounds
  content = content.replace(/bg-\[var\(--color-bg-surface\)\]/g, 'bg-surface-card');
  content = content.replace(/bg-\[var\(--color-bg-surface-raised\)\]/g, 'bg-surface-raised');
  content = content.replace(/bg-\[var\(--color-bg-root\)\]/g, 'bg-surface-card');

  // Borders
  content = content.replace(/border-\[var\(--color-border\)\]/g, 'border-app');
  content = content.replace(/border-\[var\(--color-border-strong\)\]/g, 'border-app');

  // Brand colors
  content = content.replace(/text-\[var\(--color-brand\)\]/g, 'text-[#6C5CE7] dark:text-indigo-400');
  content = content.replace(/bg-\[var\(--color-brand\)\]/g, 'bg-[#6C5CE7] dark:bg-indigo-600');
  content = content.replace(/bg-\[var\(--color-brand-subtle\)\]/g, 'bg-[#6C5CE7]/10 dark:bg-indigo-900/30');
  content = content.replace(/border-\[var\(--color-brand-border\)\]/g, 'border-[#6C5CE7]/20 dark:border-indigo-500/30');
  content = content.replace(/shadow-\[var\(--color-brand\)\]/g, 'shadow-indigo-500');
  content = content.replace(/border-\[var\(--color-brand\)\]/g, 'border-[#6C5CE7] dark:border-indigo-500');
  content = content.replace(/ring-\[var\(--color-brand\)\]/g, 'ring-[#6C5CE7] dark:ring-indigo-500');
  content = content.replace(/hover:border-\[var\(--color-brand\)\]/g, 'hover:border-[#6C5CE7] dark:hover:border-indigo-500');
  content = content.replace(/hover:text-\[var\(--color-brand\)\]/g, 'hover:text-[#6C5CE7] dark:hover:text-indigo-400');
  content = content.replace(/hover:bg-\[var\(--color-brand-subtle\)\]/g, 'hover:bg-[#6C5CE7]/10 dark:hover:bg-indigo-900/30');

  // Error/Warning
  content = content.replace(/text-\[var\(--color-error\)\]/g, 'text-red-600 dark:text-red-400');
  content = content.replace(/bg-\[var\(--color-error-subtle\)\]/g, 'bg-red-50 dark:bg-red-900/20');
  content = content.replace(/border-\[var\(--color-error\)\]\/20/g, 'border-red-100 dark:border-red-900/30');
  
  content = content.replace(/text-\[var\(--color-warning\)\]/g, 'text-amber-600 dark:text-amber-400');
  content = content.replace(/bg-\[var\(--color-warning-subtle\)\]/g, 'bg-amber-50 dark:bg-amber-900/20');
  content = content.replace(/border-\[var\(--color-warning\)\]\/30/g, 'border-amber-100 dark:border-amber-900/30');
  content = content.replace(/border-\[var\(--color-warning\)\]\/40/g, 'border-amber-200 dark:border-amber-900/40');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`No changes needed for ${filePath}`);
  }
}

if (fs.existsSync(targetFile)) {
  processFile(targetFile);
} else {
  console.log('Target file does not exist');
}
