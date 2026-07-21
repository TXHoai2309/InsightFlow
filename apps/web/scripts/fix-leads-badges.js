const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\lead-monitoring';

function fixDir(d) {
  if (!fs.existsSync(d)) return;
  const files = fs.readdirSync(d);
  files.forEach(file => {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix background pastels
      content = content.replace(/bg-\[#FFE2C7\](?!.*dark:bg-orange)/g, 'bg-[#FFE2C7] dark:bg-orange-900/30');
      content = content.replace(/bg-\[#E2DFFF\](?!.*dark:bg-indigo)/g, 'bg-[#E2DFFF] dark:bg-indigo-900/30');
      content = content.replace(/bg-\[#D7F4E2\](?!.*dark:bg-green)/g, 'bg-[#D7F4E2] dark:bg-green-900/30');
      content = content.replace(/bg-\[#FFF1D6\](?!.*dark:bg-orange)/g, 'bg-[#FFF1D6] dark:bg-orange-900/30');
      content = content.replace(/bg-\[#FFF4F2\](?!.*dark:bg-red)/g, 'bg-[#FFF4F2] dark:bg-red-900/10');
      
      // Fix missing text darks on tags
      content = content.replace(/text-\[#5B2A00\](?!.*dark:text-orange)/g, 'text-[#5B2A00] dark:text-orange-400');
      content = content.replace(/text-\[#0F0069\](?!.*dark:text-indigo)/g, 'text-[#0F0069] dark:text-indigo-400');
      content = content.replace(/text-\[#410002\](?!.*dark:text-red)/g, 'text-[#410002] dark:text-red-400');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  });
}

fixDir(dir);
console.log('Fixed badges in lead-monitoring');
