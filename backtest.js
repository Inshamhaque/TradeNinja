#!/usr/bin/env node

// TRADING BACKTESTER CLI
// Usage: backtest <command> [options]

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

// ============================================
// FILE OPERATIONS
// ============================================
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

// ============================================
// TECHNICAL INDICATORS
// ============================================
function sma(arr, per) {
  const res = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < per - 1) {
      res.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < per; j++) sum += arr[i - j];
      res.push(sum / per);
    }
  }
  return res;
}

function ema(arr, per) {
  const res = [];
  const k = 2 / (per + 1);
  let prv = arr[0];
  res.push(prv);
  for (let i = 1; i < arr.length; i++) {
    const cur = arr[i] * k + prv * (1 - k);
    res.push(cur);
    prv = cur;
  }
  return res;
}

function rsi(arr, per = 14) {
  const res = [];
  const gns = [];
  const lss = [];
  
  for (let i = 1; i < arr.length; i++) {
    const chg = arr[i] - arr[i - 1];
    gns.push(chg > 0 ? chg : 0);
    lss.push(chg < 0 ? -chg : 0);
  }
  
  for (let i = 0; i < arr.length; i++) {
    if (i < per) {
      res.push(null);
    } else {
      let avgGn = 0, avgLs = 0;
      for (let j = 0; j < per; j++) {
        avgGn += gns[i - j - 1];
        avgLs += lss[i - j - 1];
      }
      avgGn /= per;
      avgLs /= per;
      const rs = avgLs === 0 ? 100 : avgGn / avgLs;
      res.push(100 - (100 / (1 + rs)));
    }
  }
  return res;
}

function mcd(arr) {
  const e12 = ema(arr, 12);
  const e26 = ema(arr, 26);
  const mac = e12.map((v, i) => v - e26[i]);
  const sig = ema(mac, 9);
  const hst = mac.map((v, i) => v - sig[i]);
  return { mac, sig, hst };
}

// ============================================
// TRADING STRATEGIES
// ============================================
function stgSma(prc, cfg) {
  const sh = sma(prc, cfg.sht);
  const lg = sma(prc, cfg.lng);
  const sig = ['H'];
  
  for (let i = 1; i < prc.length; i++) {
    if (sh[i] === null || lg[i] === null) sig.push('H');
    else if (sh[i] > lg[i] && sh[i - 1] <= lg[i - 1]) sig.push('B');
    else if (sh[i] < lg[i] && sh[i - 1] >= lg[i - 1]) sig.push('S');
    else sig.push('H');
  }
  return sig;
}

function stgRsi(prc, cfg) {
  const r = rsi(prc, cfg.per || 14);
  return r.map(v => {
    if (v === null) return 'H';
    if (v < (cfg.low || 30)) return 'B';
    if (v > (cfg.hgh || 70)) return 'S';
    return 'H';
  });
}

function stgMcd(prc) {
  const { mac, sig: sgn } = mcd(prc);
  const res = ['H'];
  for (let i = 1; i < prc.length; i++) {
    if (mac[i] > sgn[i] && mac[i - 1] <= sgn[i - 1]) res.push('B');
    else if (mac[i] < sgn[i] && mac[i - 1] >= sgn[i - 1]) res.push('S');
    else res.push('H');
  }
  return res;
}

