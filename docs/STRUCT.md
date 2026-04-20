# BTC Pattern Analyzer

Analisi statistica delle sequenze di candele su Bitcoin. Framework HTML/JS modulare, 100% client-side.

## 🚀 Deploy su GitHub Pages

```bash
# 1. Crea un nuovo repo su GitHub
# 2. Clona e copia i file
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TUOUSER/btc-pattern-analyzer.git
git push -u origin main

# 3. Attiva GitHub Pages
# Settings → Pages → Source: Deploy from branch → main → / (root) → Save
```

Il sito sarà disponibile su `https://TUOUSER.github.io/btc-pattern-analyzer/`

## 📁 Struttura

```
btc-pattern-analyzer/
├── index.html              ← Entry point
├── css/
│   ├── base.css            ← Variabili, layout, tabelle
│   ├── help.css            ← Tour, glossario, help cards
│   └── charts.css          ← Grafici a candele e istogrammi
├── js/
│   ├── app.js              ← Entry point JS, state, orchestrazione
│   ├── engine/
│   │   ├── stats.js        ← Funzioni statistiche (z-test, percentili)
│   │   ├── candles.js      ← Classificazione candele, SMA, ATR, regimi
│   │   ├── patterns.js     ← Streak detection, pattern scanner
│   │   ├── freshness.js    ← Validazione freschezza 6 mesi
│   │   └── data-loader.js  ← Cache IndexedDB + Binance API fetcher
│   ├── ui/
│   │   ├── formatters.js   ← Formatting numeri, CSS classes, sorting
│   │   ├── chart-renderer.js ← Canvas candlestick + istogramma
│   │   └── help-system.js  ← Tour guidato, glossario
│   └── modules/
│       ├── situation.js    ← Pannello Situazione Corrente
│       ├── mod-a-streak.js ← Modulo A: Streak Analysis
│       ├── mod-b-thresholds.js ← Modulo B: Soglie di rendimento
│       ├── mod-c-patterns.js   ← Moduli C+D: Pattern + Regime
│       ├── mod-e-ranking.js    ← Modulo E: Classifiche globali
│       ├── mod-f-freshness.js  ← Modulo F: Freschezza
│       └── mod-g-charts.js     ← Modulo G: Grafici candele
├── data/                   ← JSON opzionali per uso offline
│   ├── btc_daily_data.json
│   └── btc_weekly_data.json
└── docs/
    ├── ISTRUZIONI_AGENTE.md
    ├── GUIDA_NOTEBOOKLM.md
    └── ROADMAP.md
```

## ⚡ Come funziona

1. **Primo caricamento**: scarica ~3200 candele daily BTC/USDT da Binance API (~10 sec).
2. **Caricamenti successivi**: istantanei da cache IndexedDB (si aggiorna ogni 20h).
3. **Uso offline**: esporta con ↓ Daily / ↓ Weekly → metti i JSON in `data/`.

## 🧠 Moduli di analisi

| Modulo | Funzione |
|--------|----------|
| A · Streak | Probabilità dopo N candele nella stessa direzione |
| B · Soglie | P(rendimento ≥ X%) entro K barre |
| C · Pattern | Tutte le combinazioni U/D/J (2-3-4 candele) |
| D · Regime | Pattern filtrati per BULL/BEAR × HIGH/LOW vol |
| E · Classifica | Top 10 per WR, Sharpe, Mean Reversion |
| F · Freschezza | Validazione storico vs ultimi 6 mesi |
| G · Grafici | Candlestick chart + marker pattern + istogramma |

## 📊 Test Statistico

Z-test binomiale bilaterale: H₀: P(Up) = 50%.
- ★★★ p < 0.01 — altamente significativo
- ★★ p < 0.05 — significativo
- ★ p < 0.10 — marginale
- — non significativo

## ⚠️ Requisiti tecnici

- Browser moderno con supporto ES Modules (Chrome 63+, Firefox 67+, Safari 11.1+).
- **Non funziona con `file://`** — servire via HTTP (GitHub Pages, `python -m http.server`, VS Code Live Server).
- Connessione Internet per il primo caricamento (poi offline con cache o JSON).

## 📝 Licenza

Strumento di analisi a scopo educativo. Non costituisce consulenza finanziaria.
