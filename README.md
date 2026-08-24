# Al Día

> **L'app è interamente in spagnolo.** Questo file di istruzioni resta in italiano,
> è la tua guida di riferimento.

App per tenere il conto delle **ore lavorate** e di **quanto devi pagare** a ogni lavoratore.
Funziona su iPhone e Android: si apre da un link e si aggiunge alla schermata Home come una vera app.

---

## Che problema risolve

Prima: il lavoratore ti scrive le ore su WhatsApp, tu fai i conti a mano, gli dai dei soldi
e dopo due settimane non ricordi più quando l'hai pagato né quanto.

Adesso:

| Chi | Cosa fa |
|-----|---------|
| **Il lavoratore** | A fine giornata apre l'app, risponde a 3 domande (entrata, uscita, pausa) e conferma. Fine. Non può inserire le ore "a occhio": deve mettere gli orari. |
| **Tu (titolare)** | Vedi subito le ore che arrivano, il totale che gli devi, e registri i pagamenti che fai. |
| **L'app** | Fa i conti da sola e tiene lo **storico completo**: ogni giornata, ogni pagamento, e quanto restava da dare dopo ognuno. |

**La registrazione è chiusa.** Chi apre il link trova solo "entra": non può crearsi
un account. Il titolare sei tu e sei uno solo; gli accessi dei lavoratori li crei
tu dall'app. Questa regola è nel database, non nella schermata: anche chiamando
direttamente il server, ogni registrazione che non sia un lavoratore col codice
segreto viene rifiutata.

Nessuno può barare:

- il lavoratore **non può** registrare pagamenti;
- può registrare **solo la giornata in corso** — niente giorni passati, niente futuri.
  È il suo obbligo di fine giornata, e la regola è imposta dal database, non solo
  dalla schermata: non è aggirabile;
- **non può cancellare né modificare** nulla: può registrare e consultare.
  Se sbaglia, la correzione la fai tu dalla sua scheda.

Se un lavoratore dimentica una giornata, la inserisci tu dalla sua scheda con
**"Aggiungi una giornata dimenticata"**: è l'unica strada per una data passata.

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
- **La guida per installarla è dentro il messaggio.** Quando invii le credenziali,
  scegli prima se il lavoratore ha **Android** o **iPhone**: il messaggio conterrà
  solo i passi del suo telefono, scritti uno per uno.

- **Le credenziali dei lavoratori le rivedi quando vuoi.** Nella scheda del
  lavoratore, l'icona a forma di chiave mostra nome utente e password, con il
  tasto per rimandargliele su WhatsApp. Sono conservate in chiaro **apposta**,
  perché tu possa riconsegnarle: le legge solo chi possiede la scheda, cioè tu.
  Se un accesso è stato creato prima di questa funzione, la prima volta la app
  ti chiede di scriverle a mano ("Apuntar las credenciales").

- **Se perdi TU la password.** C'è "¿Has olvidado la contraseña?" nella schermata
  di accesso: ti arriva un link per email e da lì scegli la password nuova.
  Ai lavoratori invece l'app dice di chiederle a te, che le hai annotate.

- **Vecchia procedura, se il recupero per email non funzionasse.** Non puoi rifare la registrazione, è chiusa.
  Vai su Supabase → **Authentication → Users**, apri il tuo utente e usa
  **Send password recovery** verso il tuo indirizzo email.

- **Serve un secondo titolare?** Non è previsto. Se un giorno servisse, si sospende
  il controllo, si crea l'utente e lo si riattiva:
  `alter table auth.users disable trigger on_auth_user_created;` … poi
  `alter table auth.users enable trigger on_auth_user_created;`

- **Password dimenticata dal lavoratore.** Per sicurezza non è
  recuperabile dall'app. Se gli hai messo una email vera può usare il recupero di
  Supabase; altrimenti chiedimi di cancellargli l'accesso e riacreaglielo dall'app:
  le sue ore e i suoi pagamenti non si perdono.

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
