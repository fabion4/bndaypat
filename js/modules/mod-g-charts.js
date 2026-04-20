/**
 * mod-g-charts.js — Modulo G: Grafici.
 * Candlestick chart dei dati OHLCV + visualizzazione pattern + istogramma rendimenti.
 */

import { classifyAll } from '../engine/candles.js';
import { analyzePatterns, computePatternStats, getRecencyCutoff } from '../engine/patterns.js';
import { CandlestickChart, renderHistogram } from '../ui/chart-renderer.js';

let chartInstance = null;

export function initCharts() {
  const canvas = document.getElementById('mainChartCanvas');
  if (!canvas) return;
  chartInstance = new CandlestickChart(canvas);
  const tooltip = document.getElementById('mainChartTooltip');
  if (tooltip) chartInstance.attachTooltip(tooltip);

  // resize observer
  const ro = new ResizeObserver(() => { if (chartInstance) chartInstance.resize(); });
  ro.observe(canvas.parentElement);
}

export function renderModG(data, state) {
  if (!data || data.length === 0) return;

  const classified = classifyAll(data);
  const cutoff = getRecencyCutoff(data, state.tf);

  // Main chart
  if (!chartInstance) initCharts();
  if (!chartInstance) return;

  chartInstance.setData(data, classified);
  chartInstance.setRecentCutoff(cutoff);

  // Populate pattern selector
  populatePatternSelector(data, state);

  // Default: show last 200 candles
  chartInstance.setViewLast(200);

  // Render info box
  const infoEl = document.getElementById('chartInfo');
  if (infoEl) {
    const last = data[data.length - 1];
    const first = data[0];
    infoEl.innerHTML = `
      <div class="hs-item"><span class="hs-label">Periodo</span><span class="hs-value">${first.date} → ${last.date}</span></div>
      <div class="hs-item"><span class="hs-label">Candele</span><span class="hs-value">${data.length.toLocaleString()}</span></div>
      <div class="hs-item"><span class="hs-label">Ultimo Close</span><span class="hs-value">$${last.close.toLocaleString()}</span></div>
      <div class="hs-item"><span class="hs-label">Tipo</span><span class="hs-value">${classified[classified.length-1].type}</span></div>
    `;
  }
}

function populatePatternSelector(data, state) {
  const sel = document.getElementById('chartPatternSelect');
  if (!sel) return;

  const cutoff = getRecencyCutoff(data, state.tf);
  const patterns = analyzePatterns(data, state.patternLen, 7, 'all');
  const stats = computePatternStats(patterns, cutoff, 5);
  stats.sort((a, b) => b.n - a.n);

  const prevVal = sel.value;
  sel.innerHTML = '<option value="">— Seleziona pattern —</option>';
  for (const s of stats) {
    const label = s.pattern.split('').join('-');
    const sigMark = s.pValue < 0.05 ? ' ★★' : s.pValue < 0.10 ? ' ★' : '';
    sel.innerHTML += `<option value="${s.pattern}" ${s.pattern === prevVal ? 'selected' : ''}>${label} (n=${s.n}, WR ${s.wr.toFixed(1)}%${sigMark})</option>`;
  }

  // Re-apply if previously selected
  if (prevVal && sel.querySelector(`option[value="${prevVal}"]`)) {
    sel.value = prevVal;
    highlightPattern(data, prevVal, stats, state);
  }
}

export function onPatternSelect(data, state) {
  const sel = document.getElementById('chartPatternSelect');
  if (!sel || !sel.value) {
    if (chartInstance) chartInstance.setMarkers([]);
    document.getElementById('chartHistogram').innerHTML = '<div class="chart-loading">Seleziona un pattern per vedere la distribuzione dei rendimenti</div>';
    return;
  }

  const cutoff = getRecencyCutoff(data, state.tf);
  const patterns = analyzePatterns(data, state.patternLen, 7, 'all');
  const stats = computePatternStats(patterns, cutoff, 1);
  highlightPattern(data, sel.value, stats, state);
}

function highlightPattern(data, patternStr, stats, state) {
  const match = stats.find(s => s.pattern === patternStr);
  if (!match || !chartInstance) return;

  // Build markers
  const markers = match.samples.map(s => {
    const idx = s.entryIndex !== undefined ? s.entryIndex : data.findIndex(d => d.date === s.date);
    const ret = s.returns[1];
    return {
      index: idx,
      color: ret !== undefined && ret > 0 ? '#00e4b8' : '#ff4f6a',
      tooltip: `${s.date}: ${ret !== undefined ? (ret >= 0 ? '+' : '') + ret.toFixed(2) + '%' : '—'}`
    };
  }).filter(m => m.index >= 0);

  chartInstance.setMarkers(markers);

  // Histogram
  const histEl = document.getElementById('chartHistogram');
  if (histEl && match.returns1) {
    renderHistogram(histEl, match.returns1, {
      title: `Distribuzione rendimenti dopo ${patternStr.split('').join('-')}`
    });
  }

  // Pattern stats summary
  const sumEl = document.getElementById('chartPatternSummary');
  if (sumEl) {
    const sigMark = match.pValue < 0.01 ? '★★★' : match.pValue < 0.05 ? '★★' : match.pValue < 0.10 ? '★' : '—';
    sumEl.innerHTML = `
      <div class="hs-item"><span class="hs-label">Pattern</span><span class="hs-value">${patternStr.split('').join(' · ')}</span></div>
      <div class="hs-item"><span class="hs-label">Campioni</span><span class="hs-value">${match.n}</span></div>
      <div class="hs-item"><span class="hs-label">Win Rate</span><span class="hs-value" style="color:${match.wr>=55?'var(--accent)':match.wr<=45?'var(--red)':'var(--yellow)'}">${match.wr.toFixed(1)}%</span></div>
      <div class="hs-item"><span class="hs-label">p-value</span><span class="hs-value">${match.pValue < 0.001 ? '<.001' : match.pValue.toFixed(3)} ${sigMark}</span></div>
      <div class="hs-item"><span class="hs-label">Sharpe</span><span class="hs-value">${match.sharpe.toFixed(2)}</span></div>
      <div class="hs-item"><span class="hs-label">Freschezza</span><span class="hs-value">${match.freshness.icon} ${match.freshness.label}</span></div>
    `;
  }
}

/** View range controls */
export function chartViewAll() { if (chartInstance) chartInstance.setView(0, chartInstance.data.length - 1); }
export function chartViewLast(n) { if (chartInstance) chartInstance.setViewLast(n); }
