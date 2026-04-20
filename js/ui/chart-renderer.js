/**
 * chart-renderer.js — Rendering di grafici a candele su <canvas>.
 * Nessuna dipendenza esterna. Canvas 2D puro.
 */

import { calcSMA } from '../engine/candles.js';

export class CandlestickChart {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = [];
    this.classifiedData = [];
    this.sma50 = [];
    this.markers = []; // [{index, color, tooltip}]
    this.recentCutoff = null;
    this.options = {
      padding: { top: 20, right: 60, bottom: 30, left: 10 },
      candleWidth: 0.7,
      colors: {
        up: '#00e4b8',
        down: '#ff4f6a',
        doji: '#ffc857',
        sma: '#7c8cf5',
        grid: '#1e2d40',
        text: '#7a8d9e',
        recent: 'rgba(0, 228, 184, 0.08)',
      },
      ...options
    };
    this.viewStart = 0;
    this.viewEnd = 0;
    this.tooltip = null;
    this._setupCanvas();
    this._bindEvents();
  }

  _setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  setData(data, classifiedData = null) {
    this.data = data;
    this.classifiedData = classifiedData || data;
    this.sma50 = calcSMA(data, 50);
    // default view: last 200 candles
    this.viewEnd = data.length - 1;
    this.viewStart = Math.max(0, this.viewEnd - 200);
    this.render();
  }

  setMarkers(markers) {
    this.markers = markers;
    this.render();
  }

  setRecentCutoff(cutoffDate) {
    this.recentCutoff = cutoffDate;
    this.render();
  }

  setView(start, end) {
    this.viewStart = Math.max(0, start);
    this.viewEnd = Math.min(this.data.length - 1, end);
    this.render();
  }

  setViewLast(n) {
    this.viewEnd = this.data.length - 1;
    this.viewStart = Math.max(0, this.viewEnd - n);
    this.render();
  }

  _visibleRange() {
    return this.data.slice(this.viewStart, this.viewEnd + 1);
  }

  _computeYScale() {
    const visible = this._visibleRange();
    if (visible.length === 0) return { min: 0, max: 1 };
    let min = Infinity, max = -Infinity;
    for (const d of visible) {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
    }
    const pad = (max - min) * 0.05;
    return { min: min - pad, max: max + pad };
  }

  _xFor(idx) {
    const { padding } = this.options;
    const plotWidth = this.width - padding.left - padding.right;
    const n = this.viewEnd - this.viewStart + 1;
    return padding.left + (idx - this.viewStart) * (plotWidth / n) + (plotWidth / n) / 2;
  }

  _yFor(price, yScale) {
    const { padding } = this.options;
    const plotHeight = this.height - padding.top - padding.bottom;
    return padding.top + (1 - (price - yScale.min) / (yScale.max - yScale.min)) * plotHeight;
  }

  _candleWidth() {
    const { padding } = this.options;
    const plotWidth = this.width - padding.left - padding.right;
    const n = this.viewEnd - this.viewStart + 1;
    return Math.max(1, (plotWidth / n) * this.options.candleWidth);
  }

  render() {
    const ctx = this.ctx;
    const { colors, padding } = this.options;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.data.length === 0) return;

    const yScale = this._computeYScale();

    // Recent window background
    if (this.recentCutoff) {
      const cutoffTs = this.recentCutoff.getTime();
      let recentStartIdx = this.data.findIndex(d => new Date(d.date).getTime() >= cutoffTs);
      if (recentStartIdx > -1 && recentStartIdx <= this.viewEnd) {
        const startIdx = Math.max(recentStartIdx, this.viewStart);
        const xStart = this._xFor(startIdx) - this._candleWidth() / 2;
        const xEnd = this._xFor(this.viewEnd) + this._candleWidth() / 2;
        ctx.fillStyle = colors.recent;
        ctx.fillRect(xStart, padding.top, xEnd - xStart, this.height - padding.top - padding.bottom);
      }
    }

    // Grid + price labels (right axis)
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'left';
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (i / gridLines) * (this.height - padding.top - padding.bottom);
      const price = yScale.max - (i / gridLines) * (yScale.max - yScale.min);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(this.width - padding.right, y);
      ctx.stroke();
      ctx.fillText(price >= 1000 ? `$${(price/1000).toFixed(1)}k` : `$${price.toFixed(0)}`, this.width - padding.right + 4, y + 3);
    }

    // Date labels (x axis)
    ctx.textAlign = 'center';
    const dateLabels = 6;
    const n = this.viewEnd - this.viewStart;
    for (let i = 0; i <= dateLabels; i++) {
      const idx = this.viewStart + Math.floor((i / dateLabels) * n);
      if (idx >= this.data.length) continue;
      const x = this._xFor(idx);
      const dt = this.data[idx].date;
      const label = dt.substring(2, 10); // yy-mm-dd
      ctx.fillText(label, x, this.height - padding.bottom + 15);
    }

    // Candles
    const cw = this._candleWidth();
    for (let i = this.viewStart; i <= this.viewEnd; i++) {
      const d = this.data[i];
      const type = this.classifiedData[i]?.type || 'J';
      const x = this._xFor(i);
      const yOpen = this._yFor(d.open, yScale);
      const yClose = this._yFor(d.close, yScale);
      const yHigh = this._yFor(d.high, yScale);
      const yLow = this._yFor(d.low, yScale);

      let color;
      if (type === 'U') color = colors.up;
      else if (type === 'D') color = colors.down;
      else color = colors.doji;

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
      ctx.fillRect(x - cw / 2, bodyTop, cw, bodyHeight);
    }

    // SMA(50)
    ctx.strokeStyle = colors.sma;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (let i = this.viewStart; i <= this.viewEnd; i++) {
      if (this.sma50[i] === null) continue;
      const x = this._xFor(i);
      const y = this._yFor(this.sma50[i], yScale);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Markers (pattern occurrences)
    for (const m of this.markers) {
      if (m.index < this.viewStart || m.index > this.viewEnd) continue;
      const x = this._xFor(m.index);
      const y = this._yFor(this.data[m.index].high, yScale) - 12;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      // small downward tick
      ctx.strokeStyle = m.color;
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(x, this._yFor(this.data[m.index].high, yScale) - 2);
      ctx.stroke();
    }
  }

  _bindEvents() {
    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1.15 : 0.85;
      const n = this.viewEnd - this.viewStart + 1;
      const newN = Math.max(20, Math.min(this.data.length, Math.round(n * delta)));
      const center = Math.round((this.viewStart + this.viewEnd) / 2);
      this.setView(center - Math.floor(newN / 2), center + Math.ceil(newN / 2));
    }, { passive: false });

    // Drag pan
    let isDragging = false;
    let lastX = 0;
    this.canvas.addEventListener('mousedown', e => {
      isDragging = true;
      lastX = e.offsetX;
      this.canvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
      this.canvas.style.cursor = 'crosshair';
    });
    this.canvas.addEventListener('mousemove', e => {
      if (isDragging) {
        const dx = e.offsetX - lastX;
        lastX = e.offsetX;
        const cw = this._candleWidth();
        const shift = Math.round(dx / cw);
        if (shift !== 0) {
          const newStart = this.viewStart - shift;
          const newEnd = this.viewEnd - shift;
          if (newStart >= 0 && newEnd < this.data.length) {
            this.setView(newStart, newEnd);
          }
        }
      } else {
        this._showTooltip(e);
      }
    });
    this.canvas.addEventListener('mouseleave', () => {
      if (this.tooltip) this.tooltip.classList.remove('visible');
    });
  }

  attachTooltip(tooltipEl) {
    this.tooltip = tooltipEl;
  }

  _showTooltip(e) {
    if (!this.tooltip) return;
    const { padding } = this.options;
    const plotWidth = this.width - padding.left - padding.right;
    const n = this.viewEnd - this.viewStart + 1;
    const idx = this.viewStart + Math.floor((e.offsetX - padding.left) / (plotWidth / n));
    if (idx < this.viewStart || idx > this.viewEnd) {
      this.tooltip.classList.remove('visible');
      return;
    }
    const d = this.data[idx];
    const type = this.classifiedData[idx]?.type || 'J';
    const change = ((d.close - d.open) / d.open * 100).toFixed(2);
    const changeClass = d.close >= d.open ? 'up' : 'down';
    const typeLabel = { U: 'Rialzista', D: 'Ribassista', J: 'Doji' }[type];
    this.tooltip.innerHTML = `
      <div class="tt-row"><span class="tt-label">Data</span><span class="tt-value">${d.date}</span></div>
      <div class="tt-row"><span class="tt-label">Tipo</span><span class="tt-value">${type} · ${typeLabel}</span></div>
      <div class="tt-row"><span class="tt-label">Open</span><span class="tt-value">$${d.open.toFixed(2)}</span></div>
      <div class="tt-row"><span class="tt-label">High</span><span class="tt-value">$${d.high.toFixed(2)}</span></div>
      <div class="tt-row"><span class="tt-label">Low</span><span class="tt-value">$${d.low.toFixed(2)}</span></div>
      <div class="tt-row"><span class="tt-label">Close</span><span class="tt-value">$${d.close.toFixed(2)}</span></div>
      <div class="tt-row"><span class="tt-label">Var.</span><span class="tt-value ${changeClass}">${change >= 0 ? '+' : ''}${change}%</span></div>
    `;
    this.tooltip.classList.add('visible');
    const rect = this.canvas.getBoundingClientRect();
    const parentRect = this.canvas.offsetParent.getBoundingClientRect();
    let left = e.offsetX + 12;
    let top = e.offsetY + 12;
    if (left + 200 > this.width) left = e.offsetX - 200;
    this.tooltip.style.left = left + 'px';
    this.tooltip.style.top = top + 'px';
  }

  resize() {
    this._setupCanvas();
    this.render();
  }
}

