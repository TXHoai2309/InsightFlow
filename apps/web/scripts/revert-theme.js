const fs = require('fs');
const path = require('path');

const targetDirs = [
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\brand-manager',
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\admin',
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\alerts',
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\leads',
  'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\app\\leads\\page.tsx'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Revert Texts
  content = content.replace(/text-gray-900 dark:text-gray-100/g, 'text-app-text');
  content = content.replace(/text-gray-700 dark:text-gray-300/g, 'text-app-text-secondary');
  content = content.replace(/text-gray-500 dark:text-gray-400/g, 'text-app-text-muted');
  
  // Revert Backgrounds
  content = content.replace(/bg-surface-card/g, 'bg-app-surface');
  content = content.replace(/bg-surface-raised/g, 'bg-app-surface-raised');
  
  // Revert Borders
  content = content.replace(/border-app/g, 'border-app-border');

  // Revert Brand colors
  content = content.replace(/text-\[\#6C5CE7\] dark:text-indigo-400/g, 'text-app-brand');
  content = content.replace(/bg-\[\#6C5CE7\] dark:bg-indigo-600/g, 'bg-app-brand');
  content = content.replace(/bg-\[\#6C5CE7\]\/10 dark:bg-indigo-900\/30/g, 'bg-app-brand-subtle');
  content = content.replace(/border-\[\#6C5CE7\]\/20 dark:border-indigo-500\/30/g, 'border-[var(--color-brand-border)]');
  content = content.replace(/shadow-indigo-500/g, 'shadow-[var(--color-brand)]');
  content = content.replace(/border-\[\#6C5CE7\] dark:border-indigo-500/g, 'border-app-brand');
  content = content.replace(/ring-\[\#6C5CE7\] dark:ring-indigo-500/g, 'ring-[var(--color-brand)]');
  content = content.replace(/hover:border-\[\#6C5CE7\] dark:hover:border-indigo-500/g, 'hover:border-app-brand');
  content = content.replace(/hover:text-\[\#6C5CE7\] dark:hover:text-indigo-400/g, 'hover:text-app-brand');
  content = content.replace(/hover:bg-\[\#6C5CE7\]\/10 dark:hover:bg-indigo-900\/30/g, 'hover:bg-app-brand-subtle');

  // Revert Error/Warning
  content = content.replace(/text-red-600 dark:text-red-400/g, 'text-[var(--color-error)]');
  content = content.replace(/bg-red-50 dark:bg-red-900\/20/g, 'bg-[var(--color-error-subtle)]');
  content = content.replace(/border-red-100 dark:border-red-900\/30/g, 'border-[var(--color-error)]/20');
  
  content = content.replace(/text-amber-600 dark:text-amber-400/g, 'text-[var(--color-warning)]');
  content = content.replace(/bg-amber-50 dark:bg-amber-900\/20/g, 'bg-[var(--color-warning-subtle)]');
  content = content.replace(/border-amber-100 dark:border-amber-900\/30/g, 'border-[var(--color-warning)]/30');
  content = content.replace(/border-amber-200 dark:border-amber-900\/40/g, 'border-[var(--color-warning)]/40');

  // Revert Success
  content = content.replace(/text-emerald-600 dark:text-emerald-400/g, 'text-[var(--color-success)]');

  // Revert Recharts Inline Styles
  content = content.replace(/'#1A1B20'/g, '"var(--color-bg-surface)"');
  content = content.replace(/'#272A35'/g, '"var(--color-border)"');
  content = content.replace(/'#6C5CE7'/g, '"var(--color-brand)"');
  content = content.replace(/'rgba\(108, 92, 231, 0.1\)'/g, '"var(--color-brand-subtle)"');
  content = content.replace(/'#ef4444'/g, '"var(--color-error)"');
  content = content.replace(/'#f59e0b'/g, '"var(--color-warning)"');
  content = content.replace(/'#F1F5F9'/g, '"var(--color-text-primary)"');
  content = content.replace(/'#CBD5E1'/g, '"var(--color-text-secondary)"');
  content = content.replace(/'#94A3B8'/g, '"var(--color-text-muted)"');
  content = content.replace(/'#10b981'/g, '"var(--color-success)"');

  // Also catch double quotes where single quotes were used
  content = content.replace(/"#1A1B20"/g, '"var(--color-bg-surface)"');
  content = content.replace(/"#272A35"/g, '"var(--color-border)"');
  content = content.replace(/"#6C5CE7"/g, '"var(--color-brand)"');
  content = content.replace(/"rgba\(108, 92, 231, 0.1\)"/g, '"var(--color-brand-subtle)"');
  content = content.replace(/"#ef4444"/g, '"var(--color-error)"');
  content = content.replace(/"#f59e0b"/g, '"var(--color-warning)"');
  content = content.replace(/"#F1F5F9"/g, '"var(--color-text-primary)"');
  content = content.replace(/"#CBD5E1"/g, '"var(--color-text-secondary)"');
  content = content.replace(/"#94A3B8"/g, '"var(--color-text-muted)"');
  content = content.replace(/"#10b981"/g, '"var(--color-success)"');

  // Cleanup old raw variable classes if they exist to the new standard ones
  content = content.replace(/bg-\[var\(--color-bg-surface\)\]/g, 'bg-app-surface');
  content = content.replace(/bg-\[var\(--color-bg-surface-raised\)\]/g, 'bg-app-surface-raised');
  content = content.replace(/text-\[var\(--color-text-primary\)\]/g, 'text-app-text');
  content = content.replace(/text-\[var\(--color-text-secondary\)\]/g, 'text-app-text-secondary');
  content = content.replace(/text-\[var\(--color-text-muted\)\]/g, 'text-app-text-muted');
  content = content.replace(/border-\[var\(--color-border\)\]/g, 'border-app-border');
  content = content.replace(/text-\[var\(--color-brand\)\]/g, 'text-app-brand');
  content = content.replace(/bg-\[var\(--color-brand\)\]/g, 'bg-app-brand');
  content = content.replace(/bg-\[var\(--color-brand-subtle\)\]/g, 'bg-app-brand-subtle');
  content = content.replace(/border-\[var\(--color-brand\)\]/g, 'border-app-brand');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Reverted ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    if (dir.endsWith('.tsx') || dir.endsWith('.ts')) {
      processFile(dir);
    }
    return;
  }
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

for (const target of targetDirs) {
  walkDir(target);
}
