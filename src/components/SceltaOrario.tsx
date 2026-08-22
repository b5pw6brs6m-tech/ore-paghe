import { Card } from './ui'
import { minutiDa } from '../lib/calc'

const p2 = (n: number) => String(n).padStart(2, '0')

/**
 * Selettore orario a pulsanti grandi: niente tastiera, niente rotelle native.
 * Le ore si scorrono con − / +, i minuti si scelgono con un tocco.
 */
export function SceltaOrario({ valore, onChange, etichetta }: {
  valore: string
  onChange: (v: string) => void
  etichetta: string
}) {
  const tot = minutiDa(valore) ?? 8 * 60
  const ora = Math.floor(tot / 60)
  const min = tot % 60

  const set = (h: number, m: number) => onChange(`${p2((h + 24) % 24)}:${p2(m)}`)

  return (
    <Card className="px-5 py-6">
      <p className="mb-4 text-center text-[13px] font-semibold text-ink-500">{etichetta}</p>

      <div className="flex items-center justify-center gap-3">
        <Passo segno="−" onClick={() => set(ora - 1, min)} aria="Un'ora in meno" />
        <p className="min-w-[150px] text-center text-[54px] font-extrabold leading-none tracking-tight tabular-nums text-ink-900">
          {p2(ora)}:{p2(min)}
        </p>
        <Passo segno="+" onClick={() => set(ora + 1, min)} aria="Un'ora in più" />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {[0, 15, 30, 45].map(m => (
          <button
            key={m}
            onClick={() => set(ora, m)}
            className={`rounded-xl py-2.5 text-[15px] font-bold tabular-nums transition active:scale-95 ${
              min === m ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-600 ring-1 ring-ink-200'
            }`}
          >
            :{p2(m)}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-[12px] text-ink-400">Tocca − e + per l’ora, i tasti sotto per i minuti</p>
    </Card>
  )
}

function Passo({ segno, onClick, aria }: { segno: string; onClick: () => void; aria: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-[26px] font-bold leading-none text-brand-700 transition active:scale-90 active:bg-brand-100"
    >
      {segno}
    </button>
  )
}
