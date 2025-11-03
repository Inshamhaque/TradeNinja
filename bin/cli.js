#!/usr/bin/env node

const { ldf, prs, arg } = require('../lib/utils');
const { run } = require('../lib/engine');
const { shw, cmp } = require('../lib/display');

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

CSV FORMAT:
  Date,Close
  2024-01-01,150.00
  2024-01-02,152.50
`);
}

function lst() {
  console.log(`
Available Strategies:

1. SMA (Simple Moving Average Crossover)
   Parameters: --short, --long
   Example: backtest run data.csv -s sma --short 20 --long 50

2. RSI (Relative Strength Index)
   Parameters: --period, --low, --high
   Example: backtest run data.csv -s rsi --period 14 --low 30 --high 70

3. MACD (Moving Average Convergence Divergence)
   Parameters: none (uses standard 12/26/9)
   Example: backtest run data.csv -s macd
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
    sht: parseInt(a.flg.short || '20'),
    lng: parseInt(a.flg.long || '50'),
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

function main() {
  const a = arg();
  if (!a.cmd || a.cmd === 'help') hlp();
  else if (a.cmd === 'list') lst();
  else if (a.cmd === 'run') runCmd(a);
  else if (a.cmd === 'compare') cmpCmd(a);
  else {
    console.error(`Error: Unknown command '${a.cmd}'`);
    console.log('Run "backtest help" for usage information');
    process.exit(1);
  }
}

main();