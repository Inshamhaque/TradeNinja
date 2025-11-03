const { sma, rsi, mcd } = require('./indicators');

function stgSma(prc, cfg) {
  const sh = sma(prc, cfg.sht);
  const lg = sma(prc, cfg.lng);
  const sig = ['H'];

  for (let i = 1; i < prc.length; i++) {
    if (sh[i] == null || lg[i] == null) {
      sig.push('H');
      continue;
    }

    const prevCross = sh[i - 1] - lg[i - 1];
    const currCross = sh[i] - lg[i];

    if (currCross > 0 && prevCross <= 0) sig.push('B');
    else if (currCross < 0 && prevCross >= 0) sig.push('S');
    else sig.push('H');
  }

  return sig;
}


function stgRsi(prc, cfg) {
  const r = rsi(prc, cfg.per || 14);
  const low = cfg.low || 30;
  const high = cfg.hgh || 70;
  const sig = ['H'];
  let lastAction = 'H';

  for (let i = 1; i < prc.length; i++) {
    if (r[i] == null) {
      sig.push('H');
      continue;
    }

    if (r[i] < low && lastAction !== 'B') {
      sig.push('B');
      lastAction = 'B';
    } else if (r[i] > high && lastAction !== 'S') {
      sig.push('S');
      lastAction = 'S';
    } else {
      sig.push('H');
    }
  }

  return sig;
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

function getSig(stg, prc, cfg) {
  if (stg === 'sma') return stgSma(prc, cfg);
  if (stg === 'rsi') return stgRsi(prc, cfg);
  if (stg === 'macd') return stgMcd(prc);
  console.error(`Error: Unknown strategy '${stg}'`);
  process.exit(1);
}

module.exports = { stgSma, stgRsi, stgMcd, getSig };
