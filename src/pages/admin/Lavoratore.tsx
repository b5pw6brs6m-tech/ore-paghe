import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, Button, Caricamento, Card, Errore, Field, Sheet, Spinner, Vuoto, cx, inputCls } from '../../components/ui'
import { IconCheck, IconClock, IconCopy, IconEdit, IconKey, IconLeft, IconPlus, IconShare, IconTrash, IconWallet } from '../../components/icons'
import { euro, oreLabel, todayISO } from '../../lib/format'
import { riepilogo } from '../../lib/calc'
import { db } from '../../lib/db'
import { normalizzaLogin } from '../../lib/api'
import { useApp, useCarica } from '../../context/AppContext'
import type { Entry, Payment, Worker } from '../../lib/types'
import { RigaGiorno } from '../worker/Home'
import { Movimenti } from '../../components/Movimenti'
import { RigaPagamento } from '../worker/Pagamenti'

export default function AdminLavoratore() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const { refresh } = useApp()
  const [tab, setTab] = useState<'tutto' | 'ore' | 'pagamenti'>('tutto')
  const [apriPagamento, setApriPagamento] = useState(false)
  const [apriModifica, setApriModifica] = useState(false)
  const [apriAccesso, setApriAccesso] = useState(false)

  const { dati: workers, caricando: c1 } = useCarica<Worker[]>(() => db.listWorkers(), [], [])
  const { dati: entries, caricando: c2 } = useCarica<Entry[]>(() => db.listEntries(id), [id], [])
  const { dati: payments, caricando: c3 } = useCarica<Payment[]>(() => db.listPayments(id), [id], [])

  if (c1 || c2 || c3) return <Caricamento />
  const worker = workers.find(w => w.id === id)
  if (!worker) {
    return (
      <div className="p-5 pt-16">
        <Vuoto icona={<IconClock className="h-6 w-6" />} titolo="Lavoratore non trovato"
               testo="Potrebbe essere stato eliminato."
               azione={<Button variant="soft" onClick={() => nav('/')}>Torna ai lavoratori</Button>} />
      </div>
    )
  }

  const r = riepilogo(entries, payments)

  async function eliminaOre(entryId: string) {
    if (!confirm('Vuoi eliminare questa giornata?')) return
    await db.deleteEntry(entryId); refresh()
  }
  async function eliminaPagamento(pid: string) {
    if (!confirm('Vuoi eliminare questo pagamento?')) return
    await db.deletePayment(pid); refresh()
  }

  return (
    <>
      <header className="rounded-b-[32px] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-5 pb-7 pt-4 text-white safe-top">
        <div className="flex items-center justify-between pt-3">
          <button onClick={() => nav('/')} aria-label="Indietro"
                  className="rounded-full bg-white/15 p-2.5 active:scale-90 transition">
            <IconLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            <button onClick={() => setApriAccesso(true)} aria-label="Accesso"
                    className="rounded-full bg-white/15 p-2.5 active:scale-90 transition"><IconKey className="h-5 w-5" /></button>
            <button onClick={() => setApriModifica(true)} aria-label="Modifica"
                    className="rounded-full bg-white/15 p-2.5 active:scale-90 transition"><IconEdit className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <Avatar name={worker.name} size={56} />
          <div className="min-w-0">
            <h1 className="truncate text-[24px] font-extrabold leading-tight tracking-tight">{worker.name}</h1>
            <p className="text-[14px] text-white/75">{euro(worker.hourly_rate)} all’ora</p>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] bg-white/12 p-5 ring-1 ring-white/20 backdrop-blur">
          <p className="text-[13px] font-medium text-white/70">Gli devi ancora</p>
          <p className="mt-1 text-[40px] font-extrabold leading-none tracking-tight">{euro(r.balance)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/20 pt-4 text-center">
            <Mini v={oreLabel(r.totalHours)} t={`${r.days} giornate`} />
            <Mini v={euro(r.totalEarned)} t="maturato" />
            <Mini v={euro(r.totalPaid)} t="già pagato" />
          </div>
        </div>
      </header>

      {!worker.user_id && (
        <div className="px-5 pt-5">
          <Card className="border border-amber-200 bg-amber-50 p-4 shadow-none">
            <p className="text-[14px] font-bold text-amber-900">Accesso non ancora creato</p>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
              Crea nome utente e password per {worker.name.split(' ')[0]}, così potrà registrare le ore dal suo telefono.
            </p>
            <Button variant="soft" className="mt-3" onClick={() => setApriAccesso(true)}>
              <IconKey className="h-4 w-4" /> Crea l’accesso
            </Button>
          </Card>
        </div>
      )}

      <div className="px-5 pt-5">
        <Button size="lg" full variant="success" onClick={() => setApriPagamento(true)}>
          <IconWallet className="h-5 w-5" /> Registra un pagamento
        </Button>
      </div>

      <div className="px-5 pt-6">
        <div className="mb-4 flex rounded-2xl bg-white p-1 ring-1 ring-ink-200">
          {([['tutto', 'Tutto'], ['ore', `Ore (${entries.length})`], ['pagamenti', `Pagati (${payments.length})`]] as const).map(([k, t]) => (
            <button key={k} onClick={() => setTab(k)}
              className={cx('flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition',
                tab === k ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-500')}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'tutto' ? (
          <Movimenti entries={entries} payments={payments}
                     vuotoTesto={`Qui vedrai in ordine di data ogni giornata di ${worker.name.split(' ')[0]} e ogni pagamento che gli fai.`} />
        ) : tab === 'ore' ? (
          entries.length === 0 ? (
            <Vuoto icona={<IconClock className="h-6 w-6" />} titolo="Nessuna giornata"
                   testo={`${worker.name.split(' ')[0]} non ha ancora registrato ore.`} />
          ) : (
            <div className="space-y-2.5">
              {entries.map(e => <RigaGiorno key={e.id} e={e} onDelete={() => void eliminaOre(e.id)} />)}
            </div>
          )
        ) : (
          payments.length === 0 ? (
            <Vuoto icona={<IconWallet className="h-6 w-6" />} titolo="Nessun pagamento"
                   testo="Registra un pagamento: verrà scalato dal totale e lui lo vedrà subito."
                   azione={<Button variant="soft" onClick={() => setApriPagamento(true)}><IconPlus className="h-4 w-4" /> Registra pagamento</Button>} />
          ) : (
            <div className="space-y-2.5">
              {payments.map(p => <RigaPagamento key={p.id} p={p} onDelete={() => void eliminaPagamento(p.id)} />)}
            </div>
          )
        )}
      </div>

      <FormPagamento open={apriPagamento} onClose={() => setApriPagamento(false)} worker={worker} saldo={r.balance} />
      <FormModifica open={apriModifica} onClose={() => setApriModifica(false)} worker={worker} />
      <FormAccesso open={apriAccesso} onClose={() => setApriAccesso(false)} worker={worker} />
    </>
  )
}

function Mini({ v, t }: { v: string; t: string }) {
  return (
    <div>
      <p className="text-[15px] font-bold leading-tight">{v}</p>
      <p className="text-[11px] text-white/60">{t}</p>
    </div>
  )
}

/* ------------------------------------------------------------- pagamento */

export function FormPagamento({ open, onClose, worker, saldo }: { open: boolean; onClose: () => void; worker: Worker; saldo: number }) {
  const { refresh } = useApp()
  const [importo, setImporto] = useState('')
  const [data, setData] = useState(todayISO())
  const [metodo, setMetodo] = useState('Contanti')
  const [nota, setNota] = useState('')
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)

  async function salva() {
    setErrore(''); setAttesa(true)
    try {
      const v = Number(String(importo).replace(',', '.'))
      if (!Number.isFinite(v) || v <= 0) throw new Error('Inserisci l’importo che hai pagato.')
      await db.addPayment({ worker_id: worker.id, paid_on: data, amount: v, method: metodo || null, note: nota.trim() || null })
      refresh()
      setImporto(''); setNota('')
      onClose()
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Non sono riuscito a salvare.')
    } finally { setAttesa(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Pagamento a ${worker.name.split(' ')[0]}`}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-brand-50 px-4 py-3 text-[14px] font-medium text-brand-700">
          In questo momento gli devi <b>{euro(saldo)}</b>
        </div>

        <Field label="Quanto hai pagato (€)">
          <input className={`${inputCls} text-center text-[30px] font-extrabold`} value={importo}
                 onChange={e => setImporto(e.target.value)} type="text" inputMode="decimal" placeholder="0,00" autoFocus />
        </Field>

        {saldo > 0 && (
          <button onClick={() => setImporto(saldo.toFixed(2).replace('.', ','))}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-[14px] font-semibold text-brand-700 ring-1 ring-ink-200 active:scale-[.98] transition">
            Salda tutto: {euro(saldo)}
          </button>
        )}

        <Field label="Data del pagamento">
          <input type="date" className={inputCls} value={data} onChange={e => e.target.value && setData(e.target.value)} />
        </Field>

        <Field label="Come hai pagato">
          <div className="grid grid-cols-3 gap-2">
            {['Contanti', 'Bonifico', 'Altro'].map(m => (
              <button key={m} onClick={() => setMetodo(m)}
                className={cx('rounded-2xl py-3 text-[14px] font-semibold transition active:scale-95',
                  metodo === m ? 'bg-brand-600 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200')}>
                {m}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Nota (facoltativa)">
          <input className={inputCls} value={nota} onChange={e => setNota(e.target.value)}
                 placeholder="Es. saldo di agosto" maxLength={120} />
        </Field>

        <Errore>{errore}</Errore>
        <Button size="lg" full variant="success" onClick={salva} disabled={attesa || !importo}>
          {attesa ? <Spinner /> : <><IconCheck className="h-5 w-5" /> Registra il pagamento</>}
        </Button>
      </div>
    </Sheet>
  )
}

/* -------------------------------------------------------------- modifica */

function FormModifica({ open, onClose, worker }: { open: boolean; onClose: () => void; worker: Worker }) {
  const { refresh } = useApp()
  const nav = useNavigate()
  const [nome, setNome] = useState(worker.name)
  const [tariffa, setTariffa] = useState(String(worker.hourly_rate).replace('.', ','))
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)

  async function salva() {
    setErrore(''); setAttesa(true)
    try {
      const t = Number(String(tariffa).replace(',', '.'))
      if (nome.trim().length < 2) throw new Error('Il nome non può essere vuoto.')
      if (!Number.isFinite(t) || t <= 0) throw new Error('Inserisci una tariffa oraria valida.')
      await db.updateWorker(worker.id, { name: nome.trim(), hourly_rate: t })
      refresh(); onClose()
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Non sono riuscito a salvare.')
    } finally { setAttesa(false) }
  }

  async function elimina() {
    if (!confirm(`Eliminare ${worker.name} con tutte le ore e i pagamenti? L’operazione non si può annullare.`)) return
    await db.deleteWorker(worker.id)
    refresh(); onClose(); nav('/')
  }

  return (
    <Sheet open={open} onClose={onClose} title="Modifica lavoratore">
      <div className="space-y-4">
        <Field label="Nome e cognome">
          <input className={inputCls} value={nome} onChange={e => setNome(e.target.value)} />
        </Field>
        <Field label="Tariffa oraria (€)" hint="Le giornate già registrate mantengono la tariffa di quel momento.">
          <input className={inputCls} value={tariffa} onChange={e => setTariffa(e.target.value)} inputMode="decimal" />
        </Field>
        <Errore>{errore}</Errore>
        <Button size="lg" full onClick={salva} disabled={attesa}>{attesa ? <Spinner /> : 'Salva modifiche'}</Button>
        <Button variant="danger" full onClick={elimina}>
          <IconTrash className="h-4 w-4" /> Elimina lavoratore
        </Button>
      </div>
    </Sheet>
  )
}

/* --------------------------------------------------------------- accesso */

function FormAccesso({ open, onClose, worker }: { open: boolean; onClose: () => void; worker: Worker }) {
  const { refresh } = useApp()
  const suggerito = worker.name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  const [utente, setUtente] = useState(suggerito)
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)
  const [fatto, setFatto] = useState(false)
  const [copiato, setCopiato] = useState(false)

  const messaggio = `Ciao ${worker.name.split(' ')[0]}, ecco il tuo accesso all'app "Ore & Paghe":\n\nNome utente: ${utente}\nPassword: ${password}\n\nOgni giorno apri l'app e registra le ore che hai fatto.`

  async function crea() {
    setErrore(''); setAttesa(true)
    try {
      if (!/^[a-z0-9._@-]{3,}$/i.test(utente.trim())) throw new Error('Il nome utente deve avere almeno 3 caratteri, senza spazi.')
      if (password.length < 6) throw new Error('La password deve avere almeno 6 caratteri.')
      await db.createWorkerAccount(worker.id, utente.trim(), password)
      refresh(); setFatto(true)
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Non sono riuscito a creare l’accesso.')
    } finally { setAttesa(false) }
  }

  async function condividi() {
    try {
      if (navigator.share) await navigator.share({ text: messaggio })
      else { await navigator.clipboard.writeText(messaggio); setCopiato(true); setTimeout(() => setCopiato(false), 2000) }
    } catch { /* l'utente ha annullato la condivisione */ }
  }

  if (worker.user_id && !fatto) {
    return (
      <Sheet open={open} onClose={onClose} title="Accesso del lavoratore">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-4 text-emerald-700">
            <IconCheck className="h-5 w-5" />
            <p className="text-[14px] font-semibold">L’accesso è già attivo.</p>
          </div>
          <p className="text-[14px] leading-relaxed text-ink-500">
            {worker.name.split(' ')[0]} può entrare nell’app con il nome utente e la password che gli hai consegnato.
            Se le ha perse, per motivi di sicurezza la password non è visibile: crea un nuovo lavoratore
            oppure chiedi a lui di usare “password dimenticata” dal suo indirizzo email, se ne ha usato uno vero.
          </p>
          <Button full variant="ghost" onClick={onClose}>Ho capito</Button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onClose={() => { onClose(); setFatto(false) }} title={fatto ? 'Accesso creato' : 'Crea l’accesso'}>
      {fatto ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-4 text-emerald-700">
            <IconCheck className="h-5 w-5" />
            <p className="text-[14px] font-semibold">Fatto! Ora consegna le credenziali.</p>
          </div>
          <Card className="divide-y divide-ink-100 ring-1 ring-ink-200">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[13px] text-ink-500">Nome utente</span>
              <span className="font-mono text-[15px] font-bold">{utente}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[13px] text-ink-500">Password</span>
              <span className="font-mono text-[15px] font-bold">{password}</span>
            </div>
          </Card>
          <p className="text-[13px] leading-relaxed text-ink-500">
            Salva o invia subito questi dati: la password non sarà più visibile.
          </p>
          <Button size="lg" full onClick={condividi}>
            {copiato ? <><IconCopy className="h-5 w-5" /> Copiato!</> : <><IconShare className="h-5 w-5" /> Invia le credenziali</>}
          </Button>
          <Button variant="ghost" full onClick={() => { onClose(); setFatto(false) }}>Chiudi</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[14px] leading-relaxed text-ink-500">
            Scegli tu le credenziali di {worker.name.split(' ')[0]} e poi gliele consegni.
            Può essere un nome semplice, non serve un’email.
          </p>
          <Field label="Nome utente" hint={utente ? `Entrerà scrivendo “${utente}”.` : undefined}>
            <input className={inputCls} value={utente} onChange={e => setUtente(e.target.value.toLowerCase())}
                   autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="carlo" />
          </Field>
          <Field label="Password" hint="Almeno 6 caratteri. Scrivila da qualche parte prima di continuare.">
            <div className="flex gap-2">
              <input className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="es. carlo2026" />
              <Button variant="ghost" onClick={() => setPassword(generaPassword())}>Genera</Button>
            </div>
          </Field>
          <Errore>{errore}</Errore>
          <Button size="lg" full onClick={crea} disabled={attesa || !utente || !password}>
            {attesa ? <Spinner /> : <><IconKey className="h-5 w-5" /> Crea l’accesso</>}
          </Button>
          <p className="text-center text-[12px] text-ink-400">
            Entrerà come <b>{normalizzaLogin(utente) || '—'}</b>
          </p>
        </div>
      )}
    </Sheet>
  )
}

function generaPassword(): string {
  const parole = ['sole', 'mare', 'luna', 'pane', 'vento', 'porta', 'lampo', 'fiore']
  const buf = new Uint32Array(2)
  crypto.getRandomValues(buf)
  return `${parole[buf[0] % parole.length]}${1000 + (buf[1] % 9000)}`
}
