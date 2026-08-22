import { guadagnoEntry, round2 } from './calc'
import type { Entry, Payment } from './types'

export type Movimento =
  | { tipo: 'ora'; id: string; data: string; importo: number; saldoDopo: number; entry: Entry }
  | { tipo: 'pagamento'; id: string; data: string; importo: number; saldoDopo: number; payment: Payment }

/**
 * Un'unica linea del tempo: ogni giornata lavorata aumenta il debito,
 * ogni pagamento lo riduce. Il `saldoDopo` dice quanto restava da dare
 * subito dopo quel movimento — così si vede sempre "a che punto eravamo".
 * Restituito dal più recente al più vecchio.
 */
export function movimenti(entries: Entry[], payments: Payment[]): Movimento[] {
  const grezzi = [
    ...entries.map(e => ({ tipo: 'ora' as const, id: e.id, data: e.work_date, importo: guadagnoEntry(e), ord: e.created_at, entry: e })),
    ...payments.map(p => ({ tipo: 'pagamento' as const, id: p.id, data: p.paid_on, importo: -p.amount, ord: p.created_at, payment: p })),
  ].sort((a, b) => a.data.localeCompare(b.data) || a.ord.localeCompare(b.ord))

  let saldo = 0
  const conSaldo = grezzi.map(m => {
    saldo = round2(saldo + m.importo)
    return { ...m, saldoDopo: saldo } as Movimento
  })

  return conSaldo.reverse()
}
