const fs = require('fs');

function ldf(pth) {
  try {
    return fs.readFileSync(pth, 'utf8');
  } catch (e) {
    console.error(`Error: Cannot read file '${pth}'`);
    process.exit(1);
  }
}

function prs(csv) {
  const lns = csv.trim().split('\n');
  const dat = [];
  for (let i = 1; i < lns.length; i++) {
    const pts = lns[i].split(',');
    if (pts.length >= 2) {
      dat.push({ dte: pts[0].trim(), cls: parseFloat(pts[1]) });
    }
  }
  if (dat.length === 0) {
    console.error('Error: No valid data found in CSV');
    process.exit(1);
  }
  return dat;
}

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

module.exports = { ldf, prs, arg };