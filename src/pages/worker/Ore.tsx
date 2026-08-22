import { useNavigate } from 'react-router-dom'
import { Button, Caricamento, Card, Vuoto } from '../../components/ui'
import { Header } from '../../components/Shell'
import { IconClock, IconPlus } from '../../components/icons'
import { euro, meseLabel, oreLabel } from '../../lib/format'
import { correggibile, guadagnoEntry, perMese, riepilogo, round2 } from '../../lib/calc'
import { db } from '../../lib/db'
import { useApp, useCarica } from '../../context/AppContext'
import type { Entry, Worker } from '../../lib/types'
import { RigaGiorno } from './Home'

export default function WorkerOre({ worker }: { worker: Worker }) {
  const nav = useNavigate()
  const { refresh } = useApp()
  const { dati: entries, caricando } = useCarica<Entry[]>(() => db.listEntries(worker.id), [worker.id], [])

  async function cancella(id: string) {
    if (!confirm('Hai sbagliato questa giornata? Verrà cancellata.')) return
    try { await db.deleteEntry(id); refresh() } catch (e) { alert(e instanceof Error ? e.message : 'Errore') }
  }

  if (caricando) return <Caricamento />
  const r = riepilogo(entries, [])
  const mesi = perMese(entries)

  return (
    <>
      <Header occhiello="Il tuo registro" titolo="Le mie ore">
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Box v={String(r.days)} t={r.days === 1 ? 'giorno' : 'giorni'} />
          <Box v={oreLabel(r.totalHours)} t="ore" />
          <Box v={euro(r.totalEarned)} t="guadagnato" />
        </div>
      </Header>

      <div className="px-5 pt-6">
        {entries.length === 0 ? (
          <Vuoto
            icona={<IconClock className="h-6 w-6" />}
            titolo="Nessuna giornata registrata"
            testo="Qui vedrai ogni giornata di lavoro con le ore e il guadagno."
            azione={<Button variant="soft" onClick={() => nav('/registra')}><IconPlus className="h-4 w-4" /> Registra ore</Button>}
          />
        ) : (
          <div className="space-y-7">
            <p className="rounded-2xl bg-white px-4 py-3 text-[13px] leading-relaxed text-ink-500 ring-1 ring-ink-200">
              Hai sbagliato una giornata? Puoi cancellarla con la ✕ entro 24 ore dalla registrazione.
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
                      <RigaGiorno key={e.id} e={e}
                        onDelete={correggibile(e.created_at) ? () => void cancella(e.id) : undefined} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
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
