const fs = require('fs');

const targetFile = 'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\app\\label-requests\\page.tsx';

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

  // Brand colors
  content = content.replace(/text-\[var\(--color-brand\)\]/g, 'text-[#6C5CE7] dark:text-indigo-400');
  content = content.replace(/bg-\[var\(--color-brand\)\]/g, 'bg-[#6C5CE7] dark:bg-indigo-600');
  content = content.replace(/bg-\[var\(--color-brand-subtle\)\]/g, 'bg-[#6C5CE7]/10 dark:bg-indigo-900/30');
  content = content.replace(/border-\[var\(--color-brand\)\]/g, 'border-[#6C5CE7] dark:border-indigo-500');

  // Success / Positive
  content = content.replace(/text-\[var\(--color-success\)\]/g, 'text-green-700 dark:text-green-400');
  content = content.replace(/bg-\[var\(--color-success\)\]/g, 'bg-green-600 dark:bg-green-500');
  content = content.replace(/bg-\[var\(--color-success-subtle\)\]/g, 'bg-green-50 dark:bg-green-900/20');
  content = content.replace(/border-\[var\(--color-success\)\]/g, 'border-green-500 dark:border-green-400');

  // Error / Negative
  content = content.replace(/text-\[var\(--color-error\)\]/g, 'text-red-700 dark:text-red-400');
  content = content.replace(/bg-\[var\(--color-error\)\]/g, 'bg-red-600 dark:bg-red-500');
  content = content.replace(/bg-\[var\(--color-error-subtle\)\]/g, 'bg-red-50 dark:bg-red-900/20');
  content = content.replace(/border-\[var\(--color-error\)\]/g, 'border-red-500 dark:border-red-400');

  // Info / Neutral
  content = content.replace(/text-\[var\(--color-info\)\]/g, 'text-blue-700 dark:text-blue-400');
  content = content.replace(/bg-\[var\(--color-info\)\]/g, 'bg-blue-600 dark:bg-blue-500');
  content = content.replace(/bg-\[var\(--color-info-subtle\)\]/g, 'bg-blue-50 dark:bg-blue-900/20');
  content = content.replace(/border-\[var\(--color-info\)\]/g, 'border-blue-500 dark:border-blue-400');

  // Warning / Urgency
  content = content.replace(/text-\[var\(--color-warning\)\]/g, 'text-amber-700 dark:text-amber-400');
  content = content.replace(/bg-\[var\(--color-warning\)\]/g, 'bg-amber-600 dark:bg-amber-500');
  content = content.replace(/bg-\[var\(--color-warning-subtle\)\]/g, 'bg-amber-50 dark:bg-amber-900/20');
  content = content.replace(/border-\[var\(--color-warning\)\]/g, 'border-amber-500 dark:border-amber-400');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log('No changes made.');
  }
}

if (fs.existsSync(targetFile)) {
  processFile(targetFile);
} else {
  console.log('Target file does not exist');
}
