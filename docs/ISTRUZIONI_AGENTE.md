# Istruzioni Agente: Framework di Analisi Statistica Pattern Bitcoin

## 1. Obiettivo del Progetto

Costruire un **framework HTML portabile** per l'analisi statistica delle sequenze di candele (pattern) su Bitcoin, operante su dati giornalieri (daily) e settimanali (weekly). Il sistema deve essere completamente client-side, senza dipendenze da server, e deve includere i dati storici in file JSON separati per massima portabilità e manutenibilità.

---

## 2. Architettura dei File

Il progetto si compone di **3 file**:

| File | Ruolo |
|---|---|
| `btc_pattern_analyzer.html` | Interfaccia + motore di calcolo (HTML/CSS/JS) |
| `btc_daily_data.json` | Serie storica giornaliera OHLCV di BTC/USD |
| `btc_weekly_data.json` | Serie storica settimanale OHLCV di BTC/USD (derivabile dal daily oppure scaricata separatamente) |

### 2.1 Formato dati JSON

Ogni file JSON è un array di oggetti con questa struttura:

```json
[
  {
    "date": "2015-01-01",
    "open": 314.25,
    "high": 318.90,
    "close": 315.00,
    "low": 312.10,
    "volume": 12345678
  }
]
```

- Ordinamento: cronologico crescente (dal più vecchio al più recente).
- Sorgente consigliata: CoinGecko API, Yahoo Finance (BTC-USD), o CryptoCompare.
- Range minimo: dal **1 gennaio 2015** ad oggi (minimo ~3800 candele daily).
- Il volume è opzionale ma consigliato.

---

## 3. Classificazione delle Candele

Ogni candela deve essere classificata in **3 categorie**:

| Tipo | Codice | Condizione |
|---|---|---|
| Rialzista | `U` (Up) | `close > open` AND `body > 25% del range` |
| Ribassista | `D` (Down) | `close < open` AND `body > 25% del range` |
| Doji/Indecisa | `J` (doJi) | `body <= 25% del range` |

Dove:
- `body = abs(close - open)`
- `range = high - low`
- Se `range == 0`, classificare come `J`.

---

## 4. Moduli di Analisi Richiesti

### 4.1 Modulo A — Probabilità Direzionali Semplici (Streak Analysis)

Calcolare la probabilità che la candela N+1 sia rialzista dopo una **streak** di N candele nella stessa direzione.

**Output richiesto (tabella):**

| Streak | Dir. | Campioni | P(Up) N+1 | P(Up) N+2 | P(Up) N+3 | Rend. Medio N+1 | Rend. Med. N+1 |
|---|---|---|---|---|---|---|---|
| 1 Up | U | 423 | 52.1% | ... | ... | +0.34% | +0.18% |
| 2 Up | UU | 198 | 48.7% | ... | ... | ... | ... |
| 3 Up | UUU | 87 | ... | ... | ... | ... | ... |
| ... | | | | | | | |
| 1 Down | D | 410 | ... | ... | ... | ... | ... |
| 2 Down | DD | 185 | ... | ... | ... | ... | ... |
| 3 Down | DDD | 79 | ... | ... | ... | ... | ... |

- Calcolare fino alla streak massima presente nei dati (tipicamente 7-9 per daily).
- Includere P(Up) a 1, 2, 3 barre di distanza (persistenza del segnale).
- Includere rendimento medio e mediano alla barra N+1.

### 4.2 Modulo B — Probabilità di Superamento Soglia

Dopo N giorni consecutivi nella stessa direzione, calcolare la probabilità che il prezzo salga di almeno X% entro K barre.

**Soglie di rendimento**: +0.5%, +1%, +2%, +3%, +5%.
**Orizzonti temporali**: 1, 2, 3, 5, 7 barre.

**Output (tabella heatmap):**

| Streak → Soglia ↓ | 1 barra | 2 barre | 3 barre | 5 barre | 7 barre |
|---|---|---|---|---|---|
| ≥ +0.5% | 38% | 45% | 51% | ... | ... |
| ≥ +1.0% | 22% | 31% | ... | ... | ... |
| ≥ +2.0% | 11% | ... | ... | ... | ... |

Generare una tabella per ogni livello di streak (es. dopo 2D, dopo 3D, dopo 2U, ecc.).

