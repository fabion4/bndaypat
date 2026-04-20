/**
 * mod-f-freshness.js — Modulo F: Validazione di freschezza.
 */

import { analyzePatterns, computePatternStats, getRecencyCutoff } from '../engine/patterns.js';
import { fmtPct, fmtPval, sigClass, sigLabel, heatClass, makeSortable } from '../ui/formatters.js';
import { freshnessClass } from '../engine/freshness.js';

export function renderModF(data, state) {
  if (!data) return;
  const cutoff = getRecencyCutoff(data, state.tf);

  let allStats = [];
  for (let len = 2; len <= 4; len++) {
    const patterns = analyzePatterns(data, len, 7, 'all');
    const stats = computePatternStats(patterns, cutoff, 3);
    allStats = allStats.concat(stats);
  }
  allStats.sort((a, b) => a.freshness.score - b.freshness.score);

  let html = `<table><thead><tr>
    <th>Pattern</th><th>N Tot</th><th>WR Storico</th><th>p-val</th><th>Sig.</th>
    <th>N 6m</th><th>WR 6m</th><th>Δ WR</th>
    <th>Score</th><th>Status</th>
  </tr></thead><tbody>`;

  for (const s of allStats) {
    if (state.hideDecayed && s.freshness.score <= -2) continue;
    if (state.onlySignificant && s.pValue > state.alphaLevel) continue;
    const delta = s.wrRecent !== null ? s.wrRecent - s.wr : null;
    const deltaClass = delta !== null ? (delta > 5 ? 'heat-green' : delta < -5 ? 'heat-red' : 'heat-neutral') : '';
    const decayed = s.freshness.score <= -2;
    const notSig = s.pValue > state.alphaLevel;
    let rowCls = '';
    if (decayed && notSig) rowCls = ' class="decayed-row not-significant"';
    else if (decayed) rowCls = ' class="decayed-row"';
    else if (notSig) rowCls = ' class="not-significant"';

    html += `<tr${rowCls}>
      <td class="pattern-cell">${s.pattern.split('').join('-')}</td>
      <td class="num" data-sort="${s.n}">${s.n}</td>
      <td class="num ${heatClass(s.wr)}" data-sort="${s.wr.toFixed(1)}">${fmtPct(s.wr)}</td>
      <td class="num pval-cell ${sigClass(s.pValue)}" data-sort="${s.pValue.toFixed(4)}">${fmtPval(s.pValue)}</td>
      <td class="num ${sigClass(s.pValue)}" data-sort="${s.pValue.toFixed(4)}"><span class="sig-stars">${sigLabel(s.pValue)}</span></td>
      <td class="num" data-sort="${s.nRecent}">${s.nRecent}</td>
      <td class="num ${s.wrRecent !== null ? heatClass(s.wrRecent) : ''}" data-sort="${s.wrRecent !== null ? s.wrRecent.toFixed(1) : '-999'}">${s.wrRecent !== null ? fmtPct(s.wrRecent) : '—'}</td>
      <td class="num ${deltaClass}" data-sort="${delta !== null ? delta.toFixed(1) : '0'}">${delta !== null ? (delta >= 0 ? '+' : '') + delta.toFixed(1) + 'pp' : '—'}</td>
      <td class="num" data-sort="${s.freshness.score}">${s.freshness.score}</td>
      <td><span class="freshness-badge ${freshnessClass(s.freshness)}">${s.freshness.icon} ${s.freshness.label}</span></td>
    </tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('tableF').innerHTML = html;
  makeSortable(document.getElementById('tableF').querySelector('table'));
}
