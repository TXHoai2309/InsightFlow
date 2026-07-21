const fs = require('fs');
const path = require('path');

const targetFile = 'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\admin\\AdminBrandManagerPage.tsx';

function beautifyFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Text Colors
  content = content.replace(/text-\[var\(--color-text-primary\)\]/g, 'text-app-text');
  content = content.replace(/text-\[var\(--color-text-secondary\)\]/g, 'text-app-text-secondary');
  content = content.replace(/text-\[var\(--color-text-muted\)\]/g, 'text-app-text-muted');
  
  // 2. Backgrounds
  content = content.replace(/bg-\[var\(--color-bg-surface\)\]/g, 'bg-app-surface backdrop-blur-md');
  content = content.replace(/bg-\[var\(--color-bg-surface-raised\)\]/g, 'bg-app-surface-raised');
  
  // 3. Borders
  content = content.replace(/border-\[var\(--color-border\)\]/g, 'border-app-border');
  content = content.replace(/border-\[var\(--color-border-strong\)\]/g, 'border-app-border-strong');
  
  // 4. Brand Colors
  content = content.replace(/text-\[var\(--color-brand\)\]/g, 'text-app-brand');
  content = content.replace(/bg-\[var\(--color-brand\)\]/g, 'bg-app-brand');
  content = content.replace(/bg-\[var\(--color-brand-subtle\)\]/g, 'bg-app-brand-subtle');
  content = content.replace(/border-\[var\(--color-brand\)\]/g, 'border-[var(--color-brand)]');
  content = content.replace(/hover:text-\[var\(--color-brand\)\]/g, 'hover:text-app-brand');
  content = content.replace(/hover:bg-\[var\(--color-brand-subtle\)\]/g, 'hover:bg-app-brand-subtle');
  content = content.replace(/hover:border-\[var\(--color-brand\)\]/g, 'hover:border-[var(--color-brand)]');
  content = content.replace(/focus:border-\[var\(--color-brand\)\]/g, 'focus:border-[var(--color-brand)]');
  content = content.replace(/focus:ring-\[var\(--color-brand\)\]\/15/g, 'focus:ring-[var(--color-brand)]/20');
  content = content.replace(/hover:bg-\[var\(--color-brand-hover\)\]/g, 'hover:bg-[var(--color-brand-hover)]');

  // 5. Success/Warning/Error Colors
  content = content.replace(/text-\[var\(--color-success\)\]/g, 'text-[var(--color-success)]');
  content = content.replace(/text-\[var\(--color-error\)\]/g, 'text-[var(--color-error)]');
  content = content.replace(/text-\[var\(--color-warning\)\]/g, 'text-[var(--color-warning)]');

  // 6. Aesthetic Enhancements
  // Make standard buttons more interactive
  content = content.replace(/transition hover:bg-app-surface-raised/g, 'transition-all duration-300 hover:bg-app-surface-raised hover:-translate-y-0.5 active:translate-y-0');
  content = content.replace(/transition hover:bg-\[var\(--color-brand-hover\)\]/g, 'transition-all duration-300 hover:bg-[var(--color-brand-hover)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--color-brand)]/20 active:translate-y-0');
  
  // Make cards prettier
  content = content.replace(/shadow-sm/g, 'shadow-sm hover:shadow-md transition-shadow duration-300');
  content = content.replace(/shadow-xl/g, 'shadow-2xl shadow-black/20');

  // Add subtle gradient to the main Header
  content = content.replace(/Admin Console<\/p>/g, 'Admin Console</p>'); // Just a marker
  content = content.replace(/className="rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6 md:p-7"/g, 'className="relative overflow-hidden rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6 md:p-7 shadow-sm"');
  
  // Insert a subtle background glow for the header section
  const headerGlow = `<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-brand)] opacity-[0.03] blur-3xl pointer-events-none" />\n          <p`;
  content = content.replace(/<p className="text-\[12px\] font-bold uppercase/g, headerGlow + ' className="text-[12px] font-bold uppercase');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully beautified ${filePath}`);
  } else {
    console.log(`No changes made to ${filePath}`);
  }
}

if (fs.existsSync(targetFile)) {
  beautifyFile(targetFile);
} else {
  console.log('Target file does not exist');
}
