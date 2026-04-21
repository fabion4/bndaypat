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

## Linea 3 — Test Suite di Regressione

### Obiettivo
Introdurre un'infrastruttura di test automatizzati che copra l'engine statistico, la classificazione candele, il pattern scanner, il data loader e gli entry point dei moduli UI, in modo da rilevare immediatamente qualunque regressione introdotta da modifiche successive (refactoring, estensioni, fix). L'idea di fondo è che ogni numero mostrato in tabella deve essere riproducibile da un test, e ogni funzione dell'engine deve avere un contratto verificabile.

### Motivazione
Il progetto ha ormai superato la soglia della complessità gestibile "a vista": l'engine combina z-test binomiale, percentili, classificazione U/D/J con soglie di corpo, SMA/ATR, regime detection, streak analysis, pattern scanner multi-lunghezza e validazione di freschezza a finestra mobile. Questi calcoli sono **interdipendenti** (es. il regime filtra i pattern, che a loro volta alimentano la classifica globale) e **non verificabili a occhio**: una modifica silenziosa a `candles.js` — ad esempio un cambio della soglia `bodyRatio` per la classificazione J — può propagarsi su tutti i moduli senza produrre errori visibili, cambiando però il significato statistico dei risultati.

Senza test:
- Un refactoring dell'engine richiede una verifica manuale lenta e incompleta.
- Le modifiche esplorative (es. sperimentare una definizione alternativa di candela J) sono rischiose perché non si può tornare facilmente al comportamento precedente.
- Non esiste un "golden output" di riferimento: se due versioni del tool producono tabelle diverse, non si sa quale sia quella corretta.
- L'integrazione di contributi esterni (o di un agente AI) diventa pericolosa, perché non c'è un cancello automatico che segnali le rotture.

### Principi di design
- **Zero framework in produzione, test-only dependencies isolati**: in linea con il vincolo architetturale del progetto, la runtime dell'app resta vanilla ES Modules. I test vivono in una cartella separata (`tests/`) e girano con un runner in `devDependencies` (Vitest o node:test nativo), mai caricato dal browser.
- **Fast, deterministic, offline**: i test non devono dipendere da Binance API né da IndexedDB. Il data loader va testato contro fixture JSON locali e mock del fetch.
- **Unit prima di integration**: la piramide classica. L'engine è puro (input → output), quindi testabile al 100% con unit test. La UI richiede meno coverage, solo smoke test.
- **Golden tests sul dominio**: i risultati numerici di riferimento (WR, p-value, z-score di pattern noti) vengono congelati in file JSON snapshot rigenerabili esplicitamente.

### Livelli di sviluppo

#### Livello 3.1 — Unit test dell'engine statistico (`engine/stats.js`)
Verifica diretta delle funzioni pure:
- Z-test binomiale bilaterale: confronto con valori noti (es. 60/100 successi → z = 2.0, p ≈ 0.0455) e casi limite (0 successi, 100% successi, n = 0).
- Percentili (P10, P25, P50, P75, P90): su array costruiti ad hoc con mediana nota.
- Interpolazione ed edge cases (array vuoto, array con un solo elemento, valori duplicati).

Coverage target: **100%** — è il cuore statistico del tool.

#### Livello 3.2 — Test di classificazione candele e indicatori (`engine/candles.js`)
- Classificazione U/D/J su candele costruite manualmente con body ratio noto ai margini della soglia.
- SMA(50): confronto con calcolo di riferimento su serie sintetica.
- ATR(14): verifica della formula Wilder e gestione del warm-up window.
- Regime detection (BULL/BEAR × HIGH/LOW VOL): matrice di test con tutte e 4 le combinazioni.

#### Livello 3.3 — Test del pattern scanner e streak detection (`engine/patterns.js`)
- Streak analysis: su serie sintetica con streak noti (es. U-U-U-U-D → streak di 4 U seguita da 1 D) verificare che il conteggio e le probabilità condizionali siano corrette.
- Pattern scanner: costruire una serie in cui il pattern "D-D-D" appare esattamente K volte e verificare che il contatore restituisca K, con i rendimenti attesi dopo N barre.
- Filtro per regime: verificare che il filtro non passi pattern fuori regime.

#### Livello 3.4 — Test di freschezza (`engine/freshness.js`)
- Test della finestra mobile degli ultimi 6 mesi: dataset sintetico con pattern concentrato nei primi anni → freshness score basso.
- Dataset con pattern costante nel tempo → freshness score alto.
- Edge case: meno di 6 mesi di dati disponibili.

