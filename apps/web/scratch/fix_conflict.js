const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/app/alerts/page.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const headIdx = lines.findIndex(l => l.startsWith('<<<<<<< HEAD'));
if (headIdx !== -1) {
    const equalsIdx = lines.findIndex((l, i) => i > headIdx && l.startsWith('======='));
    const tailIdx = lines.findIndex((l, i) => i > equalsIdx && l.startsWith('>>>>>>>'));

    if (equalsIdx !== -1 && tailIdx !== -1) {
        // We want to KEEP what is between ======= and >>>>>>>
        // So we delete from <<<<<<< HEAD (inclusive) to ======= (inclusive)
        lines.splice(headIdx, equalsIdx - headIdx + 1);
        
        // The tail marker also needs to be deleted
        const newTailIdx = tailIdx - (equalsIdx - headIdx + 1);
        lines.splice(newTailIdx, 1);
        
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log('Merge conflict markers resolved successfully.');
    } else {
        console.log('Could not find matching ======= or >>>>>>>');
    }
} else {
    console.log('Could not find <<<<<<< HEAD');
}
