import { Caricamento, Card, Vuoto } from '../../components/ui'
import { Header } from '../../components/Shell'
import { IconWallet } from '../../components/icons'
import { dataMedia, euro, maiuscola, meseLabel } from '../../lib/format'
import { perMese, riepilogo, round2 } from '../../lib/calc'
import { db } from '../../lib/db'
import { useCarica } from '../../context/AppContext'
import type { Entry, Payment, Worker } from '../../lib/types'

export default function WorkerPagamenti({ worker }: { worker: Worker }) {
  const { dati: payments, caricando: c1 } = useCarica<Payment[]>(() => db.listPayments(worker.id), [worker.id], [])
  const { dati: entries, caricando: c2 } = useCarica<Entry[]>(() => db.listEntries(worker.id), [worker.id], [])

  if (c1 || c2) return <Caricamento />
  const r = riepilogo(entries, payments)
  const mesi = perMese(payments)

  return (
    <>
      <Header occhiello="Lo que has cobrado" titolo="Pagos">
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white/12 px-4 py-4 ring-1 ring-white/20 backdrop-blur">
            <p className="text-[11px] text-white/65">Cobrado hasta ahora</p>
            <p className="mt-1 text-[22px] font-extrabold leading-none">{euro(r.totalPaid)}</p>
          </div>
          <div className="rounded-3xl bg-white/12 px-4 py-4 ring-1 ring-white/20 backdrop-blur">
            <p className="text-[11px] text-white/65">{r.balance >= 0 ? 'Todavía por cobrar' : 'Cobrado por adelantado'}</p>
            <p className="mt-1 text-[22px] font-extrabold leading-none">{euro(Math.abs(r.balance))}</p>
          </div>
        </div>
      </Header>

      <div className="px-5 pt-6">
        {payments.length === 0 ? (
          <Vuoto
            icona={<IconWallet className="h-6 w-6" />}
            titolo="Ningún pago recibido"
            testo="Cuando el jefe registre un pago lo verás aquí, con la fecha y el importe."
          />
        ) : (
          <div className="space-y-7">
            {mesi.map(([ym, righe]) => (
              <section key={ym}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-[15px] font-bold text-ink-900">{meseLabel(ym)}</h2>
                  <p className="text-[13px] font-semibold text-emerald-600">
                    {euro(round2(righe.reduce((a, p) => a + p.amount, 0)))}
                  </p>
                </div>
                <div className="space-y-2.5">
                  {righe.map(p => <RigaPagamento key={p.id} p={p} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export function RigaPagamento({ p, onDelete }: { p: Payment; onDelete?: () => void }) {
  return (
    <Card className="flex items-center gap-4 px-4 py-4">
      <div className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-600">
        <IconWallet className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-ink-900">{maiuscola(dataMedia(p.paid_on))}</p>
        <p className="truncate text-[13px] text-ink-500">
          {[p.method, p.note].filter(Boolean).join(' · ') || 'Pago registrado'}
        </p>
        {p.bonus > 0 && (
          <p className="mt-0.5 truncate text-[12.5px] font-semibold text-amber-600">
            Incluye {euro(p.bonus)} de bonus
          </p>
        )}
      </div>
      <p className="text-[17px] font-extrabold text-emerald-600">{euro(p.amount)}</p>
      {onDelete && (
        <button onClick={onDelete} aria-label="Eliminar"
                className="rounded-xl bg-rose-50 p-2 text-rose-500 active:scale-90 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}
               strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      )}
    </Card>
  )
}
