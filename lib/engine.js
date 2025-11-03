const { getSig } = require('./strategies');

function run(stg, dat, cfg) {
  const prc = dat.map(d => d.cls);
  const dte = dat.map(d => d.dte);
  const sig = getSig(stg, prc, cfg);
  
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

module.exports = { run };