### 4.3 Modulo C — Pattern di Sequenze Arbitrarie

Analizzare combinazioni specifiche di candele (non solo streak pure).

**Sequenze da analizzare** (lunghezza 2, 3, 4):

- Tutte le combinazioni di {U, D, J} per lunghezze 2 e 3.
  - Lunghezza 2: UU, UD, UJ, DU, DD, DJ, JU, JD, JJ → 9 combinazioni.
  - Lunghezza 3: UUU, UUD, UUJ, UDU, UDD, ... → 27 combinazioni.
- Per lunghezza 4: calcolare solo se campioni ≥ 10.

**Output per ogni sequenza:**

| Sequenza | N | WR | P(Up)+2 | P(Up)+3 | Rend. Medio | Rend. Med. | P10 | P50 | P90 | Sharpe |
|---|---|---|---|---|---|---|---|---|---|---|
| U-D-U | 156 | 54.2% | ... | ... | ... | ... | ... | ... | ... | ... |

Sharpe semplificato = media rendimenti / dev.std rendimenti (senza risk-free).

### 4.4 Modulo D — Filtro Regime di Mercato

Classificare il regime di mercato corrente e filtrare le statistiche:

| Regime | Condizione |
|---|---|
| BULL | Prezzo > SMA(50) |
| BEAR | Prezzo ≤ SMA(50) |
| HIGH_VOL | ATR(14) > mediana storica ATR(14) |
| LOW_VOL | ATR(14) ≤ mediana storica ATR(14) |

Combinazioni: BULL+LOW, BULL+HIGH, BEAR+LOW, BEAR+HIGH.

Quando il filtro è attivo, i campioni vengono ristretti a quelli che si sono verificati nello stesso regime. Se i campioni scendono sotto 10, disabilitare il filtro e segnalarlo.

### 4.5 Modulo E — Classifica Globale Pattern

Generare una classifica dei pattern ordinata per profittabilità (Sharpe o WR), mostrando:

1. Top 10 pattern per WR (con minimo 15 campioni).
2. Top 10 pattern per Sharpe (con minimo 15 campioni).
3. Top 10 pattern per mean reversion (pattern ribassisti con più alta P(Up) successiva).

### 4.6 Modulo F — Validazione di Freschezza (Recency Validation)

I pattern storici possono perdere validità nel tempo a causa di cambiamenti strutturali del mercato (adozione istituzionale, introduzione di derivati, variazione della base di partecipanti). Questo modulo protegge dall'affidarsi a pattern "passati di moda" confrontando la performance storica globale con quella recente.

#### 4.6.1 Finestra di Validazione

- **Finestra recente**: ultimi 180 giorni di calendario (≈ 6 mesi) per il daily, ultime 26 settimane per il weekly.
- La finestra è mobile: si aggiorna automaticamente in base alla data dell'ultimo dato disponibile.

#### 4.6.2 Metriche di Confronto

Per ogni pattern rilevato nei Moduli A, B, C, calcolare **due set di statistiche paralleli**:

| Metrica | Storico Globale | Ultimi 6 Mesi | Delta |
|---|---|---|---|
| N campioni | N_global | N_recente | — |
| WR | WR_global | WR_recente | WR_recente - WR_global |
| Rend. Medio | μ_global | μ_recente | μ_recente - μ_global |
| Rend. Med. | med_global | med_recente | med_recente - med_global |
| Sharpe | S_global | S_recente | S_recente - S_global |

#### 4.6.3 Sistema di Scoring e Classificazione

Ogni pattern riceve un **Freshness Score** su scala -2 / +2 e un'etichetta visiva:

| Score | Etichetta | Icona | Condizione |
|---|---|---|---|
| +2 | **RAFFORZATO** | 🟢🟢 | WR_recente > WR_globale + 10pp AND N_recente ≥ 5 |
| +1 | **CONFERMATO** | 🟢 | abs(WR_recente - WR_globale) ≤ 10pp AND N_recente ≥ 3 |
| 0 | **NEUTRO** | ⚪ | N_recente < 3 (campioni insufficienti per giudicare) |
| -1 | **INDEBOLITO** | 🟡 | WR_recente < WR_globale - 10pp AND N_recente ≥ 3 |
| -2 | **DECADUTO** | 🔴 | WR_recente < 40% AND WR_globale ≥ 55% AND N_recente ≥ 5 |