#### Livello 3.5 — Test del data loader con fetch mockato (`engine/data-loader.js`)
- Mock di `fetch` (Binance API) per simulare risposte valide, risposte parziali, errori di rete, rate limiting.
- Mock di IndexedDB (es. `fake-indexeddb`) per verificare che la cache venga scritta, letta, invalidata dopo 20h.
- Verifica dell'idempotenza: due chiamate ravvicinate non devono raddoppiare le request HTTP.
- Verifica del merge incrementale quando arrivano nuove candele rispetto al cache.

#### Livello 3.6 — Golden tests / snapshot numerici sui moduli
Per ogni modulo (A, B, C, D, E, F) si fissa un dataset di riferimento (subset di 500 candele BTC in `tests/fixtures/btc_sample.json`) e si congela l'output completo in uno snapshot JSON. Ogni modifica che alteri i numeri fa fallire il test, costringendo a un'aggiornamento esplicito dello snapshot.

Questo è il livello che fornisce la protezione più forte contro regressioni silenziose: non importa dove sia stata introdotta la modifica (engine, formatter, ordinamento), se i numeri finali cambiano il test segnala la differenza.

#### Livello 3.7 — Smoke test della UI e boot dell'app
Test end-to-end leggeri (jsdom o Playwright headless):
- `app.js` carica senza throw su dataset di fixture.
- Ogni modulo (A → G) monta il proprio pannello nel DOM senza errori.
- Click sui principali controlli (cambio timeframe, apertura help, export JSON) non generano exception.

Non si testa l'estetica, solo l'assenza di crash.

#### Livello 3.8 — Integrazione CI (GitHub Actions)
Workflow `.github/workflows/test.yml` che:
- Esegue la test suite su ogni push e pull request.
- Blocca il merge su `main` se i test falliscono.
- Pubblica un badge di stato nel README.
- Opzionale: report di coverage (c8 / istanbul).

Questo chiude il cerchio: il deploy su GitHub Pages (già attivo) viene condizionato al verde della pipeline.

### Struttura di cartelle proposta
```
tests/
├── unit/
│   ├── stats.test.js
│   ├── candles.test.js
│   ├── patterns.test.js
│   ├── freshness.test.js
│   └── data-loader.test.js
├── integration/
│   ├── modules.test.js        ← golden snapshot per mod-a..mod-g
│   └── app-boot.test.js       ← smoke test UI
├── fixtures/
│   ├── btc_sample.json        ← subset deterministico di candele
│   ├── binance-response.json  ← mock HTTP
│   └── snapshots/             ← output congelati dei moduli
└── helpers/
    └── mock-idb.js
```

### Stack suggerito
- **Runner**: Vitest (velocissimo, ESM nativo, API compatibile Jest) oppure `node --test` (zero dipendenze, più spartano).
- **DOM simulato**: jsdom o happy-dom per i smoke test UI.
- **Mock IndexedDB**: `fake-indexeddb`.
- **Coverage**: c8 (integrato in Vitest).

Nessuna di queste dipendenze finisce mai nel bundle servito al browser — restano confinate in `devDependencies`.

### Complessità stimata
- Livello 3.1 (unit stats): 2-3 ore.
- Livello 3.2 (unit candles): 2-3 ore.
- Livello 3.3 (unit patterns): 3-4 ore.
- Livello 3.4 (unit freshness): 1-2 ore.
- Livello 3.5 (data loader con mock): 3-4 ore.
- Livello 3.6 (golden tests moduli): 3-5 ore (la difficoltà sta nel costruire la fixture giusta).
- Livello 3.7 (smoke UI): 2-3 ore.
- Livello 3.8 (CI GitHub Actions): 1 ora.

**Totale indicativo**: 17-25 ore per coverage completa. MVP utile (3.1 + 3.2 + 3.6 + 3.8) in ~10 ore.

### Limiti e trade-off
- Introduce una dipendenza di sviluppo (Node + runner) che prima non esisteva. Il progetto a runtime resta però identico: nessun file in `js/` cambia forma, nessun import aggiunto in `index.html`.
- I golden snapshot richiedono disciplina: quando si aggiorna lo snapshot va capito **perché** è cambiato, altrimenti il meccanismo perde valore.
- I test non sostituiscono la validazione statistica del dominio (la freschezza, il p-value): verificano che il codice sia coerente con sé stesso, non che il modello sia giusto.
- Serve decidere una policy: test obbligatori in PR? Coverage minima? Snapshot rigenerabili a piacere o solo con flag esplicito?

### Precondizione
Prima di scrivere test massivi conviene estrarre eventuali funzioni ancora accoppiate al DOM dentro l'engine verso moduli puri. Se l'engine è già puro (input → output senza side effect) come dalla `STRUCT.md`, questa precondizione è soddisfatta e si può partire dal Livello 3.1.

