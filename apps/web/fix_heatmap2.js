const fs = require('fs');
const file = 'c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\components\\home\\BrandLandingPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = '<p className="text-[14px] font-bold text-[#1B1B4A] dark:text-white mb-3">Activity Heatmap</p>';
const idx = content.indexOf(targetStr);
if (idx !== -1) {
    const gridDivIdx = content.indexOf('<div className="grid grid-cols-7 gap-1.5">', idx);
    const gridEndIdx = content.indexOf('</div>', gridDivIdx);
    
    // Now insert the legend after gridEndIdx + 6
    const insertPos = gridEndIdx + 6;
    
    const legend = `\n                      <div className="grid grid-cols-7 gap-1.5 mt-1.5">\n                        {['T2','T3','T4','T5','T6','T7','CN'].map(day => (\n                          <div key={day} className="text-[9px] font-bold text-[#6B7090] text-center">{day}</div>\n                        ))}\n                      </div>\n                      <div className="flex items-center justify-between mt-3 text-[9px] font-bold text-[#6B7090]">\n                        <span>Thấp</span>\n                        <div className="flex gap-1">\n                          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#ECE9FF] dark:bg-white/10" />\n                          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#9B8CFF]" />\n                          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#6D5EF6]" />\n                        </div>\n                        <span>Cao</span>\n                      </div>`;
                      
    if (content.includes("['T2','T3','T4','T5','T6','T7','CN']")) {
       console.log("Already added");
    } else {
       content = content.substring(0, insertPos) + legend + content.substring(insertPos);
       fs.writeFileSync(file, content, 'utf8');
       console.log("Success with indexOf");
    }
} else {
    console.log("Target not found");
}
