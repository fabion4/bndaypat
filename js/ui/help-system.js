/**
 * help-system.js — Tour guidato, glossario, help cards.
 */

/* ─── Help Card Toggle ──────────────────────────────────────── */
export function toggleHelp(id) {
  const card = document.getElementById(id);
  if (card) card.classList.toggle('visible');
}

/* ─── Welcome Banner ────────────────────────────────────────── */
export function dismissWelcome() {
  document.getElementById('welcomeBanner').classList.add('hidden');
  try { localStorage.setItem('btc_pa_welcome_dismissed', '1'); } catch {}
}

export function checkWelcome() {
  try {
    if (localStorage.getItem('btc_pa_welcome_dismissed') === '1') {
      document.getElementById('welcomeBanner').classList.add('hidden');
    }
  } catch {}
}

/* ─── Glossary Sidebar ──────────────────────────────────────── */
export function openGlossary() {
  document.getElementById('glossaryOverlay').classList.add('active');
}

export function closeGlossary(e) {
  if (!e || e.target === document.getElementById('glossaryOverlay') || e.target.classList.contains('glossary-close')) {
    document.getElementById('glossaryOverlay').classList.remove('active');
  }
}

/* ─── Guided Tour ───────────────────────────────────────────── */
const TOUR_STEPS = [
  {
    target: '#sitPanel',
    title: 'Situazione Corrente',
    body: 'Questo pannello mostra la <strong>fotografia live</strong> del mercato. Analizza le ultime 3 candele e ti dice: la sequenza attuale, il Win Rate storico, il p-value di significatività, la freschezza e i percentili di rendimento.',
  },
  {
    target: '.tabs-bar',
    title: 'Moduli di Analisi',
    body: '<strong>A · Streak</strong> → Dopo N giorni nella stessa direzione, cosa succede?<br><strong>B · Soglie</strong> → Probabilità di guadagnare almeno X%?<br><strong>C · Pattern</strong> → Tutte le combinazioni U/D/J.<br><strong>D · Regime</strong> → Pattern in bull/bear market.<br><strong>E · Classifica</strong> → I migliori pattern.<br><strong>F · Freschezza</strong> → Quali funzionano ancora?<br><strong>G · Grafici</strong> → Visualizzazione candele e pattern.',
  },
  {
    target: '.controls-bar',
    title: 'Barra Controlli',
    body: '<strong>Timeframe</strong>: daily/weekly. <strong>Lunghezza pattern</strong>: 2-4 candele. <strong>Regime</strong>: filtra per contesto. <strong>Solo significativi</strong>: nasconde i pattern che non superano il test statistico (p-value). <strong>α</strong>: soglia di significatività.',
  },
  {
    target: '#modG',
    title: 'Grafici — Visualizzazione Dati',
    body: 'Il grafico mostra tutte le candele scaricate con <strong>SMA(50)</strong> e la zona degli ultimi 6 mesi evidenziata. Seleziona un pattern dal menu → i pallini verdi/rossi mostrano dove si è verificato nella storia e se dopo è salito o sceso. L\'istogramma sotto mostra la distribuzione dei rendimenti.',
  },
  {
    target: '.header-meta',
    title: 'Gestione Dati',
    body: '<strong>⟳ Refresh</strong> = ri-scarica da Binance. <strong>↓ Daily/Weekly</strong> = esporta JSON offline. <strong>?</strong> = glossario. <strong>▶</strong> = questo tour. Zoom con rotella del mouse, drag per spostarti nel grafico.',
  },
  {
    target: null,
    title: 'Pronto!',
    body: 'Clicca <strong>ⓘ</strong> su ogni modulo per help dettagliato. Le tabelle sono ordinabili per colonna. I pattern con ★★★ sono statisticamente significativi. Buona analisi!',
  },
];

let tourCurrent = 0;

export function startTour() {
  tourCurrent = 0;
  document.getElementById('tourOverlay').classList.add('active');
  renderTourStep();
  dismissWelcome();
}

export function endTour() {
  document.getElementById('tourOverlay').classList.remove('active');
}

export function tourNavigate(dir) {
  tourCurrent += dir;
  if (tourCurrent >= TOUR_STEPS.length) { endTour(); return; }
  if (tourCurrent < 0) tourCurrent = 0;
  renderTourStep();
}

function renderTourStep() {
  const step = TOUR_STEPS[tourCurrent];
  const spotlight = document.getElementById('tourSpotlight');
  const card = document.getElementById('tourCard');

  document.getElementById('tourStep').textContent = `Step ${tourCurrent + 1} di ${TOUR_STEPS.length}`;
  document.getElementById('tourTitle').textContent = step.title;
  document.getElementById('tourBody').innerHTML = step.body;

  document.getElementById('tourDots').innerHTML = TOUR_STEPS.map((_, i) =>
    `<div class="tour-dot ${i === tourCurrent ? 'active' : ''}"></div>`
  ).join('');

  document.getElementById('tourPrev').style.display = tourCurrent === 0 ? 'none' : '';
  const nextBtn = document.getElementById('tourNext');
  nextBtn.textContent = tourCurrent === TOUR_STEPS.length - 1 ? 'Chiudi ✓' : 'Avanti →';

  if (step.target) {
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      const pad = 8;
      spotlight.style.display = 'block';
      spotlight.style.top = (rect.top + window.scrollY - pad) + 'px';
      spotlight.style.left = (rect.left - pad) + 'px';
      spotlight.style.width = (rect.width + pad * 2) + 'px';
      spotlight.style.height = (rect.height + pad * 2) + 'px';
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const cardRect = card.getBoundingClientRect();
        const below = rect.bottom + 16;
        if (below + cardRect.height < window.innerHeight + window.scrollY) {
          card.style.top = below + 'px';
        } else {
          card.style.top = Math.max(10, rect.top + window.scrollY - cardRect.height - 16) + 'px';
        }
        card.style.left = Math.min(rect.left, window.innerWidth - 440) + 'px';
        card.style.transform = 'none';
      }, 100);
    } else {
      centerCard(spotlight, card);
    }
  } else {
    centerCard(spotlight, card);
  }
}

function centerCard(spotlight, card) {
  spotlight.style.display = 'none';
  card.style.top = '50%';
  card.style.left = '50%';
  card.style.transform = 'translate(-50%, -50%)';
}

export function initTourKeyboard() {
  document.addEventListener('keydown', e => {
    if (!document.getElementById('tourOverlay').classList.contains('active')) return;
    if (e.key === 'ArrowRight' || e.key === 'Enter') tourNavigate(1);
    if (e.key === 'ArrowLeft') tourNavigate(-1);
    if (e.key === 'Escape') endTour();
  });
}