---

## Linea 4 — Pattern Strutturali: Code e Livelli di Prezzo

### Obiettivo
Estendere il motore di pattern oltre le sequenze direzionali U/D/J, introducendo una nuova famiglia di pattern basati sulla **geometria delle code** e sull'**allineamento di prezzo tra candele consecutive**. L'idea di fondo è che due candele adiacenti che toccano lo stesso livello di prezzo — senza "lasciare spazio" in quella direzione — codificano un'informazione strutturale che i semplici label U/D/J non catturano.

### Concetto fondamentale: candele senza coda

Una candela ha una **coda inferiore** se `low < min(open, close)`, ovvero se il prezzo ha toccato livelli sotto il corpo prima di tornare su. Analogamente per la coda superiore rispetto a `high`. Una candela è **senza coda inferiore** quando `low == min(open, close)` — il prezzo non è mai sceso sotto il corpo: è partito (o arrivato) esattamente dal minimo.

In pratica, questa condizione è quasi mai esatta su dati reali, quindi si introduce una **soglia di tolleranza relativa**: la coda inferiore è assente se `(min(open,close) - low) / (high - low) < ε`, con ε configurabile (es. 0.02 = 2% del range della candela). Analogamente per la coda superiore.

Si definiscono quindi quattro attributi aggiuntivi per ogni candela, ortogonali al label U/D/J:
- **`noTailDown`**: coda inferiore assente (close o open coincide col low entro ε)
- **`noTailUp`**: coda superiore assente (close o open coincide col high entro ε)
- **`flatBottom`**: sinonimo semantico di noTailDown, usato per enfatizzare la natura di "pavimento piatto"
- **`flatTop`**: sinonimo di noTailUp, "soffitto piatto"

### Esempio chiave: D+U flat bottom condiviso

Il caso prototipico che ha motivato questa linea:
1. Candela **D** (ribassista) con `noTailDown` — chiude esattamente al suo low. Nessuna coda inferiore: il mercato è sceso e si è fermato lì, senza tentare rimbalzi.
2. Candela **U** (rialzista) immediatamente successiva con `noTailDown` — apre esattamente allo stesso valore `low`. Il prezzo non ha mai cercato livelli inferiori: è rimbalzato secco.
3. I due `low` sono allo stesso livello entro una soglia di prezzo assoluta (es. < 0.1% di differenza).

Questa sequenza D(flat-bottom)+U(flat-bottom) co-localizzati descrive un **rimbalzo su supporto preciso**: il mercato ha toccato un livello esatto due volte consecutive senza mai scendervi sotto, e la seconda volta ha invertito. È concettualmente diverso da un semplice "D seguito da U" perché cattura la precisione geometrica del rimbalzo.

Il pattern speculare sul lato superiore è U(flat-top)+D(flat-top): un rigetto su resistenza precisa.

### Livelli di sviluppo

#### Livello 4.1 — Estensione del classificatore candele (`engine/candles.js`)
Aggiungere a ogni oggetto candela i campi `noTailDown`, `noTailUp` e il `tailRatio` per entrambe le direzioni:
```js
// tailRatioDown: quanto del range totale è sotto il corpo (0 = nessuna coda inferiore)
tailRatioDown: (Math.min(open, close) - low) / (high - low || 1),
tailRatioUp:   (high - Math.max(open, close)) / (high - low || 1),
noTailDown:    tailRatioDown < TAIL_THRESHOLD,   // es. TAIL_THRESHOLD = 0.05
noTailUp:      tailRatioUp   < TAIL_THRESHOLD,
```
Il parametro `TAIL_THRESHOLD` è configurabile dall'utente (slider o input numerico, default 0.05 = 5% del range). Questo permette di vedere come cambia la frequenza dei pattern al variare della soglia.

#### Livello 4.2 — Scanner per pattern strutturali (`engine/patterns.js`)
Un secondo scanner, parallelo a quello esistente per le sequenze U/D/J, che rileva pattern definiti da:
- Label direzionale (U/D/J) su ogni candela della sequenza
- Presenza o assenza di coda (noTailDown / noTailUp) su una o più candele
- Allineamento di prezzo tra candele adiacenti (es. `|low[i] - low[i+1]| / low[i] < PRICE_ALIGN_THRESHOLD`)

