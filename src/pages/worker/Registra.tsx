import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Errore, Field, inputCls, Spinner, cx } from '../../components/ui'
import { SceltaOrario } from '../../components/SceltaOrario'
import { IconCalendar, IconCheck, IconClock, IconLeft } from '../../components/icons'
import { calcolaOre, minutiDa, round2 } from '../../lib/calc'
import { dataLunga, euro, oreLabel, todayISO, toISO } from '../../lib/format'
import { db } from '../../lib/db'
import { useApp } from '../../context/AppContext'
import type { Worker } from '../../lib/types'

type Passo = 0 | 1 | 2 | 3 | 4
const PASSI = 5

const giorniFa = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return toISO(d) }

export default function Registra({ worker }: { worker: Worker }) {
  const nav = useNavigate()
  const { refresh } = useApp()

  const [passo, setPasso] = useState<Passo>(0)
  const [data, setData] = useState(todayISO())
  const [entrata, setEntrata] = useState('08:00')
  const [uscita, setUscita] = useState('17:00')
  const [pausa, setPausa] = useState(60)
  const [oreDirette, setOreDirette] = useState<number | null>(null)
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)

  const ore = useMemo(
    () => (oreDirette !== null ? round2(oreDirette) : calcolaOre(entrata, uscita, pausa)),
    [oreDirette, entrata, uscita, pausa],
  )
  const guadagno = round2(ore * worker.hourly_rate)

  function avanti() {
    setErrore('')
    if (passo === 1 && minutiDa(entrata) === null) return setErrore('Inserisci un orario di entrata valido.')
    if (passo === 2) {
      if (minutiDa(uscita) === null) return setErrore('Inserisci un orario di uscita valido.')
      if (calcolaOre(entrata, uscita, 0) === 0) return setErrore('Entrata e uscita coincidono: controlla gli orari.')
    }
    if (passo === 3 && ore <= 0) return setErrore('La pausa è più lunga del turno: controlla i dati.')
    setPasso(p => Math.min(PASSI - 1, p + 1) as Passo)
  }

  function indietro() {
    setErrore('')
    if (passo === 0) { nav('/'); return }
    if (oreDirette !== null && passo === 4) { setPasso(1); return }
    setPasso(p => Math.max(0, p - 1) as Passo)
  }

  async function conferma() {
    setAttesa(true); setErrore('')
    try {
      await db.addEntry({
        worker_id: worker.id,
        work_date: data,
        start_time: oreDirette === null ? entrata : null,
        end_time: oreDirette === null ? uscita : null,
        break_minutes: oreDirette === null ? pausa : 0,
        hours: ore,
        note: null,
      })
      refresh()
      nav('/', { replace: true, state: { salvato: { ore, guadagno, data } } })
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Non sono riuscito a salvare.')
      setAttesa(false)
    }
  }

  const domande = ['Che giorno hai lavorato?', 'A che ora sei entrato?', 'A che ora sei uscito?', 'Hai fatto pausa?', 'Confermi tutto?']

  return (
    <div className="min-h-full bg-ink-100">
      <div className="mx-auto min-h-screen max-w-[480px]">

        <header className="bg-gradient-to-br from-brand-700 to-brand-500 px-5 pb-8 pt-4 text-white safe-top">
          <div className="flex items-center gap-3 pt-3">
            <button onClick={indietro} aria-label="Indietro"
                    className="rounded-full bg-white/15 p-2.5 active:scale-90 transition">
              <IconLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">
                Passo {passo + 1} di {PASSI}
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

          <h1 className="mt-6 text-[27px] font-extrabold leading-tight tracking-tight">{domande[passo]}</h1>
        </header>

        <div key={passo} className="animate-rise space-y-4 px-5 pt-6 pb-40">

          {/* ---------------------------------------------------------- Giorno */}
          {passo === 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <ChipGrande attivo={data === todayISO()} onClick={() => setData(todayISO())}
                            titolo="Oggi" sotto={dataLunga(todayISO()).split(' ').slice(0, 3).join(' ')} />
                <ChipGrande attivo={data === giorniFa(1)} onClick={() => setData(giorniFa(1))}
                            titolo="Ieri" sotto={dataLunga(giorniFa(1)).split(' ').slice(0, 3).join(' ')} />
              </div>
              <Card className="p-5">
                <Field label="Oppure scegli un altro giorno">
                  <input type="date" className={inputCls} value={data} max={todayISO()}
                         onChange={e => e.target.value && setData(e.target.value)} />
                </Field>
              </Card>
              <RiepilogoRiga icona={<IconCalendar className="h-4 w-4" />} testo={dataLunga(data)} />
            </>
          )}

          {/* --------------------------------------------------------- Entrata */}
          {passo === 1 && (
            <>
              <SceltaOrario valore={entrata} onChange={setEntrata} etichetta="Orario di entrata" />
              <Presets valori={['06:00', '07:00', '08:00', '09:00', '14:00', '15:00']} attivo={entrata} onPick={setEntrata} />
              <button
                onClick={() => { setOreDirette(8); setPasso(4) }}
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-[14px] font-semibold text-brand-700 ring-1 ring-ink-200 active:scale-[.98] transition"
              >
                Non ricordo gli orari → inserisco solo le ore totali
              </button>
            </>
          )}

          {/* ---------------------------------------------------------- Uscita */}
          {passo === 2 && (
            <>
              <SceltaOrario valore={uscita} onChange={setUscita} etichetta="Orario di uscita" />
              <Presets valori={['12:00', '13:00', '17:00', '18:00', '19:00', '22:00']} attivo={uscita} onPick={setUscita} />
              {calcolaOre(entrata, uscita, 0) > 0 && (
                <RiepilogoRiga icona={<IconClock className="h-4 w-4" />}
                               testo={`Dalle ${entrata} alle ${uscita} · ${oreLabel(calcolaOre(entrata, uscita, 0))} prima della pausa`} />
              )}
            </>
          )}

          {/* ----------------------------------------------------------- Pausa */}
          {passo === 3 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[[0, 'Nessuna pausa'], [30, '30 minuti'], [60, '1 ora'], [90, '1 ora e mezza']].map(([v, t]) => (
                  <ChipGrande key={v} attivo={pausa === v} onClick={() => setPausa(v as number)} titolo={t as string} />
                ))}
              </div>
              <Card className="p-5">
                <Field label="Altra durata (minuti)">
                  <input type="number" inputMode="numeric" min={0} max={480} className={inputCls} value={pausa}
                         onChange={e => setPausa(Math.max(0, Math.min(480, Number(e.target.value) || 0)))} />
                </Field>
              </Card>
            </>
          )}

          {/* -------------------------------------------------------- Conferma */}
          {passo === 4 && (
            <>
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-ink-900 to-ink-700 px-6 py-7 text-center text-white">
                  <p className="text-[13px] font-medium text-white/60">{dataLunga(data)}</p>
                  <p className="mt-2 text-[44px] font-extrabold leading-none tracking-tight">{oreLabel(ore)}</p>
                  <p className="mt-2 text-[15px] font-semibold text-emerald-300">{euro(guadagno)}</p>
                </div>
                <dl className="divide-y divide-ink-100 px-6 py-2">
                  {oreDirette === null ? (
                    <>
                      <Riga t="Entrata" v={entrata} />
                      <Riga t="Uscita" v={uscita} />
                      <Riga t="Pausa" v={pausa === 0 ? 'nessuna' : `${pausa} min`} />
                    </>
                  ) : (
                    <Riga t="Ore inserite a mano" v={oreLabel(ore)} />
                  )}
                  <Riga t="Tariffa oraria" v={`${euro(worker.hourly_rate)}/h`} />
                </dl>
              </Card>

              {oreDirette !== null && (
                <Card className="p-5">
                  <Field label="Ore lavorate">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" onClick={() => setOreDirette(Math.max(0.5, round2((oreDirette ?? 0) - 0.5)))}>−30m</Button>
                      <input type="number" step="0.5" min="0.5" max="24" inputMode="decimal"
                             className={`${inputCls} text-center text-[22px] font-bold`}
                             value={oreDirette}
                             onChange={e => setOreDirette(Math.max(0, Math.min(24, Number(e.target.value) || 0)))} />
                      <Button variant="ghost" onClick={() => setOreDirette(Math.min(24, round2((oreDirette ?? 0) + 0.5)))}>+30m</Button>
                    </div>
                  </Field>
                </Card>
              )}

            </>
          )}

          <Errore>{errore}</Errore>
        </div>

        {/* ------------------------------------------------------ Barra azione */}
        <div className="fixed inset-x-0 bottom-0 z-40 safe-bottom">
          <div className="mx-auto max-w-[480px] border-t border-ink-200/60 bg-white/92 px-5 py-4 backdrop-blur-xl">
            {passo < 4 ? (
              <Button size="lg" full onClick={avanti}>
                Avanti <IconRightSmall />
              </Button>
            ) : (
              <>
                <p className="mb-3 text-center text-[13px] text-ink-500">
                  Controlla i dati: dopo la conferma il titolare li vedrà subito.
                </p>
                <Button size="lg" full variant="success" onClick={conferma} disabled={attesa || ore <= 0}>
                  {attesa ? <Spinner /> : <><IconCheck className="h-5 w-5" /> Confermo, salva</>}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- pezzettini */

function IconRightSmall() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
}

function ChipGrande({ attivo, onClick, titolo, sotto }: { attivo: boolean; onClick: () => void; titolo: string; sotto?: string }) {
  return (
    <button onClick={onClick}
      className={cx('rounded-3xl px-4 py-5 text-left transition active:scale-[.97]',
        attivo ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
               : 'bg-white text-ink-900 ring-1 ring-ink-200')}>
      <span className="block text-[17px] font-bold leading-tight">{titolo}</span>
      {sotto && <span className={cx('mt-0.5 block text-[13px]', attivo ? 'text-white/75' : 'text-ink-400')}>{sotto}</span>}
    </button>
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

function RiepilogoRiga({ icona, testo }: { icona: React.ReactNode; testo: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-brand-50 px-4 py-3 text-[14px] font-medium text-brand-700">
      {icona}<span className="capitalize">{testo}</span>
    </div>
  )
}
