/**
 * mod-c-patterns.js — Moduli C (tutti i pattern) e D (filtrato per regime).
 */

import { analyzePatterns, computePatternStats, getRecencyCutoff } from '../engine/patterns.js';
import { fmtPct, fmtRet, fmtSharpe, fmtPval, sigClass, sigLabel, reliabilityBadge, heatClass, heatClassRet, makeSortable } from '../ui/formatters.js';
import { freshnessClass } from '../engine/freshness.js';

function renderPatternTable(stats, containerId, state) {
  let html = `<table><thead><tr>
    <th>Pattern</th><th>N</th><th>WR</th><th>p-val</th><th>Sig.</th>
    <th>P(Up)+2</th><th>P(Up)+3</th>
    <th>Rend.μ</th><th>Rend.Med</th>
    <th>P10</th><th>P50</th><th>P90</th>
    <th>Sharpe</th><th>Fresc.</th>
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
      <td class="pattern-cell">${s.pattern.split('').join('-')}</td>
      <td class="num" data-sort="${s.n}">${s.n} ${reliabilityBadge(s.n)}</td>
      <td class="num wr-cell ${heatClass(s.wr)}" data-sort="${s.wr.toFixed(1)}">${fmtPct(s.wr)}</td>
      <td class="num pval-cell ${sigClass(s.pValue)}" data-sort="${s.pValue.toFixed(4)}">${fmtPval(s.pValue)}</td>
      <td class="num ${sigClass(s.pValue)}" data-sort="${s.pValue.toFixed(4)}"><span class="sig-stars">${sigLabel(s.pValue)}</span></td>
      <td class="num ${s.pUp2 !== null ? heatClass(s.pUp2) : ''}" data-sort="${s.pUp2 !== null ? s.pUp2.toFixed(1) : '-1'}">${s.pUp2 !== null ? fmtPct(s.pUp2) : '—'}</td>
      <td class="num ${s.pUp3 !== null ? heatClass(s.pUp3) : ''}" data-sort="${s.pUp3 !== null ? s.pUp3.toFixed(1) : '-1'}">${s.pUp3 !== null ? fmtPct(s.pUp3) : '—'}</td>
      <td class="num ${heatClassRet(s.meanRet)}" data-sort="${s.meanRet.toFixed(3)}">${fmtRet(s.meanRet)}</td>
      <td class="num ${heatClassRet(s.medRet)}" data-sort="${s.medRet.toFixed(3)}">${fmtRet(s.medRet)}</td>
      <td class="num" data-sort="${s.p10.toFixed(3)}">${fmtRet(s.p10)}</td>
      <td class="num" data-sort="${s.p50.toFixed(3)}">${fmtRet(s.p50)}</td>
      <td class="num" data-sort="${s.p90.toFixed(3)}">${fmtRet(s.p90)}</td>
      <td class="num" data-sort="${s.sharpe.toFixed(3)}">${fmtSharpe(s.sharpe)}</td>
      <td><div class="tooltip-wrap"><span class="fresh-icon">${s.freshness.icon}</span><span class="tip">${s.freshness.label} — Storico: ${fmtPct(s.wr)} (n=${s.n}) · 6m: ${s.wrRecent !== null ? fmtPct(s.wrRecent) : '—'} (n=${s.nRecent})</span></div></td>
    </tr>`;
  }
  html += '</tbody></table>';
  document.getElementById(containerId).innerHTML = html;
  makeSortable(document.getElementById(containerId).querySelector('table'));
}

export function renderModC(data, state) {
  if (!data) return;
  const cutoff = getRecencyCutoff(data, state.tf);
  const patterns = analyzePatterns(data, state.patternLen, 7, 'all');
  const stats = computePatternStats(patterns, cutoff);
  stats.sort((a, b) => b.wr - a.wr);
  renderPatternTable(stats, 'tableC', state);
  return stats;
}

export function renderModD(data, state) {
  if (!data) return;
  const cutoff = getRecencyCutoff(data, state.tf);
  const regime = state.regimeFilter === 'all' ? 'all' : state.regimeFilter;
  const patterns = analyzePatterns(data, state.patternLen, 7, regime);
  const stats = computePatternStats(patterns, cutoff);
  stats.sort((a, b) => b.wr - a.wr);

  if (stats.length === 0) {
    document.getElementById('tableD').innerHTML = '<p style="color:var(--text-2);padding:20px">Campioni insufficienti per il regime selezionato. Prova con "Tutti".</p>';
    return;
  }
  renderPatternTable(stats, 'tableD', state);
}
