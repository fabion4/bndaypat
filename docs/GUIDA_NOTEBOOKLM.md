# BTC Pattern Analyzer — Guida Completa per Video Esplicativo

## Nota per NotebookLM
Questo documento è pensato come sorgente per generare un podcast/video esplicativo su uno strumento di analisi statistica per Bitcoin. Il tono deve essere divulgativo, accessibile a chi non ha background quantitativo, ma rigoroso nei contenuti. Immagina di spiegare lo strumento a un investitore curioso seduto al bar.

---

## Parte 1 — Cos'è il BTC Pattern Analyzer e a cosa serve

Il BTC Pattern Analyzer è uno strumento che analizza la storia dei prezzi di Bitcoin per rispondere a una domanda semplice: "Dopo una certa sequenza di movimenti, cosa è successo di solito?"

Funziona così: ogni giorno (o ogni settimana) Bitcoin forma una "candela" — una rappresentazione grafica che racconta cosa ha fatto il prezzo in quel periodo. La candela può essere rialzista (il prezzo è salito), ribassista (il prezzo è sceso), o indecisa (il prezzo non si è mosso in modo significativo, chiamata "doji").

Lo strumento prende tutta la storia di Bitcoin — dal 2017 ad oggi, circa 3000 candele giornaliere — e cataloga ogni possibile sequenza di 2, 3 o 4 candele consecutive. Per ognuna di queste sequenze, calcola cosa è successo dopo: quante volte il prezzo è salito, quante è sceso, di quanto, e con quale probabilità.

In pratica, è come avere un archivio di memoria del mercato. Non predice il futuro, ma dice: "Le ultime 150 volte che è successa questa cosa, ecco cosa è capitato dopo."

---

## Parte 2 — Come si classificano le candele

Il sistema usa tre lettere per classificare ogni candela:

**U** sta per "Up" (rialzista): il prezzo ha chiuso più in alto di dove ha aperto, e il movimento è stato significativo — il corpo della candela è più del 25% del range totale della giornata.

**D** sta per "Down" (ribassista): il prezzo ha chiuso più in basso dell'apertura, di nuovo con un corpo significativo.

**J** sta per "doJi" (indecisa): il corpo della candela è piccolissimo rispetto al range della giornata. Il mercato ha oscillato ma alla fine non ha preso una direzione chiara. La soglia è il 25% del range: se il corpo è meno del 25%, è un doji.

Quindi una sequenza come "U-D-U" significa: giorno 1 il prezzo sale, giorno 2 scende, giorno 3 risale. "D-D-D" significa tre giorni di ribasso consecutivo.

---

## Parte 3 — I sei moduli di analisi

### Modulo A — Streak Analysis: le serie consecutive

Questo è il modulo più intuitivo. Risponde alla domanda: "Dopo N giorni consecutivi nella stessa direzione, cosa succede?"

Per esempio: dopo 3 giorni di ribasso consecutivo (D-D-D), qual è la probabilità che il prezzo salga il giorno dopo? E a 2 giorni di distanza? E a 3?

Qui emerge uno dei pattern più noti di Bitcoin: la mean reversion. Dopo serie negative prolungate, Bitcoin tende storicamente a rimbalzare. Non sempre, ovviamente — ma con una probabilità statisticamente significativa, spesso superiore al 60-65%.

La tabella mostra anche il rendimento medio e mediano. Il mediano è più utile perché non viene distorto da pochi casi estremi. Se il rendimento mediano è positivo, significa che nella maggioranza dei casi il prezzo è salito.

### Modulo B — Probabilità di superamento soglia

Questo modulo approfondisce: non ti dice solo SE il prezzo sale, ma di QUANTO. Risponde a: "Dopo questa streak, quante probabilità ho che il prezzo salga di almeno l'1%? O il 2%? O il 5%?"

La tabella è una heatmap — un reticolo colorato dove le righe sono le soglie di rendimento e le colonne sono gli orizzonti temporali (1, 2, 3, 5, 7 barre). Più la cella è verde, più la probabilità è alta. Questo è utilissimo per calibrare stop-loss e take-profit.

### Modulo C — Pattern di sequenze arbitrarie

Qui le cose si fanno più sofisticate. Invece di guardare solo serie consecutive (tipo D-D-D), il modulo analizza tutte le possibili combinazioni di U, D e J.

Per 3 candele ci sono 27 combinazioni possibili. Il modulo le cataloga tutte e per ciascuna calcola: Win Rate, persistenza a +2 e +3 barre, percentili (P10, P50, P90) e Sharpe ratio.

I percentili sono particolarmente utili: P10 ti dice "nel 90% dei casi la perdita non è stata peggiore di questo", P90 ti dice "nel 10% migliore dei casi il guadagno è stato almeno questo". È un modo per capire il profilo rischio/rendimento di ogni pattern.

