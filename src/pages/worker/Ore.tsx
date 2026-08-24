import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Caricamento, Card, Vuoto } from '../../components/ui'
import { Header } from '../../components/Shell'
import { IconClock, IconPlus } from '../../components/icons'
import { euro, meseLabel, oreLabel } from '../../lib/format'
import { guadagnoEntry, perMese, riepilogo, round2 } from '../../lib/calc'
import { db } from '../../lib/db'
import { useCarica } from '../../context/AppContext'
import type { Entry, Worker } from '../../lib/types'
import { DettaglioGiornata } from '../../components/DettaglioGiornata'
import { RigaGiorno } from './Home'

export default function WorkerOre({ worker }: { worker: Worker }) {
  const nav = useNavigate()
  const [dettaglio, setDettaglio] = useState<Entry | null>(null)
  const { dati: entries, caricando } = useCarica<Entry[]>(() => db.listEntries(worker.id), [worker.id], [])

  if (caricando) return <Caricamento />
  const r = riepilogo(entries, [])
  const mesi = perMese(entries)

  return (
    <>
      <Header occhiello="Tu registro" titolo="Mis horas">
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Box v={String(r.days)} t={r.days === 1 ? 'día' : 'días'} />
          <Box v={oreLabel(r.totalHours)} t="horas" />
          <Box v={euro(r.totalEarned)} t="ganado" />
        </div>
      </Header>

      <div className="px-5 pt-6">
        {entries.length === 0 ? (
          <Vuoto
            icona={<IconClock className="h-6 w-6" />}
            titolo="Ninguna jornada registrada"
            testo="Aquí verás cada jornada de trabajo con las horas y lo que ganas."
            azione={<Button variant="soft" onClick={() => nav('/registra')}><IconPlus className="h-4 w-4" /> Registrar horas</Button>}
          />
        ) : (
          <div className="space-y-7">
            <p className="rounded-2xl bg-white px-4 py-3 text-[13px] leading-relaxed text-ink-500 ring-1 ring-ink-200">
              Toca una jornada para ver el detalle: a qué hora entraste, a qué hora saliste
              y cómo salen esas horas. Si hay algo que no cuadra, díselo al jefe.
            </p>
            {mesi.map(([ym, righe]) => {
              const ore = round2(righe.reduce((a, e) => a + e.hours, 0))
              const soldi = round2(righe.reduce((a, e) => a + guadagnoEntry(e), 0))
              return (
                <section key={ym}>
                  <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="text-[15px] font-bold text-ink-900">{meseLabel(ym)}</h2>
                    <p className="text-[13px] font-semibold text-ink-500">
                      {oreLabel(ore)} · <span className="text-emerald-600">{euro(soldi)}</span>
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    {righe.map(e => (
                      <RigaGiorno key={e.id} e={e} onApri={() => setDettaglio(e)} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>

      <DettaglioGiornata entry={dettaglio} worker={worker} perIlLavoratore
                         onClose={() => setDettaglio(null)} />
    </>
  )
}

function Box({ v, t }: { v: string; t: string }) {
  return (
    <Card className="bg-white/12 px-3 py-4 text-center text-white shadow-none ring-1 ring-white/20 backdrop-blur">
      <p className="text-[17px] font-extrabold leading-tight">{v}</p>
      <p className="mt-0.5 text-[11px] text-white/65">{t}</p>
    </Card>
  )
}
