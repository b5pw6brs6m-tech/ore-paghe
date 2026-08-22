import { giorniDaOggi, quandoLabel } from './format'
import type { Worker } from './types'

export type Stato = 'oggi' | 'recente' | 'fermo' | 'mai'

function stato(iso: string | null): Stato {
  if (!iso) return 'mai'
  const g = giorniDaOggi(iso)
  if (g <= 0) return 'oggi'
  if (g === 1) return 'recente'
  return 'fermo'
}

/**
 * Ultima volta che il lavoratore ha APERTO l'app. Vale anche se poi non ha
 * registrato niente: dice se si è fatto vivo.
 */
export function ultimoAccesso(worker: Worker): { stato: Stato; testo: string } {
  const s = stato(worker.last_seen)
  if (s === 'mai') {
    return { stato: 'mai', testo: worker.user_id ? 'Todavía no ha entrado' : 'Sin acceso todavía' }
  }
  const quando = quandoLabel(worker.last_seen!)
  if (s === 'fermo') return { stato: s, testo: `Entró ${quando}` }
  return { stato: s, testo: `Entró ${quando}` }
}