/* ═══════════ HISTOGRAM ═══════════ */

export function renderHistogram(containerEl, returns, options = {}) {
  const { bins = 20, title = 'Distribuzione Rendimenti' } = options;
  if (returns.length === 0) {
    containerEl.innerHTML = '<div class="chart-loading">Nessun dato</div>';
    return;
  }

  const min = Math.min(...returns);
  const max = Math.max(...returns);
  const range = max - min;
  const binSize = range / bins;
  const counts = new Array(bins).fill(0);

  for (const r of returns) {
    let idx = Math.floor((r - min) / binSize);
    if (idx === bins) idx = bins - 1;
    counts[idx]++;
  }

  const maxCount = Math.max(...counts);
  const meanV = returns.reduce((a, b) => a + b, 0) / returns.length;
  const sorted = [...returns].sort((a, b) => a - b);
  const medianV = sorted[Math.floor(sorted.length / 2)];

  let html = `<div class="histogram-container">`;
  for (let i = 0; i < bins; i++) {
    const binStart = min + i * binSize;
    const height = counts[i] / maxCount * 100;
    const cls = binStart < 0 ? 'neg' : '';
    html += `<div class="histogram-bar ${cls}" style="height:${height}%" title="[${binStart.toFixed(2)}%, ${(binStart+binSize).toFixed(2)}%] · n=${counts[i]}"></div>`;
  }
  html += `</div>`;
  html += `<div class="histogram-axis"><span>${min.toFixed(1)}%</span><span>0%</span><span>${max.toFixed(1)}%</span></div>`;
  html += `<div class="histogram-stats">
    <div class="hs-item"><span class="hs-label">Campioni</span><span class="hs-value">${returns.length}</span></div>
    <div class="hs-item"><span class="hs-label">Media</span><span class="hs-value" style="color:${meanV>=0?'var(--accent)':'var(--red)'}">${meanV>=0?'+':''}${meanV.toFixed(2)}%</span></div>
    <div class="hs-item"><span class="hs-label">Mediana</span><span class="hs-value" style="color:${medianV>=0?'var(--accent)':'var(--red)'}">${medianV>=0?'+':''}${medianV.toFixed(2)}%</span></div>
    <div class="hs-item"><span class="hs-label">% Positivi</span><span class="hs-value">${(returns.filter(r=>r>0).length/returns.length*100).toFixed(1)}%</span></div>
  </div>`;

  containerEl.innerHTML = html;
}
