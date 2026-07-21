const fs = require('fs');
const path = require('path');

const targetDir = 'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\alerts';

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
  content = content.replace(/border-\[var\(--color-brand\)\]/g, 'border-[#6C5CE7] dark:border-indigo-500');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

if (fs.existsSync(targetDir)) {
  const files = fs.readdirSync(targetDir);
  for (const file of files) {
    if (file.endsWith('.tsx')) {
      processFile(path.join(targetDir, file));
    }
  }
} else {
  console.log('Target directory does not exist');
}
