# BTC Pattern Analyzer 📈🤖

**BTC Pattern Analyzer** è uno strumento di analisi statistica progettato per esplorare la "memoria" del mercato di Bitcoin. Analizzando oltre **3.000 candele giornaliere** (dal 2017 a oggi), il sistema cataloga le sequenze storiche di prezzo per determinare le probabilità di movimento futuro basandosi su pattern passati.

🚀 **Prova l'applicazione live qui:** [https://fabion4.github.io/bndaypat/](https://fabion4.github.io/bndaypat/)

---

## 🔍 Cos'è e come funziona
Il software trasforma la storia dei prezzi di BTC in dati azionabili, classificando ogni candela in tre categorie:
* **U** (Up / Rialzista)
* **D** (Down / Ribassista)
* **J** (doJi / Indecisa)

Lo strumento non è una sfera di cristallo, ma un archivio intelligente che risponde alla domanda: 
> *"Nelle ultime 150 volte che si è verificata questa sequenza, cosa è successo dopo?"*

---

## 🛠 Caratteristiche Principali
* **Analisi delle Streak:** Studia il comportamento dopo serie consecutive (es. 3 giorni di ribasso) per identificare fenomeni come la *mean reversion*.
* **Probabilità di Soglia:** Calcola la probabilità statistica di superare incrementi dell'1%, 2% o 5% in diversi orizzonti temporali.
* **Filtri per Regime di Mercato:** Analisi differenziata per contesti Bull/Bear e alta/bassa volatilità.
* **Validazione di Freschezza:** Confronta il Win Rate storico con quello degli ultimi 6 mesi per identificare se un pattern è ancora efficace o "decaduto".
* **Integrazione Dati:** Fetch automatico da API Binance e caching locale tramite IndexedDB.

---

## 🔬 Approfondimento Tecnico: Significatività Statistica
Per evitare di scambiare semplici coincidenze per pattern predittivi, il sistema integra un modulo di validazione statistica che calcola se un segnale è reale o frutto del rumore di mercato.

### Il Calcolo dello Z-Score
Utilizziamo il calcolo dello **Z-Score** per proporzioni per determinare la rilevanza del Win Rate (WR) osservato:

$$z = \frac{\hat{p} - p_0}{\sqrt{\frac{p_0(1-p_0)}{n}}}$$

**Parametri:**
* $\hat{p}$: Win Rate osservato del pattern.
* $p_0$: Probabilità base (Win Rate medio storico di BTC).
* $n$: Numero di occorrenze (campioni) del pattern.

**Interpretazione dei risultati:**
* **Segnale Significativo:** Un valore $z > 1.96$ indica che il pattern ha una confidenza statistica superiore al **95%** ($p < 0.05$).
* **Filtro Campioni:** Anche con un WR elevato, se il numero di campioni ($n$) è insufficiente, lo strumento segnalerà il dato come "non significativo" per prevenire l'overfitting.

---

## 🚧 Roadmap & Contributi
Il progetto è in continua evoluzione. I contributi sono i benvenuti!

* [x] **Test di significatività statistica** ✅ *(Implementato: Validazione tramite Z-Score e p-value)*
* [ ] Integrazione backtest Pine Script.
* [ ] Generatore di segnali Pine Script per TradingView.

---

## ⚠️ Disclaimer
Questo strumento è un filtro statistico di supporto e **NON** è un sistema di trading automatico o una consulenza finanziaria. Le probabilità storiche non garantiscono risultati futuri.

---

> Progetto ispirato dall'analisi della "regola del terzo giorno" su **Criptovaluta.it**.

**Nota:** All'interno del sito troverai un tour guidato, help contestuali in ogni modulo e un video esplicativo per iniziare subito l'analisi.
