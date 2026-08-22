import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Errore, Field, inputCls, Spinner, cx } from '../../components/ui'
import { SceltaOrario } from '../../components/SceltaOrario'
import { IconCheck, IconClock, IconLeft } from '../../components/icons'
import { calcolaOre, minutiDa, round2 } from '../../lib/calc'
import { dataLunga, euro, maiuscola, oreLabel, todayISO } from '../../lib/format'
import { db } from '../../lib/db'
import { useApp } from '../../context/AppContext'
import type { Worker } from '../../lib/types'

/**
 * Le ore si registrano SOLO per la giornata in corso: è l'obbligo di fine
 * giornata del lavoratore. Non c'è scelta della data, e la stessa regola è
 * imposta anche dal database, così non è aggirabile.
 */

type Passo = 0 | 1 | 2 | 3
const PASSI = 4
const PREGUNTAS = ['¿A qué hora entraste?', '¿A qué hora saliste?', '¿Hiciste descanso?', '¿Está todo bien?']

export default function Registra({ worker }: { worker: Worker }) {
  const nav = useNavigate()
  const { refresh } = useApp()

  const [passo, setPasso] = useState<Passo>(0)
  const [entrata, setEntrata] = useState('08:00')
  const [uscita, setUscita] = useState('17:00')
  const [pausa, setPausa] = useState(60)
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)

  const oggi = todayISO()
  const ore = useMemo(() => calcolaOre(entrata, uscita, pausa), [entrata, uscita, pausa])
  const guadagno = round2(ore * worker.hourly_rate)

  function avanti() {
    setErrore('')
    if (passo === 0 && minutiDa(entrata) === null) return setErrore('Pon una hora de entrada válida.')
    if (passo === 1) {
      if (minutiDa(uscita) === null) return setErrore('Pon una hora de salida válida.')
      if (calcolaOre(entrata, uscita, 0) === 0) return setErrore('La entrada y la salida coinciden: revisa las horas.')
    }
    if (passo === 2 && ore <= 0) return setErrore('El descanso dura más que el turno: revisa los datos.')
    setPasso(p => Math.min(PASSI - 1, p + 1) as Passo)
  }

  function indietro() {
    setErrore('')
    if (passo === 0) { nav('/'); return }
    setPasso(p => Math.max(0, p - 1) as Passo)
  }

  async function conferma() {
    setAttesa(true); setErrore('')
    try {
      await db.addEntry({
        worker_id: worker.id,
        work_date: todayISO(),                    // ricalcolata al momento del salvataggio
        start_time: entrata,
        end_time: uscita,
        break_minutes: pausa,
        hours: ore,
        note: null,
      })
      refresh()
      nav('/', { replace: true, state: { salvato: { ore, guadagno, data: todayISO() } } })
    } catch (err) {
      const m = err instanceof Error ? err.message : ''
      setErrore(/row-level security|violates|42501/i.test(m)
        ? 'Solo puedes registrar la jornada de hoy. Si ya ha pasado la medianoche, pídele al jefe que la meta él.'
        : m || 'No he podido guardar.')
      setAttesa(false)
    }
  }

  return (
    <div className="min-h-full bg-ink-100">
      <div className="mx-auto min-h-screen max-w-[480px]">

        <header className="bg-gradient-to-br from-brand-700 to-brand-500 px-5 pb-8 pt-4 text-white safe-top">
          <div className="flex items-center gap-3 pt-3">
            <button onClick={indietro} aria-label="Atrás"
                    className="rounded-full bg-white/15 p-2.5 active:scale-90 transition">
              <IconLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">
                Paso {passo + 1} de {PASSI}
              </p>
              <p className="text-[15px] font-bold">{worker.name}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: PASSI }).map((_, i) => (
              <div key={i} className={cx('h-1.5 flex-1 rounded-full transition-colors duration-300',
                i <= passo ? 'bg-white' : 'bg-white/25')} />
            ))}
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5">
            <IconClock className="h-4 w-4" />
            <span className="text-[13px] font-semibold">Hoy · {dataLunga(oggi)}</span>
          </div>

          <h1 className="mt-4 text-[27px] font-extrabold leading-tight tracking-tight">{PREGUNTAS[passo]}</h1>
        </header>

        <div key={passo} className="animate-rise space-y-4 px-5 pt-6 pb-40">

          {passo === 0 && (
            <>
              <SceltaOrario valore={entrata} onChange={setEntrata} etichetta="Hora de entrada" />
              <Presets valori={['06:00', '07:00', '08:00', '09:00', '14:00', '15:00']} attivo={entrata} onPick={setEntrata} />
            </>
          )}

          {passo === 1 && (
            <>
              <SceltaOrario valore={uscita} onChange={setUscita} etichetta="Hora de salida" />
              <Presets valori={['12:00', '13:00', '17:00', '18:00', '19:00', '22:00']} attivo={uscita} onPick={setUscita} />
              {calcolaOre(entrata, uscita, 0) > 0 && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-brand-50 px-4 py-3 text-[14px] font-medium text-brand-700">
                  <IconClock className="h-4 w-4" />
                  De {entrata} a {uscita} · {oreLabel(calcolaOre(entrata, uscita, 0))} antes del descanso
                </div>
              )}
            </>
          )}

          {passo === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[[0, 'Sin descanso'], [30, '30 minutos'], [60, '1 hora'], [90, 'Hora y media']].map(([v, t]) => (
                  <button key={v} onClick={() => setPausa(v as number)}
                    className={cx('rounded-3xl px-4 py-5 text-left text-[17px] font-bold transition active:scale-[.97]',
                      pausa === v ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                                  : 'bg-white text-ink-900 ring-1 ring-ink-200')}>
                    {t}
                  </button>
                ))}
              </div>
              <Card className="p-5">
                <Field label="Otra duración (minutos)">
                  <input type="number" inputMode="numeric" min={0} max={480} className={inputCls} value={pausa}
                         onChange={e => setPausa(Math.max(0, Math.min(480, Number(e.target.value) || 0)))} />
                </Field>
              </Card>
            </>
          )}

          {passo === 3 && (
            <>
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-ink-900 to-ink-700 px-6 py-7 text-center text-white">
                  <p className="text-[13px] font-medium text-white/60">{maiuscola(dataLunga(oggi))}</p>
                  <p className="mt-2 text-[44px] font-extrabold leading-none tracking-tight">{oreLabel(ore)}</p>
                  <p className="mt-2 text-[15px] font-semibold text-emerald-300">{euro(guadagno)}</p>
                </div>
                <dl className="divide-y divide-ink-100 px-6 py-2">
                  <Riga t="Entrada" v={entrata} />
                  <Riga t="Salida" v={uscita} />
                  <Riga t="Descanso" v={pausa === 0 ? 'ninguno' : `${pausa} min`} />
                  <Riga t="Tarifa por hora" v={`${euro(worker.hourly_rate)}/h`} />
                </dl>
              </Card>

            </>
          )}

          <Errore>{errore}</Errore>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 safe-bottom">
          <div className="mx-auto max-w-[480px] border-t border-ink-200/60 bg-white/92 px-5 py-4 backdrop-blur-xl">
            {passo < 3 ? (
              <Button size="lg" full onClick={avanti}>
                Siguiente
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}
                     strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </Button>
            ) : (
              <>
                <p className="mb-3 text-center text-[13px] text-ink-500">
                  Revisa los datos: al confirmar, el jefe los verá al momento.
                </p>
                <Button size="lg" full variant="success" onClick={conferma} disabled={attesa || ore <= 0}>
                  {attesa ? <Spinner /> : <><IconCheck className="h-5 w-5" /> Confirmo, guardar</>}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Presets({ valori, attivo, onPick }: { valori: string[]; attivo: string; onPick: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {valori.map(v => (
        <button key={v} onClick={() => onPick(v)}
          className={cx('rounded-2xl py-3 text-[16px] font-bold transition active:scale-95',
            attivo === v ? 'bg-brand-600 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200')}>
          {v}
        </button>
      ))}
    </div>
  )
}

function Riga({ t, v }: { t: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-[14px] text-ink-500">{t}</dt>
      <dd className="text-[15px] font-bold text-ink-900">{v}</dd>
    </div>
  )
}
