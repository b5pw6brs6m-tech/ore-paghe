import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, Button, Caricamento, Card, Errore, Field, Sheet, Spinner, Vuoto, cx, inputCls } from '../../components/ui'
import { IconCheck, IconClock, IconCopy, IconEdit, IconKey, IconLeft, IconPlus, IconShare, IconTrash, IconWallet } from '../../components/icons'
import { dataLunga, euro, maiuscola, oreLabel, todayISO } from '../../lib/format'
import { calcolaOre, riepilogo, round2 } from '../../lib/calc'
import { db } from '../../lib/db'
import { normalizzaLogin } from '../../lib/api'
import { apriWhatsApp, condividiNativo, copiaTesto } from '../../lib/condividi'
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
  const [apriGiornata, setApriGiornata] = useState(false)

  const { dati: workers, caricando: c1 } = useCarica<Worker[]>(() => db.listWorkers(), [], [])
  const { dati: entries, caricando: c2 } = useCarica<Entry[]>(() => db.listEntries(id), [id], [])
  const { dati: payments, caricando: c3 } = useCarica<Payment[]>(() => db.listPayments(id), [id], [])

  if (c1 || c2 || c3) return <Caricamento />
  const worker = workers.find(w => w.id === id)
  if (!worker) {
    return (
      <div className="p-5 pt-16">
        <Vuoto icona={<IconClock className="h-6 w-6" />} titolo="Trabajador no encontrado"
               testo="Puede que lo hayan eliminado."
               azione={<Button variant="soft" onClick={() => nav('/')}>Volver a trabajadores</Button>} />
      </div>
    )
  }

  const r = riepilogo(entries, payments)

  async function eliminaOre(entryId: string) {
    if (!confirm('¿Eliminar esta jornada?')) return
    await db.deleteEntry(entryId); refresh()
  }
  async function eliminaPagamento(pid: string) {
    if (!confirm('¿Eliminar este pago?')) return
    await db.deletePayment(pid); refresh()
  }

  return (
    <>
      <header className="rounded-b-[32px] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-5 pb-7 pt-4 text-white safe-top">
        <div className="flex items-center justify-between pt-3">
          <button onClick={() => nav('/')} aria-label="Atrás"
                  className="rounded-full bg-white/15 p-2.5 active:scale-90 transition">
            <IconLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            <button onClick={() => setApriAccesso(true)} aria-label="Acceso"
                    className="rounded-full bg-white/15 p-2.5 active:scale-90 transition"><IconKey className="h-5 w-5" /></button>
            <button onClick={() => setApriModifica(true)} aria-label="Editar"
                    className="rounded-full bg-white/15 p-2.5 active:scale-90 transition"><IconEdit className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <Avatar name={worker.name} size={56} />
          <div className="min-w-0">
            <h1 className="truncate text-[24px] font-extrabold leading-tight tracking-tight">{worker.name}</h1>
            <p className="text-[14px] text-white/75">{euro(worker.hourly_rate)} por hora</p>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] bg-white/12 p-5 ring-1 ring-white/20 backdrop-blur">
          <p className="text-[13px] font-medium text-white/70">Aún le debes</p>
          <p className="mt-1 text-[40px] font-extrabold leading-none tracking-tight">{euro(r.balance)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/20 pt-4 text-center">
            <Mini v={oreLabel(r.totalHours)} t={`${r.days} jornadas`} />
            <Mini v={euro(r.totalEarned)} t="acumulado" />
            <Mini v={euro(r.totalPaid)} t="ya pagado" />
          </div>
        </div>
      </header>

      {!worker.user_id && (
        <div className="px-5 pt-5">
          <Card className="border border-amber-200 bg-amber-50 p-4 shadow-none">
            <p className="text-[14px] font-bold text-amber-900">Acceso todavía sin crear</p>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
              Crea el usuario y la contraseña de {worker.name.split(' ')[0]} para que pueda registrar sus horas desde su móvil.
            </p>
            <Button variant="soft" className="mt-3" onClick={() => setApriAccesso(true)}>
              <IconKey className="h-4 w-4" /> Crear el acceso
            </Button>
          </Card>
        </div>
      )}

      <div className="space-y-2.5 px-5 pt-5">
        <Button size="lg" full variant="success" onClick={() => setApriPagamento(true)}>
          <IconWallet className="h-5 w-5" /> Registrar un pago
        </Button>
        <Button variant="ghost" full onClick={() => setApriGiornata(true)}>
          <IconPlus className="h-4 w-4" /> Añadir una jornada olvidada
        </Button>
      </div>

      <div className="px-5 pt-6">
        <div className="mb-4 flex rounded-2xl bg-white p-1 ring-1 ring-ink-200">
          {([['tutto', 'Todo'], ['ore', `Horas (${entries.length})`], ['pagamenti', `Pagos (${payments.length})`]] as const).map(([k, t]) => (
            <button key={k} onClick={() => setTab(k)}
              className={cx('flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition',
                tab === k ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-500')}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'tutto' ? (
          <Movimenti entries={entries} payments={payments}
                     vuotoTesto={`Aquí verás por fecha cada jornada de ${worker.name.split(' ')[0]} y cada pago que le hagas.`}
                     onElimina={m => m.tipo === 'pagamento' ? void eliminaPagamento(m.id) : void eliminaOre(m.id)} />
        ) : tab === 'ore' ? (
          entries.length === 0 ? (
            <Vuoto icona={<IconClock className="h-6 w-6" />} titolo="Ninguna jornada"
                   testo={`${worker.name.split(' ')[0]} registra sus horas al terminar el día. Si se le olvida una, puedes añadirla tú.`}
                   azione={<Button variant="soft" onClick={() => setApriGiornata(true)}><IconPlus className="h-4 w-4" /> Añadir jornada</Button>} />
          ) : (
            <div className="space-y-2.5">
              {entries.map(e => <RigaGiorno key={e.id} e={e} onDelete={() => void eliminaOre(e.id)} />)}
            </div>
          )
        ) : (
          payments.length === 0 ? (
            <Vuoto icona={<IconWallet className="h-6 w-6" />} titolo="Ningún pago"
                   testo="Registra un pago: se descontará del total y él lo verá al momento."
                   azione={<Button variant="soft" onClick={() => setApriPagamento(true)}><IconPlus className="h-4 w-4" /> Registrar pago</Button>} />
          ) : (
            <div className="space-y-2.5">
              {payments.map(p => <RigaPagamento key={p.id} p={p} onDelete={() => void eliminaPagamento(p.id)} />)}
            </div>
          )
        )}
      </div>

      <FormPagamento open={apriPagamento} onClose={() => setApriPagamento(false)} worker={worker} saldo={r.balance} />
      <FormGiornata open={apriGiornata} onClose={() => setApriGiornata(false)} worker={worker} />
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
  const [metodo, setMetodo] = useState('Efectivo')
  const [nota, setNota] = useState('')
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)

  async function salva() {
    setErrore(''); setAttesa(true)
    try {
      const v = Number(String(importo).replace(',', '.'))
      if (!Number.isFinite(v) || v <= 0) throw new Error('Pon el importe que le has pagado.')
      await db.addPayment({ worker_id: worker.id, paid_on: data, amount: v, method: metodo || null, note: nota.trim() || null })
      refresh()
      setImporto(''); setNota('')
      onClose()
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'No he podido guardar.')
    } finally { setAttesa(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Pago a ${worker.name.split(' ')[0]}`}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-brand-50 px-4 py-3 text-[14px] font-medium text-brand-700">
          Ahora mismo le debes <b>{euro(saldo)}</b>
        </div>

        <Field label="¿Cuánto le has pagado? (€)">
          <input className={`${inputCls} text-center text-[30px] font-extrabold`} value={importo}
                 onChange={e => setImporto(e.target.value)} type="text" inputMode="decimal" placeholder="0,00" autoFocus />
        </Field>

        {saldo > 0 && (
          <button onClick={() => setImporto(saldo.toFixed(2).replace('.', ','))}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-[14px] font-semibold text-brand-700 ring-1 ring-ink-200 active:scale-[.98] transition">
            Saldar todo: {euro(saldo)}
          </button>
        )}

        <Field label="Fecha del pago">
          <input type="date" className={inputCls} value={data} onChange={e => e.target.value && setData(e.target.value)} />
        </Field>

        <Field label="¿Cómo le has pagado?">
          <div className="grid grid-cols-3 gap-2">
            {['Efectivo', 'Transferencia', 'Otro'].map(m => (
              <button key={m} onClick={() => setMetodo(m)}
                className={cx('rounded-2xl py-3 text-[14px] font-semibold transition active:scale-95',
                  metodo === m ? 'bg-brand-600 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200')}>
                {m}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Nota (opcional)">
          <input className={inputCls} value={nota} onChange={e => setNota(e.target.value)}
                 placeholder="Ej. saldo de agosto" maxLength={120} />
        </Field>

        <Errore>{errore}</Errore>
        <Button size="lg" full variant="success" onClick={salva} disabled={attesa || !importo}>
          {attesa ? <Spinner /> : <><IconCheck className="h-5 w-5" /> Registrar el pago</>}
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
      if (nome.trim().length < 2) throw new Error('El nombre no puede estar vacío.')
      if (!Number.isFinite(t) || t <= 0) throw new Error('Pon una tarifa por hora válida.')
      await db.updateWorker(worker.id, { name: nome.trim(), hourly_rate: t })
      refresh(); onClose()
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'No he podido guardar.')
    } finally { setAttesa(false) }
  }

  async function elimina() {
    if (!confirm(`¿Eliminar a ${worker.name} con todas sus horas y pagos? Esto no se puede deshacer.`)) return
    await db.deleteWorker(worker.id)
    refresh(); onClose(); nav('/')
  }

  return (
    <Sheet open={open} onClose={onClose} title="Editar trabajador">
      <div className="space-y-4">
        <Field label="Nombre y apellidos">
          <input className={inputCls} value={nome} onChange={e => setNome(e.target.value)} />
        </Field>
        <Field label="Tarifa por hora (€)" hint="Las jornadas ya registradas mantienen la tarifa de aquel momento.">
          <input className={inputCls} value={tariffa} onChange={e => setTariffa(e.target.value)} inputMode="decimal" />
        </Field>
        <Errore>{errore}</Errore>
        <Button size="lg" full onClick={salva} disabled={attesa}>{attesa ? <Spinner /> : 'Guardar cambios'}</Button>
        <Button variant="danger" full onClick={elimina}>
          <IconTrash className="h-4 w-4" /> Eliminar trabajador
        </Button>
      </div>
    </Sheet>
  )
}

/* --------------------------------------------------------------- accesso */

/**
 * Le credenziali restano annotate sulla scheda, così il titolare può
 * rimandarle in qualsiasi momento se il lavoratore le perde.
 */
function FormAccesso({ open, onClose, worker }: { open: boolean; onClose: () => void; worker: Worker }) {
  const { refresh } = useApp()
  const sugerido = worker.name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  const yaTiene = Boolean(worker.user_id)
  const apuntadas = Boolean(worker.access_login && worker.access_password)

  const [vista, setVista] = useState<'crear' | 'ver' | 'apuntar'>('crear')
  const [utente, setUtente] = useState(sugerido)
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)
  const [esito, setEsito] = useState<'copiato' | 'errore' | null>(null)
  const [sistema, setSistema] = useState<'android' | 'iphone'>('iphone')

  useEffect(() => {
    if (!open) return
    setErrore(''); setEsito(null)
    if (!yaTiene) { setVista('crear'); setUtente(sugerido); setPassword('') }
    else if (apuntadas) { setVista('ver') }
    else { setVista('apuntar'); setUtente(worker.access_login ?? sugerido); setPassword('') }
  }, [open, yaTiene, apuntadas, sugerido, worker.access_login])

  const usuario = worker.access_login ?? utente
  const clave = worker.access_password ?? password
  const enlace = `${window.location.origin}${import.meta.env.BASE_URL}`

  // Le istruzioni cambiano parecchio fra i due telefoni: si manda solo quella giusta,
  // scritta passo per passo perché la possa seguire chiunque.
  const PASSI = {
    iphone:
      `- Pulsa el enlace de aquí arriba. Se abre una ventana dentro de WhatsApp.\n` +
      `- OJO, esto es lo importante: desde dentro de WhatsApp NO se puede instalar. ` +
      `Abajo a la derecha hay un icono de brújula (o los tres puntitos "..."): púlsalo ` +
      `y elige "Abrir en Safari".\n` +
      `- Ya en Safari, abajo del todo, pulsa el cuadradito con la flecha hacia arriba (↑).\n` +
      `- Baja por la lista y elige "Añadir a pantalla de inicio".\n` +
      `- Pulsa "Añadir", arriba a la derecha.\n` +
      `- Ya está. Te queda el icono en el móvil, igual que WhatsApp.`,
    android:
      `- Pulsa el enlace de aquí arriba. Si se abre dentro de WhatsApp, pulsa los tres ` +
      `puntitos (⋮) de arriba a la derecha y elige "Abrir en el navegador" (Chrome).\n` +
      `- Ya en Chrome, pulsa otra vez los tres puntitos (⋮) de arriba a la derecha.\n` +
      `- Baja y elige "Instalar aplicación" (o "Añadir a pantalla de inicio").\n` +
      `- Pulsa "Instalar".\n` +
      `- Ya está. Te queda el icono en el móvil, igual que WhatsApp.`,
  }

  const messaggio =
    `¡Hola ${worker.name.split(' ')[0]}! ¿Qué tal?\n\n` +
    `He preparado una aplicación para llevar el control de las horas y de los pagos, ` +
    `así los dos sabemos siempre cómo vamos. Se llama "Al Día".\n\n` +
    `*1) Abre este enlace*\n${enlace}\n\n` +
    `*2) Ponla en el móvil* (es un minuto)\n${PASSI[sistema]}\n\n` +
    `*3) Entra con estos datos*\n` +
    `Usuario: ${(vista === 'ver' ? usuario : utente).split('@')[0]}\n` +
    `Contraseña: ${vista === 'ver' ? clave : password}\n\n` +
    `*4) Cada tarde, al terminar de trabajar*\n` +
    `Abre la app y apunta las horas que has hecho. Solo se puede el mismo día: ` +
    `al día siguiente ya no se puede.\n\n` +
    `Ahí ves siempre los días que has trabajado, lo que llevas ganado y lo que te he pagado. ` +
    `Cualquier duda me dices.`

  async function copia() {
    const ok = await copiaTesto(messaggio)
    setEsito(ok ? 'copiato' : 'errore')
    setTimeout(() => setEsito(null), 3000)
  }

  async function condividi() {
    if (await condividiNativo(messaggio)) return
    void copia()
  }

  async function crea() {
    setErrore(''); setAttesa(true)
    try {
      if (!/^[a-z0-9._@-]{3,}$/i.test(utente.trim())) throw new Error('El usuario debe tener al menos 3 caracteres, sin espacios.')
      if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.')
      await db.createWorkerAccount(worker.id, utente.trim(), password)
      refresh(); setVista('ver')
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'No he podido crear el acceso.')
    } finally { setAttesa(false) }
  }

  async function apunta() {
    setErrore(''); setAttesa(true)
    try {
      if (!utente.trim()) throw new Error('Escribe el usuario que le diste.')
      if (!password) throw new Error('Escribe la contraseña que le diste.')
      // Si comprueba de verdad: si no funcionan, no se guardan.
      const valgono = await db.verificaCredenziali(utente.trim(), password)
      if (!valgono) {
        throw new Error('Con estos datos no se entra. Revísalos: si no te acuerdas de la contraseña, dímelo y te creamos un acceso nuevo.')
      }
      await db.updateWorker(worker.id, {
        access_login: normalizzaLogin(utente.trim()),
        access_password: password,
      })
      refresh(); setVista('ver')
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'No he podido guardarlas.')
    } finally { setAttesa(false) }
  }

  const titolo = vista === 'crear' ? 'Crear el acceso'
    : vista === 'apuntar' ? 'Apuntar las credenciales'
    : `Acceso de ${worker.name.split(' ')[0]}`

  return (
    <Sheet open={open} onClose={onClose} title={titolo}>
      {/* ---------------------------------------------------- vederle e inviarle */}
      {vista === 'ver' && (
        <div className="space-y-4">
          <Card className="divide-y divide-ink-100 ring-1 ring-ink-200">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <span className="text-[13px] text-ink-500">Usuario</span>
              <span className="select-all font-mono text-[15px] font-bold">{usuario.split('@')[0]}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <span className="text-[13px] text-ink-500">Contraseña</span>
              <span className="select-all font-mono text-[15px] font-bold">{clave}</span>
            </div>
          </Card>

          <Field label="¿Qué móvil tiene?" hint="Le mando solo los pasos de su teléfono, para que no se líe.">
            <div className="grid grid-cols-2 gap-2">
              {([['iphone', 'iPhone'], ['android', 'Android']] as const).map(([k, t]) => (
                <button key={k} onClick={() => setSistema(k)}
                  className={cx('rounded-2xl py-3 text-[15px] font-semibold transition active:scale-95',
                    sistema === k ? 'bg-brand-600 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200')}>
                  {t}
                </button>
              ))}
            </div>
          </Field>

          <Button size="lg" full onClick={() => apriWhatsApp(messaggio)}>
            <IconShare className="h-5 w-5" /> Enviar por WhatsApp
          </Button>

          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="ghost" onClick={copia}><IconCopy className="h-4 w-4" /> Copiar</Button>
            <Button variant="ghost" onClick={condividi}><IconShare className="h-4 w-4" /> Otro…</Button>
          </div>

          {esito === 'copiato' && (
            <p className="animate-pop rounded-2xl bg-emerald-50 px-4 py-3 text-center text-[14px] font-semibold text-emerald-700">
              ¡Copiado! Ya puedes pegarlo donde quieras.
            </p>
          )}
          {esito === 'errore' && (
            <p className="animate-pop rounded-2xl bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-800">
              El navegador no me ha dejado copiar. Selecciona el usuario y la contraseña de arriba y cópialos a mano.
            </p>
          )}

          <p className="text-[13px] leading-relaxed text-ink-500">
            Si {worker.name.split(' ')[0]} pierde sus datos, vuelve aquí y se los mandas otra vez.
            Solo tú puedes verlos.
          </p>

          <Button variant="ghost" full onClick={() => {
            setVista('apuntar'); setUtente((worker.access_login ?? '').split('@')[0]); setPassword(worker.access_password ?? '')
          }}>
            <IconEdit className="h-4 w-4" /> Corregir lo apuntado
          </Button>
        </div>
      )}

      {/* ------------------------------------------------------------- crearlas */}
      {vista === 'crear' && (
        <div className="space-y-4">
          <p className="text-[14px] leading-relaxed text-ink-500">
            Elige tú las credenciales de {worker.name.split(' ')[0]} y luego se las das.
            Puede ser un nombre sencillo, no hace falta un correo.
          </p>
          <Field label="Usuario" hint={utente ? `Entrará escribiendo “${utente}”.` : undefined}>
            <input className={inputCls} value={utente} onChange={e => setUtente(e.target.value.toLowerCase())}
                   autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="carlos" />
          </Field>
          <Field label="Contraseña" hint="Al menos 6 caracteres. Quedará guardada aquí para que puedas volver a mandársela.">
            <div className="flex gap-2">
              <input className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="ej. carlos2026" />
              <Button variant="ghost" onClick={() => setPassword(generaPassword())}>Generar</Button>
            </div>
          </Field>
          <Errore>{errore}</Errore>
          <Button size="lg" full onClick={crea} disabled={attesa || !utente || !password}>
            {attesa ? <Spinner /> : <><IconKey className="h-5 w-5" /> Crear el acceso</>}
          </Button>
          <p className="text-center text-[12px] text-ink-400">
            Entrará como <b>{normalizzaLogin(utente) || '—'}</b>
          </p>
        </div>
      )}

      {/* ---------------------------------------------- annotarle a posteriori */}
      {vista === 'apuntar' && (
        <div className="space-y-4">
          <p className="text-[14px] leading-relaxed text-ink-500">
            {worker.access_login
              ? `Corrige aquí el usuario y la contraseña de ${worker.name.split(' ')[0]}.`
              : `Este acceso se creó antes de que la app guardara las credenciales. Escríbelas aquí y a partir de ahora podrás mandárselas cuando quieras.`}
          </p>
          <Field label="Usuario">
            <input className={inputCls} value={utente} onChange={e => setUtente(e.target.value.toLowerCase())}
                   autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="carlos" />
          </Field>
          <Field label="Contraseña" hint="La que le diste. Compruebo que funcione antes de guardarla.">
            <input className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="ej. carlos2026" />
          </Field>
          <Errore>{errore}</Errore>
          <Button size="lg" full onClick={apunta} disabled={attesa || !utente || !password}>
            {attesa ? <Spinner /> : <><IconCheck className="h-5 w-5" /> Comprobar y guardar</>}
          </Button>
          {apuntadas && (
            <Button variant="ghost" full onClick={() => setVista('ver')}>Cancelar</Button>
          )}
        </div>
      )}
    </Sheet>
  )
}

function generaPassword(): string {
  const palabras = ['sol', 'mar', 'luna', 'pan', 'viento', 'puerta', 'rayo', 'flor']
  const buf = new Uint32Array(2)
  crypto.getRandomValues(buf)
  return `${palabras[buf[0] % palabras.length]}${1000 + (buf[1] % 9000)}`
}

/* -------------------------------------------------------------- giornata */

/**
 * Il lavoratore può registrare solo la giornata in corso. Se se ne dimentica
 * una, il titolare la inserisce qui: è l'unica via per una data passata.
 */
function FormGiornata({ open, onClose, worker }: { open: boolean; onClose: () => void; worker: Worker }) {
  const { refresh } = useApp()
  const [data, setData] = useState(todayISO())
  const [entrata, setEntrata] = useState('08:00')
  const [uscita, setUscita] = useState('17:00')
  const [pausa, setPausa] = useState(60)
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)

  const ore = calcolaOre(entrata, uscita, pausa)
  const guadagno = round2(ore * worker.hourly_rate)

  async function salva() {
    setErrore(''); setAttesa(true)
    try {
      if (ore <= 0) throw new Error('Revisa las horas: el turno sale de cero horas.')
      await db.addEntry({
        worker_id: worker.id, work_date: data,
        start_time: entrata, end_time: uscita, break_minutes: pausa,
        hours: ore, note: null,
      })
      refresh()
      onClose()
      setData(todayISO())
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'No he podido guardar.')
    } finally { setAttesa(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Jornada de ${worker.name.split(' ')[0]}`}>
      <div className="space-y-4">
        <Field label="Día trabajado">
          <input type="date" className={inputCls} value={data} max={todayISO()}
                 onChange={e => e.target.value && setData(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Entrada">
            <input type="time" className={inputCls} value={entrata} onChange={e => setEntrata(e.target.value)} />
          </Field>
          <Field label="Salida">
            <input type="time" className={inputCls} value={uscita} onChange={e => setUscita(e.target.value)} />
          </Field>
        </div>

        <Field label="Descanso">
          <div className="grid grid-cols-4 gap-2">
            {[0, 30, 60, 90].map(m => (
              <button key={m} onClick={() => setPausa(m)}
                className={cx('rounded-2xl py-3 text-[14px] font-semibold transition active:scale-95',
                  pausa === m ? 'bg-brand-600 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200')}>
                {m === 0 ? 'no' : `${m}m`}
              </button>
            ))}
          </div>
        </Field>

        <div className="rounded-2xl bg-ink-900 px-5 py-4 text-center text-white">
          <p className="text-[12px] text-white/60">{maiuscola(dataLunga(data))}</p>
          <p className="mt-1 text-[28px] font-extrabold leading-none">{oreLabel(ore)}</p>
          <p className="mt-1 text-[14px] font-semibold text-emerald-300">{euro(guadagno)}</p>
        </div>

        <p className="text-[12px] leading-relaxed text-ink-400">
          Se aplica la tarifa actual de {euro(worker.hourly_rate)}/h.
        </p>

        <Errore>{errore}</Errore>
        <Button size="lg" full onClick={salva} disabled={attesa || ore <= 0}>
          {attesa ? <Spinner /> : <><IconCheck className="h-5 w-5" /> Añadir la jornada</>}
        </Button>
      </div>
    </Sheet>
  )
}
