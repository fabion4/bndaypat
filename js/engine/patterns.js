/**
 * patterns.js — Motore di analisi pattern e streak.
 */

import { pct, mean, median, percentile, sharpe, zTestProportion } from './stats.js';
import { classifyAll, calcRegimes } from './candles.js';
import { calcFreshness, RECENCY_CONFIG } from './freshness.js';

/**
 * Rileva tutte le streak (sequenze direzionali) nel dataset.
 * Restituisce { "3U": {dir, len, samples: [...]}, ... }
 */
export function analyzeStreaks(data, maxHorizon = 7) {
  const classified = classifyAll(data);
  const results = {};

  for (let i = 0; i < classified.length; i++) {
    const t = classified[i].type;
    if (t === 'J') continue;
    let streakLen = 1;
    while (i - streakLen >= 0 && classified[i - streakLen].type === t) streakLen++;

    const key = streakLen + t;
    const isExact = (i - streakLen < 0) || classified[i - streakLen].type !== t;
    if (!isExact) continue;

    if (!results[key]) results[key] = { dir: t, len: streakLen, samples: [] };

    const entry = { date: classified[i].date, entryPrice: classified[i].close, returns: {}, isRecent: false };
    for (let k = 1; k <= maxHorizon; k++) {
      if (i + k < classified.length) {
        entry.returns[k] = ((classified[i + k].close - classified[i].close) / classified[i].close) * 100;
      }
    }
    results[key].samples.push(entry);
  }
  return results;
}

/**
 * Calcola statistiche complete per ogni streak, incluso p-value e freshness.
 */
export function computeStreakStats(streakData, recencyCutoff) {
  const stats = [];
  for (const [key, info] of Object.entries(streakData)) {
    const { dir, len, samples } = info;
    if (samples.length < 3) continue;

    samples.forEach(s => { s.isRecent = new Date(s.date) >= recencyCutoff; });

    const ret1 = samples.filter(s => s.returns[1] !== undefined).map(s => s.returns[1]);
    const ret2 = samples.filter(s => s.returns[2] !== undefined).map(s => s.returns[2]);
    const ret3 = samples.filter(s => s.returns[3] !== undefined).map(s => s.returns[3]);

    const pUp1 = pct(ret1.filter(r => r > 0).length, ret1.length);
    const pUp2 = pct(ret2.filter(r => r > 0).length, ret2.length);
    const pUp3 = pct(ret3.filter(r => r > 0).length, ret3.length);

    const recentSamples = samples.filter(s => s.isRecent);
    const recentRet1 = recentSamples.filter(s => s.returns[1] !== undefined).map(s => s.returns[1]);
    const wrRecent = recentRet1.length > 0 ? pct(recentRet1.filter(r => r > 0).length, recentRet1.length) : null;
    const freshness = calcFreshness(pUp1, wrRecent, recentRet1.length);

    const zTest = zTestProportion(pUp1, ret1.length);

    stats.push({
      key, dir, len,
      n: samples.length,
      pUp1, pUp2, pUp3,
      meanRet: mean(ret1), medRet: median(ret1),
      wrRecent, nRecent: recentRet1.length,
      freshness,
      zScore: zTest.z, pValue: zTest.pValue,
      samples
    });
  }
  stats.sort((a, b) => a.dir === b.dir ? a.len - b.len : (a.dir === 'U' ? -1 : 1));
  return stats;
}

/**
 * Calcola probabilità di superare soglie di rendimento.
 */
export function computeThresholds(samples, thresholds = [0.5, 1, 2, 3, 5], horizons = [1, 2, 3, 5, 7]) {
  const result = [];
  for (const thr of thresholds) {
    const row = { threshold: thr };
    for (const h of horizons) {
      const valid = samples.filter(s => s.returns[h] !== undefined);
      row['h' + h] = valid.length > 0 ? pct(valid.filter(s => s.returns[h] >= thr).length, valid.length) : null;
      row['n' + h] = valid.length;
    }
    result.push(row);
  }
  return result;
}

/**
 * Scansione pattern di lunghezza arbitraria con filtro regime.
 */
export function analyzePatterns(data, patternLen, maxHorizon = 7, regimeFilter = 'all') {
  const classified = classifyAll(data);
  const regimes = calcRegimes(data);
  const results = {};

  for (let i = patternLen - 1; i < classified.length - 1; i++) {
    let pat = '';
    for (let j = i - patternLen + 1; j <= i; j++) pat += classified[j].type;

    if (regimeFilter !== 'all' && regimes[i] !== regimeFilter) continue;

    if (!results[pat]) results[pat] = { pattern: pat, samples: [] };

    const entry = {
      date: classified[i].date,
      entryPrice: classified[i].close,
      entryIndex: i,
      returns: {},
      regime: regimes[i],
      isRecent: false,
    };
    for (let k = 1; k <= maxHorizon; k++) {
      if (i + k < classified.length) {
        entry.returns[k] = ((classified[i + k].close - classified[i].close) / classified[i].close) * 100;
      }
    }
    results[pat].samples.push(entry);
  }
  return results;
}

/**
 * Calcola statistiche complete per ogni pattern.
 */
export function computePatternStats(patternData, recencyCutoff, minSamples = 3) {
  const stats = [];
  for (const [pat, info] of Object.entries(patternData)) {
    const { samples } = info;
    if (samples.length < minSamples) continue;

    samples.forEach(s => { s.isRecent = new Date(s.date) >= recencyCutoff; });

    const ret1 = samples.filter(s => s.returns[1] !== undefined).map(s => s.returns[1]);
    const ret2 = samples.filter(s => s.returns[2] !== undefined).map(s => s.returns[2]);
    const ret3 = samples.filter(s => s.returns[3] !== undefined).map(s => s.returns[3]);

    if (ret1.length === 0) continue;

    const wr = pct(ret1.filter(r => r > 0).length, ret1.length);
    const pUp2 = ret2.length > 0 ? pct(ret2.filter(r => r > 0).length, ret2.length) : null;
    const pUp3 = ret3.length > 0 ? pct(ret3.filter(r => r > 0).length, ret3.length) : null;

    const recentSamples = samples.filter(s => s.isRecent);
    const recentRet1 = recentSamples.filter(s => s.returns[1] !== undefined).map(s => s.returns[1]);
    const wrRecent = recentRet1.length > 0 ? pct(recentRet1.filter(r => r > 0).length, recentRet1.length) : null;
    const nRecent = recentRet1.length;
    const freshness = calcFreshness(wr, wrRecent, nRecent);

    const bearCount = (pat.match(/D/g) || []).length;
    const zTest = zTestProportion(wr, ret1.length);

    stats.push({
      pattern: pat,
      n: samples.length,
      wr, pUp2, pUp3,
      meanRet: mean(ret1), medRet: median(ret1),
      p10: percentile(ret1, 10), p50: percentile(ret1, 50), p90: percentile(ret1, 90),
      sharpe: sharpe(ret1),
      wrRecent, nRecent, freshness,
      bearCount,
      zScore: zTest.z, pValue: zTest.pValue,
      samples,
      returns1: ret1,
    });
  }
  return stats;
}

export function getRecencyCutoff(data, tf) {
  const last = new Date(data[data.length - 1].date);
  const days = tf === 'weekly' ? RECENCY_CONFIG.windowWeeks * 7 : RECENCY_CONFIG.windowDays;
  return new Date(last.getTime() - days * 86400000);
}