La struttura del pattern si esprime con un descrittore compatto, ad esempio:
```
D(ntd)+U(ntd)@low   // D senza coda inferiore + U senza coda inferiore, low allineati
U(ntu)+D(ntu)@high  // U senza coda superiore + D senza coda superiore, high allineati
D(ntd)+U            // D senza coda inferiore seguito da qualsiasi U (indipendente dall'allineamento)
```
Il motore scandisce tutto lo storico cercando occorrenze di questi descrittori e calcola — esattamente come fa per U/D/J — win rate, z-score, p-value, rendimento medio, percentili P10/P90 nelle N barre successive.

#### Livello 4.3 — Catalogo automatico dei pattern strutturali
A differenza del Modulo C (che enumera **tutte** le combinazioni U/D/J), i pattern strutturali hanno uno spazio molto più grande perché si aggiungono i flag di coda e l'allineamento di prezzo. Si adotta quindi un approccio **discovery-first**: lo scanner rileva tutte le sequenze di 2–3 candele con almeno un flag di coda attivo e le ordina per frequenza e significatività. Solo i pattern con almeno 20 occorrenze vengono mostrati. Il risultato è una tabella analoga al Modulo C, ma per la nuova famiglia.

#### Livello 4.4 — Nuovo modulo UI (`modules/mod-h-structural.js`)
Pannello dedicato "H · Pattern Strutturali" con:
- Slider per la soglia `TAIL_THRESHOLD` (0%–10%), con aggiornamento dinamico della tabella.
- Slider per la soglia di allineamento prezzi `PRICE_ALIGN_THRESHOLD` (0%–1%).
- Tabella dei pattern rilevati con le stesse colonne del Modulo C: label descrittivo, n. occorrenze, WR, z-score, p-value, Sharpe, rendimento mediano.
- Filtro per regime (BULL/BEAR × HIGH/LOW VOL), coerente con il Modulo D.
- Integrazione con il Modulo G (grafici): clic su un pattern mostra le occorrenze storiche marcate sul candlestick chart.

#### Livello 4.5 — Generalizzazione: libreria di pattern strutturali noti
Dopo il livello discovery, si può costruire un catalogo di pattern "classici" già nominati nella letteratura tecnica, implementati con la nuova infrastruttura:
- **Hammer / Hanging Man**: U o D con coda inferiore lunga (tailRatioDown > 0.6) e coda superiore assente.
- **Shooting Star / Inverted Hammer**: U o D con coda superiore lunga (tailRatioUp > 0.6) e coda inferiore assente.
- **Marubozu**: entrambe le code assenti (noTailDown AND noTailUp) — candela pura senza indecisione.
- **Engulfing**: U che apre sotto il close della D precedente e chiude sopra il suo open (o viceversa).
- **Tweezer Bottom**: D(ntd)+U(ntd) con low allineato (il caso prototipico della Linea 4).
- **Tweezer Top**: U(ntu)+D(ntu) con high allineato.

Ogni pattern classico viene analizzato statisticamente sullo storico BTC, producendo un report confrontabile con il Modulo C e con i pattern discovery del Livello 4.3.

### Impatto sull'architettura

Le modifiche sono **additive e non distruttive**:
- `candles.js`: aggiunta dei campi `tailRatioDown`, `tailRatioUp`, `noTailDown`, `noTailUp` a ogni oggetto candela. Nessuna modifica alle classificazioni esistenti U/D/J.
- `patterns.js`: secondo scanner affiancato a quello esistente. Nessuna modifica al primo scanner.
- `modules/mod-h-structural.js`: nuovo file, non tocca i moduli A–G.
- `index.html`: aggiunta di un tab/sezione per il Modulo H.
- `css/`: eventuali stili per il nuovo pannello.

### Complessità stimata
- Livello 4.1 (classificatore + tail attributes): 1–2 ore.
- Livello 4.2 (scanner strutturale): 3–4 ore.
- Livello 4.3 (catalogo discovery): 2–3 ore.
- Livello 4.4 (modulo UI mod-h): 3–4 ore.
- Livello 4.5 (pattern classici noti): 2–3 ore.

**Totale indicativo**: 11–16 ore per la linea completa. MVP utile (4.1 + 4.2 + pattern Tweezer Bottom/Top) in ~5 ore.

### Limiti
- La soglia `TAIL_THRESHOLD` è arbitraria: cambiandola cambiano le occorrenze e quindi la significatività statistica. Occorre comunicare chiaramente all'utente che ogni scelta di soglia produce uno studio diverso.
- L'allineamento di prezzo tra due low consecutivi è sensibile alla granularità del dato (su daily 0.1% è ragionevole, su weekly potrebbe richiedere una soglia più larga).
- I pattern a 2–3 candele con flag multipli (coda + allineamento) hanno frequenze basse per costruzione: molti avranno meno di 20 occorrenze e non risulteranno significativi. Il discovery deve gestire bene il caso "troppo pochi campioni".
- Serve decidere se i pattern strutturali rientrano nel sistema di freschezza del Modulo F: idealmente sì, ma richiede di estendere `freshness.js`.

