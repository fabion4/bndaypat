/**
 * mod-e-ranking.js — Modulo E: Classifiche globali pattern.
 */

import { analyzePatterns, computePatternStats, getRecencyCutoff } from '../engine/patterns.js';
import { fmtPct, fmtRet, fmtSharpe, fmtPval, sigClass, sigLabel, reliabilityBadge, heatClass, heatClassRet } from '../ui/formatters.js';
import { freshnessClass } from '../engine/freshness.js';

function renderRankTable(stats, containerId, state) {
  let html = `<table><thead><tr>
    <th>#</th><th>Pattern</th><th>N</th><th>WR</th><th>p-val</th><th>Sig.</th><th>Sharpe</th><th>Rend.μ</th><th>Fresc.</th>
  </tr></thead><tbody>`;

  stats.forEach((s, i) => {
    const decayed = s.freshness.score <= -2;
    const notSig = s.pValue > state.alphaLevel;
    let rowCls = '';
    if (decayed && notSig) rowCls = ' class="decayed-row not-significant"';
    else if (decayed) rowCls = ' class="decayed-row"';
    else if (notSig) rowCls = ' class="not-significant"';
    html += `<tr${rowCls}>
      <td class="num">${i + 1}</td>
      <td class="pattern-cell">${s.pattern.split('').join('-')}</td>
      <td class="num">${s.n} ${reliabilityBadge(s.n)}</td>
      <td class="num wr-cell ${heatClass(s.wr)}">${fmtPct(s.wr)}</td>
      <td class="num pval-cell ${sigClass(s.pValue)}">${fmtPval(s.pValue)}</td>
      <td class="num ${sigClass(s.pValue)}"><span class="sig-stars">${sigLabel(s.pValue)}</span></td>
      <td class="num">${fmtSharpe(s.sharpe)}</td>
      <td class="num ${heatClassRet(s.meanRet)}">${fmtRet(s.meanRet)}</td>
      <td><span class="freshness-badge ${freshnessClass(s.freshness)}">${s.freshness.icon}</span></td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById(containerId).innerHTML = html;
}

export function renderModE(data, state) {
  if (!data) return;
  const cutoff = getRecencyCutoff(data, state.tf);

  let allStats = [];
  for (let len = 2; len <= 4; len++) {
    const patterns = analyzePatterns(data, len, 7, 'all');
    const stats = computePatternStats(patterns, cutoff, 15);
    allStats = allStats.concat(stats);
  }

  let filtered = allStats;
  if (state.onlySignificant) {
    filtered = allStats.filter(s => s.pValue <= state.alphaLevel);
  }

  const topWR = [...filtered].sort((a, b) => b.wr - a.wr).slice(0, 10);
  renderRankTable(topWR, 'tableE_wr', state);

  const topSharpe = [...filtered].sort((a, b) => b.sharpe - a.sharpe).slice(0, 10);
  renderRankTable(topSharpe, 'tableE_sharpe', state);

  const topMR = [...filtered].filter(s => s.bearCount >= 2).sort((a, b) => b.wr - a.wr).slice(0, 10);
  renderRankTable(topMR, 'tableE_mr', state);
}
