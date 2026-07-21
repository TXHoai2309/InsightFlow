const fs = require('fs');
const path = require('path');

const targetDir = 'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\brand-manager';

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
  content = content.replace(/var\(--color-bg-surface\)/g, '#1A1B20'); // for inline styles in recharts
  
  // Borders
  content = content.replace(/border-\[var\(--color-border\)\]/g, 'border-app');
  content = content.replace(/border-\[var\(--color-border-strong\)\]/g, 'border-app');
  content = content.replace(/var\(--color-border\)/g, '#272A35'); // for inline styles in recharts

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
  content = content.replace(/var\(--color-brand\)/g, '#6C5CE7'); // for recharts
  content = content.replace(/var\(--color-brand-subtle\)/g, 'rgba(108, 92, 231, 0.1)'); // for recharts

  // Error/Warning
  content = content.replace(/text-\[var\(--color-error\)\]/g, 'text-red-600 dark:text-red-400');
  content = content.replace(/bg-\[var\(--color-error-subtle\)\]/g, 'bg-red-50 dark:bg-red-900/20');
  content = content.replace(/border-\[var\(--color-error\)\]\/20/g, 'border-red-100 dark:border-red-900/30');
  content = content.replace(/var\(--color-error\)/g, '#ef4444');
  
  content = content.replace(/text-\[var\(--color-warning\)\]/g, 'text-amber-600 dark:text-amber-400');
  content = content.replace(/bg-\[var\(--color-warning-subtle\)\]/g, 'bg-amber-50 dark:bg-amber-900/20');
  content = content.replace(/border-\[var\(--color-warning\)\]\/30/g, 'border-amber-100 dark:border-amber-900/30');
  content = content.replace(/border-\[var\(--color-warning\)\]\/40/g, 'border-amber-200 dark:border-amber-900/40');
  content = content.replace(/var\(--color-warning\)/g, '#f59e0b');

  // Text variables for recharts
  content = content.replace(/var\(--color-text-primary\)/g, '#F1F5F9'); 
  content = content.replace(/var\(--color-text-secondary\)/g, '#CBD5E1'); 
  content = content.replace(/var\(--color-text-muted\)/g, '#94A3B8');

  // Success
  content = content.replace(/text-\[var\(--color-success\)\]/g, 'text-emerald-600 dark:text-emerald-400');
  content = content.replace(/var\(--color-success\)/g, '#10b981');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

if (fs.existsSync(targetDir)) {
  walkDir(targetDir);
} else {
  console.log('Target directory does not exist');
}