// ============================================
// BACKTESTING ENGINE
// ============================================
function run(stg, dat, cfg) {
  const prc = dat.map(d => d.cls);
  const dte = dat.map(d => d.dte);
  
  let sig;
  if (stg === 'sma') sig = stgSma(prc, cfg);
  else if (stg === 'rsi') sig = stgRsi(prc, cfg);
  else if (stg === 'macd') sig = stgMcd(prc);
  else {
    console.error(`Error: Unknown strategy '${stg}'`);
    process.exit(1);
  }
  
  let bal = cfg.cap || 10000;
  let pos = 0;
  let ent = 0;
  const trd = [];
  const eqy = [];
  
  for (let i = 0; i < prc.length; i++) {
    if (sig[i] === 'B' && pos === 0) {
      pos = Math.floor(bal / prc[i]);
      ent = prc[i];
      bal -= pos * prc[i];
      trd.push({ dte: dte[i], typ: 'B', prc: prc[i], qty: pos, idx: i });
    } else if (sig[i] === 'S' && pos > 0) {
      const pnl = (prc[i] - ent) * pos;
      bal += pos * prc[i];
      trd[trd.length - 1].ext = prc[i];
      trd[trd.length - 1].pnl = pnl;
      trd[trd.length - 1].exd = dte[i];
      trd[trd.length - 1].exi = i;
      pos = 0;
    }
    eqy.push(bal + (pos * prc[i]));
  }
  
  if (pos > 0) {
    const pnl = (prc[prc.length - 1] - ent) * pos;
    bal += pos * prc[prc.length - 1];
    trd[trd.length - 1].ext = prc[prc.length - 1];
    trd[trd.length - 1].pnl = pnl;
    trd[trd.length - 1].exd = dte[dte.length - 1];
    trd[trd.length - 1].exi = prc.length - 1;
  }
  
  return { prc, dte, eqy, trd, cfg, stg };
}

// ============================================
// PERFORMANCE METRICS
// ============================================
function met(res) {
  const { eqy, trd, cfg } = res;
  const ini = cfg.cap || 10000;
  const fnl = eqy[eqy.length - 1];
  
  const ret = ((fnl - ini) / ini) * 100;
  const cmp = trd.filter(t => t.pnl !== undefined);
  const wns = cmp.filter(t => t.pnl > 0);
  const lss = cmp.filter(t => t.pnl < 0);
  const wnr = cmp.length > 0 ? (wns.length / cmp.length) * 100 : 0;
  
  const avgWn = wns.length > 0 ? wns.reduce((s, t) => s + t.pnl, 0) / wns.length : 0;
  const avgLs = lss.length > 0 ? lss.reduce((s, t) => s + Math.abs(t.pnl), 0) / lss.length : 0;
  const bst = cmp.length > 0 ? Math.max(...cmp.map(t => t.pnl)) : 0;
  const wst = cmp.length > 0 ? Math.min(...cmp.map(t => t.pnl)) : 0;
  
  const ttlWn = wns.reduce((s, t) => s + t.pnl, 0);
  const ttlLs = Math.abs(lss.reduce((s, t) => s + t.pnl, 0));
  const pft = ttlLs > 0 ? ttlWn / ttlLs : 0;
  
  const rtn = [];
  for (let i = 1; i < eqy.length; i++) {
    rtn.push((eqy[i] - eqy[i - 1]) / eqy[i - 1]);
  }
  const avg = rtn.reduce((s, r) => s + r, 0) / rtn.length;
  const std = Math.sqrt(rtn.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / rtn.length);
  const shp = std > 0 ? (avg / std) * Math.sqrt(252) : 0;
  
  let mxd = 0;
  let pek = eqy[0];
  for (const e of eqy) {
    if (e > pek) pek = e;
    const drw = (pek - e) / pek;
    if (drw > mxd) mxd = drw;
  }
  
  return { ret, shp, mxd: mxd * 100, wnr, pft, avgWn, avgLs, bst, wst, ttl: cmp.length, wns: wns.length, lss: lss.length };
}

// ============================================
// ASCII CHART GENERATOR
// ============================================
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

// ============================================
// DISPLAY FUNCTIONS
// ============================================
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