Lo Sharpe ratio misura l'efficienza: un pattern può avere un Win Rate del 55% ma uno Sharpe di 1.2 (molto buono), perché quando vince guadagna molto e quando perde perde poco.

### Modulo D — Analisi per regime di mercato

Lo stesso pattern può comportarsi in modo completamente diverso a seconda del contesto. In un mercato rialzista (Bull), un rimbalzo dopo un ribasso potrebbe essere molto più probabile che in un mercato ribassista (Bear).

Il sistema classifica il regime di mercato usando due indicatori: la media mobile a 50 periodi (prezzo sopra = Bull, sotto = Bear) e l'ATR a 14 periodi per la volatilità (sopra la mediana storica = alta volatilità, sotto = bassa volatilità).

Le quattro combinazioni — Bull+Low, Bull+High, Bear+Low, Bear+High — producono statistiche molto diverse. Filtrare per regime aumenta la precisione dell'analisi ma riduce il numero di campioni.

### Modulo E — Classifica globale

Tre classifiche dei migliori pattern:

La prima è per Win Rate puro: quali pattern hanno la più alta probabilità di produrre un rialzo? La seconda è per Sharpe ratio: quali hanno il miglior rapporto rendimento/rischio? La terza è la classifica "Mean Reversion": tra i pattern ribassisti (con almeno 2 candele D), quali producono i rimbalzi più forti?

Dalla classifica Mean Reversion emerge spesso che le sequenze ribassiste prolungate sul weekly — tipo D-D-D settimanale — hanno winrate del 65-70%. Tre settimane di ribasso consecutive in Bitcoin hanno storicamente prodotto un rimbalzo in 7 casi su 10.

### Modulo F — Validazione di freschezza

Questo è il modulo più importante per chi vuole davvero usare lo strumento. Un pattern che funzionava nel 2019 potrebbe non funzionare più oggi. Il mercato di Bitcoin è cambiato enormemente: sono entrati gli istituzionali, ci sono i derivati, gli ETF, i bot di trading.

Il modulo confronta il WR storico (calcolato su tutti i dati) con il WR degli ultimi 6 mesi. Se un pattern aveva storicamente un WR del 65% ma negli ultimi 6 mesi è sceso al 35%, viene classificato come "Decaduto" e segnato con un pallino rosso.

I punteggi vanno da +2 (Rafforzato: funziona anche meglio di prima) a -2 (Decaduto: ha smesso di funzionare). Un pattern Confermato (+1) è il gold standard: funziona oggi come ha sempre funzionato.

---

## Parte 4 — Come leggere il pannello Situazione Corrente

All'apertura, lo strumento analizza le ultime 3 candele e mostra immediatamente:

1. La sequenza attuale (es. U-D-U)
2. Il Win Rate storico per quella sequenza
3. La persistenza: come evolve la probabilità a +2 e +3 barre
4. I percentili: rischio downside (P10) e upside potenziale (P90)
5. Il regime di mercato corrente
6. Il punteggio di freschezza

Se il punteggio di freschezza è "Decaduto", il pannello diventa rosso lampeggiante — è un segnale forte che quel pattern non è più affidabile.

---

## Parte 5 — I dati e la cache

Lo strumento scarica automaticamente i dati OHLCV (Open, High, Low, Close, Volume) di BTC/USDT dall'API pubblica di Binance. Il primo caricamento richiede circa 10 secondi. Dopodiché i dati vengono memorizzati nella cache del browser (IndexedDB) e si aggiornano automaticamente ogni 20 ore.

Per chi vuole lavorare completamente offline, ci sono pulsanti per scaricare i file JSON dei dati daily e weekly. Basta metterli nella stessa cartella dell'HTML e il sistema li usa senza bisogno di Internet.

---

## Parte 5b — Il test che separa i pattern reali dal rumore

Questa è la parte più importante dal punto di vista scientifico. Un WR del 70% su 12 campioni è impressionante, ma è affidabile? La risposta viene dal p-value.

Il ragionamento è semplice: immaginiamo che il mercato sia completamente casuale — una moneta lanciata ogni giorno, 50% testa (sale), 50% croce (scende). Se lanciamo la moneta 12 volte e otteniamo 8 teste (67%), siamo sorpresi? Non particolarmente — capita abbastanza spesso per caso. Ma se lanciamo 200 volte e otteniamo 134 teste (67%), quello è molto più strano.

Il test binomiale (z-test per proporzioni) fa esattamente questo calcolo. Prende il WR osservato, il numero di campioni, e calcola: "Se il mercato fosse casuale al 50%, quante probabilità ci sarebbero di osservare un WR così lontano dal 50%?"

Questo numero è il p-value. Un p-value di 0.003 significa: "C'è solo lo 0.3% di probabilità che questo WR sia frutto del caso." A quel punto, è ragionevole concludere che c'è qualcosa di reale — una regola sottostante, un bias di mercato, un comportamento ricorrente degli operatori.

