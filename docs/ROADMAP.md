# BTC Pattern Analyzer — Roadmap Sviluppi Futuri

**Stato attuale del progetto:**
- `btc_pattern_analyzer.html` — framework completo con 6 moduli, z-test, freshness score, cache IndexedDB, tour guidato, help contestuali.
- `ISTRUZIONI_AGENTE_BTC_PATTERN.md` — specifica tecnica.
- `BTC_PATTERN_GUIDA_NOTEBOOKLM.md` — sorgente per video/podcast esplicativo.

**Due linee di sviluppo aperte**, entrambe valide e complementari. Da valutare per priorità.

---

## Linea 1 — PineScript per Backtest su TradingView

### Obiettivo
Trasporre la logica dei pattern più significativi del framework in script PineScript v5 eseguibili direttamente su TradingView. L'utente potrà visualizzare i segnali sul grafico nativo, fare backtest con il tester integrato di TradingView, e impostare alert in tempo reale.

### Valore aggiunto
- **Esecuzione nativa su TradingView**: accesso a tutti gli asset (non solo BTC), tutti i timeframe, tutti i dati storici della piattaforma.
- **Alert real-time**: notifiche push quando un pattern significativo si forma.
- **Backtest rigoroso**: il Strategy Tester di TradingView calcola drawdown, Profit Factor, Sharpe, Sortino, numero di trade — metriche di trading, non solo statistiche.
- **Visualizzazione nativa**: le candele classificate U/D/J vengono dipinte direttamente sul grafico.
- **Portabilità**: gli script PineScript sono condivisibili con un link.

### Componenti da sviluppare

**1. `btc_pattern_indicator.pine`** — Indicatore visuale
- Classifica ogni candela (U/D/J) e la colora/marca sul grafico.
- Evidenzia le sequenze di interesse con box o label (es. quando si forma "D-D-D").
- Mostra regime corrente (BULL/BEAR + HIGH/LOW VOL) nell'angolo.
- Plotta SMA(50) e ATR(14) per contesto.

**2. `btc_pattern_strategy.pine`** — Strategia di backtest
- Input configurabili: pattern target (es. "DDD"), timeframe, regime filter.
- Entry: al chiuso della candela che completa il pattern.
- Exit: take profit / stop loss / tempo massimo (1-7 barre).
- Permette di testare uno specifico pattern emerso come significativo dal framework HTML.

**3. `btc_pattern_scanner.pine`** — Scanner multi-pattern
- Monitora simultaneamente i top N pattern dal Modulo E (significativi e confermati).
- Genera alert quando uno di questi si verifica.
- Compatibile con il screener di TradingView.

### Ponte HTML → PineScript
Il framework HTML potrebbe avere un pulsante **"Esporta in PineScript"** su ogni pattern significativo che genera automaticamente il codice PineScript pronto all'uso. Esempio di output:

```pinescript
//@version=5
strategy("BTC Pattern DDD (WR 62% p<0.01)", overlay=true)

// Classificazione candele
bodyRatio = math.abs(close - open) / (high - low)
isU = close > open and bodyRatio > 0.25
isD = close < open and bodyRatio > 0.25
isJ = bodyRatio <= 0.25

// Rileva pattern D-D-D
patternDDD = isD[2] and isD[1] and isD

// Entry
if patternDDD
    strategy.entry("Long", strategy.long)

// Exit dopo 3 barre
if ta.barssince(strategy.position_size > 0) >= 3
    strategy.close("Long")
```

### Complessità stimata
- Indicatore base: 1-2 ore di sviluppo.
- Strategia con parametri: 2-3 ore.
- Scanner multi-pattern: 3-4 ore.
- Generatore PineScript dall'HTML: 2-3 ore (lato JavaScript, genera template PineScript).

### Limiti
- PineScript non supporta calcoli statistici complessi (z-test, percentili sono possibili ma verbosi).
- Non si può replicare la validazione di freschezza degli ultimi 6 mesi in modo dinamico (si può fissare una soglia temporale).
- Il lookback massimo su TradingView free è limitato a ~5000 candele.

---

## Linea 2 — Elementi Grafici nel Framework HTML

### Obiettivo
Trasformare il framework da "tutto-tabelle" a strumento visuale, aggiungendo rappresentazioni grafiche che rendano immediatamente percepibile ciò che i numeri dicono.

### Livelli di sviluppo

#### Livello 2.1 — Grafico dei campioni OHLCV
Grafico a candele del dataset caricato, con:
- Zoom e pan.
- Overlay SMA(50) e bande di volatilità.
- Marker sulle candele classificate U/D/J (colori leggermente diversi o mini-label).
- Highlight del periodo "ultimi 6 mesi" (finestra di freschezza).

**Libreria consigliata**: Lightweight Charts (TradingView open source, 40KB, performante su 5000+ candele). Alternativa: Chart.js già menzionato nelle istruzioni.

