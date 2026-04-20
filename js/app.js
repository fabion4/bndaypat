/**
 * app.js — Entry point. State management, event handlers, render orchestration.
 */

import { loadData, cacheClear, downloadJSON } from './engine/data-loader.js';
import { renderSituation } from './modules/situation.js';
import { renderModA } from './modules/mod-a-streak.js';
import { renderModB } from './modules/mod-b-thresholds.js';
import { renderModC, renderModD } from './modules/mod-c-patterns.js';
import { renderModE } from './modules/mod-e-ranking.js';
import { renderModF } from './modules/mod-f-freshness.js';
import { renderModG, onPatternSelect, initCharts, chartViewAll, chartViewLast } from './modules/mod-g-charts.js';
import { toggleHelp, dismissWelcome, checkWelcome, openGlossary, closeGlossary, startTour, endTour, tourNavigate, initTourKeyboard } from './ui/help-system.js';

/* ─── GLOBAL STATE ──────────────────────────────────────────── */
const STATE = {
  tf: 'daily',
  patternLen: 3,
  regimeFilter: 'all',
  hideDecayed: false,
  onlySignificant: false,
  alphaLevel: 0.05,
  dailyData: null,
  weeklyData: null,
};

function getData() {
  return STATE.tf === 'daily' ? STATE.dailyData : STATE.weeklyData;
}

/* ─── RENDER ALL ────────────────────────────────────────────── */
function renderAll() {
  const data = getData();
  if (!data) return;
  renderSituation(data, STATE);
  renderModA(data, STATE);
  renderModB(data, STATE);
  renderModC(data, STATE);
  renderModD(data, STATE);
  renderModE(data, STATE);
  renderModF(data, STATE);
  renderModG(data, STATE);
}

function updateMeta() {
  const d = STATE.dailyData;
  const w = STATE.weeklyData;
  if (d?.length) {
    document.getElementById('metaLastDate').textContent = d[d.length - 1].date;
    document.getElementById('metaDailyCount').textContent = d.length.toLocaleString();
  }
  if (w?.length) {
    document.getElementById('metaWeeklyCount').textContent = w.length.toLocaleString();
  }
}

/* ─── EVENT HANDLERS ────────────────────────────────────────── */
function bindEvents() {
  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.module-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
      // Init chart canvas on first switch to G
      if (tab.dataset.tab === 'modG') {
        setTimeout(() => { initCharts(); renderModG(getData(), STATE); }, 50);
      }
    });
  });

  // Timeframe
  document.getElementById('tfToggle').addEventListener('click', e => {
    if (e.target.tagName !== 'BUTTON') return;
    document.querySelectorAll('#tfToggle button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    STATE.tf = e.target.dataset.tf;
    renderAll();
  });

  // Pattern length
  document.getElementById('patternLen').addEventListener('change', e => {
    STATE.patternLen = parseInt(e.target.value);
    renderModC(getData(), STATE);
    renderModD(getData(), STATE);
    renderModG(getData(), STATE);
  });

  // Regime filter
  document.getElementById('regimeFilter').addEventListener('change', e => {
    STATE.regimeFilter = e.target.value;
    renderModD(getData(), STATE);
  });

  // Hide decayed
  document.getElementById('hideDecayed').addEventListener('change', e => {
    STATE.hideDecayed = e.target.checked;
    renderAll();
  });

  // Significance filter
  document.getElementById('onlySignificant').addEventListener('change', e => {
    STATE.onlySignificant = e.target.checked;
    renderAll();
  });
  document.getElementById('alphaLevel').addEventListener('change', e => {
    STATE.alphaLevel = parseFloat(e.target.value);
    renderAll();
  });

  // Streak selector B
  document.getElementById('streakSelectB').addEventListener('change', () => renderModB(getData(), STATE));

  // Chart pattern selector
  document.getElementById('chartPatternSelect')?.addEventListener('change', () => onPatternSelect(getData(), STATE));

  // Chart view buttons
  document.getElementById('chartViewAll')?.addEventListener('click', chartViewAll);
  document.getElementById('chartView200')?.addEventListener('click', () => chartViewLast(200));
  document.getElementById('chartView90')?.addEventListener('click', () => chartViewLast(90));
  document.getElementById('chartView30')?.addEventListener('click', () => chartViewLast(30));
}

/* ─── EXPOSE GLOBALS for inline onclick ─────────────────────── */
window.toggleHelp = toggleHelp;
window.dismissWelcome = dismissWelcome;
window.openGlossary = openGlossary;
window.closeGlossary = closeGlossary;
window.startTour = startTour;
window.endTour = endTour;
window.tourNavigate = tourNavigate;

window.refreshData = () => bootData(true);
window.exportDailyJSON = () => { if (STATE.dailyData) downloadJSON(STATE.dailyData, 'btc_daily_data.json'); };
window.exportWeeklyJSON = () => { if (STATE.weeklyData) downloadJSON(STATE.weeklyData, 'btc_weekly_data.json'); };
window.clearCache = async () => {
  await cacheClear();
  alert('Cache cancellata. Il prossimo caricamento scaricherà dati freschi.');
};

/* ─── BOOT ──────────────────────────────────────────────────── */
async function bootData(forceRefresh = false) {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  overlay.classList.remove('hidden');

  try {
    const result = await loadData({
      forceRefresh,
      onStatus: msg => { loadingText.textContent = msg; }
    });

    STATE.dailyData = result.daily;
    STATE.weeklyData = result.weekly;

    loadingText.textContent = 'Calcolo pattern…';
    await new Promise(r => setTimeout(r, 50));

    updateMeta();
    renderAll();
    overlay.classList.add('hidden');
  } catch (err) {
    loadingText.innerHTML = `
      <span style="color:var(--red)">Errore: ${err.message}</span><br>
      <span style="font-size:12px;color:var(--text-2)">
        Possibili cause: connessione assente, Binance non raggiungibile, file JSON mancanti.
      </span><br><br>
      <button onclick="refreshData()" style="
        background:var(--accent);color:var(--bg-0);border:none;padding:8px 20px;
        border-radius:6px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;
      ">⟳ Riprova</button>
    `;
  }
}

/* ─── INIT ──────────────────────────────────────────────────── */
checkWelcome();
bindEvents();
initTourKeyboard();
bootData();
