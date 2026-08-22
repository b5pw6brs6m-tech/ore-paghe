import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Caricamento, Card, Vuoto } from '../../components/ui'
import { Header, Sezione, saluto } from '../../components/Shell'
import { IconCheck, IconClock, IconLogout, IconPlus, IconRight } from '../../components/icons'
import { euro, dataBreve, dataMedia, maiuscola, oreLabel } from '../../lib/format'
import { guadagnoEntry, riepilogo } from '../../lib/calc'
import { db } from '../../lib/db'
import { useApp, useCarica } from '../../context/AppContext'
import type { Entry, Payment, Worker } from '../../lib/types'
import { Movimenti } from '../../components/Movimenti'

type Salvato = { ore: number; guadagno: number; data: string }

export default function WorkerHome({ worker }: { worker: Worker }) {
  const nav = useNavigate()
  const { state } = useLocation() as { state?: { salvato?: Salvato } }
  const { user, signOut } = useApp()
  const [conferma, setConferma] = useState<Salvato | null>(state?.salvato ?? null)

  useEffect(() => {
    if (!conferma) return
    window.history.replaceState({}, '')          // niente conferma se si ricarica la pagina
    const t = setTimeout(() => setConferma(null), 6000)
    return () => clearTimeout(t)
  }, [conferma])

  const { dati: entries, caricando: c1 } = useCarica<Entry[]>(() => db.listEntries(worker.id), [worker.id], [])
  const { dati: payments, caricando: c2 } = useCarica<Payment[]>(() => db.listPayments(worker.id), [worker.id], [])

  if (c1 || c2) return <Caricamento />

  const r = riepilogo(entries, payments)
  const nome = (worker.name || user?.fullName || '').split(' ')[0]
  const ultimi = entries.slice(0, 4)

  return (
    <>
      <Header
        occhiello={`${saluto()},`}
        titolo={nome}
        azione={
          <button onClick={() => void signOut()} aria-label="Salir"
                  className="rounded-full bg-white/15 p-2.5 active:scale-90 transition">
            <IconLogout className="h-5 w-5" />
          </button>
        }
      >
        <div className="mt-6 rounded-[26px] bg-white/12 p-5 ring-1 ring-white/20 backdrop-blur">
          <p className="text-[13px] font-medium text-white/70">
            {r.balance >= 0 ? 'Por cobrar ahora' : 'Has cobrado por adelantado'}
          </p>
          <p className="mt-1 text-[42px] font-extrabold leading-none tracking-tight">{euro(Math.abs(r.balance))}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/20 pt-4 text-center">
            <MiniStat v={String(r.days)} t={r.days === 1 ? 'día' : 'días'} />
            <MiniStat v={oreLabel(r.totalHours)} t="horas en total" />
            <MiniStat v={`${euro(worker.hourly_rate)}`} t="por hora" />
          </div>
        </div>
      </Header>

      {conferma && (
        <div className="px-5 pt-5">
          <div className="animate-rise flex items-center gap-3 rounded-3xl bg-emerald-50 px-4 py-4 ring-1 ring-emerald-200">
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600"><IconCheck className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-emerald-900">¡Registrado!</p>
              <p className="truncate text-[13px] text-emerald-700">
                {maiuscola(dataMedia(conferma.data))} · {oreLabel(conferma.ore)} · {euro(conferma.guadagno)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pt-6">
        <Button size="lg" full onClick={() => nav('/registra')}>
          <IconPlus className="h-5 w-5" /> Registrar las horas de hoy
        </Button>
        <p className="mt-2.5 text-center text-[12px] leading-relaxed text-ink-400">
          Solo se registra la jornada de hoy, al terminar.
          <br />Mañana ya no se podrá.
        </p>
      </div>

      <Sezione titolo="Tu cuenta">
        <Card className="divide-y divide-ink-100">
          <RigaConto etichetta="Has ganado" valore={euro(r.totalEarned)} colore="text-ink-900" />
          <RigaConto etichetta="Ya te he pagado" valore={`− ${euro(r.totalPaid)}`} colore="text-emerald-600" />
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-[15px] font-bold text-ink-900">
              {r.balance >= 0 ? 'Aún te debo' : 'Has cobrado de más'}
            </span>
            <span className="text-[22px] font-extrabold text-brand-600">{euro(Math.abs(r.balance))}</span>
          </div>
        </Card>
      </Sezione>

      <Sezione
        titolo="Últimos movimientos"
        azione={ultimi.length > 0 && (
          <button onClick={() => nav('/ore')} className="flex items-center gap-1 text-[13px] font-semibold text-brand-600">
            Ver todo <IconRight className="h-3.5 w-3.5" />
          </button>
        )}
      >
        {ultimi.length === 0 && payments.length === 0 ? (
          <Vuoto
            icona={<IconClock className="h-6 w-6" />}
            titolo="Todavía no hay jornadas"
            testo="En cuanto registres tus horas las verás aquí, con lo que ganas cada día."
            azione={<Button variant="soft" onClick={() => nav('/registra')}>Registrar la primera jornada</Button>}
          />
        ) : (
          <Movimenti entries={entries} payments={payments} vuotoTesto="" limite={4} />
        )}
      </Sezione>
    </>
  )
}

function MiniStat({ v, t }: { v: string; t: string }) {
  return (
    <div>
      <p className="text-[16px] font-bold leading-tight">{v}</p>
      <p className="text-[11px] text-white/60">{t}</p>
    </div>
  )
}

function RigaConto({ etichetta, valore, colore }: { etichetta: string; valore: string; colore: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-[14px] text-ink-500">{etichetta}</span>
      <span className={`text-[16px] font-bold ${colore}`}>{valore}</span>
    </div>
  )
}

export function RigaGiorno({ e, onDelete }: { e: Entry; onDelete?: () => void }) {
  return (
    <Card className="flex items-center gap-4 px-4 py-3.5">
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <span className="text-[15px] font-extrabold leading-none">{e.work_date.slice(8)}</span>
        <span className="text-[9px] font-semibold uppercase leading-none mt-0.5">{dataBreve(e.work_date).split(' ')[2]}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-ink-900">{maiuscola(dataBreve(e.work_date))}</p>
        <p className="truncate text-[13px] text-ink-500">
          {e.start_time && e.end_time
            ? `${e.start_time} – ${e.end_time}${e.break_minutes ? ` · descanso ${e.break_minutes}m` : ''}`
            : 'horas metidas a mano'}
          {e.note ? ` · ${e.note}` : ''}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[15px] font-extrabold text-ink-900">{oreLabel(e.hours)}</p>
        <p className="text-[13px] font-semibold text-emerald-600">{euro(guadagnoEntry(e))}</p>
      </div>
      {onDelete && (
        <button onClick={onDelete} aria-label="Eliminar"
                className="ml-1 rounded-xl bg-rose-50 p-2 text-rose-500 active:scale-90 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}
               strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      )}
    </Card>
  )
}
