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
  
  return { 
    ret, shp, mxd: mxd * 100, wnr, pft, 
    avgWn, avgLs, bst, wst, 
    ttl: cmp.length, wns: wns.length, lss: lss.length 
  };
}

module.exports = { met };
