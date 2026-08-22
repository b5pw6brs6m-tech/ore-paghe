import { useState } from 'react'
import { Button, Errore, Field, Sheet, inputCls, Spinner } from '../components/ui'
import { IconCheck, IconClock, IconInfo } from '../components/icons'
import { db, isDemo } from '../lib/db'
import { useApp } from '../context/AppContext'

/**
 * Non c'è registrazione: il titolare è uno solo e gli accessi dei lavoratori
 * li crea lui dall'app. Anche il database rifiuta ogni altra registrazione.
 */
export default function Login() {
  const { refresh } = useApp()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)
  const [recupero, setRecupero] = useState(false)

  async function invia(e: React.FormEvent) {
    e.preventDefault()
    setErrore(''); setAttesa(true)
    try {
      await db.signIn(login, password)
      refresh()
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Algo ha salido mal.')
    } finally {
      setAttesa(false)
    }
  }

  async function probarCon(l: string) {
    setErrore(''); setAttesa(true)
    try {
      await db.signIn(l, 'demo')
      refresh()
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Error')
    } finally { setAttesa(false) }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-700 via-brand-600 to-brand-500">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col px-5 safe-top safe-bottom">

        <header className="flex flex-col items-center pt-16 pb-8 text-center text-white">
          <div className="relative mb-4">
            <div className="rounded-[22px] bg-white/15 p-4 ring-1 ring-white/25 backdrop-blur">
              <IconClock className="h-9 w-9" />
            </div>
            {/* stessa spunta verde dell'icona dell'app */}
            <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-brand-600 p-[3px]">
              <div className="rounded-full bg-emerald-500 p-1.5 text-white">
                <IconCheck className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
          <h1 className="text-[34px] font-extrabold tracking-tight">Al Día</h1>
          <p className="mt-1.5 text-[15px] text-white/80">Las horas trabajadas y lo que te toca cobrar, siempre claro.</p>
        </header>

        <div className="animate-rise rounded-[28px] bg-white p-6 shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-[19px] font-bold text-ink-900">Entra con tus datos</h2>
            <p className="mt-1 text-[13px] text-ink-400">Solo tu usuario y tu contraseña.</p>
          </div>

          <form onSubmit={invia} className="space-y-4">
            <Field label="Usuario">
              <input className={inputCls} value={login} onChange={e => setLogin(e.target.value)}
                     placeholder="carlos"
                     autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" />
            </Field>

            <Field label="Contraseña">
              <input className={inputCls} type="password" value={password} onChange={e => setPassword(e.target.value)}
                     placeholder="••••••" autoComplete="current-password" />
            </Field>

            <Errore>{errore}</Errore>

            <Button type="submit" size="lg" full disabled={attesa || !login || !password}>
              {attesa ? <Spinner /> : 'Entrar'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setRecupero(true)}
            className="mt-5 w-full text-center text-[14px] font-semibold text-brand-600 active:opacity-60"
          >
            ¿Has olvidado la contraseña?
          </button>
        </div>

        {isDemo && (
          <div className="mt-5 animate-rise rounded-3xl bg-white/12 p-5 text-white ring-1 ring-white/20 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <IconInfo className="h-4 w-4" />
              <p className="text-[13px] font-bold uppercase tracking-wide">Modo de prueba</p>
            </div>
            <p className="mb-4 text-[14px] leading-relaxed text-white/80">
              La base de datos aún no está conectada: los datos se quedan en este dispositivo.
              Entra con un perfil de prueba para ver cómo funciona.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="ghost" onClick={() => probarCon('demo@ore.app')} disabled={attesa}>Soy el jefe</Button>
              <Button variant="ghost" onClick={() => probarCon('demo-carlos@ore.app')} disabled={attesa}>Soy Carlos</Button>
            </div>
          </div>
        )}

        <Recuperar open={recupero} onClose={() => setRecupero(false)} />

        <div className="flex-1" />
        <p className="py-6 text-center text-[12px] text-white/50">
          Añade la app a la pantalla de inicio para usarla como una app normal.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- recupero */

/**
 * Il lavoratore non ha un'email vera, quindi per lui il recupero è chiedere
 * le credenziali al titolare, che le ha annotate. Il titolare invece riceve
 * il link per email.
 */
function Recuperar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [errore, setErrore] = useState('')
  const [inviato, setInviato] = useState(false)
  const [attesa, setAttesa] = useState(false)

  async function invia() {
    setErrore(''); setAttesa(true)
    try {
      const v = email.trim().toLowerCase()
      if (!v.includes('@') || v.endsWith('@ore.app')) {
        throw new Error('Escribe un correo de verdad. Si eres trabajador, pídele las credenciales a tu jefe.')
      }
      await db.recuperaPassword(v)
      setInviato(true)
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'No he podido enviar el correo.')
    } finally { setAttesa(false) }
  }

  return (
    <Sheet open={open} onClose={() => { onClose(); setInviato(false) }} title="Recuperar la contraseña">
      {inviato ? (
        <div className="space-y-4">
          <p className="rounded-2xl bg-emerald-50 px-4 py-4 text-[14px] font-medium leading-relaxed text-emerald-800">
            Te he mandado un correo a <b>{email}</b>. Ábrelo y pulsa el enlace:
            desde ahí podrás poner una contraseña nueva.
          </p>
          <p className="text-[13px] leading-relaxed text-ink-500">
            Si no lo ves, mira en la carpeta de correo no deseado.
          </p>
          <Button full variant="ghost" onClick={() => { onClose(); setInviato(false) }}>Cerrar</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-brand-50 px-4 py-4 text-[14px] leading-relaxed text-brand-800">
            <b>¿Eres trabajador?</b> Pídele las credenciales a tu jefe: él las tiene
            guardadas y te las puede volver a mandar por WhatsApp al momento.
          </div>
          <p className="text-[14px] leading-relaxed text-ink-500">
            Si eres el jefe, escribe tu correo y te mando un enlace para poner
            una contraseña nueva.
          </p>
          <Field label="Tu correo">
            <input className={inputCls} value={email} onChange={e => setEmail(e.target.value)}
                   type="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                   placeholder="miguel@correo.es" autoComplete="email" />
          </Field>
          <Errore>{errore}</Errore>
          <Button size="lg" full onClick={invia} disabled={attesa || !email}>
            {attesa ? <Spinner /> : 'Enviar el enlace'}
          </Button>
        </div>
      )}
    </Sheet>
  )
}