#### Livello 2.2 — Visualizzazione dei pattern trovati
Per ogni pattern significativo, mostrare sul grafico **tutte le occorrenze storiche**:
- Marker verticali (o box) sulle date in cui il pattern si è verificato.
- Colore del marker in base al risultato (verde se dopo è salito, rosso se è sceso).
- Hover: tooltip con la data e il rendimento successivo.

Questo trasforma una riga di tabella ("D-D-D, 79 campioni, WR 62%") in una visualizzazione: 79 marker distribuiti sul grafico, 49 verdi e 30 rossi. La distribuzione temporale racconta se il pattern è uniforme o concentrato in certi periodi (es. solo in bear market).

#### Livello 2.3 — Distribuzione dei rendimenti
Per ogni pattern selezionato, un **istogramma dei rendimenti post-pattern**:
- Asse X: rendimento % dopo N barre (-5%, -4%, ..., +5%, +10%).
- Asse Y: frequenza (numero di occorrenze).
- Linea verticale sulla media e mediana.
- Zone ombreggiate per P10 e P90.

Rende immediatamente visibile se il pattern ha una distribuzione simmetrica (→ rumore) o asimmetrica (→ edge reale).

#### Livello 2.4 — Heatmap temporale del WR
Grafico che mostra come il WR di un pattern è evoluto nel tempo:
- Asse X: tempo (anni o trimestri).
- Asse Y: WR calcolato su finestra mobile di 6 mesi.
- Linea orizzontale al 50% (soglia casualità).
- Bande di confidenza (intervallo al 95%).

Visualizza graficamente il concetto di freschezza: si vede a colpo d'occhio se il pattern è stabile, ciclico, o in decadimento.

#### Livello 2.5 — Sparkline inline nelle tabelle
Mini-grafici da 60×20 pixel dentro le celle della tabella che mostrano la sparkline del WR mobile degli ultimi 2 anni. Permette di vedere la "traiettoria" del pattern senza cliccare.

### Complessità stimata
- Livello 2.1 (grafico candele): 3-4 ore.
- Livello 2.2 (marker pattern): 2-3 ore aggiuntive.
- Livello 2.3 (istogramma rendimenti): 2 ore.
- Livello 2.4 (heatmap temporale): 3-4 ore.
- Livello 2.5 (sparkline): 2 ore.

### Domanda aperta: modal o pagina?
Due approcci possibili:
- **Modal**: clic su una riga di tabella → si apre un pannello con tutti i grafici per quel pattern. Non rompe l'interfaccia attuale.
- **Vista dedicata**: una nuova tab "Grafici" con selettore pattern. Più spazio per i grafici, ma frammenta l'esperienza.

### Limiti
- I grafici aumentano il peso dell'HTML (Lightweight Charts è 40KB, quindi gestibile).
- Renderizzare 3000+ candele al primo caricamento può rallentare su dispositivi lenti (mitigabile con lazy loading).

---

## Sinergia tra le due linee

Le due linee NON sono alternative: sono **complementari**.

- **Linea 2 (grafici nel tool)** = migliora la fase di **scoperta** (analisi esplorativa, capire quali pattern vale la pena approfondire).
- **Linea 1 (PineScript)** = migliora la fase di **esecuzione** (portare i pattern validati sul campo, con alert e backtest di trading).

Un workflow integrato sarebbe:
1. Apri l'HTML → esplori i pattern con le tabelle e i grafici.
2. Identifichi un pattern significativo e confermato (es. "DDD sul weekly, WR 72%, p<0.001").
3. Clicchi "Esporta in PineScript" → scarichi lo script.
4. Lo carichi su TradingView → imposti un alert → aspetti.

### Suggerimento di priorità
Se dovessi scegliere una, direi **Linea 2.1 + 2.2** (grafico candele + visualizzazione pattern): trasforma la percezione del tool dal "foglio Excel avanzato" a "strumento visuale professionale", con impatto immediato sulla comprensibilità. È anche la base su cui costruire gli altri livelli grafici.

La Linea 1 (PineScript) ha più valore **dopo** che l'utente ha già identificato pattern di cui si fida — quindi arriva naturalmente nella fase 2 del workflow.

Ma entrambe sono valide e possono essere sviluppate in parallelo: non c'è dipendenza tecnica tra le due.

---

## Stato di avanzamento

| Linea | Componente | Stato |
|---|---|---|
| 1 | Indicatore base PineScript | 🔵 Da fare |
| 1 | Strategy tester | 🔵 Da fare |
| 1 | Scanner multi-pattern | 🔵 Da fare |
| 1 | Generatore PineScript dall'HTML | 🔵 Da fare |
| 2.1 | Grafico candele OHLCV | 🔵 Da fare |
| 2.2 | Marker pattern storici | 🔵 Da fare |
| 2.3 | Istogramma rendimenti | 🔵 Da fare |
| 2.4 | Heatmap temporale WR | 🔵 Da fare |
| 2.5 | Sparkline nelle tabelle | 🔵 Da fare |

Legenda: 🔵 da fare · 🟡 in corso · 🟢 completato