---

## Sinergia tra le linee

Le linee 1 e 2 sono **funzionali** (ampliano ciò che l'utente può fare). La Linea 3 è **infrastrutturale** (protegge ciò che il tool fa già). La Linea 4 è un'**estensione del dominio analitico**: introduce una nuova famiglia di segnali che si affianca — senza sostituire — l'analisi sequenziale U/D/J. Sono ortogonali e si rinforzano a vicenda:

- **Linea 2 (grafici nel tool)** = migliora la fase di **scoperta** (analisi esplorativa, capire quali pattern vale la pena approfondire).
- **Linea 1 (PineScript)** = migliora la fase di **esecuzione** (portare i pattern validati sul campo, con alert e backtest di trading).
- **Linea 3 (test suite)** = abilita la fase di **evoluzione** (rendere il codice modificabile senza paura, condizione necessaria per far crescere le altre due linee).
- **Linea 4 (pattern strutturali)** = amplia il **vocabolario analitico** del tool: introduce segnali geometrici (code, allineamenti di prezzo) che le sequenze U/D/J non possono esprimere.

Un workflow integrato sarebbe:
1. Apri l'HTML → esplori i pattern con le tabelle e i grafici (Linea 2).
2. Identifichi un pattern significativo e confermato (es. "DDD sul weekly, WR 72%, p<0.001" oppure "Tweezer Bottom, WR 68%, p<0.05").
3. Clicchi "Esporta in PineScript" → scarichi lo script (Linea 1).
4. Lo carichi su TradingView → imposti un alert → aspetti.

### Suggerimento di priorità
Se dovessi scegliere una linea funzionale, direi **Linea 2.1 + 2.2** (grafico candele + visualizzazione pattern): trasforma la percezione del tool dal "foglio Excel avanzato" a "strumento visuale professionale", con impatto immediato sulla comprensibilità. È anche la base su cui costruire gli altri livelli grafici.

La **Linea 4 (pattern strutturali)** è un candidato forte per un secondo step funzionale: il Livello 4.1 (tail attributes) è rapido da implementare e sblocca immediatamente un'analisi nuova e complementare. I pattern Tweezer Bottom/Top in particolare sono tra i più studiati nel trading tecnico — avere statistiche rigorose su BTC su di essi ha valore autonomo.

La Linea 1 (PineScript) ha più valore **dopo** che l'utente ha già identificato pattern di cui si fida — quindi arriva naturalmente nella fase 2 del workflow.

La **Linea 3 (test suite)** andrebbe idealmente iniziata **prima** di espandere le funzionalità: fissare ora il comportamento corretto dell'engine significa poter poi aggiungere grafici, pattern strutturali ed export PineScript con la sicurezza che i numeri di base non si muovano. Un MVP minimo (3.1 + 3.6 + 3.8) vale più di tutti gli altri livelli presi singolarmente in termini di rischio/benefit.

Le linee funzionali possono essere sviluppate in parallelo: non c'è dipendenza tecnica tra loro, e la Linea 3 non blocca nessuna delle altre, le rende solo più sicure.

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
| 3.1 | Unit test engine statistico (stats.js) | 🔵 Da fare |
| 3.2 | Unit test classificazione candele (candles.js) | 🔵 Da fare |
| 3.3 | Unit test pattern scanner (patterns.js) | 🔵 Da fare |
| 3.4 | Unit test freschezza (freshness.js) | 🔵 Da fare |
| 3.5 | Test data loader con fetch/IDB mockati | 🔵 Da fare |
| 3.6 | Golden snapshot tests sui moduli A–F | 🔵 Da fare |
| 3.7 | Smoke test UI (boot app + moduli) | 🔵 Da fare |
| 3.8 | CI GitHub Actions + badge | 🔵 Da fare |
| 4.1 | Tail attributes nel classificatore candele (candles.js) | 🔵 Da fare |
| 4.2 | Scanner pattern strutturali (patterns.js) | 🔵 Da fare |
| 4.3 | Catalogo discovery pattern strutturali | 🔵 Da fare |
| 4.4 | Modulo H — UI Pattern Strutturali (mod-h-structural.js) | 🔵 Da fare |
| 4.5 | Pattern classici noti (Tweezer, Marubozu, Hammer, ecc.) | 🔵 Da fare |

Legenda: 🔵 da fare · 🟡 in corso · 🟢 completato
