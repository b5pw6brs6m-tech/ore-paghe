import { giorniDaOggi, quandoLabel } from './format'
import type { Entry, Worker } from './types'

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

/**
 * Ultima giornata registrata DA LUI. Se una giornata dimenticata la inserisce
 * il titolare, non conta: non vuol dire che il lavoratore sia stato puntuale.
 */
export function ultimaRegistrazione(entries: Entry[], workerUserId: string | null): { stato: Stato; testo: string } {
  const suoi = workerUserId ? entries.filter(e => e.created_by === workerUserId) : []
  if (suoi.length === 0) {
    return { stato: 'mai', testo: 'Aún no ha registrado ninguna jornada' }
  }
  const ultimo = suoi.reduce((a, b) => (a.created_at > b.created_at ? a : b))
  return { stato: stato(ultimo.created_at), testo: `Última jornada: ${quandoLabel(ultimo.created_at)}` }
}
