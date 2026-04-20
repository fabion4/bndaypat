/**
 * formatters.js — Utility di formattazione numeri e classi CSS.
 */

export function fmtPct(v) { return v.toFixed(1) + '%'; }
export function fmtRet(v) { return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'; }
export function fmtSharpe(v) { return v.toFixed(2); }

export function fmtPval(p) {
  if (p < 0.001) return '<.001';
  if (p < 0.01) return p.toFixed(3);
  return p.toFixed(2);
}

export function sigClass(pVal) {
  if (pVal < 0.01) return 'sig-strong';
  if (pVal < 0.05) return 'sig-moderate';
  if (pVal < 0.10) return 'sig-weak';
  return 'sig-none';
}

export function sigLabel(pVal) {
  if (pVal < 0.01) return '★★★';
  if (pVal < 0.05) return '★★';
  if (pVal < 0.10) return '★';
  return '—';
}

export function reliabilityBadge(n) {
  if (n >= 30) return '<span class="reliability ok" title="≥30 campioni">✓</span>';
  if (n >= 15) return '<span class="reliability warn" title="15-29 campioni">⚠</span>';
  return '<span class="reliability low" title="<15 campioni">⚠</span>';
}

export function heatClass(v) {
  if (v === null || v === undefined) return 'heat-neutral';
  if (v >= 60) return 'heat-green';
  if (v <= 40) return 'heat-red';
  if (v >= 55) return 'heat-yellow';
  return 'heat-neutral';
}

export function heatClassRet(v) {
  if (v > 0.5) return 'heat-green';
  if (v < -0.5) return 'heat-red';
  return 'heat-neutral';
}

/** Make any table sortable by clicking column headers */
export function makeSortable(tableEl) {
  const ths = tableEl.querySelectorAll('thead th');
  ths.forEach((th, col) => {
    th.addEventListener('click', () => {
      const tbody = tableEl.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const asc = !th.classList.contains('sorted-asc');
      ths.forEach(t => t.classList.remove('sorted-asc', 'sorted-desc'));
      th.classList.add(asc ? 'sorted-asc' : 'sorted-desc');
      rows.sort((a, b) => {
        let va = a.cells[col]?.getAttribute('data-sort') ?? a.cells[col]?.textContent ?? '';
        let vb = b.cells[col]?.getAttribute('data-sort') ?? b.cells[col]?.textContent ?? '';
        const na = parseFloat(va), nb = parseFloat(vb);
        if (!isNaN(na) && !isNaN(nb)) return asc ? na - nb : nb - na;
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}
