import { giorniDaOggi, quandoLabel } from './format'
import type { Entry } from './types'

export type Stato = 'oggi' | 'recente' | 'fermo' | 'mai'

/**
 * Quando il lavoratore ha registrato l'ultima volta. Contano solo le
 * registrazioni fatte da lui: se una giornata dimenticata la inserisce il
 * titolare, non vuol dire che il lavoratore sia stato puntuale.
 */
export function ultimoIngresso(entries: Entry[], workerUserId: string | null): {
  stato: Stato
  testo: string
} {
  const suoi = workerUserId ? entries.filter(e => e.created_by === workerUserId) : []
  if (suoi.length === 0) {
    return { stato: 'mai', testo: 'Todavía no ha registrado nada' }
  }

  const ultimo = suoi.reduce((a, b) => (a.created_at > b.created_at ? a : b))
  const giorni = giorniDaOggi(ultimo.created_at)
  const quando = quandoLabel(ultimo.created_at)

  if (giorni === 0) return { stato: 'oggi', testo: `Registró ${quando}` }
  if (giorni === 1) return { stato: 'recente', testo: `Registró ${quando}` }
  return { stato: 'fermo', testo: `Última vez: ${quando}` }
}
