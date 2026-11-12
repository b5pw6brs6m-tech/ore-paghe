import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Caricamento, Card, Errore, Field, Interruttore, Led, Sheet, Spinner, Vuoto, Avatar, cx, inputCls } from '../../components/ui'
import { Header, Sezione } from '../../components/Shell'
import { IconBell, IconLogout, IconPlus, IconRight, IconUsers } from '../../components/icons'
import { euro, oreLabel, dataBreve } from '../../lib/format'
import { riepilogo, round2 } from '../../lib/calc'
import { db } from '../../lib/db'
import { useApp, useCarica } from '../../context/AppContext'
import { avvisa, chiediPermessoNotifiche, segnaVisto, ultimaVisita } from '../../lib/novita'
import { ultimoAccesso } from '../../lib/ultimoIngresso'
import type { Entry, Payment, Worker } from '../../lib/types'

export default function AdminLavoratori() {
  const nav = useNavigate()
  const { user, signOut, refresh } = useApp()
  const [apriNuovo, setApriNuovo] = useState(false)

  // Interruttore dell'accesso: mentre il database risponde mostriamo già il
  // nuovo stato, così il tocco si vede subito.
  const [inCambio, setInCambio] = useState<Record<string, boolean>>({})
  async function cambiaAccesso(w: Worker, attivo: boolean) {
    const nome = w.name.split(' ')[0]
    if (!attivo && !confirm(`¿Desactivar el acceso de ${nome}?\n\nNo podrá entrar en la app hasta que lo vuelvas a activar. Sus horas y sus pagos se quedan guardados.`)) return
    setInCambio(s => ({ ...s, [w.id]: attivo }))
    try {
      await db.impostaAccesso(w.id, attivo)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No he podido cambiar el acceso.')
    } finally {
      // Lasciamo il tempo ai dati nuovi di arrivare prima di togliere lo stato provvisorio.
      setTimeout(() => setInCambio(s => { const n = { ...s }; delete n[w.id]; return n }), 600)
    }
  }

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
      if (w) avvisa('Horas nuevas registradas', `${w.name}: ${oreLabel(e.hours)} el ${dataBreve(e.work_date)}`)
    }
  }, [entries, workers, c2])

  if (c1 || c2 || c3) return <Caricamento />

  const totali = workers.map(w => {
    // Lo stato provvisorio dell'interruttore vince finché il database non conferma.
    const attivo = w.id in inCambio ? inCambio[w.id] : w.active
    return {
      w, attivo,
      r: riepilogo(entries.filter(e => e.worker_id === w.id), payments.filter(p => p.worker_id === w.id)),
      accesso: ultimoAccesso({ ...w, active: attivo }),
    }
  })
  const attivi = workers.filter(w => w.active).length
  const daPagare = round2(totali.reduce((a, t) => a + t.r.balance, 0))
  const oreTotali = round2(totali.reduce((a, t) => a + t.r.totalHours, 0))

  return (
    <>
      <Header
        occhiello="Área del jefe"
        titolo={(user?.fullName || 'Hola').split(' ')[0]}
        azione={
          <button onClick={() => void signOut()} aria-label="Salir"
                  className="rounded-full bg-white/15 p-2.5 active:scale-90 transition">
            <IconLogout className="h-5 w-5" />
          </button>
        }
      >
        <div className="mt-6 rounded-[26px] bg-white/12 p-5 ring-1 ring-white/20 backdrop-blur">
          <p className="text-[13px] font-medium text-white/70">Total por pagar</p>
          <p className="mt-1 text-[42px] font-extrabold leading-none tracking-tight">{euro(daPagare)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/20 pt-4 text-center">
            <div>
              <p className="text-[16px] font-bold leading-tight">{attivi}</p>
              <p className="text-[11px] text-white/60">{attivi === 1 ? 'trabajador activo' : 'trabajadores activos'}</p>
            </div>
            <div>
              <p className="text-[16px] font-bold leading-tight">{oreLabel(oreTotali)}</p>
              <p className="text-[11px] text-white/60">horas registradas</p>
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
                  {nuove.length === 1 ? 'Un registro nuevo' : `${nuove.length} registros nuevos`}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {nuove.slice(0, 3).map(e => {
                    const w = workers.find(x => x.id === e.worker_id)
                    return (
                      <li key={e.id} className="truncate text-[13px] text-amber-800">
                        <span className="font-semibold">{w?.name ?? 'Trabajador'}</span> · {oreLabel(e.hours)} · {dataBreve(e.work_date)}
                      </li>
                    )
                  })}
                </ul>
                <button
                  onClick={async () => { segnaVisto(); setVisto(new Date().toISOString()); await chiediPermessoNotifiche() }}
                  className="mt-2.5 text-[13px] font-bold text-amber-700 underline underline-offset-2"
                >
                  Ya lo he visto, marcar como leído
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Sezione
        titolo="Tus trabajadores"
        azione={
          <button onClick={() => setApriNuovo(true)}
                  className="flex items-center gap-1 rounded-xl bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-700 active:scale-95 transition">
            <IconPlus className="h-4 w-4" /> Añadir
          </button>
        }
      >
        {workers.length === 0 ? (
          <Vuoto
            icona={<IconUsers className="h-6 w-6" />}
            titolo="Ningún trabajador"
            testo="Añade el primer trabajador con su nombre y su tarifa por hora, y luego créale el acceso."
            azione={<Button variant="soft" onClick={() => setApriNuovo(true)}><IconPlus className="h-4 w-4" /> Añadir trabajador</Button>}
          />
        ) : (
          <div className="space-y-2.5">
            {totali.map(({ w, r, accesso, attivo }) => (
              <Card key={w.id} className="overflow-hidden">
                <button onClick={() => nav(`/lavoratore/${w.id}`)}
                        className={cx('flex w-full items-center gap-3.5 px-4 pt-4 pb-3.5 text-left transition active:opacity-60',
                          !attivo && 'opacity-55')}>
                  <Avatar name={w.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-bold text-ink-900">{w.name}</p>
                    <p className="truncate text-[13px] text-ink-500">
                      {euro(w.hourly_rate)}/h · {oreLabel(r.totalHours)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-[17px] font-extrabold ${r.balance > 0 ? 'text-brand-600' : 'text-emerald-600'}`}>
                      {euro(r.balance)}
                    </p>
                    <p className="text-[11px] text-ink-400">{r.balance > 0 ? 'por pagar' : r.balance < 0 ? 'por adelantado' : 'al día'}</p>
                  </div>
                  <IconRight className="h-4 w-4 shrink-0 text-ink-300" />
                </button>

                {/* riga di stato: ultimo accesso e interruttore per accenderlo o spegnerlo */}
                <div className="flex items-center gap-2 border-t border-ink-100 bg-ink-50/60 py-2 pl-4 pr-3">
                  <Led stato={accesso.stato} />
                  <span className={cx('truncate text-[12.5px]', w.user_id && !attivo ? 'font-semibold text-rose-600' : 'text-ink-500')}>
                    {accesso.testo}
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-2 text-[12px] text-ink-400">
                    {!w.user_id
                      ? <b className="py-1 font-semibold text-amber-600">falta el acceso</b>
                      : <>
                          <span className={attivo ? 'font-semibold text-emerald-600' : ''}>{attivo ? 'Activo' : 'Desactivado'}</span>
                          <Interruttore
                            attivo={attivo} occupato={w.id in inCambio}
                            etichetta={`Acceso de ${w.name}`}
                            onCambia={v => void cambiaAccesso(w, v)}
                          />
                        </>}
                  </span>
                </div>
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
      if (nome.trim().length < 2) throw new Error('Escribe el nombre del trabajador.')
      const t = Number(String(tariffa).replace(',', '.'))
      if (!Number.isFinite(t) || t <= 0) throw new Error('Pon una tarifa por hora válida.')
      const w = await db.createWorker(nome, t)
      refresh()
      setNome(''); setTariffa('')
      onClose()
      nav(`/lavoratore/${w.id}`)
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'No he podido guardar.')
    } finally { setAttesa(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Nuevo trabajador">
      <div className="space-y-4">
        <Field label="Nombre y apellidos">
          <input className={inputCls} value={nome} onChange={e => setNome(e.target.value)}
                 placeholder="Carlos Blanco" autoComplete="off" />
        </Field>
        <Field label="Tarifa por hora (€)" hint="Puedes cambiarla cuando quieras: las jornadas ya registradas se quedan con el precio antiguo.">
          <input className={inputCls} value={tariffa} onChange={e => setTariffa(e.target.value)}
                 type="text" inputMode="decimal" placeholder="12,00" />
        </Field>
        <Errore>{errore}</Errore>
        <Button size="lg" full onClick={salva} disabled={attesa}>
          {attesa ? <Spinner /> : 'Añadir trabajador'}
        </Button>
      </div>
    </Sheet>
  )
}
