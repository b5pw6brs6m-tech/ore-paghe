import { useState } from 'react'
import { Avatar, Button, Caricamento, Card, Sheet, Vuoto } from '../../components/ui'
import { Header } from '../../components/Shell'
import { IconPlus, IconRight, IconWallet } from '../../components/icons'
import { dataMedia, euro, meseLabel } from '../../lib/format'
import { perMese, riepilogo, round2 } from '../../lib/calc'
import { db } from '../../lib/db'
import { useCarica } from '../../context/AppContext'
import type { Entry, Payment, Worker } from '../../lib/types'
import { FormPagamento } from './Lavoratore'

export default function AdminPagamenti() {
  const [scelta, setScelta] = useState(false)
  const [target, setTarget] = useState<Worker | null>(null)

  const { dati: workers, caricando: c1 } = useCarica<Worker[]>(() => db.listWorkers(), [], [])
  const { dati: payments, caricando: c2 } = useCarica<Payment[]>(() => db.listPayments(), [], [])
  const { dati: entries, caricando: c3 } = useCarica<Entry[]>(() => db.listEntries(), [], [])

  if (c1 || c2 || c3) return <Caricamento />

  const totale = round2(payments.reduce((a, p) => a + p.amount, 0))
  const daPagare = round2(workers.reduce(
    (a, w) => a + riepilogo(entries.filter(e => e.worker_id === w.id), payments.filter(p => p.worker_id === w.id)).balance, 0))
  const mesi = perMese(payments)
  const nomeDi = (id: string) => workers.find(w => w.id === id)?.name ?? 'Lavoratore'

  const saldoDi = (w: Worker) =>
    riepilogo(entries.filter(e => e.worker_id === w.id), payments.filter(p => p.worker_id === w.id)).balance

  return (
    <>
      <Header occhiello="Tutto quello che hai dato" titolo="Pagamenti">
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white/12 px-4 py-4 ring-1 ring-white/20 backdrop-blur">
            <p className="text-[11px] text-white/65">Pagato in totale</p>
            <p className="mt-1 text-[22px] font-extrabold leading-none">{euro(totale)}</p>
          </div>
          <div className="rounded-3xl bg-white/12 px-4 py-4 ring-1 ring-white/20 backdrop-blur">
            <p className="text-[11px] text-white/65">Ancora da pagare</p>
            <p className="mt-1 text-[22px] font-extrabold leading-none">{euro(daPagare)}</p>
          </div>
        </div>
      </Header>

      <div className="px-5 pt-6">
        <Button size="lg" full variant="success" onClick={() => setScelta(true)} disabled={workers.length === 0}>
          <IconWallet className="h-5 w-5" /> Registra un pagamento
        </Button>
      </div>

      <div className="px-5 pt-6">
        {payments.length === 0 ? (
          <Vuoto
            icona={<IconWallet className="h-6 w-6" />}
            titolo="Nessun pagamento registrato"
            testo="Ogni volta che dai dei soldi registralo qui: resta segnato quando, quanto e a chi."
            azione={workers.length > 0
              ? <Button variant="soft" onClick={() => setScelta(true)}><IconPlus className="h-4 w-4" /> Registra il primo</Button>
              : undefined}
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
                  {righe.map(p => (
                    <Card key={p.id} className="flex items-center gap-4 px-4 py-3.5">
                      <Avatar name={nomeDi(p.worker_id)} size={42} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-ink-900">{nomeDi(p.worker_id)}</p>
                        <p className="truncate text-[13px] capitalize text-ink-500">
                          {dataMedia(p.paid_on)}{p.method ? ` · ${p.method}` : ''}
                        </p>
                      </div>
                      <p className="text-[17px] font-extrabold text-emerald-600">{euro(p.amount)}</p>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Sheet open={scelta} onClose={() => setScelta(false)} title="A chi hai pagato?">
        <div className="space-y-2.5">
          {workers.map(w => (
            <Card key={w.id} onClick={() => { setTarget(w); setScelta(false) }}
                  className="flex items-center gap-4 px-4 py-4 ring-1 ring-ink-200">
              <Avatar name={w.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink-900">{w.name}</p>
                <p className="text-[13px] text-ink-500">gli devi {euro(saldoDi(w))}</p>
              </div>
              <IconRight className="h-4 w-4 text-ink-300" />
            </Card>
          ))}
        </div>
      </Sheet>

      {target && (
        <FormPagamento open onClose={() => setTarget(null)} worker={target} saldo={saldoDi(target)} />
      )}
    </>
  )
}
