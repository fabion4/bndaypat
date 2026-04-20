/**
 * candles.js — Classificazione candele e calcolo regimi di mercato.
 */

import { median } from './stats.js';

/**
 * Classifica una candela come U (up), D (down) o J (doji).
 * Body > 25% del range → direzionale; altrimenti doji.
 */
export function classifyCandle(o, h, l, c) {
  const range = h - l;
  if (range === 0) return 'J';
  const body = Math.abs(c - o);
  if (body / range <= 0.25) return 'J';
  return c > o ? 'U' : 'D';
}

export function classifyAll(data) {
  return data.map(d => ({
    ...d,
    type: classifyCandle(d.open, d.high, d.low, d.close)
  }));
}

/** Simple Moving Average */
export function calcSMA(data, period) {
  const sma = new Array(data.length).fill(null);
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j].close;
    sma[i] = sum / period;
  }
  return sma;
}

/** Average True Range */
export function calcATR(data, period) {
  const tr = new Array(data.length).fill(0);
  tr[0] = data[0].high - data[0].low;
  for (let i = 1; i < data.length; i++) {
    const hl = data[i].high - data[i].low;
    const hc = Math.abs(data[i].high - data[i - 1].close);
    const lc = Math.abs(data[i].low - data[i - 1].close);
    tr[i] = Math.max(hl, hc, lc);
  }
  const atr = new Array(data.length).fill(null);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += tr[i];
  atr[period - 1] = sum / period;
  for (let i = period; i < data.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }
  return atr;
}

/**
 * Calcola il regime di mercato per ogni candela.
 * Trend: BULL se close > SMA(50), BEAR altrimenti.
 * Volatility: HIGH se ATR(14) > mediana storica ATR, LOW altrimenti.
 */
export function calcRegimes(data) {
  const sma50 = calcSMA(data, 50);
  const atr14 = calcATR(data, 14);
  const validATR = atr14.filter(v => v !== null);
  const medATR = median(validATR);

  return data.map((d, i) => {
    if (sma50[i] === null || atr14[i] === null) return 'N/A';
    const trend = d.close > sma50[i] ? 'BULL' : 'BEAR';
    const vol = atr14[i] > medATR ? 'HIGH' : 'LOW';
    return trend + '+' + vol;
  });
}

/**
 * Aggregazione settimanale (lunedì - domenica).
 */
export function aggregateWeekly(dailyData) {
  const weeks = [];
  let current = null;
  for (const d of dailyData) {
    const dt = new Date(d.date);
    const day = dt.getDay();
    if (!current || (day === 1 && current.count > 0)) {
      if (current && current.count > 0) weeks.push(current.candle);
      current = {
        candle: { date: d.date, open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume || 0 },
        count: 1
      };
    } else {
      current.candle.high = Math.max(current.candle.high, d.high);
      current.candle.low = Math.min(current.candle.low, d.low);
      current.candle.close = d.close;
      current.candle.volume = (current.candle.volume || 0) + (d.volume || 0);
      current.count++;
    }
  }
  if (current && current.count > 0) weeks.push(current.candle);
  return weeks;
}
