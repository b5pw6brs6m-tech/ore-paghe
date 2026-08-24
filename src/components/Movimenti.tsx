import { Card, Vuoto } from './ui'
import { IconChart, IconClock, IconRegalo, IconWallet } from './icons'
import { dataMedia, euro, maiuscola, oreLabel } from '../lib/format'
import { movimenti, type Movimento } from '../lib/movimenti'
import type { Entry, Payment } from '../lib/types'

/**
 * Storico raggruppato per giornata, con il saldo una volta sola in fondo a
 * ogni giorno.
 *
 * Prima il saldo stava su ogni riga: leggendo dall'alto faceva 0, 80, 64 e
 * sembravano cifre a caso, perché quei numeri hanno senso solo scorrendo dal
 * basso. Per giornata invece si legge come un estratto conto.
 */
export function Movimenti({ entries, payments, vuotoTesto, limite, onElimina, onApri }: {
  entries: Entry[]
  payments: Payment[]
  vuotoTesto: string
  /** Mostra solo i primi N movimenti. Il saldo resta calcolato su tutto lo storico. */
  limite?: number
  /** Se presente, ogni riga mostra il tasto per cancellarla. */
  onElimina?: (m: { tipo: 'ora' | 'pagamento'; id: string }) => void
  /** Se presente, toccando una giornata se ne apre il dettaglio. */
  onApri?: (e: Entry) => void
}) {
  const tutti = movimenti(entries, payments)
  const righe = limite ? tutti.slice(0, limite) : tutti

  if (righe.length === 0) {
    return <Vuoto icona={<IconChart className="h-6 w-6" />} titolo="Todavía no hay movimientos" testo={vuotoTesto} />
  }

  // Le giornate restano nell'ordine in cui arrivano: dalla più recente.
  const giornate: Array<{ data: string; righe: Movimento[]; saldo: number }> = []
  for (const m of righe) {
    const ultima = giornate[giornate.length - 1]
    if (ultima && ultima.data === m.data) ultima.righe.push(m)
    // il saldo del giorno è quello dopo l'ultimo movimento, cioè il primo che incontriamo
    else giornate.push({ data: m.data, righe: [m], saldo: m.saldoDopo })
  }

  return (
    <div className="space-y-3">
      {giornate.map(g => (
        <Card key={g.data} className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/70 px-4 py-2.5">
            <span className="truncate text-[13.5px] font-bold text-ink-700">{maiuscola(dataMedia(g.data))}</span>
            <span className="shrink-0 text-[12px] text-ink-400">
              saldo <b className={g.saldo > 0 ? 'text-brand-600' : 'text-emerald-600'}>{euro(g.saldo)}</b>
            </span>
          </div>

          {/* dentro la giornata si legge in ordine: prima le ore, poi il bonus, poi il pagamento */}
          <div className="divide-y divide-ink-100">
            {[...g.righe].reverse().map(m => <Riga key={m.id} m={m} onElimina={onElimina} onApri={onApri} />)}
          </div>
        </Card>
      ))}
    </div>
  )
}

function Riga({ m, onElimina, onApri }: {
  m: Movimento
  onElimina?: (x: { tipo: 'ora' | 'pagamento'; id: string }) => void
  onApri?: (e: Entry) => void
}) {
  const pagamento = m.tipo === 'pagamento'
  const bonus = m.tipo === 'bonus'

  const colore = pagamento ? 'bg-emerald-50 text-emerald-600'
    : bonus ? 'bg-amber-50 text-amber-600'
    : 'bg-brand-50 text-brand-600'

  const titolo = m.tipo === 'ora'
    ? oreLabel(m.entry.hours)
    : bonus ? 'Bonus'
    : 'Pagado'

  const sotto = m.tipo === 'ora'
    ? [m.entry.start_time && m.entry.end_time ? `${m.entry.start_time}–${m.entry.end_time}` : null,
       `${euro(m.entry.hourly_rate)}/h`].filter(Boolean).join(' · ')
    : bonus ? ''                                   // l'icona del regalo e la parola bastano
    : [m.payment.method, m.payment.note].filter(Boolean).join(' · ')

  const apribile = m.tipo === 'ora' && Boolean(onApri)

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={`flex min-w-0 flex-1 items-center gap-3 text-left ${apribile ? 'transition active:opacity-60' : ''}`}
        role={apribile ? 'button' : undefined}
        onClick={apribile && m.tipo === 'ora' ? () => onApri!(m.entry) : undefined}
      >
      <div className={`shrink-0 rounded-xl p-2 ${colore}`}>
        {pagamento ? <IconWallet className="h-[18px] w-[18px]" />
          : bonus ? <IconRegalo className="h-[18px] w-[18px]" />
          : <IconClock className="h-[18px] w-[18px]" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-bold text-ink-900">
          {titolo}
          {apribile && <span className="ml-1.5 text-[12px] font-semibold text-brand-500">ver</span>}
        </p>
        {sotto && <p className="truncate text-[12.5px] text-ink-400">{sotto}</p>}
      </div>

      <p className={`shrink-0 text-[15px] font-extrabold ${
        pagamento ? 'text-emerald-600' : bonus ? 'text-amber-600' : 'text-ink-900'}`}>
        {pagamento ? '−' : '+'}{euro(Math.abs(m.importo))}
      </p>
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
    </div>
  )
}
