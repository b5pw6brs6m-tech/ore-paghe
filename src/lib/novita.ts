const KEY = 'ore-paghe-visto'

export function ultimaVisita(): string {
  return localStorage.getItem(KEY) ?? new Date(Date.now() - 7 * 864e5).toISOString()
}

export function segnaVisto() {
  localStorage.setItem(KEY, new Date().toISOString())
}

/** Avviso di sistema (dove il browser lo consente) quando arrivano ore nuove. */
export async function chiediPermessoNotifiche(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

export function avvisa(titolo: string, testo: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(titolo, { body: testo, icon: '/icon-192.png', tag: 'ore-paghe' })
    }
  } catch { /* alcuni browser bloccano le notifiche fuori dal service worker */ }
}