// ============================================
// CLI COMMANDS
// ============================================
function hlp() {
  console.log(`
Trading Backtester CLI v1.0

USAGE:
  backtest <command> [options]

COMMANDS:
  run <file>        Run backtest on CSV file
  compare <file>    Compare multiple strategies
  list              List available strategies
  help              Show this help message

OPTIONS:
  --strategy, -s    Strategy name (sma|rsi|macd) [default: sma]
  --short           Short period for SMA [default: 20]
  --long            Long period for SMA [default: 50]
  --period, -p      RSI period [default: 14]
  --low             RSI oversold level [default: 30]
  --high            RSI overbought level [default: 70]
  --capital, -c     Starting capital [default: 10000]
  --output, -o      Output format (text|json) [default: text]
  --strategies      Comma-separated strategies for compare [default: sma,rsi,macd]

EXAMPLES:
  backtest run data.csv --strategy sma --short 10 --long 30
  backtest run data.csv -s rsi -p 14 --low 30 --high 70
  backtest compare data.csv --strategies sma,rsi,macd
  backtest compare data.csv -c 50000

CSV FORMAT:
  Date,Close
  2024-01-01,150.00
  2024-01-02,152.50
  ...
`);
}

function lst() {
  console.log(`
Available Strategies:

1. SMA (Simple Moving Average Crossover)
   - Parameters: --short, --long
   - Example: backtest run data.csv -s sma --short 20 --long 50
   - Buys when short MA crosses above long MA

2. RSI (Relative Strength Index)
   - Parameters: --period, --low, --high
   - Example: backtest run data.csv -s rsi --period 14 --low 30 --high 70
   - Buys when RSI < low, sells when RSI > high

3. MACD (Moving Average Convergence Divergence)
   - Parameters: none (uses standard 12/26/9)
   - Example: backtest run data.csv -s macd
   - Buys on bullish crossover, sells on bearish crossover
`);
}

function runCmd(a) {
  const fil = a.pos[0];
  if (!fil) {
    console.error('Error: Missing file argument');
    console.log('Usage: backtest run <file> [options]');
    process.exit(1);
  }
  
  const csv = ldf(fil);
  const dat = prs(csv);
  
  const cfg = {
    sht: parseInt(a.flg.short || a.flg.s || '20'),
    lng: parseInt(a.flg.long || a.flg.l || '50'),
    per: parseInt(a.flg.period || a.flg.p || '14'),
    low: parseInt(a.flg.low || '30'),
    hgh: parseInt(a.flg.high || '70'),
    cap: parseInt(a.flg.capital || a.flg.c || '10000')
  };
  
  const stg = (a.flg.strategy || a.flg.s || 'sma').toLowerCase();
  const fmt = (a.flg.output || a.flg.o || 'text').toLowerCase();
  
  const res = run(stg, dat, cfg);
  shw(res, fmt);
}

function cmpCmd(a) {
  const fil = a.pos[0];
  if (!fil) {
    console.error('Error: Missing file argument');
    console.log('Usage: backtest compare <file> [options]');
    process.exit(1);
  }
  
  const csv = ldf(fil);
  const dat = prs(csv);
  
  const cfg = {
    sht: parseInt(a.flg.short || '20'),
    lng: parseInt(a.flg.long || '50'),
    per: parseInt(a.flg.period || '14'),
    low: parseInt(a.flg.low || '30'),
    hgh: parseInt(a.flg.high || '70'),
    cap: parseInt(a.flg.capital || a.flg.c || '10000')
  };
  
  const stgs = (a.flg.strategies || 'sma,rsi,macd').split(',').map(s => s.trim().toLowerCase());
  cmp(dat, stgs, cfg);
}

// ============================================
// MAIN
// ============================================
function main() {
  const a = arg();
  
  if (!a.cmd || a.cmd === 'help') {
    hlp();
  } else if (a.cmd === 'list') {
    lst();
  } else if (a.cmd === 'run') {
    runCmd(a);
  } else if (a.cmd === 'compare') {
    cmpCmd(a);
  } else {
    console.error(`Error: Unknown command '${a.cmd}'`);
    console.log('Run "backtest help" for usage information');
    process.exit(1);
  }
}

main();