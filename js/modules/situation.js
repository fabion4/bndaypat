/**
 * situation.js — Pannello Situazione Corrente.
 */

import { classifyAll, calcRegimes } from '../engine/candles.js';
import { analyzePatterns, computePatternStats, getRecencyCutoff } from '../engine/patterns.js';
import { fmtPct, fmtRet, fmtPval, reliabilityBadge } from '../ui/formatters.js';
import { freshnessClass } from '../engine/freshness.js';

export function renderSituation(data, state) {
  if (!data || data.length < 5) return;
  const classified = classifyAll(data);
  const regimes = calcRegimes(data);
  const last4 = classified.slice(-4).map(c => c.type).join('-');
  const last3 = classified.slice(-3).map(c => c.type).join('-');
  const regime = regimes[regimes.length - 1] || 'N/A';
  const lastDate = data[data.length - 1].date;
  const lastClose = data[data.length - 1].close;

  const cutoff = getRecencyCutoff(data, state.tf);
  const patterns = analyzePatterns(data, 3, 7, 'all');
  const allStats = computePatternStats(patterns, cutoff);
  const match = allStats.find(s => s.pattern === last3.replace(/-/g, ''));

  const panel = document.getElementById('sitPanel');
  const content = document.getElementById('sitContent');

  if (match) {
    const isDecayed = match.freshness.score <= -2;
    panel.className = 'situation-panel fade-up' + (isDecayed ? ' decayed' : '');
    const wrColor = match.wr >= 55 ? 'green' : match.wr <= 45 ? 'red' : 'yellow';
    const sigInfo = match.pValue !== undefined ? match.pValue : 1;
    const sigText = sigInfo < 0.01 ? 'Altamente significativo ★★★' : sigInfo < 0.05 ? 'Significativo ★★' : sigInfo < 0.10 ? 'Marginale ★' : 'Non significativo';
    const sigColor = sigInfo < 0.05 ? 'green' : sigInfo < 0.10 ? 'yellow' : 'red';

    content.innerHTML = `
      <div class="sit-block">
        <div class="sit-label">Sequenza (3)</div>
        <div class="sit-value" style="letter-spacing:3px">${classified.slice(-3).map(c=>c.type).join(' · ')}</div>
        <div class="sit-sub">Seq. 4: ${last4} · ${lastDate} · $${lastClose.toLocaleString()}</div>
      </div>
      <div class="sit-block">
        <div class="sit-label">WR Prossima Barra</div>
        <div class="sit-value ${wrColor}">${fmtPct(match.wr)}</div>
        <div class="sit-sub">su ${match.n} campioni ${reliabilityBadge(match.n)}</div>
      </div>
      <div class="sit-block">
        <div class="sit-label">Significatività Statistica</div>
        <div class="sit-value ${sigColor}" style="font-size:16px">p = ${fmtPval(sigInfo)}</div>
        <div class="sit-sub">${sigText} (z = ${match.zScore !== undefined ? match.zScore.toFixed(2) : '—'})</div>
      </div>
      <div class="sit-block">
        <div class="sit-label">Persistenza</div>
        <div class="sit-value" style="font-size:16px">+2: ${match.pUp2 !== null ? fmtPct(match.pUp2) : '—'} · +3: ${match.pUp3 !== null ? fmtPct(match.pUp3) : '—'}</div>
      </div>
      <div class="sit-block">
        <div class="sit-label">Percentili Rendimento</div>
        <div class="sit-value" style="font-size:14px">
          <span class="red">P10 ${fmtRet(match.p10)}</span> ·
          P50 ${fmtRet(match.p50)} ·
          <span class="green">P90 ${fmtRet(match.p90)}</span>
        </div>
      </div>
      <div class="sit-block">
        <div class="sit-label">Regime</div>
        <div class="sit-value" style="font-size:14px">${regime}</div>
      </div>
      <div class="sit-block">
        <div class="sit-label">Freschezza</div>
        <div class="tooltip-wrap">
          <span class="freshness-badge ${freshnessClass(match.freshness)}">${match.freshness.icon} ${match.freshness.label}</span>
          <span class="tip">Storico: WR ${fmtPct(match.wr)} su ${match.n} · Ultimi 6m: WR ${match.wrRecent !== null ? fmtPct(match.wrRecent) : '—'} su ${match.nRecent}</span>
        </div>
      </div>
    `;
  } else {
    panel.className = 'situation-panel fade-up';
    content.innerHTML = `
      <div class="sit-block">
        <div class="sit-label">Sequenza</div>
        <div class="sit-value">${classified.slice(-3).map(c=>c.type).join(' · ')}</div>
        <div class="sit-sub">Nessun campione trovato per questa sequenza</div>
      </div>
    `;
  }
}
