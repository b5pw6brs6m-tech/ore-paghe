/**
 * Copia negli appunti con riserva: `navigator.clipboard` non esiste su
 * connessioni non sicure e alcuni browser lo bloccano, quindi in quel caso
 * si ripiega sul vecchio metodo del campo nascosto.
 */
export async function copiaTesto(testo: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(testo)
      return true
    }
  } catch { /* passo al metodo di riserva */ }

  try {
    const campo = document.createElement('textarea')
    campo.value = testo
    campo.setAttribute('readonly', '')
    campo.style.position = 'fixed'
    campo.style.top = '0'
    campo.style.opacity = '0'
    document.body.appendChild(campo)
    campo.select()
    campo.setSelectionRange(0, testo.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(campo)
    return ok
  } catch {
    return false
  }
}

/** Apre WhatsApp con il messaggio già scritto, lasciando scegliere il contatto. */
export function apriWhatsApp(testo: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, '_blank', 'noopener')
}

/** Foglio di condivisione del telefono, se disponibile. */
export async function condividiNativo(testo: string): Promise<boolean> {
  if (!navigator.share) return false
  try {
    await navigator.share({ text: testo })
    return true
  } catch {
    return false   // l'utente ha annullato
  }
}
