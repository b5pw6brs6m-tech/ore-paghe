import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Caricamento, Card, Errore, Field, Sheet, Spinner, Vuoto, Avatar, inputCls } from '../../components/ui'
import { Header, Sezione } from '../../components/Shell'
import { IconBell, IconLogout, IconPlus, IconRight, IconUsers } from '../../components/icons'
import { euro, oreLabel, dataBreve } from '../../lib/format'
import { riepilogo, round2 } from '../../lib/calc'
import { db } from '../../lib/db'
import { useApp, useCarica } from '../../context/AppContext'
import { avvisa, chiediPermessoNotifiche, segnaVisto, ultimaVisita } from '../../lib/novita'
import type { Entry, Payment, Worker } from '../../lib/types'

export default function AdminLavoratori() {
  const nav = useNavigate()
  const { user, signOut } = useApp()
  const [apriNuovo, setApriNuovo] = useState(false)

  const { dati: workers, caricando: c1 } = useCarica<Worker[]>(() => db.listWorkers(), [], [])
  const { dati: entries, caricando: c2 } = useCarica<Entry[]>(() => db.listEntries(), [], [])
  const { dati: payments, caricando: c3 } = useCarica<Payment[]>(() => db.listPayments(), [], [])

  // Le registrazioni "nuove" sono quelle arrivate dopo l'ultima volta che hai guardato.
  const [visto, setVisto] = useState(() => ultimaVisita())
  const nuove = useMemo(() => entries.filter(e => e.created_at > visto), [entries, visto])

  // Avviso di sistema solo per le ore che arrivano mentre l'app è aperta:
  // al primo caricamento memorizziamo quelle già presenti senza notificare nulla.
  const conosciute = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (c2) return
    if (conosciute.current === null) {
      conosciute.current = new Set(entries.map(e => e.id))
      return
    }
    for (const e of entries) {
      if (conosciute.current.has(e.id)) continue
      conosciute.current.add(e.id)
      const w = workers.find(x => x.id === e.worker_id)
      if (w) avvisa('Nuove ore registrate', `${w.name}: ${oreLabel(e.hours)} il ${dataBreve(e.work_date)}`)
    }
  }, [entries, workers, c2])

  if (c1 || c2 || c3) return <Caricamento />

  const totali = workers.map(w => ({
    w,
    r: riepilogo(entries.filter(e => e.worker_id === w.id), payments.filter(p => p.worker_id === w.id)),
  }))
  const daPagare = round2(totali.reduce((a, t) => a + t.r.balance, 0))
  const oreTotali = round2(totali.reduce((a, t) => a + t.r.totalHours, 0))

  return (
    <>
      <Header
        occhiello="Area titolare"
        titolo={(user?.fullName || 'Ciao').split(' ')[0]}
        azione={
          <button onClick={() => void signOut()} aria-label="Esci"
                  className="rounded-full bg-white/15 p-2.5 active:scale-90 transition">
            <IconLogout className="h-5 w-5" />
          </button>
        }
      >
        <div className="mt-6 rounded-[26px] bg-white/12 p-5 ring-1 ring-white/20 backdrop-blur">
          <p className="text-[13px] font-medium text-white/70">Totale da pagare</p>
          <p className="mt-1 text-[42px] font-extrabold leading-none tracking-tight">{euro(daPagare)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/20 pt-4 text-center">
            <div>
              <p className="text-[16px] font-bold leading-tight">{workers.length}</p>
              <p className="text-[11px] text-white/60">{workers.length === 1 ? 'lavoratore' : 'lavoratori'}</p>
            </div>
            <div>
              <p className="text-[16px] font-bold leading-tight">{oreLabel(oreTotali)}</p>
              <p className="text-[11px] text-white/60">ore registrate</p>
            </div>
          </div>
        </div>
      </Header>

      {nuove.length > 0 && (
        <div className="px-5 pt-5">
          <Card className="animate-rise border border-amber-200 bg-amber-50 p-4 shadow-none">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-600"><IconBell className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-amber-900">
                  {nuove.length === 1 ? 'Una nuova registrazione' : `${nuove.length} nuove registrazioni`}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {nuove.slice(0, 3).map(e => {
                    const w = workers.find(x => x.id === e.worker_id)
                    return (
                      <li key={e.id} className="truncate text-[13px] text-amber-800">
                        <span className="font-semibold">{w?.name ?? 'Lavoratore'}</span> · {oreLabel(e.hours)} · <span className="capitalize">{dataBreve(e.work_date)}</span>
                      </li>
                    )
                  })}
                </ul>
                <button
                  onClick={async () => { segnaVisto(); setVisto(new Date().toISOString()); await chiediPermessoNotifiche() }}
                  className="mt-2.5 text-[13px] font-bold text-amber-700 underline underline-offset-2"
                >
                  Ho visto, segna come lette
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Sezione
        titolo="I tuoi lavoratori"
        azione={
          <button onClick={() => setApriNuovo(true)}
                  className="flex items-center gap-1 rounded-xl bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-700 active:scale-95 transition">
            <IconPlus className="h-4 w-4" /> Aggiungi
          </button>
        }
      >
        {workers.length === 0 ? (
          <Vuoto
            icona={<IconUsers className="h-6 w-6" />}
            titolo="Nessun lavoratore"
            testo="Aggiungi il primo lavoratore con nome e tariffa oraria, poi creagli l’accesso."
            azione={<Button variant="soft" onClick={() => setApriNuovo(true)}><IconPlus className="h-4 w-4" /> Aggiungi lavoratore</Button>}
          />
        ) : (
          <div className="space-y-2.5">
            {totali.map(({ w, r }) => (
              <Card key={w.id} onClick={() => nav(`/lavoratore/${w.id}`)} className="flex items-center gap-4 px-4 py-4">
                <Avatar name={w.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-bold text-ink-900">{w.name}</p>
                  <p className="truncate text-[13px] text-ink-500">
                    {euro(w.hourly_rate)}/h · {oreLabel(r.totalHours)} · {r.days} gg
                    {!w.user_id && <span className="ml-1 font-semibold text-amber-600">· accesso da creare</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[17px] font-extrabold ${r.balance > 0 ? 'text-brand-600' : 'text-emerald-600'}`}>
                    {euro(r.balance)}
                  </p>
                  <p className="text-[11px] text-ink-400">{r.balance > 0 ? 'da pagare' : r.balance < 0 ? 'in anticipo' : 'in pari'}</p>
                </div>
                <IconRight className="h-4 w-4 text-ink-300" />
              </Card>
            ))}
          </div>
        )}
      </Sezione>

      <NuovoLavoratore open={apriNuovo} onClose={() => setApriNuovo(false)} />
    </>
  )
}

function NuovoLavoratore({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refresh } = useApp()
  const nav = useNavigate()
  const [nome, setNome] = useState('')
  const [tariffa, setTariffa] = useState('')
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)

  async function salva() {
    setErrore(''); setAttesa(true)
    try {
      if (nome.trim().length < 2) throw new Error('Scrivi il nome del lavoratore.')
      const t = Number(String(tariffa).replace(',', '.'))
      if (!Number.isFinite(t) || t <= 0) throw new Error('Inserisci una tariffa oraria valida.')
      const w = await db.createWorker(nome, t)
      refresh()
      setNome(''); setTariffa('')
      onClose()
      nav(`/lavoratore/${w.id}`)
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Non sono riuscito a salvare.')
    } finally { setAttesa(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Nuovo lavoratore">
      <div className="space-y-4">
        <Field label="Nome e cognome">
          <input className={inputCls} value={nome} onChange={e => setNome(e.target.value)}
                 placeholder="Carlo Bianchi" autoComplete="off" />
        </Field>
        <Field label="Tariffa oraria (€)" hint="Puoi cambiarla in qualsiasi momento: le giornate già registrate restano al vecchio prezzo.">
          <input className={inputCls} value={tariffa} onChange={e => setTariffa(e.target.value)}
                 type="text" inputMode="decimal" placeholder="12,00" />
        </Field>
        <Errore>{errore}</Errore>
        <Button size="lg" full onClick={salva} disabled={attesa}>
          {attesa ? <Spinner /> : 'Aggiungi lavoratore'}
        </Button>
      </div>
    </Sheet>
  )
}
