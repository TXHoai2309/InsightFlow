const fs = require('fs');

const targetFile = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/components/profile/SecurityTab.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// We'll split the content line by line and build the resolved file by taking only the HEAD part
const lines = content.split('\n');
const resolvedLines = [];
let state = 'NORMAL'; // NORMAL, HEAD, THEIRS

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('<<<<<<< HEAD')) {
    state = 'HEAD';
  } else if (line.startsWith('=======')) {
    state = 'THEIRS';
  } else if (line.startsWith('>>>>>>> origin/Lead')) {
    state = 'NORMAL';
  } else {
    if (state === 'NORMAL' || state === 'HEAD') {
      resolvedLines.push(line);
    }
  }
}

fs.writeFileSync(targetFile, resolvedLines.join('\n'));
console.log('Resolved merge conflicts by keeping HEAD.');