Dove `pp` = punti percentuali.

#### 4.6.4 Regole di Applicazione

1. **Classifiche (Modulo E)**: i pattern con score ≤ -2 (DECADUTO) vengono esclusi dalle classifiche Top 10, oppure mostrati barrati con nota esplicativa.
2. **Situazione Corrente**: il riquadro in evidenza mostra sempre il Freshness Score accanto al WR storico. Se il pattern corrente è DECADUTO, viene mostrato un avviso prominente.
3. **Tabelle Moduli A/B/C**: aggiungere una colonna "Fresc." con l'icona corrispondente. L'utente può filtrare per mostrare solo pattern CONFERMATI o RAFFORZATI.
4. **Tooltip**: al passaggio del mouse sulla cella Freshness, mostrare il dettaglio: "Storico: WR 62% su 87 campioni — Ultimi 6m: WR 44% su 9 campioni — Δ = -18pp".

#### 4.6.5 Analisi Trend di Validità (opzionale)

Per i pattern con campioni sufficienti (N_globale ≥ 40), calcolare il WR su finestre mobili di 6 mesi lungo tutta la serie storica. Questo produce una "serie temporale del WR" che mostra se il pattern è stabile, ciclico o in decadimento. Visualizzabile come sparkline nella tabella.

```
Finestre: [0-180gg], [90-270gg], [180-360gg], ... (sliding window con passo 90gg)
Per ogni finestra: calcolare WR e N campioni
Output: array di {periodo, WR, N} → sparkline
```

#### 4.6.6 Soglie Configurabili

I parametri seguenti devono essere configurabili dall'interfaccia o definiti come costanti facilmente modificabili nel codice:

```javascript
const RECENCY_CONFIG = {
  windowDays: 180,         // Finestra di validazione in giorni (daily)
  windowWeeks: 26,         // Finestra di validazione in settimane (weekly)
  minSamplesJudge: 3,      // Campioni minimi per esprimere un giudizio
  minSamplesStrong: 5,     // Campioni minimi per giudizio RAFFORZATO o DECADUTO
  thresholdConfirmed: 10,  // Soglia in pp per CONFERMATO (±)
  thresholdDecayed: 55,    // WR globale minimo per attivare DECADUTO
  thresholdDecayedRecent: 40, // WR recente massimo per DECADUTO
  slidingWindowStep: 90    // Passo finestra mobile per trend (giorni)
};
```

---

## 5. Specifiche dell'Interfaccia HTML

### 5.1 Layout Generale

- **Header**: titolo, data ultimo dato, conteggio candele caricate.
- **Selettore Timeframe**: toggle Daily / Weekly.
- **Selettore Modulo**: tabs per i moduli A, B, C, D, E, F.
- **Area filtri**: toggle regime di mercato (Modulo D), selezione lunghezza sequenza.
- **Area risultati**: tabelle dati con ordinamento colonne cliccabile.
- **Situazione corrente**: riquadro in evidenza con le ultime 3-4 candele e le statistiche associate.
- **Footer**: note metodologiche, disclaimer.

### 5.2 Requisiti Tecnici

- **Puro HTML + CSS + JavaScript vanilla**. Nessun framework (React, Vue, etc.).
- Librerie esterne consentite (via CDN): `Chart.js` per grafici opzionali. Nessun'altra dipendenza.
- Il file HTML deve caricare i dati JSON tramite `fetch()` relativo (i file devono stare nella stessa cartella).
- **Responsive**: funzionare su desktop e tablet.
- **Tema scuro** di default (stile terminale finanziario).
- Le tabelle devono essere **ordinabili** per colonna cliccando sull'header.
- Le celle con probabilità > 60% vanno evidenziate in verde, < 40% in rosso (gradient).
- Includere un **indicatore di affidabilità** basato sul numero di campioni: ⚠ se N < 15, ✓ se N ≥ 30.

### 5.3 Calcolo Situazione Corrente

All'apertura, il sistema deve:

1. Leggere le ultime 4 candele dal dataset.
2. Classificarle (U/D/J).
3. Cercare il pattern corrispondente nelle tabelle precalcolate.
4. Mostrare un **riquadro in evidenza** con:
   - Sequenza corrente (es. "U-D-U-D").
   - Regime corrente (BULL/BEAR + HIGH/LOW VOL).
   - WR alla prossima barra.
   - **Freshness Score** con icona (Modulo F) e dettaglio storico vs recente.
   - Persistenza a 2 e 3 barre.
   - Percentili (P10, P50, P90).
   - Confronto con il pattern medio.
   - Se il pattern è DECADUTO: avviso prominente con bordo rosso.

---

## 6. Flusso di Lavoro per l'Agente

### Fase 1 — Generazione istruzioni (QUESTO DOCUMENTO)
Produrre il presente file markdown. Attendere conferma dell'utente.

### Fase 2 — Costruzione Framework HTML (su conferma utente)
1. Creare `btc_pattern_analyzer.html` seguendo le specifiche dei Moduli A-F.
2. Implementare il motore di calcolo in JavaScript vanilla.
3. Il caricamento dati avviene via `fetch('./btc_daily_data.json')` e `fetch('./btc_weekly_data.json')`.
4. Tutti i calcoli sono eseguiti client-side al caricamento.
5. Includere fallback con dati di esempio se i JSON non vengono trovati.

### Fase 3 — Preparazione Dati Storici (su ulteriore conferma utente)
1. Scaricare dati OHLCV daily BTC/USD dal 2015-01-01 a oggi.
2. Generare `btc_daily_data.json`.
3. Aggregare i dati in candele settimanali (lunedì-domenica) e generare `btc_weekly_data.json`.
4. Validare: nessun gap > 2 giorni, nessun valore nullo, date ordinate.

### Fase 4 — Validazione
1. Verificare che i WR calcolati siano coerenti con campioni noti.
2. Controllare che la somma P(Up) + P(Down) + P(Doji) ≈ 100% per ogni pattern.
3. Assicurarsi che i campioni dei sotto-pattern sommino al campione del pattern padre.

---

## 7. Note Metodologiche

