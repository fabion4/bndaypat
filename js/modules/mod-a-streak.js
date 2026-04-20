/**
 * mod-a-streak.js — Modulo A: Streak Analysis.
 */

import { analyzeStreaks, computeStreakStats, getRecencyCutoff } from '../engine/patterns.js';
import { fmtPct, fmtRet, fmtPval, sigClass, sigLabel, reliabilityBadge, heatClass, heatClassRet, makeSortable } from '../ui/formatters.js';
import { freshnessClass } from '../engine/freshness.js';

export function renderModA(data, state) {
  if (!data) return;
  const cutoff = getRecencyCutoff(data, state.tf);
  const streaks = analyzeStreaks(data);
  const stats = computeStreakStats(streaks, cutoff);

  let html = `<table><thead><tr>
    <th>Streak</th><th>Dir</th><th>N</th>
    <th>P(Up) +1</th><th>p-val</th><th>Sig.</th>
    <th>P(Up) +2</th><th>P(Up) +3</th>
    <th>Rend. Medio</th><th>Rend. Med.</th><th>Fresc.</th>
  </tr></thead><tbody>`;

  for (const s of stats) {
    if (state.hideDecayed && s.freshness.score <= -2) continue;
    if (state.onlySignificant && s.pValue > state.alphaLevel) continue;
    const decayed = s.freshness.score <= -2;
    const notSig = s.pValue > state.alphaLevel;
    let rowCls = '';
    if (decayed && notSig) rowCls = ' class="decayed-row not-significant"';
    else if (decayed) rowCls = ' class="decayed-row"';
    else if (notSig) rowCls = ' class="not-significant"';
    html += `<tr${rowCls}>
      <td class="pattern-cell">${s.key}</td>
      <td>${s.dir === 'U' ? '🟩' : '🟥'}</td>
      <td class="num" data-sort="${s.n}">${s.n} ${reliabilityBadge(s.n)}</td>
      <td class="num wr-cell ${heatClass(s.pUp1)}" data-sort="${s.pUp1.toFixed(1)}">${fmtPct(s.pUp1)}</td>
      <td class="num pval-cell ${sigClass(s.pValue)}" data-sort="${s.pValue.toFixed(4)}">${fmtPval(s.pValue)}</td>
      <td class="num ${sigClass(s.pValue)}" data-sort="${s.pValue.toFixed(4)}"><span class="sig-stars">${sigLabel(s.pValue)}</span></td>
      <td class="num ${heatClass(s.pUp2)}" data-sort="${s.pUp2.toFixed(1)}">${fmtPct(s.pUp2)}</td>
      <td class="num ${heatClass(s.pUp3)}" data-sort="${s.pUp3.toFixed(1)}">${fmtPct(s.pUp3)}</td>
      <td class="num ${heatClassRet(s.meanRet)}" data-sort="${s.meanRet.toFixed(3)}">${fmtRet(s.meanRet)}</td>
      <td class="num ${heatClassRet(s.medRet)}" data-sort="${s.medRet.toFixed(3)}">${fmtRet(s.medRet)}</td>
      <td><div class="tooltip-wrap"><span class="fresh-icon">${s.freshness.icon}</span><span class="tip">${s.freshness.label} — Storico: ${fmtPct(s.pUp1)} · 6m: ${s.wrRecent !== null ? fmtPct(s.wrRecent) : '—'} (n=${s.nRecent})</span></div></td>
    </tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('tableA').innerHTML = html;
  makeSortable(document.getElementById('tableA').querySelector('table'));
  return stats;
}

/** Return the streak list for Module B's selector */
export function getStreakKeys(data) {
  return analyzeStreaks(data);
}
