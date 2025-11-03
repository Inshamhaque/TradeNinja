const fs = require('fs');
const pth = require('path');

// ============================================
// CLI ARGUMENT PARSER
// ============================================
function arg() {
  const cmd = process.argv[2];
  const flg = {};
  const pos = [];
  
  for (let i = 3; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = process.argv[i + 1];
      flg[k] = v && !v.startsWith('--') ? v : true;
      if (v && !v.startsWith('--')) i++;
    } else if (a.startsWith('-')) {
      const k = a.slice(1);
      const v = process.argv[i + 1];
      flg[k] = v && !v.startsWith('-') ? v : true;
      if (v && !v.startsWith('-')) i++;
    } else {
      pos.push(a);
    }
  }
  
  return { cmd, flg, pos };
}
