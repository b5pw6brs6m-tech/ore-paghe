import { Card, Vuoto } from './ui'
import { IconChart, IconClock, IconRegalo, IconWallet } from './icons'
import { dataBreve, dataMedia, euro, maiuscola, oreLabel } from '../lib/format'
import { movimenti } from '../lib/movimenti'
import type { Entry, Payment } from '../lib/types'

/**
 * Storico unico: ogni giornata e ogni pagamento in ordine di data,
 * con il saldo residuo dopo ciascun movimento.
 */
export function Movimenti({ entries, payments, vuotoTesto, limite, onElimina }: {
  entries: Entry[]
  payments: Payment[]
  vuotoTesto: string
  /** Mostra solo i primi N movimenti. Il saldo resta calcolato su tutto lo storico. */
  limite?: number
  /** Se presente, ogni riga mostra il tasto per cancellarla. */
  onElimina?: (m: { tipo: 'ora' | 'pagamento'; id: string }) => void
}) {
  const tutti = movimenti(entries, payments)
  const righe = limite ? tutti.slice(0, limite) : tutti

  if (righe.length === 0) {
    return <Vuoto icona={<IconChart className="h-6 w-6" />} titolo="Todavía no hay movimientos" testo={vuotoTesto} />
  }

  return (
    <div className="space-y-2.5">
      {righe.map(m => {
        const pagamento = m.tipo === 'pagamento'
        const bonus = m.tipo === 'bonus'
        return (
          <Card key={m.id} className="flex items-center gap-3 px-3.5 py-3.5">
            <div className={`rounded-2xl p-2.5 ${
              pagamento ? 'bg-emerald-50 text-emerald-600'
              : bonus ? 'bg-amber-50 text-amber-600'
              : 'bg-brand-50 text-brand-600'}`}>
              {pagamento ? <IconWallet className="h-5 w-5" />
                : bonus ? <IconRegalo className="h-5 w-5" />
                : <IconClock className="h-5 w-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink-900">{maiuscola(onElimina ? dataBreve(m.data) : dataMedia(m.data))}</p>
              <p className="truncate text-[13px] text-ink-500">
                {m.tipo === 'ora'
                  ? `${oreLabel(m.entry.hours)}${m.entry.start_time && m.entry.end_time ? ` · ${m.entry.start_time}–${m.entry.end_time}` : ''}`
                  : m.tipo === 'bonus'
                  ? 'Bonus'
                  : [m.payment.method, m.payment.note].filter(Boolean).join(' · ') || 'Pago'}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className={`text-[15px] font-extrabold ${
                pagamento ? 'text-emerald-600' : bonus ? 'text-amber-600' : 'text-ink-900'}`}>
                {pagamento ? '−' : '+'}{euro(Math.abs(m.importo))}
              </p>
              <p className="text-[11px] text-ink-400">quedan {euro(m.saldoDopo)}</p>
            </div>

            {onElimina && m.tipo !== 'bonus' && (
              <button
                onClick={() => onElimina({ tipo: m.tipo, id: m.id })}
                aria-label="Eliminar"
                className="-mr-1 shrink-0 rounded-lg p-1.5 text-ink-300 transition active:scale-90 active:text-rose-500"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor"
                     strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            )}
          </Card>
        )
      })}
    </div>
  )
}
