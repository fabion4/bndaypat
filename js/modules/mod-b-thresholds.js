/**
 * mod-b-thresholds.js — Modulo B: Probabilità di superamento soglia.
 */

import { analyzeStreaks, computeThresholds } from '../engine/patterns.js';
import { fmtPct, heatClass, makeSortable } from '../ui/formatters.js';

export function renderModB(data, state) {
  if (!data) return;
  const streaks = analyzeStreaks(data);
  const keys = Object.keys(streaks).sort();

  const sel = document.getElementById('streakSelectB');
  const prev = sel.value;
  sel.innerHTML = keys.map(k => `<option value="${k}" ${k === prev ? 'selected' : ''}>${k} (n=${streaks[k].samples.length})</option>`).join('');

  const chosen = sel.value || keys[0];
  if (!chosen || !streaks[chosen]) {
    document.getElementById('tableB').innerHTML = '<p style="color:var(--text-2)">Nessun dato</p>';
    return;
  }

  const thresholds = computeThresholds(streaks[chosen].samples);
  const horizons = [1, 2, 3, 5, 7];

  let html = `<table><thead><tr><th>Soglia ≥</th>`;
  horizons.forEach(h => { html += `<th>${h} ${state.tf === 'daily' ? 'gg' : 'sett'}</th>`; });
  html += '</tr></thead><tbody>';

  for (const row of thresholds) {
    html += `<tr><td class="num" style="font-weight:600">+${row.threshold}%</td>`;
    horizons.forEach(h => {
      const v = row['h' + h];
      const n = row['n' + h];
      html += `<td class="num ${v !== null ? heatClass(v) : ''}" data-sort="${v !== null ? v.toFixed(1) : '-1'}">${v !== null ? fmtPct(v) : '—'}<br><span style="font-size:9px;color:var(--text-2)">n=${n}</span></td>`;
    });
    html += '</tr>';
  }
  html += '</tbody></table>';
  document.getElementById('tableB').innerHTML = html;
  makeSortable(document.getElementById('tableB').querySelector('table'));
}
