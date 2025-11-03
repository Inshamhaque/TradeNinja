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

module.exports = { sma, ema, rsi, mcd };
