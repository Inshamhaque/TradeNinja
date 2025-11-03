const { met } = require('./metrics');

function chr(arr, hgt = 12, wdt = 50, mrk = []) {
  const mn = Math.min(...arr);
  const mx = Math.max(...arr);
  const rng = mx - mn;
  if (rng === 0) return '';
  
  const lns = Array(hgt).fill('').map(() => ' '.repeat(wdt));
  
  for (let i = 0; i < arr.length; i++) {
    const x = Math.floor((i / arr.length) * wdt);
    const y = hgt - 1 - Math.floor(((arr[i] - mn) / rng) * (hgt - 1));
    const row = lns[y].split('');
    row[x] = '*';
    lns[y] = row.join('');
  }
  
  for (const m of mrk) {
    const x = Math.floor((m.idx / arr.length) * wdt);
    const y = hgt - 1 - Math.floor(((arr[m.idx] - mn) / rng) * (hgt - 1));
    if (y >= 0 && y < hgt && x >= 0 && x < wdt) {
      const row = lns[y].split('');
      row[x] = m.typ === 'B' ? '▲' : '▼';
      lns[y] = row.join('');
    }
  }
  
  let out = '';
  const fmt = n => n.toFixed(2).padStart(7);
  for (let i = 0; i < lns.length; i++) {
    const val = mx - (i / (hgt - 1)) * rng;
    out += fmt(val) + ' |' + lns[i] + '\n';
  }
  out += '        +' + '-'.repeat(wdt) + '\n';
  return out;
}

function shw(res, fmt = 'text') {
  const mtr = met(res);
  const { prc, trd, cfg, stg } = res;
  
  if (fmt === 'json') {
    console.log(JSON.stringify({ strategy: stg, metrics: mtr, trades: trd }, null, 2));
    return;
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('  BACKTEST RESULTS');
  console.log('═'.repeat(60));
  
  let stgTxt = stg.toUpperCase();
  if (stg === 'sma') stgTxt += ` (${cfg.sht}/${cfg.lng})`;
  else if (stg === 'rsi') stgTxt += ` (${cfg.per || 14})`;
  
  console.log(`Strategy: ${stgTxt}`);
  console.log(`Period: ${prc.length} days`);
  console.log(`Capital: $${cfg.cap || 10000}`);
  console.log('');
  console.log('PERFORMANCE:');
  console.log(`  Return:        ${mtr.ret > 0 ? '+' : ''}${mtr.ret.toFixed(2)}%`);
  console.log(`  Sharpe Ratio:  ${mtr.shp.toFixed(2)}`);
  console.log(`  Max Drawdown:  -${mtr.mxd.toFixed(2)}%`);
  console.log(`  Win Rate:      ${mtr.wnr.toFixed(1)}%`);
  console.log(`  Profit Factor: ${mtr.pft.toFixed(2)}`);
  console.log('');
  console.log(`TRADES: ${mtr.ttl} total (${mtr.wns} wins, ${mtr.lss} losses)`);
  if (mtr.ttl > 0) {
    console.log(`  Avg Win:   +$${mtr.avgWn.toFixed(2)}`);
    console.log(`  Avg Loss:  -$${mtr.avgLs.toFixed(2)}`);
    console.log(`  Best:      +$${mtr.bst.toFixed(2)}`);
    console.log(`  Worst:     $${mtr.wst.toFixed(2)}`);
  }
  console.log('');
  console.log('PRICE CHART:');
  const mrk = trd.map(t => ({ idx: t.idx, typ: t.typ }));
  console.log(chr(prc, 12, 50, mrk));
  
  if (trd.filter(t => t.pnl !== undefined).length > 0) {
    console.log('RECENT TRADES (Last 10):');
    const rcnt = trd.filter(t => t.pnl !== undefined).slice(-10);
    for (const t of rcnt) {
      const pnl = t.pnl > 0 ? `+$${t.pnl.toFixed(2)}` : `$${t.pnl.toFixed(2)}`;
      const pct = ((t.ext - t.prc) / t.prc * 100).toFixed(1);
      console.log(`  ${t.dte} → ${t.exd}: ${pnl} (${pct}%)`);
    }
  }
  console.log('═'.repeat(60) + '\n');
}

function cmp(dat, stgs, cfg) {
  const { run } = require('./engine');
  console.log('\n' + '═'.repeat(70));
  console.log('  STRATEGY COMPARISON');
  console.log('═'.repeat(70));
  
  const res = [];
  for (const s of stgs) {
    const r = run(s, dat, cfg);
    const m = met(r);
    res.push({ stg: s, mtr: m });
  }
  
  console.log('Strategy'.padEnd(15) + 'Return'.padStart(10) + 'Sharpe'.padStart(10) + 'Drawdown'.padStart(12) + 'WinRate'.padStart(10) + 'Trades'.padStart(10));
  console.log('-'.repeat(70));
  
  for (const r of res) {
    const stg = r.stg.toUpperCase().padEnd(15);
    const ret = (r.mtr.ret > 0 ? '+' : '') + r.mtr.ret.toFixed(1) + '%';
    const shp = r.mtr.shp.toFixed(2);
    const mxd = '-' + r.mtr.mxd.toFixed(1) + '%';
    const wnr = r.mtr.wnr.toFixed(0) + '%';
    const trd = r.mtr.ttl.toString();
    console.log(stg + ret.padStart(10) + shp.padStart(10) + mxd.padStart(12) + wnr.padStart(10) + trd.padStart(10));
  }
  console.log('═'.repeat(70) + '\n');
}

module.exports = { chr, shw, cmp };