Lo strumento classifica la significatività con le stelle:
- Tre stelle (★★★, p < 0.01): prova molto forte. Meno dell'1% di probabilità che sia caso.
- Due stelle (★★, p < 0.05): prova solida. Standard accademico di significatività.
- Una stella (★, p < 0.10): indicazione debole. Potrebbe essere reale, serve cautela.
- Nessuna stella: non significativo. Il WR potrebbe tranquillamente essere rumore.

C'è anche un filtro nell'interfaccia: "Solo significativi (p<0.05)" che nasconde tutti i pattern non significativi. Quando lo attivi, le tabelle si svuotano drasticamente — e quello che resta è l'oro statistico: i pochi pattern che hanno davvero un edge misurabile e non casuale.

Un esempio concreto dal dataset: il pattern D-D-D (tre ribassiste consecutive) sul daily potrebbe mostrare WR 62% su 79 campioni con p = 0.01. Due stelle. Lo stesso pattern U-U-U-U-U potrebbe avere WR 72% ma su 11 campioni e p = 0.17 — nessuna stella. Il primo è un segnale; il secondo è rumore vestito bene.

---

## Parte 6 — Limiti e avvertenze

Questo strumento NON è un sistema di trading. È un filtro statistico: aggiunge contesto numerico alla decisione, non la sostituisce.

I limiti principali sono:

1. **Campioni limitati**: Bitcoin esiste come asset tradabile solo dal 2017 su Binance. Circa 3000 candele daily. Per pattern a 4 candele, alcune combinazioni hanno meno di 10 campioni — troppo pochi per essere statisticamente significativi.

2. **Assenza di causalità**: il sistema trova correlazioni, non cause. Il fatto che dopo D-D-D il prezzo sia salito il 65% delle volte non significa che ci sia un meccanismo che lo faccia salire necessariamente.

3. **Overfitting potenziale**: con 81 combinazioni a 4 candele, alcune avranno WR alto per puro caso. Il test di significatività (p-value) è la difesa principale: il filtro "Solo significativi" rimuove i pattern che non superano il test binomiale. Ma attenzione al "multiple testing problem": testando 81 pattern, circa 4 risulteranno significativi a p<0.05 anche per puro caso. Per questo le tre stelle (p<0.01) sono molto più affidabili delle due.

4. **Il mercato cambia**: per questo esiste il Modulo F. I pattern che funzionavano nel 2020 potrebbero non funzionare nel 2026. La validazione di freschezza è essenziale.

---

## Parte 7 — Suggerimenti per l'uso pratico

Per un uso efficace dello strumento, un approccio ragionevole è:

1. **Guarda prima la Situazione Corrente**: che sequenza siamo oggi? È un pattern confermato o decaduto?

2. **Incrocia i moduli**: se il Modulo A dice che dopo 3D il WR è 62%, vai al Modulo B per vedere se c'è probabilità di superare il +2%. Poi vai al Modulo D per verificare se il regime attuale conferma.

3. **Fidati solo dei pattern confermati**: usa il Modulo F come filtro definitivo. Un WR del 70% con freschezza "Decaduto" vale meno di un WR del 58% con freschezza "Confermato".

4. **Guarda il weekly per il quadro generale**: i pattern settimanali hanno meno campioni ma sono più robusti. La mean reversion sul weekly è il segnale statistico più forte che Bitcoin produce.

5. **Non prendere decisioni su un singolo pattern**: usa lo strumento come uno dei tanti input, insieme all'analisi del contesto macro, dei flussi on-chain, e del sentiment.

---

## Script suggerito per il video

### Apertura (30 sec)
"Vi siete mai chiesti se Bitcoin ha una memoria? Se certi movimenti tendono a ripetersi? Abbiamo costruito uno strumento che analizza migliaia di giornate di trading per trovare pattern statistici. Non è una sfera di cristallo — è un archivio intelligente della storia del prezzo."

### Corpo (3-5 min)
Mostrare lo strumento, partendo dalla Situazione Corrente (ora mostra anche p-value e significatività), poi navigare nei moduli uno per uno con esempi reali dal dataset. Soffermarsi sulla mean reversion (D-D-D → rimbalzo) perché è il pattern più intuitivo e forte. Mostrare il filtro "Solo significativi" e far vedere come le tabelle si svuotano — quello che resta è l'informazione reale. Poi mostrare il Modulo F spiegando perché la freschezza è cruciale.

### Chiusura (30 sec)
"Ricordate: le probabilità non sono certezze. Un 65% di Win Rate significa comunque che 35 volte su 100 il pattern non ha funzionato. Usate questo strumento come filtro di contesto, non come oracolo."

---

*Documento generato come sorgente per NotebookLM. Caricarlo come "source" e generare un Audio Overview o utilizzarlo come base per uno script video.*
