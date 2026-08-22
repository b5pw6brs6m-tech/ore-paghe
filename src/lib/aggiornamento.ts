import { registerSW } from 'virtual:pwa-register'

/**
 * Tiene l'app aggiornata da sola.
 *
 * Una volta installata sul telefono, l'app vive da un magazzino locale: senza
 * questo, chi ce l'ha sulla Home continuerebbe a vedere la versione vecchia.
 * Qui si controlla se ne è uscita una nuova ogni minuto, ogni volta che si
 * torna sull'app, e a comando (tirando giù la schermata). Quando la nuova
 * prende il posto della vecchia, la pagina si ricarica una volta sola.
 */

let ricaricaInCorso = false
const avevaGiaUnaVersione = Boolean(navigator.serviceWorker?.controller)

let chiediAggiornamento: () => Promise<void> = async () => {}

export function avviaAggiornamentoAutomatico() {
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Alla primissima installazione non c'era niente da sostituire: non ricaricare.
    if (!avevaGiaUnaVersione || ricaricaInCorso) return
    ricaricaInCorso = true
    window.location.reload()
  })

  registerSW({
    immediate: true,
    onRegisteredSW(_url, registrazione) {
      if (!registrazione) return
      chiediAggiornamento = async () => {
        try { await registrazione.update() } catch { /* offline: si riprova dopo */ }
      }
      setInterval(() => void chiediAggiornamento(), 60_000)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) void chiediAggiornamento()
      })
    },
  })
}

/** Controlla subito se c'è una versione nuova (usato dal gesto di trascinamento). */
export async function controllaAggiornamenti() {
  await chiediAggiornamento()
}
