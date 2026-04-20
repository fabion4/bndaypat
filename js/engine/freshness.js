/**
 * freshness.js — Validazione di freschezza dei pattern.
 * Confronta WR storico globale con WR recente (finestra 6 mesi).
 */

export const RECENCY_CONFIG = {
  windowDays: 180,
  windowWeeks: 26,
  minSamplesJudge: 3,
  minSamplesStrong: 5,
  thresholdConfirmed: 10,
  thresholdDecayed: 55,
  thresholdDecayedRecent: 40,
};

/**
 * Calcola il Freshness Score confrontando WR globale e recente.
 * @returns {{score: number, label: string, icon: string}}
 */
export function calcFreshness(wrGlobal, wrRecent, nRecent) {
  const C = RECENCY_CONFIG;
  if (wrRecent === null || nRecent < C.minSamplesJudge) {
    return { score: 0, label: 'NEUTRO', icon: '⚪' };
  }
  const delta = wrRecent - wrGlobal;
  if (nRecent >= C.minSamplesStrong && delta > C.thresholdConfirmed) {
    return { score: 2, label: 'RAFFORZATO', icon: '🟢🟢' };
  }
  if (Math.abs(delta) <= C.thresholdConfirmed) {
    return { score: 1, label: 'CONFERMATO', icon: '🟢' };
  }
  if (nRecent >= C.minSamplesStrong && wrRecent < C.thresholdDecayedRecent && wrGlobal >= C.thresholdDecayed) {
    return { score: -2, label: 'DECADUTO', icon: '🔴' };
  }
  if (delta < -C.thresholdConfirmed) {
    return { score: -1, label: 'INDEBOLITO', icon: '🟡' };
  }
  return { score: 1, label: 'CONFERMATO', icon: '🟢' };
}

export function freshnessClass(f) {
  if (f.score === 2) return 'f2';
  if (f.score === 1) return 'f1';
  if (f.score === 0) return 'f0';
  if (f.score === -1) return 'fm1';
  return 'fm2';
}