- **Winrate (WR)**: percentuale di volte in cui la candela successiva è stata rialzista (`close[i+1] > close[i]`, dove `i` è l'ultima candela della sequenza). Si usa close-to-close, non open-to-close, per rappresentare la variazione dal punto di ingresso ipotetico.
- **Rendimento**: calcolato come `(close[i+k] - close[i]) / close[i] * 100` dove `i` è l'ultima candela della sequenza e `k` è l'orizzonte (1, 2, 3, 5, 7 barre).
- **Persistenza**: WR calcolato non sulla candela immediatamente successiva, ma sulla posizione del prezzo rispetto al punto di ingresso dopo K barre. "Essere in territorio positivo" a K barre di distanza.
- **Percentili**: P10 = 10° percentile dei rendimenti (worst case tipico), P50 = mediana, P90 = best case tipico.
- **Sharpe semplificato**: `mean(returns) / std(returns)`. Senza risk-free rate e senza annualizzazione.
- **Campione minimo**: 10 per mostrare il dato, 15 per includerlo nelle classifiche, 30 per piena affidabilità.
- **SMA(50)**: media mobile semplice a 50 periodi calcolata sui prezzi di chiusura.
- **ATR(14)**: Average True Range a 14 periodi. True Range = max(high-low, abs(high-close_prev), abs(low-close_prev)).
- **Freshness Score**: indice di validità recente del pattern. Confronta WR storico globale con WR calcolato sulla finestra mobile degli ultimi 6 mesi. Un pattern con WR storico alto ma WR recente basso è classificato come DECADUTO — il mercato ha cambiato comportamento su quella sequenza. Il punteggio va da -2 (decaduto) a +2 (rafforzato). Pattern con campioni recenti insufficienti ricevono score NEUTRO (0) e non vengono né promossi né penalizzati.
- **z-test binomiale (Significatività Statistica)**: per ogni pattern, si testa H₀: P(Up) = 50% vs H₁: P(Up) ≠ 50%. La formula è: `z = (WR/100 - 0.50) / sqrt(0.50 * 0.50 / n)`. Il p-value bilaterale si calcola dalla CDF normale: `p = 2 * (1 - Φ(|z|))`. Classificazione: ★★★ (p < 0.01, altamente significativo), ★★ (p < 0.05, significativo), ★ (p < 0.10, marginale), — (non significativo). I pattern con p > α (default 0.05) vengono opacizzati nelle tabelle e possono essere filtrati. Le classifiche del Modulo E possono limitarsi ai soli pattern significativi.

---

## 8. Dettaglio Calcoli Chiave

### 8.1 Algoritmo di Scansione Pattern

```
PER OGNI indice i nel dataset (da pattern_length a N-max_horizon):
  1. Estrarre le ultime pattern_length candele [i-pattern_length+1 ... i]
  2. Classificare ciascuna → stringa pattern (es. "UDU")
  3. Registrare nel dizionario patterns[stringa]:
     - close[i] come prezzo di ingresso
     - close[i+1], close[i+2], close[i+3], close[i+5], close[i+7] come prezzi futuri
     - regime di mercato al momento i
     - flag is_recent = true se data[i] cade nella finestra ultimi 180 giorni
  4. Al termine, per ogni pattern:
     - Calcolare WR, rendimenti, percentili, Sharpe (globali)
     - Calcolare WR_recente, rendimenti_recente (solo campioni con is_recent=true)
     - Calcolare Freshness Score secondo regole Modulo F (§4.6.3)
```

### 8.2 Streak Detection

```
PER OGNI indice i nel dataset:
  1. Classificare candela i → tipo
  2. Contare all'indietro quante candele consecutive hanno lo stesso tipo
  3. Registrare: streak_length, direction, next_candle_return
```

### 8.3 Threshold Probability

```
PER OGNI streak registrata:
  PER OGNI soglia in [0.5, 1, 2, 3, 5]:
    PER OGNI orizzonte in [1, 2, 3, 5, 7]:
      P = count(return[orizzonte] >= soglia) / count(totale)
```

### 8.4 Freshness Validation (Modulo F)

```
cutoff_date = data ultimo dato - 180 giorni (o 26 settimane per weekly)

PER OGNI pattern nel dizionario:
  campioni_recenti = filtra campioni con data >= cutoff_date
  N_recente = count(campioni_recenti)
  WR_recente = count(campioni_recenti con return > 0) / N_recente

  SE N_recente < 3:
    freshness_score = 0  (NEUTRO)
  ALTRIMENTI SE N_recente >= 5 AND WR_recente > WR_globale + 10pp:
    freshness_score = +2  (RAFFORZATO)
  ALTRIMENTI SE abs(WR_recente - WR_globale) <= 10pp:
    freshness_score = +1  (CONFERMATO)
  ALTRIMENTI SE WR_recente < WR_globale - 10pp AND N_recente >= 3:
    SE WR_recente < 40% AND WR_globale >= 55% AND N_recente >= 5:
      freshness_score = -2  (DECADUTO)
    ALTRIMENTI:
      freshness_score = -1  (INDEBOLITO)
```

---

## 9. Stile Visivo

- Palette: sfondo #0a0e17, testo #e0e0e0, accento primario #00d4aa (verde acqua), accento negativo #ff4757.
- Font: monospace per dati numerici, sans-serif per intestazioni.
- Tabelle: righe alternate con leggera differenza di luminosità, bordi sottili #1a2035.
- Heatmap celle: gradiente da rosso (< 40%) → giallo (50%) → verde (> 60%) per le probabilità.
- Riquadro "Situazione Corrente": bordo luminoso #00d4aa, sfondo leggermente più chiaro.
- **Freshness badge**: pill colorata accanto al pattern — verde (CONFERMATO/RAFFORZATO), grigio (NEUTRO), giallo (INDEBOLITO), rosso (DECADUTO). Tooltip con dettaglio WR storico vs recente al hover.
- **Pattern DECADUTO**: riga con opacità ridotta (0.5) e testo barrato nelle classifiche. Riquadro corrente con bordo rosso lampeggiante se il pattern attuale è decaduto.

---

## 10. Disclaimer

Il framework è uno strumento di analisi statistica a scopo educativo e di ricerca. Non costituisce consulenza finanziaria. Le performance passate non garantiscono risultati futuri. L'utente è responsabile delle proprie decisioni di investimento.
