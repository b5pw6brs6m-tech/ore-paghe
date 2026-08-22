# Ore & Paghe

App per tenere il conto delle **ore lavorate** e di **quanto devi pagare** a ogni lavoratore.
Funziona su iPhone e Android: si apre da un link e si aggiunge alla schermata Home come una vera app.

---

## Che problema risolve

Prima: il lavoratore ti scrive le ore su WhatsApp, tu fai i conti a mano, gli dai dei soldi
e dopo due settimane non ricordi più quando l'hai pagato né quanto.

Adesso:

| Chi | Cosa fa |
|-----|---------|
| **Il lavoratore** | Apre l'app, risponde a 4 domande (che giorno, entrata, uscita, pausa), conferma. Fine. |
| **Tu (titolare)** | Vedi subito le ore che arrivano, il totale che gli devi, e registri i pagamenti che fai. |
| **L'app** | Fa i conti da sola e tiene lo **storico completo**: ogni giornata, ogni pagamento, e quanto restava da dare dopo ognuno. |

Nessuno può barare: il lavoratore **non può** registrare pagamenti, e può cancellare una
giornata sbagliata solo entro 24 ore. Tu vedi sempre tutto.

---

## L'app è già online e collegata

**Link:** https://b5pw6brs6m-tech.github.io/ore-paghe/

Funziona da qualsiasi telefono e qualsiasi rete. È già collegata al database
cloud (Supabase, progetto `ore-paghe`, regione Francoforte), quindi i dati sono
condivisi fra il tuo telefono e quelli dei lavoratori.

Configurazione già eseguita:

- tabelle e regole di sicurezza create (`supabase/schema.sql`)
- conferma via email disattivata, così gli accessi che crei tu funzionano subito
- chiavi impostate come variabili del repository, la pubblicazione è automatica

### Per modificare l'app

```bash
npm install
```

```bash
npm run dev
```

Quando salvi e fai `git push`, GitHub ricompila e ripubblica da solo sullo stesso link.

## Installarla sul telefono

**iPhone** — apri il link con **Safari** (non Chrome) → tasto Condividi (il quadrato con
la freccia) → **Aggiungi a Home**.

**Android** — apri il link con **Chrome** → menù ⋮ → **Installa app**.

Da quel momento c'è l'icona sulla schermata Home e si apre a schermo intero.

---

## Come si usa

### Tu, la prima volta
1. Apri l'app → **Nuovo titolare** → nome, email e password. Questo è il tuo account.
2. **Aggiungi** un lavoratore: nome e tariffa oraria.
3. Nella sua scheda tocca la **chiave** in alto → **Crea l'accesso**:
   scegli un nome utente (basta il nome, es. `carlo`) e una password.
   Poi tocca **Invia le credenziali** per mandargliele su WhatsApp.

### Il lavoratore, ogni giorno
Apre l'app, entra con le sue credenziali, tocca **Registra le ore di oggi**
e risponde alle domande. All'ultima schermata rilegge il riepilogo e conferma.

### Tu, quando paghi
Apri la scheda del lavoratore → **Registra un pagamento** → l'importo (c'è il tasto
**Salda tutto**), la data e come hai pagato. L'importo si scala automaticamente dal
totale, e lui lo vede subito nella sua area.

### La scheda "Tutto"
È lo storico che risolve il problema: ogni riga è una giornata (**+**) o un pagamento
(**−**), in ordine di data, con scritto **quanto restava da dare dopo ognuno**.

---

## Cose da sapere

- **La tariffa è "congelata".** Se alzi la paga oraria, le giornate già registrate
  restano al vecchio prezzo: i conti passati non cambiano mai da soli.
- **Turni notturni.** Se l'uscita è prima dell'entrata (es. 22:00 → 06:00), l'app
  capisce che il turno passa la mezzanotte e conta le ore giuste.
- **Avvisi.** Quando arrivano ore nuove trovi il riquadro giallo "nuove registrazioni"
  nella schermata dei lavoratori, e la lista si aggiorna da sola mentre l'app è aperta.
  Le notifiche a telefono spento non ci sono: servirebbe un server dedicato.
- **Password dimenticata.** Se un lavoratore perde la password, per sicurezza non è
  recuperabile dall'app. Se gli hai messo una email vera può usare il recupero di
  Supabase; altrimenti creagli un nuovo accesso.

---

## Struttura del progetto

```
src/
  lib/          calcoli (ore, saldi, movimenti) e accesso ai dati
    api.ts         cosa deve saper fare il "motore dati"
    localApi.ts    versione dimostrativa, solo su questo dispositivo
    supabaseApi.ts versione cloud
    db.ts          sceglie l'una o l'altra in base al file .env
  components/   pezzi grafici riutilizzabili
  pages/
    admin/         area titolare
    worker/        area lavoratore
supabase/schema.sql   database e regole di sicurezza
```
