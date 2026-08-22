import { Card, Vuoto } from './ui'
import { IconChart, IconClock, IconWallet } from './icons'
import { dataMedia, euro, oreLabel } from '../lib/format'
import { movimenti } from '../lib/movimenti'
import type { Entry, Payment } from '../lib/types'

/**
 * Storico unico: ogni giornata e ogni pagamento in ordine di data,
 * con il saldo residuo dopo ciascun movimento.
 */
export function Movimenti({ entries, payments, vuotoTesto, limite }: {
  entries: Entry[]
  payments: Payment[]
  vuotoTesto: string
  /** Mostra solo i primi N movimenti. Il saldo resta calcolato su tutto lo storico. */
  limite?: number
}) {
  const tutti = movimenti(entries, payments)
  const righe = limite ? tutti.slice(0, limite) : tutti

  if (righe.length === 0) {
    return <Vuoto icona={<IconChart className="h-6 w-6" />} titolo="Ancora nessun movimento" testo={vuotoTesto} />
  }

  return (
    <div className="space-y-2.5">
      {righe.map(m => {
        const pagamento = m.tipo === 'pagamento'
        return (
          <Card key={m.id} className="flex items-center gap-3.5 px-4 py-3.5">
            <div className={`rounded-2xl p-2.5 ${pagamento ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600'}`}>
              {pagamento ? <IconWallet className="h-5 w-5" /> : <IconClock className="h-5 w-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold capitalize text-ink-900">{dataMedia(m.data)}</p>
              <p className="truncate text-[13px] text-ink-500">
                {m.tipo === 'ora'
                  ? `${oreLabel(m.entry.hours)}${m.entry.start_time && m.entry.end_time ? ` · ${m.entry.start_time}–${m.entry.end_time}` : ''}`
                  : [m.payment.method, m.payment.note].filter(Boolean).join(' · ') || 'Pagamento'}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className={`text-[15px] font-extrabold ${pagamento ? 'text-emerald-600' : 'text-ink-900'}`}>
                {pagamento ? '−' : '+'}{euro(Math.abs(m.importo))}
              </p>
              <p className="text-[11px] text-ink-400">restano {euro(m.saldoDopo)}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
