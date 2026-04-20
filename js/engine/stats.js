/**
 * stats.js — Funzioni statistiche di base
 * Modulo puro senza side-effects. Tutte le funzioni sono deterministiche.
 */

export function pct(n, d) { return d === 0 ? 0 : (n / d) * 100; }

export function mean(arr) {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function median(arr) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

export function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = (p / 100) * (s.length - 1);
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo);
}

export function sharpe(arr) {
  const s = stdev(arr);
  return s === 0 ? 0 : mean(arr) / s;
}

/**
 * Normal CDF — Abramowitz & Stegun approximation.
 * Accurate to ~7.5e-8.
 */
export function normalCDF(z) {
  if (z < -8) return 0;
  if (z > 8) return 1;
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429;
  const p=0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  const erf = 1 - ((((a5*t+a4)*t+a3)*t+a2)*t+a1) * t * Math.exp(-x*x);
  return 0.5 * (1 + sign * erf);
}

/**
 * Two-tailed z-test for proportions.
 * H0: p = p0 (default 0.5). H1: p != p0.
 * Input: wrObserved in percentage (0-100).
 */
export function zTestProportion(wrObserved, n, p0 = 0.5) {
  if (n < 2) return { z: 0, pValue: 1 };
  const p = wrObserved / 100;
  const se = Math.sqrt(p0 * (1 - p0) / n);
  if (se === 0) return { z: 0, pValue: 1 };
  const z = (p - p0) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  return { z: parseFloat(z.toFixed(3)), pValue: parseFloat(pValue.toFixed(4)) };
}
